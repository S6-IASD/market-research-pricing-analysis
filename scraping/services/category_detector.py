"""
Détection automatique de catégorie et sous-catégorie.
Fonctionne pour TOUTE recherche, pas seulement les vélos.
"""

from typing import Dict, Tuple


class CategoryDetector:
    """
    Détecte catégorie + sous-catégorie à partir de n'importe quel titre/requête.
    """
    
    # Catégories principales avec mots-clés
    CATEGORIES = {
        "electronics": [
            "laptop", "phone", "smartphone", "tablet", "tv", "television",
            "camera", "headphone", "earbud", "charger", "cable", "monitor",
            "keyboard", "mouse", "speaker", "console", "gaming", "pc",
            "computer", "ssd", "ram", "processor", "gpu", "rtx", "intel",
            "amd", "macbook", "iphone", "samsung", "xiaomi", "playstation",
            "xbox", "nintendo", "drone", "router", "modem", "printer",
            "watch", "smartwatch", "fitness tracker", "earphone", "microphone",
            "webcam", "hard drive", "usb", "hdmi", "bluetooth", "wireless",
        ],
        "clothing": [
            "shirt", "dress", "shoe", "jean", "jacket", "sneaker", "t-shirt",
            "pant", "sock", "underwear", "hoodie", "coat", "skirt", "suit",
            "watch", "jewelry", "bag", "backpack", "belt", "hat", "scarf",
            "glove", "boot", "sandal", "slipper", "wallet", "sunglasses",
            "tunic", "blouse", "sweater", "cardigan", "short", "swimwear",
        ],
        "sports": [
            "bicycle", "bike", "velo", "cycling", "treadmill", "dumbbell",
            "yoga", "mat", "ball", "racket", "golf", "fishing", "camping",
            "tent", "kayak", "spin bike", "exercise", "fitness", "gym",
            "running", "hiking", "swimming", "surfing", "skateboard",
        ],
        "books": [
            "book", "novel", "textbook", "ebook", "audiobook", "hardcover",
            "paperback", "comic", "manga", "dictionary", "encyclopedia",
            "biography", "fiction", "thriller", "romance", "science",
        ],
        "appliances": [
            "fridge", "refrigerator", "washer", "washing machine", "microwave",
            "blender", "vacuum", "oven", "dishwasher", "dryer", "toaster",
            "kettle", "air conditioner", "heater", "fan", "iron", "cooker",
            "freezer", "hood", "robot", "purifier", "humidifier", "mixer",
        ],
        "beauty": [
            "perfume", "cream", "lotion", "shampoo", "makeup", "lipstick",
            "foundation", "serum", "skincare", "hair", "nail", "cosmetic",
            "mask", "sunscreen", "deo", "fragrance", "essential oil",
        ],
        "home": [
            "furniture", "chair", "table", "desk", "sofa", "bed", "mattress",
            "lamp", "light", "mirror", "rug", "curtain", "pillow", "blanket",
        ],
        "automotive": [
            "car", "tire", "wheel", "battery", "oil", "brake", "engine",
            "motorcycle", "scooter", "helmet", "gps", "dashcam",
        ],
    }
    
    # Sous-catégories (optionnel, pour granularité)
    SUBCATEGORIES = {
        "electronics": {
            "laptop": ["laptop", "macbook", "notebook", "netbook"],
            "phone": ["phone", "smartphone", "iphone", "samsung galaxy"],
            "gaming": ["console", "playstation", "xbox", "nintendo", "gaming laptop"],
            "audio": ["headphone", "earbud", "speaker", "microphone"],
            "computer": ["pc", "desktop", "monitor", "keyboard", "mouse"],
        },
        "sports": {
            "cycling": ["bicycle", "bike", "velo", "cycling", "spin bike"],
            "fitness": ["treadmill", "dumbbell", "exercise", "fitness", "gym"],
            "outdoor": ["camping", "tent", "hiking", "kayak", "fishing"],
        },
        "clothing": {
            "men": ["men", "man", "homme", "male"],
            "women": ["women", "woman", "femme", "female", "dress", "skirt"],
            "shoes": ["shoe", "sneaker", "boot", "sandal", "slipper"],
            "accessories": ["bag", "wallet", "belt", "hat", "scarf", "jewelry"],
        },
    }
    
    def detect(self, title: str, query: str = None) -> str:
        """
        Détecte la catégorie principale.
        """
        if not title and not query:
            return "unknown"
        
        # Combine titre + requête pour meilleure détection
        text = f"{title} {query or ''}".lower()
        scores = {}
        
        for category, keywords in self.CATEGORIES.items():
            score = sum(2 if kw in text.split() else 1 
                       for kw in keywords 
                       if kw in text)
            if score > 0:
                scores[category] = score
        
        if not scores:
            return "unknown"
        
        return max(scores, key=scores.get)
    
    def detect_subcategory(self, title: str, category: str) -> str:
        """
        Détecte sous-catégorie si la catégorie principale est connue.
        """
        if category not in self.SUBCATEGORIES:
            return ""
        
        title_lower = title.lower()
        subcats = self.SUBCATEGORIES[category]
        
        for subcat, keywords in subcats.items():
            if any(kw in title_lower for kw in keywords):
                return subcat
        
        return ""
    
    def detect_full(self, title: str, query: str = None) -> Dict:
        """
        Détection complète : catégorie + sous-catégorie.
        """
        category = self.detect(title, query)
        subcategory = self.detect_subcategory(title, category)
        
        return {
            "category": category,
            "subcategory": subcategory,
            "confidence": "high" if category != "unknown" else "low",
        }