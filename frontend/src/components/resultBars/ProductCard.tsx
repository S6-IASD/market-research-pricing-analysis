import type { Product } from "../../types/types";

interface ProductCardProps {
  product: Product;
}

const platformColors: Record<string, string> = {
  jumia: "bg-orange-100 text-orange-800",
  ebay: "bg-blue-100 text-blue-800",
  aliexpress: "bg-red-100 text-red-800",
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {product.image && (
          <img
            src={product.image}
            alt={product.title}
            className="w-24 h-24 object-contain rounded-lg border border-slate-100"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <div className="flex-1 text-left">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-slate-900 line-clamp-2">
              {product.title}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${platformColors[product.platform]}`}>
              {product.platform}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {product.price.toLocaleString()} {product.currency}
            </span>
            {product.price_usd && (
              <span className="text-sm text-slate-500">
                (~${product.price_usd.toLocaleString()})
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
            {product.seller && <span>Seller: {product.seller}</span>}
            {product.rating && (
              <span>
                Rating: {product.rating} ⭐ ({product.reviews_count} reviews)
              </span>
            )}
          </div>

          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(product.attributes).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {key}: {value}
                </span>
              ))}
            </div>
          )}

          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            Voir le produit →
          </a>
        </div>
      </div>
    </div>
  );
}
