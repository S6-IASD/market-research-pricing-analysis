export const PLATEFORMS = [
    {id : "jumia", name: "jumia.ma"},
    {id: "ebay", name: "ebay.fr"},
    {id: "aliexpress", name: "aliexpress.com"}
] as const;

export interface scrapeRequest{
    query: string;
    category?: string;
    platforms?: string[];
}