import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from mlxtend.frequent_patterns import fpgrowth, association_rules
from django.db.models import Prefetch

from products.models import Product, PriceSnapshot

def get_price_distribution(prices: pd.Series, bins: int = 7) -> list:
    """Generate histogram data for bar chart."""
    if prices.empty:
        return []
    counts, bin_edges = np.histogram(prices.dropna(), bins=bins)
    bar_data = []
    for i in range(len(counts)):
        min_edge = round(bin_edges[i], 1)
        max_edge = round(bin_edges[i+1], 1)
        name = f"{min_edge}-{max_edge}"
        if max_edge > 1000:
            name = f"{min_edge/1000:.1f}k-{max_edge/1000:.1f}k"
        bar_data.append({
            "name": name,
            "count": int(counts[i])
        })
    return bar_data

def get_boxplot_data(df: pd.DataFrame) -> list:
    """Generate boxplot data grouped by platform."""
    boxplot_data = []
    for platform in df['platform'].unique():
        platform_df = df[df['platform'] == platform]
        if len(platform_df) < 3:
            continue
        prices = platform_df['price']
        boxplot_data.append({
            "platform": platform.capitalize(),
            "min": round(prices.min(), 2),
            "max": round(prices.max(), 2),
            "q1": round(prices.quantile(0.25), 2),
            "median": round(prices.median(), 2),
            "q3": round(prices.quantile(0.75), 2)
        })
    return boxplot_data

def generate_association_rules(df: pd.DataFrame) -> list:
    """Generate association rules using FP-growth."""
    if len(df) < 10:
        return []
    
    # Create categorical dataframe for transaction mapping
    transactions = pd.DataFrame()
    for plat in df['platform'].unique():
        transactions['Platform_' + str(plat).capitalize()] = (df['platform'] == plat)
    
    for label in df['cluster_label'].unique():
        transactions['Gamme_' + str(label).replace(' ', '_')] = (df['cluster_label'] == label)
    
    try:
        frequent_itemsets = fpgrowth(transactions, min_support=0.1, use_colnames=True)
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.5)
        rules = rules.sort_values(by="lift", ascending=False).head(5)
        
        formatted_rules = []
        for _, row in rules.iterrows():
            antecedents = list(row['antecedents'])
            consequents = list(row['consequents'])
            if not antecedents or not consequents:
                continue
            formatted_rules.append({
                "antecedents": antecedents,
                "consequents": consequents,
                "confidence": round(row['confidence'] * 100, 1),
                "lift": round(row['lift'], 2)
            })
        return formatted_rules
    except Exception as e:
        print(f"Error in association rules: {e}")
        return []

def analyze_products(query: str) -> dict:
    """
    Récupère les produits correspondants à la requête, extrait leurs prix les plus récents,
    et applique un clustering (KMeans), une détection d'anomalies (IsolationForest + LOF),
    ainsi que des règles d'association.
    """
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
    
    # Conversion en MAD pour avoir une base de comparaison unifiée (1 USD ≈ 10 MAD)
    # Cela permet de comparer équitablement Jumia (MAD), AliExpress et eBay (USD)
    df['normalized_price'] = df.apply(lambda row: row['price_usd'] * 10 if pd.notnull(row.get('price_usd')) else row['price'], axis=1)
    df['price'] = df['normalized_price']
    
    prices = df[['price']]

    # 1. Clustering K-Means (Segmentation de prix)
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(prices)
    
    cluster_means = df.groupby('cluster')['price'].mean().sort_values()
    label_map = {
        cluster_means.index[0]: 'Entrée de gamme', 
        cluster_means.index[1]: 'Milieu de gamme', 
        cluster_means.index[2]: 'Haut de gamme'
    }
    df['cluster_label'] = df['cluster'].map(label_map)

    # 2. Détection d'anomalies (Isolation Forest + LOF)
    iso = IsolationForest(contamination=0.05, random_state=42)
    df['iso_anomaly'] = iso.fit_predict(prices) == -1

    lof = LocalOutlierFactor(n_neighbors=min(20, len(df)-1), contamination=0.05)
    df['lof_anomaly'] = lof.fit_predict(prices) == -1

    # On combine les deux modèles (Voting)
    df['is_anomaly'] = df['iso_anomaly'] | df['lof_anomaly']

    # 3. Statistiques descriptives
    stats = {
        "min": round(df['price'].min(), 2),
        "max": round(df['price'].max(), 2),
        "median": round(df['price'].median(), 2),
        "std": round(df['price'].std(), 2),
        "count": len(df),
        "anomaly_count": int(df['is_anomaly'].sum()),
    }

    # 4. Génération des graphiques
    barData = get_price_distribution(df['price'])
    boxPlotData = get_boxplot_data(df)
    
    # 5. Règles d'association
    rules = generate_association_rules(df)

    offers = df.drop(columns=['iso_anomaly', 'lof_anomaly', 'cluster']).to_dict(orient='records')

    return {
        "query": query,
        "stats": stats,
        "barData": barData,
        "boxPlotData": boxPlotData,
        "rules": rules,
        "offers": offers
    }
