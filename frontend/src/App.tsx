import Header from "./components/Header";
import Main from "./components/Main";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen flex flex-col border border-slate-50 overflow-x-hidden">
      <Header />

      <Main />

      <Footer />
    </div>
  );
}

export default App;
