import random
import time
from playwright.sync_api import sync_playwright


class HttpClient:

    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    ]

    def __init__(self, platform: str = "generic", proxy: str = None):
        self.platform = platform
        self.ua = random.choice(self.USER_AGENTS)
        self.proxy = proxy

    def get(self, url: str) -> str:
        with sync_playwright() as p:
            launch_kwargs = {
                "headless": True,
                "args": [
                    "--disable-blink-features=AutomationControlled",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                ]
            }
            
            if self.proxy:
                launch_kwargs["proxy"] = {"server": self.proxy}

            browser = p.chromium.launch(**launch_kwargs)

            context = browser.new_context(
                user_agent=self.ua,
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                timezone_id="America/New_York",
            )
            
            # Masquer webdriver
            context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                window.chrome = { runtime: {} };
            """)

            page = context.new_page()
            # Timeout global de 90s pour TOUTE la session (navigation + scroll + attente)
            page.set_default_timeout(90000)

            try:
                self._before_navigation(page)

                # 🔥 FIX : domcontentloaded au lieu de networkidle pour éviter timeout
                page.goto(url, wait_until="domcontentloaded", timeout=60000)

                self._after_navigation(page)

                html = page.content()
            except Exception as e:
                print(f"  ⚠️  Playwright timeout/error: {e}")
                html = ""
            finally:
                browser.close()

            return html

    def _before_navigation(self, page):
        if self.platform == "aliexpress":
            page.goto("https://www.aliexpress.com", wait_until="domcontentloaded", timeout=60000)
            time.sleep(random.uniform(2, 4))

        elif self.platform == "ebay":
            # eBay: visiter home d'abord
            page.goto("https://www.ebay.com", wait_until="domcontentloaded", timeout=60000)
            time.sleep(random.uniform(3, 5))
            
            # Mouvement souris
            page.mouse.move(random.randint(200, 800), random.randint(200, 600))
            time.sleep(random.uniform(0.5, 1.5))
            
            page.set_extra_http_headers({
                "accept-language": "en-US,en;q=0.9",
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "upgrade-insecure-requests": "1",
            })

        elif self.platform == "jumia":
            pass

    def _after_navigation(self, page):
        if self.platform == "aliexpress":
            for _ in range(5):
                page.mouse.wheel(0, random.randint(400, 900))
                time.sleep(random.uniform(1.5, 3))

        elif self.platform == "jumia":
            page.mouse.wheel(0, 800)

        elif self.platform == "ebay":
            # Scroll + attente fixe au lieu d'attendre networkidle
            for _ in range(3):
                page.mouse.wheel(0, random.randint(300, 700))
                time.sleep(random.uniform(1, 2))
            
            # Attendre que les produits apparaissent (max 10s)
            try:
                page.wait_for_selector("li.s-item", timeout=10000)
            except:
                pass
            
            # Attente fixe supplémentaire
            time.sleep(random.uniform(2, 4))