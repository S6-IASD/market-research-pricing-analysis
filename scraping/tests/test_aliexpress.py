from scraping.spiders.aliexpress_spider import AliexpressSpider


def main():
    spider = AliexpressSpider("tv")
    results = spider.run()

    print(f"\n{'='*50}")
    print(f"Produits trouvés: {len(results)}")
    print(f"{'='*50}\n")

    for i, r in enumerate(results[:5], 1):
        print(f"--- Produit {i} ---")
        print(f"ID: {r.get('id', 'N/A')}")
        print(f"Titre: {r.get('title', 'N/A')}")
        print(f"Prix: {r.get('price', 'N/A')} {r.get('currency', '')}")
        print(f"URL: {r.get('url', 'N/A')[:80]}...")
        print()


if __name__ == "__main__":
    main()