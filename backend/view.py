"""
Vue Django pour l'API de scraping.
"""

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from scraping.services.scraper_service import get_scraper_service
from scraping.services.exporter import DataExporter


@csrf_exempt
@require_http_methods(["POST"])
def api_scrape(request):
    """
    POST /api/scrape/
    
    Body: {"query": "laptop", "category": "electronics", "platforms": ["jumia", "ebay"]}
    """
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    query = data.get("query")
    if not query:
        return JsonResponse({"error": "'query' required"}, status=400)
    
    # Paramètres optionnels
    category = data.get("category")
    platforms = data.get("platforms")
    
    # Exécuter scraping
    service = get_scraper_service()
    result = service.scrape(query=query, category_hint=category, platforms=platforms)
    
    # Export optionnel pour data_mining
    if result["status"] == "success" and result["products"]:
        exporter = DataExporter()
        csv_path = exporter.to_csv(result["products"], f"{query.replace(' ', '_')}.csv")
        result["exports"] = {"csv": csv_path}
    
    return JsonResponse(result)