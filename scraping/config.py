PLATFORMS = {
    "amazon": {
        "search_url": "https://www.amazon.fr/s?k={}",
        "base_url": "https://www.amazon.fr"
    },
    "jumia": {
        "search_url": "https://www.jumia.ma/catalog/?q={}",
        "base_url": "https://www.jumia.ma"
    },
    "ebay": {
        "search_url": "https://www.ebay.fr/sch/i.html?_nkw={}",
        "base_url": "https://www.ebay.fr"
    }
}

REQUEST_DELAY_MIN = 1.5
REQUEST_DELAY_MAX = 3.5
REQUEST_TIMEOUT = 10
MAX_RETRIES = 3