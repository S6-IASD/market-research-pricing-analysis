from scraping.spiders.jumia_spider import JumiaSpider

if __name__ == "__main__":
    print("🚀 Lancement du spider Jumia...")
    print("=" * 50)

    # 🔥 Plusieurs requêtes pour maximiser les résultats
    queries = [
        "laptop",
        "pc portable",
        "ordinateur portable",
        "notebook",
        "ultrabook",
        "macbook",
    ]

    all_products = []
    seen_urls = set()  # Pour éviter les doublons
    total_brut = 0     # Compteur des produits bruts (avant dédoublonnage)

    for query in queries:
        print(f"\n🔎 Requête : '{query}'")
        print("-" * 50)

        spider = JumiaSpider(query=query, category_hint="electronics", debug=False)
        products = spider.run(max_pages=5)
        
        total_brut += len(products)  # Ajoute au total brut

        for p in products:
            url = p.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_products.append(p)

        print(f"  ✅ {len(products)} trouvés | Cumul unique : {len(all_products)}")

    # 🔥 AFFICHAGE DES TOTAUX — APRÈS la boucle
    print(f"\n{'=' * 50}")
    print(f"📊 TOTAL BRUT   : {total_brut} produits (toutes requêtes confondues)")
    print(f"📊 TOTAL UNIQUE : {len(all_products)} produits (après dédoublonnage)")
    print(f"{'=' * 50}")

    # Affiche les 10 premiers
    for p in all_products[:10]:
        print(f"\n💻 {p['title'][:70]}")
        print(f"   Prix : {p['price']} {p['currency']} | Requête : {p['search_query']}")
        print(f"   URL  : {p['url']}")

    # Sauvegarde en JSON
    import json
    with open("jumia_results.json", "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Sauvegardé dans jumia_results.json ({len(all_products)} produits)")