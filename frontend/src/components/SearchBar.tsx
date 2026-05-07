import React, { useState } from "react";
import { PLATEFORMS } from "../types";

export default function SearchBar() {
  const [query, setQuery] = useState("");
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
    <div>
      <form onSubmit={handleSubmit}>
        <div>
        <label htmlFor="search">Rechercher un produit:</label>
        <input
          type="search"
          id="search"
          onChange={(e) => setQuery(e.target.value)}
          value={query}
          placeholder="Ex: laptop, redmi pro 14, hp pc portable..."
        />
        </div>
        <div>
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
        </div>
      </form>
    </div>
  );
}
