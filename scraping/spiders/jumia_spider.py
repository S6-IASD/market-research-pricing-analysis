import re
import time
import random
import requests
from bs4 import BeautifulSoup
from scraping.spiders.base_spider import BaseSpider
from scraping.parsers.jumia_parser import JumiaParser

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
]

PROXIES_LIST = [
    None,  # connexion directe en fallback
]


def get_headers() -> dict:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-MA,fr;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }


class JumiaSpider(BaseSpider):
    """
    Spider Jumia — hérite de BaseSpider.
    Implémente : get_platform_name, build_search_url, fetch, parse, _is_empty_page.
    Hérite de run() pour la boucle de pagination.
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

    # ── 3. FETCH AVEC PROXY + UA FALLBACK ──────────────────────────────────
    def fetch(self, url: str) -> str | None:
        for i, proxy in enumerate(PROXIES_LIST, 1):
            headers = get_headers()
            proxy_config = {"http": proxy, "https": proxy} if proxy else None
            label = proxy or "DIRECT"

            try:
                print(f"  [#{i}] {label} | UA: {headers['User-Agent'][:45]}...")
                r = requests.get(
                    url,
                    headers=headers,
                    proxies=proxy_config,
                    timeout=15,
                    allow_redirects=True,
                )

                if r.status_code == 200:
                    print(f"  ✅ Succès ({label})")
                    time.sleep(random.uniform(2, 5))
                    return r.text

                print(f"  ⚠️  HTTP {r.status_code} ({label})")

            except requests.exceptions.ProxyError:
                print(f"  ❌ Proxy mort : {label}")
            except requests.exceptions.Timeout:
                print(f"  ⏱️  Timeout : {label}")
            except requests.exceptions.ConnectionError as e:
                print(f"  🔌 Connexion échouée : {label} — {e}")

        print("  💀 Tous les proxies ont échoué.")
        return None

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