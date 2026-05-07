import { Component, useState } from "react";
import SearchBar from "./components/SearchBar";

function App() {
  return (
    <div>
      <header>
        <div>
          <h1>Market Research & Pricing Analysis</h1>
          <p>Analyse intelligente des prix e-commerce</p>
        </div>
      </header>

      <main>
        <SearchBar />
      </main>

      <footer>
        <div>
          <p>
            Projet Data Mining - Licence IASD 2025/2026 All rights
            reserved.&copy;
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
