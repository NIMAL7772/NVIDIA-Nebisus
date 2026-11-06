
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import {
  getReorderSuggestions,
  type ReorderSuggestion,
} from "../../services/inventory";

function ReorderSuggestions() {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getReorderSuggestions();
      setSuggestions(response.reorder_suggestions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load reorder suggestions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        Loading reorder suggestions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchSuggestions}
          className="mt-3 text-sm text-blue-600"
        >
          Try again
        </button>
      </div>
    );
  }

const reorderProducts = suggestions;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Demand-Based Reorder Suggestions
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Based on the last 30 days of sales
          </p>
        </div>

        <button
          onClick={fetchSuggestions}
          className="p-2 rounded-lg hover:bg-slate-100"
          title="Refresh suggestions"
        >
          <RefreshCw size={18} className="text-slate-600" />
        </button>
      </div>

      {reorderProducts.length === 0 ? (
        <div className="flex items-center gap-3 py-6">
          <CheckCircle className="text-green-500" size={24} />
          <p className="text-slate-600">
            No products currently require reordering.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Reorder Point</th>
                <th className="py-3 px-4">Daily Demand</th>
                <th className="py-3 px-4">Order Quantity</th>
                <th className="py-3 pl-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {reorderProducts.map((item) => (
                <tr
                  key={item.product_id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-4 pr-4">
                    <p className="font-medium text-slate-800">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.sku}
                    </p>
                  </td>

                  <td className="py-4 px-4">
                    {item.current_stock}
                  </td>

                  <td className="py-4 px-4">
                    {item.calculated_reorder_point}
                  </td>

                  <td className="py-4 px-4">
                    {item.average_daily_demand}
                  </td>

                  <td className="py-4 px-4 font-semibold text-blue-600">
                    {item.suggested_order_quantity} units
                  </td>

                  <td className="py-4 pl-4">
                    <span
  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
    item.priority === "Critical"
      ? "bg-red-100 text-red-700"
      : item.priority === "High"
      ? "bg-orange-100 text-orange-700"
      : item.priority === "Medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700"
  }`}
>
  {item.priority === "Critical" || item.priority === "High" ? (
    <AlertTriangle size={13} />
  ) : (
    <CheckCircle size={13} />
  )}
  {item.priority}
</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        {suggestions.filter((item) => item.needs_reorder).length} products require reordering out of{" "}
{suggestions.length} analyzed.
      </p>
    </div>
  );
}

export default ReorderSuggestions;
