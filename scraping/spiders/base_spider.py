from abc import ABC, abstractmethod
from typing import List, Dict
import time
import random


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
        pass

    def run(self, max_pages: int = 10) -> List[Dict]:
        all_products = []
        empty_pages_count = 0

        for page in range(1, max_pages + 1):
            url = self.build_search_url(page)
            html = self.fetch(url)

            if not html:
                break

            # 🔥 DÉLAI ANTI-BOT ENTRE PAGES
            if self.platform == "ebay" and page < max_pages:
                delay = random.uniform(5, 10)
                print(f"  ⏳ Attente {delay:.1f}s pour éviter le blocage eBay...")
                time.sleep(delay)

            if self._is_empty_page(html):
                empty_pages_count += 1
                if empty_pages_count >= 2:
                    print(f"  🛑 2 pages vides consécutives — arrêt.")
                    break
                continue
            else:
                empty_pages_count = 0

            products = self.parse(html)

            for p in products:
                p["platform"] = self.platform
                p["search_query"] = self.query
                p["category_hint"] = self.category_hint

            all_products.extend(products)

        return all_products