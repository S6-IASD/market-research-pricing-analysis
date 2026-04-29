# 🚀 Démarrage rapide pour Backend

## 3 lignes pour intégrer

from scraping.services.scraper_service import get_scraper_service

service = get_scraper_service()
result = service.scrape(query="laptop")  # ← C'est tout

## Ce que vous devez savoir

| Question | Réponse |
|----------|---------|
| Quel fichier importer ? | scraping.services.scraper_service |
| Quelle fonction appeler ? | get_scraper_service().scrape() |
| Quels arguments ? | query (obligatoire), category_hint (optionnel), platforms (optionnel) |
| Quel type de retour ? | dict Python prêt pour JsonResponse() |
| Combien de temps ? | 30-90 secondes |
| Que faire du résultat ? | Sauvegarder en base, retourner au frontend |

## Exemple minimal Django

from django.http import JsonResponse
from scraping.services.scraper_service import get_scraper_service

def api_scrape(request):
    service = get_scraper_service()
    result = service.scrape(query=request.POST.get("q"))
    return JsonResponse(result)

## Structure du retour

result
├── status           → "success" | "no_results" | "partial_failure"
├── products[]       → Liste de produits (voir détail ci-dessous)
├── stats            → Métadonnées (total, by_platform, errors)
└── execution_time_ms → Temps total

## Gestion des erreurs

if result["status"] == "success":
    # Tout est OK, sauvegarder tous les produits
    pass
elif result["status"] == "partial_failure":
    # Certaines plateformes ont échoué, mais d'autres ont réussi
    # Vérifier result["stats"]["errors"] pour savoir lesquelles
    pass
else:
    # Aucun produit trouvé
    pass

---

# API Interne — Module Scraping

Document destiné à l'équipe Backend pour intégrer le module de scraping.

---

## 1. Installation & Dépendances

### Dépendances Python requises

pip install playwright requests beautifulsoup4 lxml
playwright install chromium
ou bien pip install rquirements

### Structure du module (à ne pas modifier)

scraping/
├── spiders/           # Récupération HTML par plateforme
│   ├── base_spider.py
│   ├── jumia_spider.py
│   ├── ebay_spider.py
│   └── aliexpress_spider.py
├── parsers/           # Extraction données brutes
│   ├── jumia_parser.py
│   ├── ebay_parser.py
│   └── aliexpress_parser.py
├── pipelines/         # Traitement & nettoyage
│   ├── cleaner.py     # Nettoyage texte/prix
│   ├── normalizer.py  # Standardisation
│   └── validator.py   # Validation + dédoublonnage
├── services/          # Orchestration
│   ├── scraper_service.py    # POINT D'ENTRÉE PRINCIPAL
│   ├── category_detector.py  # Détection auto catégorie
│   └── exporter.py           # Export CSV/JSON
└── utils/
    ├── http_client.py  # Playwright / requests
    └── logger.py       # Logs structurés

---

## 2. Point d'entrée unique

### Import

from scraping.services.scraper_service import get_scraper_service

### Utilisation minimale

service = get_scraper_service()
result = service.scrape(query="laptop")

### Utilisation complète

result = service.scrape(
    query="laptop",                           # Recherche utilisateur (obligatoire)
    category_hint="electronics",                # Catégorie suggérée (optionnel)
    platforms=["jumia", "ebay", "aliexpress"],  # Plateformes (optionnel, défaut = toutes)
    max_workers=3                              # Threads parallèles (optionnel)
)

---

## 3. Format de retour (dict Python)

{
    "status": "success",              # "success" | "no_results" | "partial_failure"
    "query": "laptop",
    "category": "electronics",          # Catégorie détectée ou hint
    "scraped_at": "2026-04-21T19:30:00Z",
    "execution_time_ms": 55000,       # Temps total en millisecondes
    
    "products": [                     # Liste de produits normalisés
        {
            "title": "DELL Laptop 2024 Latitude 5450",
            "price": 7900.0,          # Float, toujours positif
            "currency": "MAD",        # ISO : MAD, USD, EUR, GBP
            "price_usd": 790.0,       # Conversion approximative pour comparaison
            "platform": "jumia",      # "jumia" | "ebay" | "aliexpress"
            "category": "electronics", # Catégorie normalisée
            "url": "https://www.jumia.ma/...",
            "image": "https://cdn.jumia.ma/...",  # Peut être vide
            "seller": "DELL Official Store",       # Peut être vide
            "rating": 4.5,            # Float 0-5, ou null
            "reviews_count": 128,     # Int, ou 0
            "attributes": {            # JSON libre, varie par catégorie
                "brand": "DELL",
                "ram": "16GB",
                "storage": "512GB SSD",
                "processor": "Intel Ultra 5"
            },
            "scraped_at": "2026-04-21T19:30:00Z",
            "search_query": "laptop"   # Requête originale
        }
    ],
    
    "stats": {
        "total_products": 37,         # Produits validés uniques
        "raw_extracted": 124,         # Total avant dédoublonnage
        "by_platform": {
            "jumia": 17,
            "ebay": 12,
            "aliexpress": 8
        },
        "errors": [],                 # Erreurs par plateforme
        "rejected": 3,                # Invalides (prix nul, titre vide...)
        "deduplicated": 84            # Doublons supprimés
    }
}

---

## 4. Exemple d'intégration Django complet

### views.py (backend)

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from scraping.services.scraper_service import get_scraper_service
from backend.models import Product  # Votre modèle

@csrf_exempt
def api_scrape(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    
    # Lire le body
    body = json.loads(request.body)
    query = body.get("query")
    
    if not query:
        return JsonResponse({"error": "query required"}, status=400)
    
    # APPEL AU MODULE SCRAPING
    service = get_scraper_service()
    result = service.scrape(
        query=query,
        category_hint=body.get("category"),
        platforms=body.get("platforms")
    )
    
    # Sauvegarde en base (optionnel, selon votre logique)
    if result["status"] == "success":
        for p in result["products"]:
            Product.objects.update_or_create(
                url=p["url"],  # Clé unique
                defaults={
                    "title": p["title"],
                    "price": p["price"],
                    "currency": p["currency"],
                    "price_usd": p.get("price_usd"),
                    "platform": p["platform"],
                    "category": p["category"],
                    "seller": p.get("seller", ""),
                    "rating": p.get("rating"),
                    "attributes": p.get("attributes", {}),
                    "search_query": query,
                }
            )
    
    # Retourner au frontend
    return JsonResponse(result)

---

## 5. Gestion des erreurs

| Cas | status | stats["errors"] | Action backend |
|-----|--------|-----------------|--------------|
| Tout OK | success | [] | Sauvegarder, retourner 200 |
| 1 spider bloqué | partial_failure | [{"platform": "aliexpress", "error": "CAPTCHA"}] | Sauvegarder le reste, retourner 200 avec warning |
| Tout bloqué | no_results | [...] | Retourner 200 mais products: [] |
| Paramètre manquant | — | — | Retourner 400 avant d'appeler le scraper |

---

## 6. Performance & limites

| Paramètre | Valeur | Note |
|-----------|--------|------|
| Timeout par spider | 120s | Playwright lent sur AliExpress |
| Threads parallèles | 3 max | Évite le rate-limit |
| Produits par spider | 20-66 | Dépend de la plateforme |
| Temps total typique | 30-90s | AliExpress = le plus lent |
| Appels simultanés | Éviter | Risque de blocage IP |

Conseil : Pour l'UI, lancer le scraping en tâche asynchrone (Celery/RQ) et polling, pas synchrone.

---

## 7. Export data_mining (optionnel)

Si l'équipe data_mining veut des fichiers plutôt que l'API :

from scraping.services.exporter import DataExporter

exporter = DataExporter(output_dir="data_mining/inputs/")
csv_path = exporter.to_csv(products, "laptop.csv")
json_path = exporter.to_json(products, "laptop.json")

Fichiers générés dans data_mining/inputs/.

---

## 8. Contact & support

| Question | Qui contacter |
|----------|---------------|
| Spider ne fonctionne plus (HTML changé) | Membre 1 — Scraping |
| Ajouter une plateforme | Membre 1 — Scraping |
| Intégration Django ne marche pas | Membre X — Backend |
| Format JSON incompris | Membre 1 — Scraping |
| Performance trop lente | Membre 1 — Scraping |

---

## 9. Test de validation

Pour vérifier que le module fonctionne avant intégration :

cd C:\market-research-pricing-analysis
.\venv\Scripts\activate

# Test rapide (1 plateforme)
python -c "from scraping.services.scraper_service import get_scraper_service; s = get_scraper_service(); r = s.scrape('laptop', platforms=['jumia']); print(f'OK: {r['stats']['total_products']} products')"

# Test complet (3 plateformes)
python -m scraping.tests.test_integration

Résultat attendu : OK: 37 products (varie selon les résultats live).

---

Document version 1.0 — 21 Avril 2026
Module Scraping v1.0 validé