import random
import time
from playwright.sync_api import sync_playwright


class HttpClient:

    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) Chrome/123 Safari/537.36",
    ]

    def __init__(self, platform: str = "generic"):
        self.platform = platform
        self.ua = random.choice(self.USER_AGENTS)

    # =====================================================
    # PUBLIC METHOD
    # =====================================================
    def get(self, url: str) -> str:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            context = browser.new_context(
                user_agent=self.ua,
                viewport={"width": 1366, "height": 768},
                locale="fr-FR"
            )

            page = context.new_page()

            # STEP 1: comportement avant navigation
            self._before_navigation(page)

            # STEP 2: navigation principale
            page.goto(url, wait_until="domcontentloaded")

            # STEP 3: comportement après chargement
            self._after_navigation(page)

            html = page.content()
            browser.close()

            return html

    # =====================================================
    # PLATFORM LOGIC (TOUT ICI)
    # =====================================================

    def _before_navigation(self, page):
        if self.platform == "aliexpress":
            # visite home obligatoire (réduit blocage)
            page.goto("https://www.aliexpress.com", wait_until="domcontentloaded")
            time.sleep(random.uniform(2, 4))

        elif self.platform == "ebay":
            # eBay: headers simples
            page.set_extra_http_headers({
                "accept-language": "en-US,en;q=0.9"
            })

        elif self.platform == "jumia":
            # Jumia: rien de spécial
            pass

    def _after_navigation(self, page):
        if self.platform == "aliexpress":
            # scroll progressif (important pour lazy loading)
            for _ in range(3):
                page.mouse.wheel(0, random.randint(400, 900))
                time.sleep(random.uniform(1.5, 3))

        elif self.platform == "jumia":
            # scroll léger
            page.mouse.wheel(0, 800)

        elif self.platform == "ebay":
            # eBay: très léger pour éviter blocage
            page.wait_for_timeout(1500)