import { Component, useState } from "react";

import Header from "./components/Header";
import Main from "./components/Main";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen border border-slate-50">
      <Header />

      <Main />

      <Footer />
    </div>
  );
}

export default App;
