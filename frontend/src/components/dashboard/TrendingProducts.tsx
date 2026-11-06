import {
  TrendingUp,
  Package,
  ArrowUpRight,
} from "lucide-react";

interface Props {
  category: string;
}

const products = [
  {
    name: "Vim Dishwash Liquid",
    category: "Dishwashing",
    popularity: 95,
    growth: "+18.5%",
    status: "High Demand",
  },
  {
    name: "Surf Excel Detergent",
    category: "Cleaning",
    popularity: 89,
    growth: "+14.2%",
    status: "Trending",
  },
  {
    name: "Hand Wash",
    category: "Personal Care",
    popularity: 82,
    growth: "+11.6%",
    status: "Trending",
  },
  {
    name: "Paper Towels",
    category: "Household",
    popularity: 76,
    growth: "+8.4%",
    status: "Growing",
  },
  {
    name: "Bed Sheets",
    category: "Bedding",
    popularity: 70,
    growth: "+6.2%",
    status: "Growing",
  },
  {
    name: "Steel Utensils",
    category: "Utensils",
    popularity: 65,
    growth: "+5.1%",
    status: "Growing",
  },
];

function TrendingProducts({ category }: Props) {
  const filteredProducts = products.filter(
    (product) => product.category === category
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Trending Products
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Popular products in {category}
          </p>
        </div>

        <div className="p-3 bg-emerald-50 rounded-xl">
          <TrendingUp size={23} className="text-emerald-600" />
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="space-y-5">
          {filteredProducts.map((product, index) => (
            <div
              key={product.name}
              className="flex items-center gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
            >
              <div className="bg-slate-100 p-3 rounded-lg">
                <Package size={22} className="text-slate-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-800">
                  {index + 1}. {product.name}
                </h3>

                <div className="w-full bg-slate-100 h-2 rounded-full mt-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${product.popularity}%` }}
                  />
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-emerald-600">
                  <ArrowUpRight size={15} />
                  <span className="text-sm font-bold">
                    {product.growth}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  {product.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 py-8 text-center">
          No trending products available for this category.
        </p>
      )}

      <p className="text-xs text-slate-400 mt-6">
        Demonstration data. Actual rankings will use sales records.
      </p>

    </div>
  );
}

export default TrendingProducts;