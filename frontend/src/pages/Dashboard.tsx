import ReorderSuggestions from "../components/dashboard/ReorderSuggestions";
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import SalesChart from "../components/dashboard/SalesChart";
import InventoryAlerts from "../components/dashboard/InventoryAlerts";
import ProductSalesChart from "../components/dashboard/ProductSalesChart";
import AIInsights from "../components/dashboard/AIInsights";

import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "../services/dashboard";

function Dashboard() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<{ status: string }>("/health")
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("Disconnected"));

    getDashboardSummary()
      .then((data) => {
        setSummary(data);
        setError("");
      })
      .catch(() => setError("Unable to load dashboard data"))
      .finally(() => setSummaryLoading(false));
  }, []);

  const stats = [
    {
      title: "Total Products",
      value: summary?.total_products ?? 0,
      description: "Products in inventory",
      icon: Package,
    },
    {
      title: "Total Stock Units",
      value: summary?.total_stock_units ?? 0,
      description: "Units currently available",
      icon: Boxes,
    },
    {
      title: "Low Stock Items",
      value: summary?.low_stock_items ?? 0,
      description: "Require attention",
      icon: AlertTriangle,
    },
    {
      title: "Out of Stock",
      value: summary?.out_of_stock_items ?? 0,
      description: "Products with zero stock",
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard Overview
        </h1>

        <p className="text-slate-500 mt-1">
          Monitor your inventory and business performance.
        </p>

        <p className="text-sm mt-3">
          Backend Status:{" "}
          <span
            className={
              backendStatus === "healthy"
                ? "text-green-600 font-semibold"
                : backendStatus === "Disconnected"
                ? "text-red-600 font-semibold"
                : "text-yellow-600 font-semibold"
            }
          >
            {backendStatus}
          </span>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {stat.title}
                </p>

                <div className="p-3 bg-slate-100 rounded-lg">
                  <Icon size={22} className="text-slate-700" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-800 mt-5">
                {summaryLoading
                  ? "..."
                  : stat.value.toLocaleString("en-IN")}
              </h2>

              <p className="text-xs text-slate-400 mt-2">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      {/* Bottom Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <SalesChart />
  <InventoryAlerts />
  <ProductSalesChart />
  <AIInsights />
</div>

{/* Demand-Based Reorder Suggestions */}
<ReorderSuggestions />
    </div>
  );
}

export default Dashboard;
