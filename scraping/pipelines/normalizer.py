"""
Standardisation avec sous-catégorie.
"""

from typing import Dict, Optional
from scraping.services.category_detector import CategoryDetector


class DataNormalizer:
    """Transforme données nettoyées en format standard universel."""
    
    CURRENCY_MAP = {
        "dh": "MAD", "mad": "MAD", "د.م.": "MAD",
        "$": "USD", "usd": "USD", "us$": "USD",
        "€": "EUR", "eur": "EUR", "£": "GBP",
    }
    
    PLATFORM_SLUGS = {
        "jumia": "jumia", "jumia.ma": "jumia", "jumia.com": "jumia",
        "ebay": "ebay", "ebay.com": "ebay",
        "aliexpress": "aliexpress", "aliexpress.com": "aliexpress",
    }
    
    def __init__(self):
        self.category_detector = CategoryDetector()
    
    def normalize(self, product: Dict, category_hint: Optional[str] = None) -> Dict:
        """Normalise un produit nettoyé."""
        normalized = product.copy()
        
        normalized["currency"] = self._normalize_currency(
            product.get("currency", ""),
            product.get("price_raw", "")
        )
        
        normalized["price"] = float(product.get("price", 0))
        normalized["platform"] = self._normalize_platform(product.get("platform", ""))
        
        # Détection catégorie complète
        category_info = self._normalize_category(
            product.get("title", ""),
            product.get("category", ""),
            category_hint,
            product.get("search_query", "")
        )
        
        normalized["category"] = category_info["category"]
        normalized["subcategory"] = category_info["subcategory"]
        
        # Champs calculés
        normalized["price_usd"] = self._convert_to_usd(
            normalized["price"], 
            normalized["currency"]
        )
        
        normalized["rating"] = self._normalize_rating(product.get("rating"))
        normalized["reviews_count"] = int(product.get("reviews_count", 0) or 0)
        normalized["attributes"] = product.get("attributes", {}) or {}
        
        if "scraped_at" not in normalized:
            from datetime import datetime
            normalized["scraped_at"] = datetime.utcnow().isoformat() + "Z"
        
        return normalized
    
    def _normalize_currency(self, currency_raw: str, price_raw) -> str:
        text = f"{currency_raw} {price_raw}".lower()
        for indicator, iso in self.CURRENCY_MAP.items():
            if indicator in text:
                return iso
        return "USD"
    
    def _normalize_platform(self, platform_raw: str) -> str:
        key = platform_raw.lower().strip()
        return self.PLATFORM_SLUGS.get(key, key)
    
    def _normalize_category(self, title: str, existing: str, hint: Optional[str], query: Optional[str]) -> Dict:
        """Retourne dict avec category + subcategory."""
        # Priorité: hint > existant > détection auto
        if hint:
            category = hint.lower()
            subcategory = self.category_detector.detect_subcategory(title, category)
            return {"category": category, "subcategory": subcategory}
        
        if existing and existing != "unknown":
            subcategory = self.category_detector.detect_subcategory(title, existing)
            return {"category": existing.lower(), "subcategory": subcategory}
        
        # Détection auto complète
        detected = self.category_detector.detect_full(title, query)
        return {
            "category": detected["category"],
            "subcategory": detected["subcategory"],
        }
    
    def _convert_to_usd(self, price: float, currency: str) -> Optional[float]:
        rates = {"MAD": 0.10, "EUR": 1.08, "GBP": 1.25, "USD": 1.0}
        rate = rates.get(currency, 1.0)
        return round(price * rate, 2) if price else None
    
    def _normalize_rating(self, rating_raw) -> Optional[float]:
        if not rating_raw:
            return None
        try:
            rating = float(rating_raw)
            if rating > 5 and rating <= 10:
                return round(rating / 2, 1)
            elif rating > 10:
                return round(rating / 20, 1)
            return round(rating, 1)
        except (ValueError, TypeError):
            return None