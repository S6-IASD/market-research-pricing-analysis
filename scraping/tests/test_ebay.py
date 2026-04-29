import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from scraping.spiders.ebay_spider import EbaySpider

if __name__ == "__main__":
    print("🚀 Lancement du spider eBay...")
    spider = EbaySpider(query="smartphone")
    results = spider.run()

    print(f"\n✅ {len(results)} produits trouvés\n")
    for i, p in enumerate(results[:3], 1):
        print(f"--- Produit {i} ---")
        print(f"  Titre : {p['title']}")
        print(f"  Prix  : {p['price']}")
        print(f"  URL   : {p['url'][:60]}...")
        print()