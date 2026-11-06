import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  category: string;
}

const trendData: Record<string, { week: string; demand: number }[]> = {
  Dishwashing: [
    { week: "Week 1", demand: 40 },
    { week: "Week 2", demand: 55 },
    { week: "Week 3", demand: 48 },
    { week: "Week 4", demand: 75 },
    { week: "Week 5", demand: 90 },
  ],
  Bedding: [
    { week: "Week 1", demand: 35 },
    { week: "Week 2", demand: 42 },
    { week: "Week 3", demand: 50 },
    { week: "Week 4", demand: 47 },
    { week: "Week 5", demand: 65 },
  ],
  Utensils: [
    { week: "Week 1", demand: 55 },
    { week: "Week 2", demand: 48 },
    { week: "Week 3", demand: 52 },
    { week: "Week 4", demand: 45 },
    { week: "Week 5", demand: 48 },
  ],
  Cleaning: [
    { week: "Week 1", demand: 45 },
    { week: "Week 2", demand: 60 },
    { week: "Week 3", demand: 65 },
    { week: "Week 4", demand: 72 },
    { week: "Week 5", demand: 85 },
  ],
  Household: [
    { week: "Week 1", demand: 50 },
    { week: "Week 2", demand: 58 },
    { week: "Week 3", demand: 55 },
    { week: "Week 4", demand: 68 },
    { week: "Week 5", demand: 72 },
  ],
  "Personal Care": [
    { week: "Week 1", demand: 65 },
    { week: "Week 2", demand: 58 },
    { week: "Week 3", demand: 52 },
    { week: "Week 4", demand: 45 },
    { week: "Week 5", demand: 38 },
  ],
};

function DemandTrendChart({ category }: Props) {
  const data = trendData[category] ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-lg font-bold text-slate-800">
        Demand Trend
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Weekly demand pattern for {category}
      </p>

      <div className="w-full h-72 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="week" />

            <YAxis domain={[0, 100]} />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="demand"
              stroke="#7c3aed"
              strokeWidth={3}
              fill="url(#demandGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DemandTrendChart;