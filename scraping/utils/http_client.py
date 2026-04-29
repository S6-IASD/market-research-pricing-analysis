import random
import time
from playwright.sync_api import sync_playwright


class HttpClient:
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    ]

    # Proxies gratuits rotatifs (à remplacer par des résidentiels payants pour production)
    PROXIES = [
        None,  # Sans proxy
        # "http://user:pass@proxy:port",  # Décommentez et configurez vos proxies
    ]

    def __init__(self):
        self.ua = random.choice(self.USER_AGENTS)
        self.proxy = random.choice(self.PROXIES)

    def get(self, url: str) -> str:
        with sync_playwright() as p:
            args = [
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
                "--disable-dev-shm-usage",
                "--no-sandbox",
            ]

            browser = p.chromium.launch(
                headless=True,
                args=args,
                proxy={"server": self.proxy} if self.proxy else None
            )
            
            context = browser.new_context(
                user_agent=self.ua,
                viewport={"width": random.randint(1366, 1920), "height": random.randint(768, 1080)},
                locale=random.choice(["fr-FR", "en-US", "en-GB"]),
                timezone_id=random.choice(["Europe/Paris", "America/New_York", "Europe/London"]),
                color_scheme="light",
                java_script_enabled=True,
            )

            # Masquer webdriver
            context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en-US', 'en'] });
                window.chrome = { runtime: {} };
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
            """)

            page = context.new_page()

            # Comportement humain : visiter la home d'abord
            page.goto("https://www.aliexpress.com", wait_until="domcontentloaded", timeout=30000)
            
            # Mouvements de souris aléatoires
            for _ in range(random.randint(2, 4)):
                page.mouse.move(random.randint(100, 800), random.randint(100, 600))
                time.sleep(random.uniform(0.5, 1.5))

            # Parfois cliquer sur un élément aléatoire (cookie consent ou lien)
            try:
                buttons = page.query_selector_all("button, a")
                if buttons:
                    random.choice(buttons).hover()
                    time.sleep(random.uniform(0.3, 0.8))
            except:
                pass

            time.sleep(random.uniform(5, 10))  # Attente longue

            # Recherche
            page.goto(url, wait_until="networkidle", timeout=60000)
            time.sleep(random.uniform(8, 15))  # Attendre le chargement JS

            # Scroll progressif comme un humain
            for i in range(random.randint(3, 6)):
                page.mouse.wheel(0, random.randint(400, 900))
                time.sleep(random.uniform(2, 5))

            # Parfois revenir en haut
            if random.random() > 0.5:
                page.mouse.wheel(0, -2000)
                time.sleep(random.uniform(1, 3))

            html = page.content()

            browser.close()
            return html