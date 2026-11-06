
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { apiRequest } from "../../services/api";

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  current_stock: number;
  reorder_point: number;
}

function InventoryAlerts() {
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Product[]>("/api/inventory/")
      .then((products) => {
        const lowStockProducts = products.filter(
          (product) =>
            product.current_stock <= product.reorder_point
        );

        setAlerts(lowStockProducts);
      })
      .catch(() => setError("Unable to load inventory alerts"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Inventory Alerts
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Products requiring attention
          </p>
        </div>

        <AlertTriangle className="text-orange-500" size={22} />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading alerts...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : alerts.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-semibold text-slate-700">
            No inventory alerts
          </p>
          <p className="text-xs text-slate-400 mt-2">
            All products are above their reorder points.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {alerts.map((item) => {
            const critical = item.current_stock === 0;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.category || "Uncategorized"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">
                    {item.current_stock} units
                  </p>
                  <span className={`text-xs font-medium ${
                    critical ? "text-red-600" : "text-orange-600"
                  }`}>
                    {critical ? "Out of Stock" : "Low Stock"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="mt-6 flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-800">
        View all alerts
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default InventoryAlerts;
