from urllib.parse import quote
from scraping.spiders.base_spider import BaseSpider
from scraping.parsers.aliexpress_parser import AliexpressParser
from scraping.utils.http_client import HttpClient
from scraping.utils.logger import get_logger


class AliexpressSpider(BaseSpider):
    """Spider pour AliExpress (Playwright)."""
    
    def get_platform_name(self) -> str:
        return "aliexpress"
    
    def build_search_url(self) -> str:
        return f"https://www.aliexpress.com/wholesale?SearchText={quote(self.query)}"
    
    def fetch(self, url: str) -> str:
        logger = get_logger("AliexpressSpider")
        logger.info(f"Fetching: {url}")
        
        client = HttpClient()
        return client.get(url)
    
    def parse(self, html: str) -> list:
        return AliexpressParser().extract_products(html)