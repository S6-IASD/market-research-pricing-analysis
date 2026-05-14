import React, { useState } from "react";
import type {scrapeRequest} from "../types/types";



interface searchBarProps {
  onSearch: (request: scrapeRequest) => void;
  isloading: boolean;
}

const PLATFORMS = [
  { id: 'jumia', label: 'Jumia' },
  { id: 'ebay', label: 'eBay' },
  { id: 'aliexpress', label: 'AliExpress' },
] as const;

export default function SearchBar({onSearch, isloading}: searchBarProps) {
  const [query, setQuery] = useState("");
  const [category, setCat] = useState("");
  const [selectedPlat, setSelectedPlat] = useState<string[]>([]);
  


  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if(!query.trim()) return;
    onSearch({
      query: query.trim(),
      category: category.trim() || undefined,
      platforms: selectedPlat.length > 0? selectedPlat : undefined,
    });

  };

  function selectPlatButto(platid : string) {
    setSelectedPlat(prev=>
      prev.includes(platid)?
        prev.filter(p=> p !== platid) : [...prev,platid]
    );
    
  }

  return (
    <section className=" lg:col-span-1 ">
      <form
        onSubmit={handleSubmit}
        className="bg-[#a8dadc] border-[#2f3e46] p-3 lg:p-6 shadow-sm rounded-xl border-2 lg:space-y-8 space-y-3 "
      >
      <article >
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1 ">
            Rechercher un produit:
          </label>
          <input
            className="border border-slate-700 px-3 py-2 rounded-lg w-full focus:ring-2 focus:border-[#1d3557] focus:ring-[#1d3557] outline-none bg-white text-slate-800 "
            type="search"
            id="search"
            onChange={(e) => setQuery(e.target.value)}
            value={query}
            placeholder="Ex: laptop, redmi pro 14, hp pc portable ..."
          />
        </article>

        <article>
          <label htmlFor="Categorie" className="block text-sm font-medium text-slate-700 mb-1 ">
            Categorie(optionelle)
          </label>
          <input
            className="border border-slate-700  rounded-lg px-4  py-2 w-full outline-none focus:ring-2 focus:ring-[#1d3557] focus:border-[#1d3557] bg-white"
            type="text"
            id="Categorie"
            onChange={(e)=>setCat(e.currentTarget.value)}
            value={category}
            placeholder="ex: electronics, fashion, home ..."
          />
        </article>

        <article>
          <span className="block text-sm font-medium text-slate-700 mb-1">Platforms</span>

          <div className="flex flex-wrap justify-around" >
            {PLATFORMS.map(platform=>(
              <label
                key={platform.id}
                className={`flex gap-3 border-2 lg:gap-1  py-2 px-3 rounded-xl
                  hover:scale-110 duration-300 hover:cursor-pointer
                  hover:-translate-y-1 ${selectedPlat.includes(platform.id)?
                  "bg-[#0077b6] border border-2 border-[#03045e] text-white":"bg-[#caf0f8]"}
                  lg:my-2`}
                >
                <input 
                  type="checkbox"
                  name="platforms"
                  checked={selectedPlat.includes(platform.id)}
                  onChange={()=>selectPlatButto(platform.id)}
                  className={`hover:cursor-pointer accent-blue-200`}
                />
                <span className="text-sm font-bold " >{platform.label}</span>
              </label>
            ))} 
          </div>
        </article>

        <button
        disabled={isloading || !query.trim()}
         className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg
        hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300
        font-medium transition-colors hover:cursor-pointer lg:-mt-4"
        >search product</button>
      </form>
    </section>
  );
}
