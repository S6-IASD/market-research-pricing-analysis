"""
Orchestrateur principal: lance spiders, applique pipelines, retourne JSON.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Optional
from datetime import datetime
import time
import sys
from pathlib import Path

# Ajouter la racine du projet au path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from scraping.spiders.jumia_spider import JumiaSpider
from scraping.spiders.ebay_spider import EbaySpider
from scraping.spiders.aliexpress_spider import AliexpressSpider
from scraping.pipelines.cleaner import DataCleaner
from scraping.pipelines.normalizer import DataNormalizer
from scraping.pipelines.validator import DataValidator
from scraping.utils.logger import get_logger


class ScraperService:
    """Service principal qui orchestre tout le flux scraping."""
    
    SPIDERS = {
        "jumia": JumiaSpider,
        "ebay": EbaySpider,
        "aliexpress": AliexpressSpider,
    }
    
    def __init__(self):
        self.logger = get_logger("ScraperService")
        self.cleaner = DataCleaner()
        self.normalizer = DataNormalizer()
        self.validator = DataValidator()
    
    def scrape(
        self, 
        query: str, 
        category_hint: Optional[str] = None,
        platforms: Optional[List[str]] = None,
        max_workers: int = 3
    ) -> Dict[str, Any]:
        """
        Lance scraping complet. Retourne JSON standardisé.
        """
        start_time = time.time()
        self.logger.info(f"🚀 Scrape start: '{query}' | category={category_hint}")
        
        # Sélection spiders
        spider_classes = self._select_spiders(platforms)
        
        # Étape 1: Scraping parallèle
        raw_results, errors = self._run_parallel(spider_classes, query, category_hint, max_workers)
        
        # Étape 2: Clean
        cleaned = [self.cleaner.clean(p) for p in raw_results]
        
        # Étape 3: Normalize
        normalized = [self.normalizer.normalize(p, category_hint) for p in cleaned]
        
        # Étape 4: Validate + dedup
        validated = self.validator.validate_batch(normalized)
        
        # Étape 5: Build response
        execution_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "success" if validated else "no_results",
            "query": query,
            "category": category_hint or self.normalizer.category_detector.detect(query),
            "scraped_at": datetime.utcnow().isoformat() + "Z",
            "execution_time_ms": execution_time,
            "products": validated,
            "stats": {
                "total_products": len(validated),
                "raw_extracted": len(raw_results),
                "by_platform": self._count_by_platform(validated),
                "errors": errors,
                "rejected": self.validator.rejected_count,
                "deduplicated": len(normalized) - len(validated),
            }
        }
    
    def _select_spiders(self, platforms: Optional[List[str]]) -> Dict:
        if platforms is None:
            return self.SPIDERS
        return {k: v for k, v in self.SPIDERS.items() if k in platforms}
    
    def _run_parallel(self, spider_classes, query, category_hint, max_workers):
        """Lance spiders en parallèle avec ThreadPool."""
        all_raw = []
        errors = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(self._run_single, cls, query, category_hint): name
                for name, cls in spider_classes.items()
            }
            
            for future in as_completed(futures):
                name = futures[future]
                try:
                    products = future.result(timeout=120)
                    all_raw.extend(products)
                    self.logger.info(f"  ✓ {name}: {len(products)} products")
                except Exception as e:
                    errors.append({"platform": name, "error": str(e)})
                    self.logger.error(f"  ✗ {name}: {e}")
        
        return all_raw, errors
    
    def _run_single(self, spider_cls, query, category_hint):
        """Exécute un spider."""
        spider = spider_cls(query, category_hint)
        return spider.run()
    
    def _count_by_platform(self, products: List[Dict]) -> Dict[str, int]:
        from collections import defaultdict
        counts = defaultdict(int)
        for p in products:
            counts[p.get("platform", "unknown")] += 1
        return dict(counts)


# Singleton pour Django
_scraper_instance = None

def get_scraper_service() -> ScraperService:
    global _scraper_instance
    if _scraper_instance is None:
        _scraper_instance = ScraperService()
    return _scraper_instance


# ============================================================
# TEST DIRECT
# ============================================================
if __name__ == "__main__":
    print("=" * 60)
    print("🚀 TEST SCRAPER SERVICE")
    print("=" * 60)
    
    service = get_scraper_service()
    
    result = service.scrape(
        query="laptop",
        category_hint="laptop",
        platforms=["ebay", "aliexpress"],  # Jumia désactivé pour l'instant
        max_workers=2
    )
    
    print(f"\n📊 STATUS: {result['status']}")
    print(f"🔍 Query: {result['query']}")
    print(f"📁 Category: {result['category']}")
    print(f"⏱️  Execution time: {result['execution_time_ms']}ms")
    print(f"📦 Total products: {result['stats']['total_products']}")
    print(f"📈 Raw extracted: {result['stats']['raw_extracted']}")
    print(f"🌐 By platform: {result['stats']['by_platform']}")
    
    if result['stats']['errors']:
        print(f"\n❌ Errors: {result['stats']['errors']}")
    
    if result['stats']['deduplicated']:
        print(f"🗑️  Deduplicated: {result['stats']['deduplicated']}")
    
    print(f"\n{'=' * 60}")
    print("TOP 10 PRODUITS")
    print(f"{'=' * 60}")
    
    for i, p in enumerate(result['products'][:10], 1):
        print(f"\n{i}. [{p['platform'].upper()}] {p['title'][:70]}")
        print(f"   💰 {p['price']} {p['currency']}")
        print(f"   🔗 {p['url'][:60]}...")
    
    print(f"\n{'=' * 60}")
    print("✅ TEST TERMINÉ")
    print(f"{'=' * 60}")