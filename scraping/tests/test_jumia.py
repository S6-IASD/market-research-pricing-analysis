# test_jumia.py
from scraping.spiders.jumia_spider import JumiaSpider
import json

def main():
    print("🚀 Lancement du spider Jumia...")
    print("=" * 50)
    
    # On teste avec "laptop" comme produit
    spider = JumiaSpider("tv")
    results = spider.run()
    
    print("\n" + "=" * 50)
    print(f"📊 RÉSULTATS : {len(results)} produits trouvés")
    print("=" * 50)
    
    if results:
        # Affiche le premier produit en détail
        print("\n🔍 Premier produit trouvé :")
        print(json.dumps(results[0], indent=2, ensure_ascii=False))
        
        # Affiche un résumé de tous les produits
        print(f"\n📋 Résumé des {len(results)} produits :")
        for i, product in enumerate(results[:5], 1):  # Limite à 5 pour la lisibilité
            print(f"\n{i}. {product['title'][:60]}...")
            print(f"   💰 Prix : {product['price']} {product['currency']}")
            print(f"   🔗 URL : {product['url'][:70]}...")
    else:
        print("❌ Aucun produit trouvé. Vérifie la connexion ou la structure HTML.")

if __name__ == "__main__":
    main()