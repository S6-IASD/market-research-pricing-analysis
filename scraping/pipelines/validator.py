"""
Validation qualité + filtrage générique des faux positifs.
"""

import hashlib
import re
from typing import Dict, List, Set


class DataValidator:
    """Vérifie qu'un produit est exploitable et pertinent."""
    
    MIN_TITLE_LENGTH = 10
    MAX_TITLE_LENGTH = 200
    MIN_PRICE = 0.01
    MAX_PRICE = 1000000
    
    # Faux positifs par catégorie (générique)
    JUNK_BY_CATEGORY = {
        "sports": ["sticker", "decal", "tunic", "neck", "notebook", "bloc note", 
                   "graffiti", "cartoon", "anime", "poster", "flag"],
        "electronics": ["sticker", "case", "cover", "screen protector", "cable only",
                        "adapter", "charger only", "stand", "holder"],
        "clothing": ["sticker", "decal", "hanger", "rack", "organizer", "box"],
        "books": ["bookmark", "cover", "sleeve", "stand", "light"],
        "appliances": ["filter", "bag", "accessory", "part", "replacement"],
    }
    
    def __init__(self):
        self.seen_hashes: Set[str] = set()
        self.rejected_count = 0
        self.junk_count = 0
    
    def is_valid(self, product: Dict) -> bool:
        """Valide structure + contenu."""
        checks = [
            self._has_valid_title(product),
            self._has_valid_price(product),
            self._has_valid_url(product),
            self._has_valid_platform(product),
            self._is_not_junk(product),  # ← NOUVEAU : filtre faux positifs
        ]
        
        if not all(checks):
            self.rejected_count += 1
            return False
        return True
    
    def is_unique(self, product: Dict) -> bool:
        """Vérifie dédoublonnage."""
        fingerprint = self._hash_product(product)
        if fingerprint in self.seen_hashes:
            return False
        self.seen_hashes.add(fingerprint)
        return True
    
    def validate_batch(self, products: List[Dict]) -> List[Dict]:
        """Filtre et dédoublonne un batch complet."""
        valid = []
        for p in products:
            if self.is_valid(p) and self.is_unique(p):
                valid.append(p)
        return valid
    
    def _is_not_junk(self, product: Dict) -> bool:
        """
        Filtre les faux positifs selon la catégorie.
        Ex: "Bike Neck Tunic" n'est pas un vélo.
        """
        title = product.get("title", "").lower()
        category = product.get("category", "unknown")
        
        # Récupérer les mots junk pour cette catégorie
        junk_words = self.JUNK_BY_CATEGORY.get(category, [])
        
        # Si le titre contient un mot junk → rejeté
        for junk in junk_words:
            if junk in title:
                self.junk_count += 1
                return False
        
        return True
    
    def _hash_product(self, product: Dict) -> str:
        """Hash sur titre normalisé (pas price, car varie selon plateforme)."""
        title = product.get("title", "").lower()
        # Supprime variantes mineures
        title = re.sub(r'\b(2024|2025|new|original|official)\b', '', title)
        title = re.sub(r'[^\w\s]', '', title)
        title = " ".join(title.split())
        
        return hashlib.md5(title.encode()).hexdigest()
    
    def _has_valid_title(self, product: Dict) -> bool:
        title = product.get("title", "")
        if not title or len(title) < self.MIN_TITLE_LENGTH or len(title) > self.MAX_TITLE_LENGTH:
            return False
        digit_ratio = sum(c.isdigit() for c in title) / len(title)
        return digit_ratio <= 0.5
    
    def _has_valid_price(self, product: Dict) -> bool:
        price = product.get("price")
        return isinstance(price, (int, float)) and self.MIN_PRICE <= price <= self.MAX_PRICE
    
    def _has_valid_url(self, product: Dict) -> bool:
        url = product.get("url", "")
        pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return bool(re.match(pattern, url, re.IGNORECASE))
    
    def _has_valid_platform(self, product: Dict) -> bool:
        return product.get("platform", "") in ["jumia", "ebay", "aliexpress"]
    
    def get_stats(self) -> Dict:
        return {
            "rejected": self.rejected_count,
            "junk_filtered": self.junk_count,
        }