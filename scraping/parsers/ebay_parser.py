import re
from bs4 import BeautifulSoup

class EbayParser:

    def _clean_price(self, raw: str) -> str:
        match = re.search(r'[\d\s,\.]+\s*EUR', raw)
        return match.group(0).strip() if match else raw.strip()

    def extract_products(self, html: str) -> list:
        soup = BeautifulSoup(html, "lxml")
        products = []

        # Conteneur principal de chaque carte produit
        cards = soup.select("div.su-card-container__content")

        for card in cards:
            try:
                # Titre : dans span à l'intérieur de div.s-card__title
                title_tag = card.select_one("div.s-card__title span")
                title = title_tag.get_text(strip=True) if title_tag else None

                if not title or len(title) < 5:
                    continue
                if "shop on ebay" in title.lower():
                    continue

                # Prix : span.s-card__price
                price_tag = card.select_one("span.s-card__price")
                price = self._clean_price(price_tag.get_text(strip=True)) if price_tag else None

                # URL : href du lien principal
                link_tag = card.select_one("a.su-card-container__header")
                url = link_tag.get("href", "") if link_tag else None

                # Image : dans le HTML parent — on remonte
                parent = card.find_parent()
                img_tag = parent.select_one("img") if parent else None
                image = img_tag.get("src") if img_tag else None

                products.append({
                    "title": title,
                    "price": price,
                    "currency": "EUR",
                    "platform": "ebay",
                    "url": url,
                    "image": image,
                    "seller": "eBay",
                    "category": "electronique",
                    "attributes": {}
                })

            except Exception:
                continue

        return products