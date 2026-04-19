import re
from bs4 import BeautifulSoup

class JumiaParser:
    
    def _clean_title(self, raw_title: str) -> str:
        """Supprime les textes parasites collés au titre."""
        # Supprime "0522041818 pour commander" (numéro téléphone + texte)
        cleaned = re.sub(r'\d{9,10}\s*pour\s*commander', '', raw_title)
        # Supprime les prix collés à la fin "7,900.00 Dhs9,000.00 Dhs12%"
        cleaned = re.sub(r'[\d,\.]+\s*Dhs.*$', '', cleaned)
        return cleaned.strip()
    
    def extract_products(self, html: str) -> list:
        soup = BeautifulSoup(html, "lxml")
        products = []
        
        links = soup.select("a.core")
        
        for link in links:
            try:
                title = self._clean_title(link.get_text(strip=True))
                
                price_elem = (
                    link.select_one("span._price") or 
                    link.select_one(".prc") or
                    link.select_one("span.-b") or
                    link.select_one("span.-pvs")
                )
                price = price_elem.get_text(strip=True) if price_elem else None
                
                img_container = link.select_one("div.img-c")
                img_url = None
                if img_container:
                    img = img_container.select_one("img")
                    if img:
                        img_url = img.get("data-src") or img.get("src")
                
                href = link.get("href", "")
                if href and not href.startswith("http"):
                    href = "https://www.jumia.ma" + href
                
                seller_elem = link.select_one("._sml")
                seller = seller_elem.get_text(strip=True) if seller_elem else "Jumia"
                
                if title and len(title) > 5:
                    products.append({
                        "title": title,
                        "price": price,
                        "currency": "MAD",
                        "platform": "jumia",
                        "url": href,
                        "image": img_url,
                        "seller": seller,
                        "category": "electronique",
                        "attributes": {}
                    })
                    
            except Exception:
                continue
                
        return products