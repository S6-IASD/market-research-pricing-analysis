from abc import ABC, abstractmethod
from typing import List, Dict


class BaseSpider(ABC):
    """Base class for all spiders."""

    def __init__(self, query: str, category_hint: str = None):
        self.query = query
        self.category_hint = category_hint
        self.platform = self.get_platform_name()

    @abstractmethod
    def get_platform_name(self) -> str:
        pass

    @abstractmethod
    def build_search_url(self, page: int) -> str:
        pass

    @abstractmethod
    def fetch(self, url: str) -> str:
        pass

    @abstractmethod
    def parse(self, html: str) -> List[Dict]:
        pass

    @abstractmethod
    def _is_empty_page(self, html: str) -> bool:
        """
        Retourne True si la page ne contient AUCUN article brut
        (vraie fin de catalogue), pas juste des produits filtrés.
        """
        pass

    def run(self, max_pages: int = 10) -> List[Dict]:
        all_products = []
        empty_pages_count = 0

        for page in range(1, max_pages + 1):
            url = self.build_search_url(page)
            html = self.fetch(url)

            if not html:
                break

            # 🔥 Vérifie si c'est une vraie page vide (fin de catalogue)
            if self._is_empty_page(html):
                empty_pages_count += 1
                if empty_pages_count >= 2:
                    print(f"  🛑 2 pages vides consécutives — arrêt.")
                    break
                continue
            else:
                empty_pages_count = 0

            products = self.parse(html)

            # 🔥 NE PLUS s'arrêter si 0 produits validés
            # On continue pour les pages suivantes

            for p in products:
                p["platform"] = self.platform
                p["search_query"] = self.query
                p["category_hint"] = self.category_hint

            all_products.extend(products)

        return all_products