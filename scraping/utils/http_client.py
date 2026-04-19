import requests
import time
import random
from fake_useragent import UserAgent
from scraping.config import REQUEST_DELAY_MIN, REQUEST_DELAY_MAX, REQUEST_TIMEOUT, MAX_RETRIES

class HttpClient:
    def __init__(self):
        self.ua = UserAgent()

    def _get_headers(self):
        return {
            "User-Agent": self.ua.random,
            "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

    def get(self, url: str) -> str:
        for attempt in range(MAX_RETRIES):
            try:
                time.sleep(random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX))
                response = requests.get(
                    url,
                    headers=self._get_headers(),
                    timeout=REQUEST_TIMEOUT
                )
                response.raise_for_status()
                return response.text
            except requests.Timeout:
                print(f"Timeout tentative {attempt + 1}/{MAX_RETRIES}: {url}")
                time.sleep(2 ** attempt)
            except requests.HTTPError as e:
                print(f"Erreur HTTP {e.response.status_code}: {url}")
                return ""
            except Exception as e:
                print(f"Erreur inattendue: {e}")
                return ""
        return ""