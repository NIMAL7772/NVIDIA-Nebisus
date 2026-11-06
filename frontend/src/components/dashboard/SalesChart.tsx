
import { useEffect, useState } from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { apiRequest } from "../../services/api";

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

function SalesChart() {
  const [salesData, setSalesData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<MonthlyRevenue[]>("/api/sales/monthly-revenue")
      .then((data) => {
        setSalesData(data);
        setError("");
      })
      .catch(() => {
        setError("Unable to load revenue data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">
          Revenue Overview
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Monthly revenue performance
        </p>
      </div>

      <div className="w-full h-72">
        {loading ? (
          <p className="text-sm text-slate-500">Loading revenue...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />

              <Tooltip
                formatter={(value) => [
                  `₹${Number(value).toLocaleString("en-IN")}`,
                  "Revenue",
                ]}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default SalesChart;
