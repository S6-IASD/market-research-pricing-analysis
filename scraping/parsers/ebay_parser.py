import re
from bs4 import BeautifulSoup

class EbayParser:
    
    def _clean_title(self, title: str) -> str:
        """Nettoie le titre des artefacts eBay."""
        if not title:
            return ""
        
        # Supprimer les caractères spéciaux eBay (⁣, Ѕ, etc.)
        title = re.sub(r'[⁣Ѕ]', '', title)  # Caractères zero-width et lookalikes
        
        # Supprimer les patterns de bruit
        noise_patterns = [
            r'NEW\s+LOW\s+PRICE',
            r'Shop\s+on\s+eBay',
            r'Shop\s+store\s+on\s+eBay',
            r'Sponsored',
            r'Brand\s+New',
            r'or\s+Best\s+Offer',
            r'\+.*delivery',
            r'Located\s+in.*',
            r'Last\s+one',
            r'\d+\s*watching',
            r'\d+\s*[Kk]?items?\s*sold',
            r'Free\s+shipping',
            r'Open\s+box',
            r'Pre-Owned',
        ]
        
        for pattern in noise_patterns:
            title = re.sub(pattern, '', title, flags=re.IGNORECASE)
        
        title = ' '.join(title.split())
        return title.strip()

    def _is_sponsored(self, block) -> bool:
        """Détecte si le bloc est une annonce sponsorisée."""
        block_text = block.get_text().lower()
        sponsored_indicators = ['sponsored', 'shop store on ebay']
        return any(ind in block_text for ind in sponsored_indicators)

    def _is_valid_product(self, title: str, url: str) -> bool:
        """Vérifie que c'est un vrai produit."""
        if not title or len(title) < 15:
            return False
        
        # Vérifier que l'URL est valide (pas un faux itm/123456)
        if "itm/123456" in url or not re.search(r'itm/\d{10,}', url):
            return False
        
        # Vérifier que le titre contient des mots de produit
        product_words = ['laptop', 'computer', 'phone', 'iphone', 'dell', 'hp', 
                        'lenovo', 'asus', 'acer', 'macbook', 'thinkpad', 'pc',
                        'tv', 'television', 'monitor', 'tablet', 'watch', 'camera',
                        'intel', 'amd', 'ryzen', 'core', 'ssd', 'ram']
        
        title_lower = title.lower()
        return any(word in title_lower for word in product_words)

    def extract_products(self, html: str) -> list:
        soup = BeautifulSoup(html, "lxml")
        products = []
        
        for link in soup.find_all("a", href=re.compile(r'itm/\d+')):
            try:
                href = link.get("href", "")
                url = href.split("?")[0] if href else ""
                
                if not url or "ebay.com" not in url:
                    continue
                
                # Remonter pour trouver le bloc produit
                block = link
                for _ in range(4):
                    parent = block.find_parent()
                    if not parent:
                        break
                    block = parent
                
                # Filtrer sponsorisés
                if self._is_sponsored(block):
                    continue
                
                # Extraire le titre
                title = ""
                for text_elem in block.find_all(["span", "div", "h3", "h4", "a"]):
                    text = text_elem.get_text(strip=True)
                    
                    if len(text) > len(title) and 10 < len(text) < 200:
                        if re.match(r'^[\d\$\€\£\,\.\s]+$', text):
                            continue
                        if "items per page" in text.lower():
                            continue
                        title = text
                
                title = self._clean_title(title)
                
                # Vérifier validité
                if not self._is_valid_product(title, url):
                    continue
                
                # Extraire le prix
                price = None
                block_text = block.get_text()
                price_match = re.search(r'[\$\€\£]\s*[\d,]+\.?\d*', block_text)
                if price_match:
                    price = price_match.group(0)
                
                # Extraire l'image
                img = block.find("img")
                image = img.get("src") if img else None
                
                products.append({
                    "title": title,
                    "price": price,
                    "currency": "USD",
                    "platform": "ebay",
                    "url": url,
                    "image": image,
                    "seller": "eBay",
                    "category": "electronique",
                    "attributes": {}
                })
                
            except Exception:
                continue
        
        # Dédoublonner
        seen = set()
        unique = []
        for p in products:
            if p["url"] and p["url"] not in seen:
                seen.add(p["url"])
                unique.append(p)
        
        return unique