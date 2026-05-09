import React, { useState } from "react";
import { PLATEFORMS } from "../types";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [category, setCat] = useState("");
  const [selectedPlat, setSelectedPlat] = useState<string[]>(
    PLATEFORMS.map(p => p.id)
  )

  console.log(selectedPlat);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    }

    const HandleButtonPlateform = (plateformId: string) => {
        setSelectedPlat(prev => 
            prev.includes(plateformId)?
            prev.filter(p => p !== plateformId) :
            [...prev, plateformId]
        );
        
    }

  return (
    <section className="border-2 h-[75vh] " >
      <form onSubmit={handleSubmit} 
      className="flex flex-col w-200 border-2 border-sky-200 p-6 items-start justify-around ">

        <article className="border-2 flex px-2 py-2 flex-col gap-[.4em] w-[70%]  ">
          <label htmlFor="search">Rechercher un produit:</label>
          <input
            className="border-2 p-2 rounded-lg "
            type="search"
            id="search"
            onChange={(e) => setQuery(e.target.value)}
            value={query}
            placeholder="Ex: laptop, redmi pro 14, hp pc portable ..."
         />
        </article>

        <article className="border-2 flex flex-col p-4 w-[70%] " >
          <label htmlFor="Categorie">Categorie</label>
          <input 
          type="text" 
          id="Categorie"
          placeholder="ex: electronics, fashion, home ..."
          />
        </article>

        <article>
            <label>Plateforms</label>
            <div>
                {PLATEFORMS.map((plateform) => (
                    <button
                        key={plateform.id}
                        onClick={()=> HandleButtonPlateform(plateform.id)}
                        
                    >{plateform.name}
                    </button>
                ))}
            </div>
        </article>

        <button >search product</button>

      </form>
    </section>
  );
}
