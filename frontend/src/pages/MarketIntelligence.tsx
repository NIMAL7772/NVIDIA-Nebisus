import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BrainCircuit,
  Package,
} from "lucide-react";
import DemandTrendChart from "../components/dashboard/DemandTrendChart";
import AIRecommendation from "../components/dashboard/AIRecommendation";
import TrendingProducts from "../components/dashboard/TrendingProducts";
import AIExplanation from "../components/dashboard/AIExplanation";

const categories = [
  "Dishwashing",
  "Bedding",
  "Utensils",
  "Cleaning",
  "Household",
  "Personal Care",
];

const categoryData: Record<
  string,
  { popularity: number; status: string; change: string }
> = {
  Dishwashing: {
    popularity: 92,
    status: "High",
    change: "+14.5%",
  },
  Bedding: {
    popularity: 65,
    status: "Moderate",
    change: "+5.2%",
  },
  Utensils: {
    popularity: 48,
    status: "Moderate",
    change: "-2.1%",
  },
  Cleaning: {
    popularity: 85,
    status: "High",
    change: "+11.8%",
  },
  Household: {
    popularity: 72,
    status: "High",
    change: "+7.4%",
  },
  "Personal Care": {
    popularity: 38,
    status: "Low",
    change: "-4.3%",
  },
};

function MarketIntelligence() {
  const [selectedCategory, setSelectedCategory] =
    useState("Dishwashing");

  const selectedData = categoryData[selectedCategory];

  return (
    <div className="space-y-8">
    <DemandTrendChart category={selectedCategory} />
    <AIRecommendation
  category={selectedCategory}
  popularity={selectedData.popularity}
  change={selectedData.change}
/>
<AIExplanation
  category={selectedCategory}
  popularity={selectedData.popularity}
  change={selectedData.change}
/>
<TrendingProducts category={selectedCategory} />

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-100 rounded-xl">
            <BrainCircuit size={26} className="text-violet-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              AI Market Intelligence
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Understand product demand and market trends.
            </p>
          </div>
        </div>
      </div>

      {/* Category Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Select Product Category
        </h2>

        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-3 rounded-lg text-sm font-medium border transition ${
                selectedCategory === category
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

      </div>

      {/* Market Popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Market Popularity
              </p>

              <h2 className="text-2xl font-bold text-slate-800 mt-2">
                {selectedCategory}
              </h2>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl">
              <Package size={25} className="text-blue-600" />
            </div>
          </div>

          <div className="mt-8 flex items-end gap-3">
            <span className="text-5xl font-bold text-slate-800">
              {selectedData.popularity}
            </span>

            <span className="text-slate-400 mb-2">
              / 100
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full mt-5">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${selectedData.popularity}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-500">
              Popularity Level
            </span>

            <span className={`text-sm font-bold ${
              selectedData.status === "High"
                ? "text-emerald-600"
                : selectedData.status === "Moderate"
                ? "text-orange-500"
                : "text-red-500"
            }`}>
              {selectedData.status}
            </span>
          </div>

        </div>

        {/* Demand Change */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

          <p className="text-sm text-slate-500">
            Demand Change
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-4">
            {selectedData.change}
          </h2>

          <div className="flex items-center gap-2 mt-4">
            {selectedData.change.startsWith("+") ? (
              <TrendingUp className="text-emerald-600" size={22} />
            ) : selectedData.change.startsWith("-") ? (
              <TrendingDown className="text-red-500" size={22} />
            ) : (
              <Minus className="text-slate-500" size={22} />
            )}

            <span className="text-sm text-slate-500">
              Compared to previous period
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-8">
            Demonstration data – actual demand metrics will be
            connected to the backend later.
          </p>

        </div>

      </div>

    </div>
  );
}

export default MarketIntelligence;