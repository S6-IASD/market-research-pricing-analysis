import json
import re
from bs4 import BeautifulSoup


class AliexpressParser:

    def extract_products(self, html: str):
        if self._is_blocked(html):
            print("❌ PAGE BLOCKED DETECTED")
            with open("blocked_page.html", "w", encoding="utf-8") as f:
                f.write(html[:5000])
            return []

        products = self._parse_json(html)
        if products:
            return products

        return self._parse_dom(html)

    def _is_blocked(self, html: str) -> bool:
        if len(html) < 5000:
            return True
            
        block_indicators = [
            "blocked", "captcha", "robot check", "security check",
            "please verify", "access denied", "403 forbidden",
            "verify you are human", "ddos protection",
            "are you a robot", "automated access",
            "unusual traffic", "suspicious activity"
        ]
        html_lower = html.lower()
        return any(indicator in html_lower for indicator in block_indicators)

    def clean_text(self, text: str):
        if not text:
            return ""
        remove_words = [
            "See preview", "Similar items", "Extra", "sold",
            "Save", "Top selling", "Best price",
            "New shoppers", "Premium Quality", "Free shipping",
            "Official Store"
        ]
        for w in remove_words:
            text = text.replace(w, "")
        return " ".join(text.split())

    def _parse_json(self, html: str):
        try:
            match = re.search(
                r'window\.__INIT_DATA__\s*=\s*({[\s\S]*?});?\s*(?:</script>|window\.)',
                html
            )
            if not match:
                return []

            json_str = match.group(1)
            json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
            data = json.loads(json_str)

            items = (
                data.get("data", {})
                    .get("root", {})
                    .get("fields", {})
                    .get("mods", {})
                    .get("itemList", {})
                    .get("content", [])
            )

            if not items:
                items = data.get("itemList", {}).get("content", [])

            products = []
            for item in items:
                title = item.get("title", {}).get("displayTitle") or item.get("title", "")
                prices = item.get("prices", {})
                sale_price = prices.get("salePrice", {}) if isinstance(prices, dict) else {}
                price = sale_price.get("formattedPrice") if isinstance(sale_price, dict) else None

                if not price:
                    min_price = sale_price.get("minPrice") if isinstance(sale_price, dict) else None
                    if min_price:
                        price = f"{min_price.get('value', '')} {min_price.get('currency', 'USD')}"

                product_id = item.get("productId") or item.get("id")

                products.append({
                    "id": product_id,
                    "title": self.clean_text(title),
                    "price": price,
                    "currency": "USD",
                    "platform": "aliexpress",
                    "url": f"https://www.aliexpress.com/item/{product_id}.html" if product_id else ""
                })

            return products

        except Exception as e:
            print(f"JSON parsing error: {e}")
            return []

    def _parse_dom(self, html: str):
        soup = BeautifulSoup(html, "html.parser")
        products = []

        items = soup.select("[data-spm='list']") or \
                soup.select("[data-product-id]") or \
                soup.select("a[href*='/item/']")

        for item in items[:20]:
            title_elem = (
                item.select_one("[class*='title']") or
                item.select_one("img[alt]")
            )
            
            title = ""
            if title_elem:
                title = title_elem.get("alt", "") or title_elem.get_text(strip=True)
            else:
                title = item.get_text(strip=True)
            
            title = self.clean_text(title)

            href = item.get("href", "")
            if not href:
                link = item.select_one("a[href]")
                if link:
                    href = link.get("href", "")
            
            if href and href.startswith("//"):
                href = "https:" + href
            elif href and not href.startswith("http"):
                href = "https://www.aliexpress.com" + href

            # --- PRIX CORRIGÉ ---
            price = None
            currency = "USD"
            
            if href:
                # Extrait le prix de l'URL : %21MAD%21<original>%21<discounted>
                # Pattern: %21MAD%21XXXX.XX%21YYYY.YY%21
                price_matches = re.findall(r'%21(MAD|USD|EUR)%21([\d\.]+)%21([\d\.]+)?%21', href)
                
                if price_matches:
                    curr, original, discounted = price_matches[0]
                    # Prendre le prix discounté s'il existe, sinon l'original
                    price_val = discounted if discounted else original
                    price = f"{price_val}"
                    currency = curr

            # Fallback : chercher dans le DOM
            if not price:
                price_elem = item.select_one("[class*='price']")
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
                    # Extraire nombre + devise
                    price_match = re.search(r'([\d\.,]+)\s*(MAD|USD|\$|€)', price_text)
                    if price_match:
                        price = price_match.group(1).replace(',', '.')
                        currency = "MAD" if "MAD" in price_text or "DH" in price_text else "USD"

            product_id = item.get("data-product-id") or ""
            if not product_id and href:
                id_match = re.search(r'/item/(\d+)', href)
                product_id = id_match.group(1) if id_match else ""

            if title and len(title) > 10 and product_id:
                products.append({
                    "id": product_id,
                    "title": title,
                    "price": price,
                    "currency": currency,
                    "platform": "aliexpress",
                    "url": href
                })

        return products