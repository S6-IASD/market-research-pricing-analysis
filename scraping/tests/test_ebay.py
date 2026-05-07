import sys
from pathlib import Path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from scraping.spiders.ebay_spider import EbaySpider
from scraping.parsers.ebay_parser import EbayParser

spider = EbaySpider("laptop")
url = spider.build_search_url(1)
html = spider.fetch(url)

print(f"HTML: {len(html)} caractères")
print(f"Contient 's-item': {'s-item' in html}")
print(f"Contient 'itm/': {'itm/' in html}")

parser = EbayParser()
products = parser.extract_products(html)

print(f"\n✅ {len(products)} produits extraits\n")

for i, p in enumerate(products[:5], 1):
    print(f"--- Produit {i} ---")
    print(f"  Titre: {p.get('title', 'N/A')[:70]}")
    print(f"  Prix:  {p.get('price', 'N/A')}")
    print(f"  URL:   {p.get('url', 'N/A')[:60]}...")
    print()