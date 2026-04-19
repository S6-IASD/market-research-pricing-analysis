from scraping.spiders.base_spider import BaseSpider
from scraping.parsers.jumia_parser import JumiaParser
from scraping.config import PLATFORMS
from urllib.parse import quote

class JumiaSpider(BaseSpider):
    def __init__(self, query: str):
        super().__init__(query)
        self.platform = "jumia"

    def build_url(self) -> str:
        return PLATFORMS["jumia"]["search_url"].format(quote(self.query))

    def parse(self, html: str) -> list:
        return JumiaParser().extract_products(html)