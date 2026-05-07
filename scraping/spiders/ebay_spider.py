from urllib.parse import quote
from scraping.spiders.base_spider import BaseSpider
from scraping.parsers.ebay_parser import EbayParser
from scraping.utils.http_client import HttpClient
from scraping.utils.logger import get_logger


class EbaySpider(BaseSpider):
    """Spider pour eBay."""

    def get_platform_name(self) -> str:
        return "ebay"

    def build_search_url(self, page: int = 1) -> str:
        return f"https://www.ebay.com/sch/i.html?_nkw={quote(self.query)}&_pgn={page}"

    def fetch(self, url: str) -> str:
        logger = get_logger("EbaySpider")
        logger.info(f"Fetching: {url}")
        client = HttpClient(platform="ebay")
        return client.get(url)

    def parse(self, html: str) -> list:
        return EbayParser().extract_products(html)

    def _is_empty_page(self, html: str) -> bool:
        """Vraie page vide = aucune carte produit eBay trouvée."""
        return "su-card-container__content" not in html