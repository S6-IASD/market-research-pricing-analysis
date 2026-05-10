import { useState } from "react";
import SearchBar from "./SearchBar";
import ResultsBar from "./ResultBar";
import type { scrapeRequest, scrapeResponse } from "../types/types";
import { scrapeProducts } from "../api/api";

export default function Main() {
  const [isLoading, setIsLoading] = useState(false);
  const [reponse, setReponse] = useState<scrapeResponse | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSearch(request: scrapeRequest) {
    setIsLoading(true);
    setErreur(null);
    setReponse(null);

    try {
      const resultat = await scrapeProducts(request);
      setReponse(resultat);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Echoue de scraper");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <main className="max-w-7xl mx-auto px-3 pt-2 lg:p-8 sm:px-4 lg:px-8 ">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4  ">
        <SearchBar onSearch={handleSearch} isloading={isLoading} />
        <ResultsBar response={reponse} error={erreur} isloading={isLoading} />
      </div>
    </main>
  );
}
