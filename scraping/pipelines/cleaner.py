"""
Nettoyage des données brutes extraites par les spiders.
"""

import re
from typing import Dict


class DataCleaner:
    """Nettoie les champs texte, prix, URLs avant normalisation."""
    
    MARKETING_JUNK = [
        "official store", "genuine", "authentic", "original",
        "hot sale", "best price", "top selling", "free shipping",
        "see preview", "similar items", "extra", "save",
        "new shoppers", "premium quality", "limited edition",
        "flash deal", "clearance", "bestseller", "trending now",
    ]
    
    def clean(self, product: Dict) -> Dict:
        """Pipeline de nettoyage complet."""
        cleaned = product.copy()
        
        cleaned["title"] = self._clean_title(cleaned.get("title", ""))
        cleaned["price_raw"] = cleaned.get("price")  # Debug
        cleaned["price"] = self._clean_price(cleaned.get("price", ""))
        cleaned["url"] = self._clean_url(cleaned.get("url", ""))
        cleaned["image"] = self._clean_url(cleaned.get("image", ""))
        cleaned["seller"] = self._clean_text(cleaned.get("seller", ""))
        
        # Nettoyer attributes
        if "attributes" in cleaned and isinstance(cleaned["attributes"], dict):
            cleaned["attributes"] = {
                k: self._clean_text(str(v))
                for k, v in cleaned["attributes"].items()
            }
        
        return cleaned
    
    def _clean_title(self, title: str) -> str:
        if not title:
            return ""
        
        for junk in self.MARKETING_JUNK:
            title = re.sub(rf'\b{re.escape(junk)}\b', '', title, flags=re.IGNORECASE)
        
        # Supprime caractères spéciaux répétés
        title = re.sub(r'[!@#$%^&*()_+]{2,}', '', title)
        
        return " ".join(title.split()).strip()
    
    def _clean_price(self, price_raw) -> float:
        """Extrait float d'une string prix: 'MAD 12 345,67' → 12345.67"""
        if isinstance(price_raw, (int, float)):
            return float(price_raw)
        
        if not price_raw:
            return 0.0
        
        price_str = str(price_raw)
        cleaned = re.sub(r'[^\d.,]', '', price_str)
        
        # Détecte format européen vs US
        if ',' in cleaned and '.' in cleaned:
            if cleaned.rfind(',') > cleaned.rfind('.'):
                cleaned = cleaned.replace('.', '').replace(',', '.')
            else:
                cleaned = cleaned.replace(',', '')
        elif ',' in cleaned:
            if len(cleaned.split(',')[-1]) == 2:
                cleaned = cleaned.replace(',', '.')
            else:
                cleaned = cleaned.replace(',', '')
        
        try:
            return float(cleaned) if cleaned else 0.0
        except ValueError:
            return 0.0
    
    def _clean_url(self, url: str) -> str:
        if not url:
            return ""
        if url.startswith("//"):
            return "https:" + url
        if not url.startswith("http"):
            return "https://" + url
        return url.strip()
    
    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        return " ".join(str(text).split()).strip()