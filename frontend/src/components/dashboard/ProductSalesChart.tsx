
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { apiRequest } from "../../services/api";

interface ProductSales {
  product_id: number;
  name: string;
  sales: number;
  revenue: number;
}

function ProductSalesChart() {
  const [productData, setProductData] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<ProductSales[]>("/api/sales/top-products")
      .then((data) => {
        setProductData(data);
        setError("");
      })
      .catch(() => setError("Unable to load top selling products"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">
          Top Selling Products
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Product-wise sales performance
        </p>
      </div>

      <div className="w-full h-72">
        {loading ? (
          <p className="text-sm text-slate-500">Loading chart...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : productData.length === 0 ? (
          <p className="text-sm text-slate-500">
            No sales data available yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={productData}
              layout="vertical"
              margin={{ left: 15, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />

              <XAxis type="number" axisLine={false} tickLine={false} />

              <YAxis
                type="category"
                dataKey="name"
                width={110}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                formatter={(value) => [
                  `${value} units`,
                  "Units Sold",
                ]}
              />

              <Bar
                dataKey="sales"
                name="Units Sold"
                fill="#2563eb"
                radius={[0, 6, 6, 0]}
                barSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default ProductSalesChart;
