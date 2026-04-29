from abc import ABC, abstractmethod
from typing import List, Dict


class BaseSpider(ABC):
    """Classe de base pour tous les spiders."""
    
    def __init__(self, query: str, category_hint: str = None):
        self.query = query
        self.category_hint = category_hint
        self.platform = self.get_platform_name()
    
    @abstractmethod
    def get_platform_name(self) -> str:
        pass
    
    @abstractmethod
    def build_search_url(self) -> str:
        pass
    
    @abstractmethod
    def fetch(self, url: str) -> str:
        pass
    
    @abstractmethod
    def parse(self, html: str) -> List[Dict]:
        pass
    
    def run(self) -> List[Dict]:
        """Template method : construit URL, fetch, parse."""
        url = self.build_search_url()
        html = self.fetch(url)
        products = self.parse(html)
        
        # Enrichit avec métadonnées communes
        for p in products:
            p["platform"] = self.platform
            p["search_query"] = self.query
            p["category_hint"] = self.category_hint
        
        return products