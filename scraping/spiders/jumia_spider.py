from urllib.parse import quote
from scraping.spiders.base_spider import BaseSpider
from scraping.parsers.jumia_parser import JumiaParser
from scraping.utils.http_client import HttpClient
from scraping.utils.logger import get_logger


class JumiaSpider(BaseSpider):
    """Spider pour Jumia Maroc."""
    
    def get_platform_name(self) -> str:
        return "jumia"
    
    def build_search_url(self) -> str:
        return f"https://www.jumia.ma/catalog/?q={quote(self.query)}"
    
    def fetch(self, url: str) -> str:
        logger = get_logger("JumiaSpider")
        logger.info(f"Fetching: {url}")
        
        client = HttpClient()
        return client.get(url)
    
    def parse(self, html: str) -> list:
        return JumiaParser().extract_products(html)