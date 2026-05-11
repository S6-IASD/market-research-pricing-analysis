export const PLATFORMS = [
    {id : "jumia", name: "jumia.ma"},
    {id: "ebay", name: "ebay.fr"},
    {id: "aliexpress", name: "aliexpress.com"}
] as const;

export interface Product{
    title: string;
    price: number;
    currency: string;
    price_usd: number;
    platform: "jumia" | "ebay" | "aliexpress";
    category: string;
    url: string;
    image?: string;
    seller?: string;
    rating?: string;
    reviews_count: number;
    attributes: Record<string,string>;
    scraped_at: string;
    search_query: string;
}

export interface PlatformStats {
  [platform: string]: number;
}

export interface ScrapeStats{
    total_products: number;
    raw_extracted: number;
    by_platform: PlatformStats;
    errors: {platform: string; error: string;}[];
    rejected: number;
    deduplicated: number;
}

export interface scrapeRequest{
    query: string;
    category?: string;
    platforms?: string[];
}

export interface scrapeResponse {
  status: 'success' | 'no_results' | 'partial_failure';
  query: string;
  category: string;
  scraped_at: string;
  execution_time_ms: number;
  products: Product[];
  stats: ScrapeStats;
}