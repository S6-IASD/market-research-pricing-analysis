import type { scrapeResponse } from "../../types/types";
import StatsPanel from "./StatsPanel";
import ProductCard from "./ProductCard";

// interface productProps{
//     response: scrapeResponse;
// }

export default function ProductsBar(response: scrapeResponse) {
  return (
    <article>
      <StatsPanel
        stats={response.stats}
        status={response.status}
        query={response.query}
        category={response.category}
        executionTime_ms={response.execution_time_ms}
      />

      {response.products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">
            Aucun produit trouvé. Essayez un autre.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Products ({response.products.length})
          </h2>
          {response.products.map((product, index) => (
            <ProductCard key={`${product.url}-${index}`} product={product} />
          ))}
        </div>
      )}
    </article>
  );
}
