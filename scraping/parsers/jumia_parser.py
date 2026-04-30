import re
from bs4 import BeautifulSoup


class JumiaParser:
    """
    Jumia Parser — STRICT laptop-only filtering.
    Corrections appliquées :
    1. _parse_price gère les plages "X - Y Dhs" et les virgules MAD
    2. NEGATIVE_KEYWORDS nettoyés (suppression de "stand","support","case" trop génériques)
    3. URL récupérée depuis a.core et non le premier <a>
    4. Image récupérée depuis data-src en priorité (lazy loading)
    5. "book" retiré de LAPTOP_BRANDS (trop générique)
    """

    NEGATIVE_KEYWORDS = [
        # Cables & power
        "câble", "cable", "adaptateur", "adapter", "chargeur", "charger",
        "alimentation", "power supply", "usb hub", "hub usb", "dock", "docking",
        "hdmi", "vga", "displayport", "convertisseur", "splitter", "multiprise",
        # Peripherals
        "souris", "mouse", "clavier", "keyboard", "tapis de souris", "mousepad",
        "webcam", "microphone", "casque", "headphone", "enceinte", "speaker",
        "écouteur", "earphone", "airpod", "souris sans fil",
        # External storage
        "disque dur externe", "hard drive external", "ssd externe", "clé usb",
        "usb stick", "carte mémoire", "memory card",
        # Bags & cases ONLY (pas "case" seul car trop générique)
        "sac à dos", "sacoche", "housse", "étui", "pochette", "sleeve",
        "laptop bag", "laptop case",
        # Furniture
        "bureau", "chaise", "chair", "étagère", "shelf",
        # Protection & cosmetics
        "pâte thermique", "thermal paste",
        "screen protector", "verre trempé", "sticker", "autocollant", "skin", "decal",
        # Components (sold separately)
        "carte mère", "motherboard", "processeur seul", "cpu seul",
        "barrette ram", "module mémoire", "ventilateur cpu", "dissipateur",
        # Noise / scams
        "whatsapp", "appel", "livraison gratuite",
        "promo code", "code promo", "contactez", "appelez",
    ]

    POSITIVE_KEYWORDS = [
        "pc portable", "ordinateur portable", "laptop", "notebook",
        "macbook", "chromebook", "ultrabook",
        "pc gamer portable", "ordinateur gamer", "gaming laptop",
    ]

    LAPTOP_BRANDS = [
        "hp", "hewlett-packard", "dell", "lenovo", "asus", "acer", "msi",
        "apple", "macbook", "microsoft", "razer", "alienware",
        "samsung", "lg", "huawei", "xiaomi", "honor", "chuwi", "teclast",
        "jumper", "fusion5", "blackview", "gpd",
        "elitebook", "pavilion", "probook", "envy", "spectre", "omen", "victus",
        "thinkpad", "ideapad", "yoga", "legion",
        "xps", "inspiron", "latitude", "vostro", "precision",
        "vivobook", "zenbook", "tuf", "rog", "expertbook", "proart",
        "nitro", "predator", "aspire", "swift", "travelmate", "extensa",
        # ❌ "surface" retiré (trop générique, matche "Surface Pro charger")
        # ❌ "book" retiré (trop générique)
        # ❌ "mac" retiré (matche "macbook" via POSITIVE_KEYWORDS)
        # ❌ "blade" retiré (trop générique)
    ]

    SPEC_PATTERNS = [
        r'\bi[3579]\b',
        r'\bryzen\s*\d+',
        r'\bceleron\b',
        r'\bpentium\b',
        r'\bcore\s*i[3579]\b',
        r'\bamd\s*(a[49]|e[12]|fx|ryzen)\b',
        r'\bintel\s*(core|celeron|pentium|n\d+)\b',
        r'\b\d+\s*go\s*(ram|ssd|hdd)?\b',   # 8 Go, 16 Go RAM
        r'\b\d+\s*gb\b',
        r'\b\d+\s*to\b',
        r'\b\d+\s*tb\b',
        r'\b\d+\s*ssd\b',
        r'\bhdd\b',
        r'\bwindows\s*(10|11|7|8)\b',
        r'\bdos\b',
        r'\blinux\b',
        r'\b\d{2}\.\d+\s*"',        # 15.6", 14.0"
        r'''\b\d{2}\.\d+\s*\'\'''', # 15.6''
        r'\b\d{2}\s*pouces\b',
        r'\b\d+\s*ghz\b',
        r'\b\d+\s*th\s*gen\b',
        r'\b\d+e\s*gen\b',
        r'\bgénération\b',
        r'\blpddr\s*\d*',            # LPDDR5, LPDDR4
        r'\bddr\s*\d+\b',           # DDR4, DDR5
        r'\bryzen\s*[357]\b',
        r'\bcore\s*[357]\b',         # Core 3, Core 5, Core 7 (nouvelle gen)
    ]

    MIN_PRICE = 1500.0   # ← Relevé à 1500 MAD (≈140€), en dessous = accessoire
    MAX_PRICE = 50000.0

    def __init__(self, debug=False):
        self.debug = debug
        self.rejection_log = []
        self.acceptance_log = []

    def _clean_title(self, raw_title: str) -> str:
        if not raw_title:
            return ""
        # Supprime les numéros de téléphone "pour commander"
        cleaned = re.sub(r'\d{8,12}\s*pour\s*commander', '', raw_title, flags=re.I)
        # Supprime les suffixes prix (ex: "5,500.00 Dhs - Neuf")
        # ⚠️ NE PAS supprimer les specs du titre (15.6'', 512Go, etc.)
        # On ne supprime que si "Dhs" est présent
        cleaned = re.sub(r'\s*\d[\d\s,\.]*\s*Dhs.*$', '', cleaned, flags=re.I)
        # Normalise
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.strip()

    def _parse_price(self, raw: str) -> float | None:
        """
        Gère :
        - "5,500.00 Dhs"         → 5500.0
        - "3,400.00 Dhs"         → 3400.0
        - "68.00 Dhs - 69.00 Dhs" → 68.0  (prend le min)
        - "5,799.00 Dhs"         → 5799.0
        """
        if not raw:
            return None

        # Cas plage de prix : prend le premier nombre (le plus bas)
        raw = raw.split("-")[0].strip()

        # Supprime tout sauf chiffres, virgule, point
        cleaned = re.sub(r"[^\d,.]", "", raw)

        if not cleaned:
            return None

        # Format MAD : "5,500.00" → virgule = séparateur milliers, point = décimal
        if "," in cleaned and "." in cleaned:
            # Enlève les points (séparateur milliers potentiel) puis remplace virgule
            # Mais en MAD c'est l'inverse : 5,500.00 → virgule est milliers
            cleaned = cleaned.replace(",", "")  # "5500.00"
        elif "," in cleaned:
            # "5500,00" → décimal français
            cleaned = cleaned.replace(",", ".")

        try:
            return float(cleaned)
        except ValueError:
            return None

    def _has_negative(self, title: str) -> tuple[bool, str | None]:
        t = title.lower()
        for kw in self.NEGATIVE_KEYWORDS:
            if kw in t:
                return True, kw
        return False, None

    def _has_positive(self, title: str) -> tuple[bool, str | None]:
        t = title.lower()
        for kw in self.POSITIVE_KEYWORDS:
            if kw in t:
                return True, kw
        return False, None

    def _has_brand(self, title: str) -> tuple[bool, str | None]:
        t = title.lower()
        for brand in self.LAPTOP_BRANDS:
            # Vérification mot entier pour les courtes marques (hp, lg)
            if len(brand) <= 3:
                if re.search(r'\b' + re.escape(brand) + r'\b', t):
                    return True, brand
            else:
                if brand in t:
                    return True, brand
        return False, None

    def _has_specs(self, title: str) -> tuple[bool, str | None]:
        t = title.lower()
        for pattern in self.SPEC_PATTERNS:
            match = re.search(pattern, t)
            if match:
                return True, match.group(0)
        return False, None

    def _has_screen_size(self, title: str) -> bool:
        t = title.lower()
        return bool(
            re.search(r'\b\d{2}\.\d+\s*"', t) or
            re.search(r'''\b\d{2}\.\d+\s*\'\'''' , t) or
            re.search(r'\b\d{2}\s*pouces\b', t)
        )

    def _is_valid_laptop(self, title: str, price: float | None) -> tuple[bool, str]:
        if not title or len(title) < 5:
            return False, "TITLE_TOO_SHORT"

        if price is None:
            return False, "NO_PRICE"

        if price < self.MIN_PRICE:
            return False, f"PRICE_TOO_LOW ({price} < {self.MIN_PRICE})"

        if price > self.MAX_PRICE:
            return False, f"PRICE_TOO_HIGH ({price} > {self.MAX_PRICE})"

        has_neg, neg_kw = self._has_negative(title)
        if has_neg:
            return False, f"NEGATIVE: '{neg_kw}'"

        has_pos, pos_kw = self._has_positive(title)
        if has_pos:
            return True, f"POSITIVE: '{pos_kw}'"

        has_brand, brand = self._has_brand(title)
        has_specs, spec = self._has_specs(title)

        if has_brand and has_specs:
            return True, f"BRAND+SPEC: '{brand}' + '{spec}'"

        if has_specs and self._has_screen_size(title):
            return True, f"SPEC+SCREEN: '{spec}'"

        if has_brand and self._has_screen_size(title):
            return True, f"BRAND+SCREEN: '{brand}'"

        if has_brand:
            return False, f"BRAND_ONLY: '{brand}' (no specs/screen)"

        return False, "NO_LAPTOP_INDICATORS"

    def extract_products(self, html: str) -> list:
        soup = BeautifulSoup(html, "html.parser")
        products = []

        articles = (
            soup.select("article.prd") or
            soup.select("article[class*='prd']") or
            soup.select("article")
        )

        if self.debug:
            print(f"  🔍 Articles trouvés: {len(articles)}")

        for article in articles:
            try:
                # ── TITRE ───────────────────────────────────────────────────
                title_elem = (
                    article.select_one("h3.name") or
                    article.select_one(".name") or
                    article.select_one("h3")
                )
                raw_title = title_elem.get_text(strip=True) if title_elem else ""
                title = self._clean_title(raw_title)

                # ── PRIX ────────────────────────────────────────────────────
                price_elem = article.select_one(".prc")
                price_raw = price_elem.get_text(strip=True) if price_elem else ""
                price = self._parse_price(price_raw)

                # ── VALIDATION ──────────────────────────────────────────────
                is_valid, reason = self._is_valid_laptop(title, price)

                # 🔥 MODIFIÉ : log uniquement les acceptés
                if self.debug and is_valid:
                    log_entry = {"title": title[:70], "reason": reason, "price": price}
                    self.acceptance_log.append(log_entry)

                if not is_valid:
                    continue

                # ── URL ─────────────────────────────────────────────────────
                core_link = article.select_one("a.core")
                href = core_link.get("href", "") if core_link else ""
                if href and not href.startswith("http"):
                    href = "https://www.jumia.ma" + href

                # ── IMAGE ───────────────────────────────────────────────────
                img_url = None
                img = article.select_one("a.core img.img")
                if img:
                    img_url = img.get("data-src") or img.get("src")

                # ── SELLER ──────────────────────────────────────────────────
                seller_elem = article.select_one("._sml")
                seller = seller_elem.get_text(strip=True) if seller_elem else "Jumia"

                # ── CATEGORY HINT ───────────────────────────────────────────
                t_lower = title.lower()
                if any(k in t_lower for k in ["gaming", "gamer", "rog", "tuf", "nitro", "predator"]):
                    category_hint = "gaming"
                elif any(k in t_lower for k in ["macbook", "apple"]):
                    category_hint = "apple"
                elif "chromebook" in t_lower:
                    category_hint = "chromebook"
                elif any(k in t_lower for k in ["ultrabook", "thinkpad", "zenbook", "xps"]):
                    category_hint = "ultrabook"
                else:
                    category_hint = "standard"

                # ── SKU ─────────────────────────────────────────────────────
                sku = article.get("data-sku") or ""
                if not sku and core_link:
                    sku = core_link.get("data-gtm-id", "")

                products.append({
                    "title": title,
                    "price": price,
                    "price_raw": price_raw,
                    "currency": "MAD",
                    "platform": "jumia",
                    "url": href,
                    "image": img_url,
                    "seller": seller,
                    "sku": sku,
                    "category": "electronics",
                    "category_hint": category_hint,
                    "attributes": {},
                    "match_reason": reason,
                })

            except Exception as e:
                continue

        return products

    def print_debug_report(self, top_rejected=20):
        """Affiche uniquement le nombre total de produits validés."""
        print("=" * 70)
        print("📊 JUMIA PARSER — DEBUG REPORT")
        print("=" * 70)
        print(f"✅ Produits validés : {len(self.acceptance_log)}")
        print("=" * 70)