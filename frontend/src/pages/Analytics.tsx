
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 18000 },
  { month: "Feb", revenue: 22000 },
  { month: "Mar", revenue: 19500 },
  { month: "Apr", revenue: 28000 },
  { month: "May", revenue: 32000 },
  { month: "Jun", revenue: 26400 },
];

const productData = [
  { product: "Dishwashing", sales: 420 },
  { product: "Bedsheets", sales: 310 },
  { product: "Utensils", sales: 280 },
  { product: "Cleaning", sales: 230 },
  { product: "Hand Wash", sales: 180 },
];

function Analytics() {
  const totalRevenue = revenueData.reduce(
    (sum, item) => sum + item.revenue,
    0
  );

  return (
    <div className="space-y-6">

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Understand your business performance through data.
        </p>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Total Revenue (Sample)</p>
          <h2 className="text-3xl font-bold text-slate-800 mt-3">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Based on the six displayed months
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Best Revenue Month</p>
          <h2 className="text-3xl font-bold text-slate-800 mt-3">
            {revenueData.reduce((best, item) =>
              item.revenue > best.revenue ? item : best
            ).month}
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Highest monthly revenue in sample data
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">
          Monthly Revenue Trend
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Revenue performance over six months
        </p>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                fill="url(#revenueColor)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Sales Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">
          Top-Selling Products
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Product-wise sales comparison
        </p>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="product"
                width={110}
              />
              <Tooltip />
              <Bar
                dataKey="sales"
                fill="#2563eb"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

export default Analytics;
