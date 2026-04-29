"""
Test intégration complet: Spider → Cleaner → Normalizer → Validator → JSON
"""

from scraping.services.scraper_service import ScraperService
from scraping.services.data_exporter import DataExporter


def test_full_pipeline():
    # Définir query ici
    query = "laptop"
    category = "electronics"
    platforms = ["jumia", "ebay", "aliexpress"]

    service = ScraperService()

    result = service.scrape(
        query=query,
        category_hint=category,
        platforms=platforms
    )

    print(f"\n{'='*60}")
    print(f"Query: {query}")
    print(f"Status: {result['status']}")
    print(f"Products: {result['stats']['total_products']}")
    print(f"Time: {result['execution_time_ms']}ms")
    print(f"{'='*60}")

    for i, p in enumerate(result["products"][:3], 1):
        print(f"\n--- Product {i} ---")
        print(f"Title: {p['title'][:60]}...")
        print(f"Price: {p['price']} {p['currency']} (USD: {p['price_usd']})")
        print(f"Platform: {p['platform']} | Category: {p['category']}")
        print(f"URL: {p['url'][:50]}...")

    # Export pour data_mining
    if result["status"] == "success" and result["products"]:
        exporter = DataExporter()

        query_safe = query.replace(" ", "_").replace("/", "-")
        csv_path = exporter.to_csv(result["products"], f"{query_safe}.csv")
        json_path = exporter.to_json(result["products"], f"{query_safe}.json")

        print(f"\n📁 CSV exporté: {csv_path}")
        print(f"📁 JSON exporté: {json_path}")

    return result


if __name__ == "__main__":
    test_full_pipeline()