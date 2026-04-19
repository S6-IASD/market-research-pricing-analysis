from abc import ABC, abstractmethod

class BaseSpider(ABC):
    def __init__(self, query: str):
        self.query = query
        self.platform = ""

    @abstractmethod
    def build_url(self) -> str:
        pass

    @abstractmethod
    def parse(self, html: str) -> list:
        pass

    def run(self) -> list:
        from scraping.utils.http_client import HttpClient
        from scraping.utils.logger import get_logger
        logger = get_logger(self.__class__.__name__)

        url = self.build_url()
        logger.info(f"Scraping {self.platform} : {url}")

        html = HttpClient().get(url)

        if not html:
            logger.warning(f"Page vide pour : {url}")
            return []

        # Sauvegarde le HTML pour les tests
        import os
        os.makedirs("scraping/tests/fixtures", exist_ok=True)
        with open(f"scraping/tests/fixtures/{self.platform}_latest.html", "w", encoding="utf-8") as f:
            f.write(html)

        results = self.parse(html)
        logger.info(f"{len(results)} produits trouvés sur {self.platform}")
        return results