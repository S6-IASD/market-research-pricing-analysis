

import type { ScrapeStats } from "../../types/types";

interface StatspanelProps {
  stats: ScrapeStats;
  status: string;
  query: string;
  category: string;
  executionTime_ms: number;
}

export default function StatsPanel({status, stats, query, category,executionTime_ms}: StatspanelProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Search Results for "{query}"
      </h2>

      <article className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-50 p-3 rounded-lg">
          <h3 className="text-sm text-slate-500">Total Products</h3>
          <p className="text-2xl font-bold text-slate-900">
            {stats.total_products}
          </p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <h3 className="text-sm text-slate-500">Raw Extracted</h3>
          <p className="text-2xl font-bold text-slate-900">
            {stats.raw_extracted}
          </p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <h3 className="text-sm text-slate-500">Deduplicated</h3>
          <p className="text-2xl font-bold text-slate-900">
            {stats.deduplicated}
          </p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <h3 className="text-sm text-slate-500">Time (s)</h3>
          <p className="text-2xl font-bold text-slate-900">
            {(executionTime_ms / 1000).toFixed(1)}
          </p>
        </div>
      </article>

      <article className="flex flex-wrap gap-4 text-sm text-slate-600">
        <div>
          <span className="font-medium">Category:</span> {category}
        </div>
        <div>
          <span className="font-medium">Status:</span>{" "}
          <span
            className={
              status === "success"
                ? "text-green-600"
                : status === "partial_failure"
                  ? "text-orange-600"
                  : "text-red-600"
            }
          >
            {status}
          </span>
        </div>
      </article>

      {stats.errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
          <ul className="list-disc list-inside text-sm text-red-700">
            {stats.errors.map((err, i) => (
              <li key={i}>
                {err.platform}: {err.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <article className="mt-4">
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Products per Platform:
        </h4>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(stats.by_platform).map(([platform, count]) => (
            <span
              key={platform}
              className="px-3 py-1 bg-slate-100 rounded-full text-sm"
            >
              {platform}: {count}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}
