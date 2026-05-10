

export default function LoadingBar() {
  return (
    <article className="flex flex-col items-center justify-center h-full py-12">
      <div
        className="inline-block h-8 w-8 animate-spin 
        rounded-full border-4 border-solid border-blue-600 
        border-r-transparent"
      ></div>
      <p className="mt-4 text-slate-600">
        Recherche de produits sur différentes plateformes...
      </p>
      <p className="text-sm text-slate-500">
        Cela peut prendre entre 30 et 90 secondes
      </p>
    </article>
  );
}
