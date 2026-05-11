import type { scrapeRequest, scrapeResponse } from "../types/types";


const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function scrapeProducts(request: scrapeRequest):Promise<scrapeResponse> {
    const Response = await fetch(`${API_BASE_URL}/api/scrape/`,{
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });
    if(!Response.ok){
        const errorData = await Response.json().catch(()=>({error: 'erreur inconnue'}));
        throw new Error(errorData.error || `HTTP ${Response.status}`);
    }

    return Response.json();
};