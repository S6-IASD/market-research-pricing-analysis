import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from django.db.models import Prefetch

from products.models import Product, PriceSnapshot

def analyze_products(query: str) -> dict:
    """
    Récupère les produits correspondants à la requête, extrait leurs prix les plus récents,
    et applique un clustering (KMeans) ainsi qu'une détection d'anomalies (IsolationForest).
    """
    # 1. Récupérer les produits avec leur dernier snapshot de prix
    products = Product.objects.filter(search_query__icontains=query).prefetch_related(
        Prefetch('snapshots', queryset=PriceSnapshot.objects.order_by('-scraped_at'))
    )

    data = []
    for p in products:
        latest_snapshot = p.snapshots.first()
        if latest_snapshot and latest_snapshot.price > 0:
            data.append({
                'id': p.id,
                'title': p.title,
                'platform': p.platform,
                'url': p.url,
                'price': latest_snapshot.price,
                'price_usd': latest_snapshot.price_usd,
                'currency': latest_snapshot.currency,
                'seller': p.seller,
                'rating': latest_snapshot.rating,
                'image': p.image
            })

    if len(data) < 5:
        return {"error": "Pas assez de données pour effectuer une analyse fiable (minimum 5 requises)."}

    df = pd.DataFrame(data)
    prices = df[['price']]

    # 2. Clustering K-Means (Segmentation de prix)
    # n_init=10 est recommandé pour éviter les avertissements futurs
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(prices)
    
    # Ordonner les clusters par prix moyen pour assigner les labels
    cluster_means = df.groupby('cluster')['price'].mean().sort_values()
    label_map = {
        cluster_means.index[0]: 'Entrée de gamme', 
        cluster_means.index[1]: 'Milieu de gamme', 
        cluster_means.index[2]: 'Haut de gamme'
    }
    df['cluster_label'] = df['cluster'].map(label_map)

    # 3. Détection d'anomalies (Isolation Forest)
    # Contamination = 0.05 signifie qu'on s'attend à 5% d'offres anormales maximum
    iso = IsolationForest(contamination=0.05, random_state=42)
    df['is_anomaly'] = iso.fit_predict(prices) == -1  # -1 indique une anomalie

    # 4. Statistiques descriptives
    stats = {
        "min": round(df['price'].min(), 2),
        "max": round(df['price'].max(), 2),
        "median": round(df['price'].median(), 2),
        "std": round(df['price'].std(), 2),
        "count": len(df),
        "anomaly_count": int(df['is_anomaly'].sum()),
    }

    # 5. Conversion pour la réponse API
    offers = df.to_dict(orient='records')

    return {
        "query": query,
        "stats": stats,
        "offers": offers
    }
