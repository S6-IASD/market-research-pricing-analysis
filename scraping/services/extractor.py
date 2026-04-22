"""
Exporte données normalisées vers formats utilisables par data_mining.
"""

import csv
import json
from typing import List, Dict
from pathlib import Path


class DataExporter:
    """Exporte produits vers CSV/JSON pour analyse."""
    
    def __init__(self, output_dir: str = "data_mining/inputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def to_csv(self, products: List[Dict], filename: str = "products.csv") -> str:
        """Exporte en CSV plat (attributes en JSON string)."""
        filepath = self.output_dir / filename
        
        if not products:
            return str(filepath)
        
        # Aplatir pour CSV
        flat_products = []
        for p in products:
            flat = {
                "id": p.get("id", ""),
                "title": p.get("title", ""),
                "price": p.get("price", 0),
                "currency": p.get("currency", ""),
                "price_usd": p.get("price_usd", ""),
                "platform": p.get("platform", ""),
                "category": p.get("category", ""),
                "subcategory": p.get("subcategory", ""),
                "url": p.get("url", ""),
                "image": p.get("image", ""),
                "seller": p.get("seller", ""),
                "rating": p.get("rating", ""),
                "reviews_count": p.get("reviews_count", 0),
                "attributes_json": json.dumps(p.get("attributes", {}), ensure_ascii=False),
                "scraped_at": p.get("scraped_at", ""),
            }
            flat_products.append(flat)
        
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=flat_products[0].keys())
            writer.writeheader()
            writer.writerows(flat_products)
        
        return str(filepath)
    
    def to_json(self, products: List[Dict], filename: str = "products.json") -> str:
        """Exporte en JSON structuré."""
        filepath = self.output_dir / filename
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({
                "metadata": {
                    "count": len(products),
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                },
                "products": products
            }, f, ensure_ascii=False, indent=2)
        
        return str(filepath)
    
    def to_pandas_ready(self, products: List[Dict]) -> List[Dict]:
        """Retourne format prêt pour pd.DataFrame."""
        return [
            {
                **{k: v for k, v in p.items() if k != "attributes"},
                **{f"attr_{k}": v for k, v in p.get("attributes", {}).items()}
            }
            for p in products
        ]