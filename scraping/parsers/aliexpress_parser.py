import json
import re
from bs4 import BeautifulSoup


class AliexpressParser:

    def extract_products(self, html: str):
        if self._is_blocked(html):
            print("❌ PAGE BLOCKED DETECTED")
            return []

        # Essayer JSON d'abord
        products = self._parse_json(html)
        if products:
            print(f"✅ {len(products)} produits extraits via JSON")
            return products

        # Fallback DOM
        products = self._parse_dom(html)
        if products:
            print(f"✅ {len(products)} produits extraits via DOM")
        else:
            print("⚠️ Aucun produit trouvé ni en JSON ni en DOM")
        return products

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
        """Parse toutes les variables JSON possibles."""
        json_vars = [
            r'window\.__INIT_DATA__\s*=\s*({[\s\S]*?});?\s*(?:</script>|window\.)',
            r'window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*(?:</script>|window\.)',
            r'window\.__APP_DATA__\s*=\s*({[\s\S]*?});?\s*(?:</script>|window\.)',
            r'window\._dida_config_\s*=\s*({[\s\S]*?});?\s*(?:</script>|window\.)',
        ]
        
        for pattern in json_vars:
            try:
                match = re.search(pattern, html)
                if not match:
                    continue
                
                json_str = match.group(1)
                json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
                data = json.loads(json_str)
                
                items = self._extract_items_from_json(data)
                if items:
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
                continue
        
        return []

    def _extract_items_from_json(self, data):
        """Extraire items depuis différentes structures JSON possibles."""
        paths = [
            ["data", "root", "fields", "mods", "itemList", "content"],
            ["itemList", "content"],
            ["data", "products"],
            ["data", "searchResult", "products"],
            ["data", "result", "data"],
            ["mods", "itemList", "content"],
        ]
        
        for path in paths:
            current = data
            for key in path:
                if isinstance(current, dict):
                    current = current.get(key, {})
                else:
                    break
            if isinstance(current, list) and len(current) > 0:
                return current
        
        # Chercher récursivement des listes qui ressemblent à des produits
        return self._find_product_lists(data)

    def _find_product_lists(self, data, depth=0):
        if depth > 5:
            return []
        if isinstance(data, list):
            if len(data) > 0 and isinstance(data[0], dict):
                # Vérifier si ça ressemble à des produits
                if any(k in data[0] for k in ["productId", "title", "prices", "id"]):
                    return data
            for item in data:
                result = self._find_product_lists(item, depth + 1)
                if result:
                    return result
        elif isinstance(data, dict):
            for v in data.values():
                result = self._find_product_lists(v, depth + 1)
                if result:
                    return result
        return []

    def _parse_dom(self, html: str):
        soup = BeautifulSoup(html, "html.parser")
        products = []
        
        # Collecter tous les éléments produit possibles sans doublons
        seen_ids = set()
        items = []
        
        # Stratégie 1: liens directs /item/
        for link in soup.find_all("a", href=re.compile(r'/item/\d+')):
            href = link.get("href", "")
            id_match = re.search(r'/item/(\d+)', href)
            if id_match:
                pid = id_match.group(1)
                if pid not in seen_ids:
                    seen_ids.add(pid)
                    items.append(("link", link, pid, href))
        
        # Stratégie 2: data-product-id
        for elem in soup.find_all(attrs={"data-product-id": True}):
            pid = elem.get("data-product-id")
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                href = elem.get("href", "")
                if not href:
                    link = elem.select_one("a[href*='item']")
                    if link:
                        href = link.get("href", "")
                items.append(("data", elem, pid, href))
        
        # Stratégie 3: images avec alt (produits)
        for img in soup.find_all("img", alt=re.compile(r'.{10,}')):
            parent = img.find_parent("a", href=re.compile(r'/item/\d+'))
            if parent:
                href = parent.get("href", "")
                id_match = re.search(r'/item/(\d+)', href)
                if id_match:
                    pid = id_match.group(1)
                    if pid not in seen_ids:
                        seen_ids.add(pid)
                        items.append(("img", parent, pid, href))
        
        print(f"🔍 {len(items)} éléments produit uniques trouvés dans le DOM")
        
        for source, elem, product_id, href in items[:50]:
            try:
                # Normaliser l'URL
                if href.startswith("//"):
                    href = "https:" + href
                elif href and not href.startswith("http"):
                    href = "https://www.aliexpress.com" + href
                
                # --- TITRE ---
                title = ""
                
                # Essayer img alt d'abord (souvent le plus propre)
                img = elem.find("img")
                if img and img.get("alt"):
                    title = img.get("alt")
                
                # Sinon chercher dans l'élément
                if not title:
                    title_elem = (
                        elem.select_one("[class*='title']") or
                        elem.select_one("[class*='name']") or
                        elem.select_one("h1, h2, h3, h4, span")
                    )
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                
                # Sinon texte de l'élément lui-même
                if not title:
                    title = elem.get_text(strip=True)
                
                title = self.clean_text(title)
                
                # Filtrer les titres non pertinents
                if not title or len(title) < 5 or title.lower() in ["aliexpress", "home"]:
                    continue
                
                # --- PRIX ---
                price = None
                currency = "USD"
                
                # Chercher prix dans l'élément et ses parents
                search_elem = elem
                for _ in range(4):
                    if not search_elem:
                        break
                    
                    # Chercher par classe
                    price_elem = (
                        search_elem.select_one("[class*='price']") or
                        search_elem.select_one("[class*='cost']") or
                        search_elem.select_one("[class*='value']")
                    )
                    if price_elem:
                        price_text = price_elem.get_text(strip=True)
                        price_match = re.search(r'([\d\.,]+)\s*(MAD|USD|\$|€|EUR|DH|US)', price_text, re.IGNORECASE)
                        if price_match:
                            price = price_match.group(1).replace(',', '.')
                            curr_text = price_match.group(2).upper()
                            currency = "MAD" if curr_text in ["MAD", "DH"] else "USD"
                            break
                    
                    search_elem = search_elem.find_parent()
                
                # Fallback: parsing URL
                if not price:
                    price_matches = re.findall(r'%21(MAD|USD|EUR)%21([\d\.]+)%21([\d\.]+)?%21', href)
                    if price_matches:
                        curr, original, discounted = price_matches[0]
                        price = discounted if discounted else original
                        currency = curr
                
                products.append({
                    "id": product_id,
                    "title": title,
                    "price": price or "N/A",
                    "currency": currency,
                    "platform": "aliexpress",
                    "url": href
                })
                
            except Exception as e:
                continue
        
        return products