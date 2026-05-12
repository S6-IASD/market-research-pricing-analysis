import re
from bs4 import BeautifulSoup
from scraping.spiders.base_spider import BaseSpider
from scraping.parsers.jumia_parser import JumiaParser
from scraping.utils.http_client import HttpClient
from scraping.utils.logger import get_logger

class JumiaSpider(BaseSpider):
    """
    Spider Jumia — hérite de BaseSpider.
    Implémente : get_platform_name, build_search_url, fetch, parse, _is_empty_page.
    """

    BASE_URL = "https://www.jumia.ma/catalog/?q={query}&page={page}"

    def __init__(self, query: str, category_hint: str = None, debug: bool = False):
        self.parser = JumiaParser(debug=debug)
        self.debug = debug
        super().__init__(query=query, category_hint=category_hint)

    # ── 1. NOM PLATEFORME ───────────────────────────────────────────────────
    def get_platform_name(self) -> str:
        return "jumia"

    # ── 2. CONSTRUCTION URL ─────────────────────────────────────────────────
    def build_search_url(self, page: int) -> str:
        return self.BASE_URL.format(query=self.query, page=page)

    # ── 3. FETCH AVEC HTTP CLIENT (PLAYWRIGHT) ──────────────────────────────
    def fetch(self, url: str) -> str | None:
        logger = get_logger("JumiaSpider")
        logger.info(f"Fetching: {url}")
        client = HttpClient(platform="jumia")
        html = client.get(url)
        return html if html else None

    # ── 4. VÉRIFICATION FIN DE CATALOGUE ───────────────────────────────────
    def _is_empty_page(self, html: str) -> bool:
        """Vérifie si Jumia retourne une page sans aucun article (vraie fin)."""
        soup = BeautifulSoup(html, "html.parser")

        # Message "Aucun résultat"
        no_result = soup.find(string=re.compile(r"aucun résultat", re.I))
        if no_result:
            print(f"  🛑 Message 'Aucun résultat' détecté.")
            return True

        # Ou aucun article présent
        articles = soup.select("article.prd")
        if len(articles) == 0:
            print(f"  🛑 0 articles bruts sur la page.")
            return True

        return False

    # ── 5. PARSE ────────────────────────────────────────────────────────────
    def parse(self, html: str) -> list:
        products = self.parser.extract_products(html)
        print(f"  📦 {len(products)} produits extraits")
        return products