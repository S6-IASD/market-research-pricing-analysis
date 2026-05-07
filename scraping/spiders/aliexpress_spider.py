from urllib.parse import quote
from scraping.spiders.base_spider import BaseSpider
from scraping.parsers.aliexpress_parser import AliexpressParser
from scraping.utils.http_client import HttpClient
from scraping.utils.logger import get_logger


class AliexpressSpider(BaseSpider):
    """Spider pour AliExpress (Playwright)."""

    def get_platform_name(self) -> str:
        return "aliexpress"

    def build_search_url(self, page: int = 1) -> str:
        return f"https://www.aliexpress.com/wholesale?SearchText={quote(self.query)}&page={page}"

    def fetch(self, url: str) -> str:
        logger = get_logger("AliexpressSpider")
        logger.info(f"Fetching: {url}")
        client = HttpClient(platform="aliexpress")
        return client.get(url)

    def parse(self, html: str) -> list:
        return AliexpressParser().extract_products(html)

    def _is_empty_page(self, html: str) -> bool:
        """Vraie page vide = page bloquée ou aucun article détectable."""
        parser = AliexpressParser()
        if parser._is_blocked(html):
            return True
        # Chercher simplement des indices de produits dans le HTML brut
        has_products = (
            "window.__INIT_DATA__" in html or
            "window.__INITIAL_STATE__" in html or
            "data-product-id" in html or
            "/item/" in html
        )
        return not has_products