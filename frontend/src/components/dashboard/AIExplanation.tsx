import {
  BrainCircuit,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

interface Props {
  category: string;
  popularity: number;
  change: string;
}

const inventoryData: Record<
  string,
  { stock: number; reorderLevel: number }
> = {
  Dishwashing: { stock: 35, reorderLevel: 50 },
  Bedding: { stock: 75, reorderLevel: 40 },
  Utensils: { stock: 60, reorderLevel: 30 },
  Cleaning: { stock: 25, reorderLevel: 50 },
  Household: { stock: 80, reorderLevel: 40 },
  "Personal Care": { stock: 90, reorderLevel: 45 },
};

function AIExplanation({ category, popularity, change }: Props) {
  const inventory = inventoryData[category];
  const demandChange = Number(change.replace("%", ""));

  const reasons = [
    {
      icon: TrendingUp,
      title: "Market Popularity",
      description: `The ${category} category has a popularity score of ${popularity}/100.`,
    },
    {
      icon: TrendingUp,
      title: "Demand Movement",
      description: `Demand has changed by ${change} compared with the previous period.`,
    },
    {
      icon: Package,
      title: "Current Inventory",
      description: `${inventory.stock} units available against a reorder level of ${inventory.reorderLevel} units.`,
    },
  ];

  const isLowStock = inventory.stock <= inventory.reorderLevel;
  const isHighDemand = popularity >= 80 && demandChange >= 10;

  let conclusion = "Continue monitoring inventory and demand.";
  let recommendation = "MAINTAIN STOCK";
  let RecommendationIcon = CheckCircle;
  let color = "blue";

  if (isLowStock && isHighDemand) {
    conclusion =
      "High demand combined with stock below the reorder level indicates a potential shortage.";
    recommendation = "RESTOCK NOW";
    RecommendationIcon = AlertTriangle;
    color = "red";
  } else if (popularity < 40 || demandChange <= -4) {
    conclusion =
      "Demand indicators are relatively weak. Avoid unnecessary inventory purchases.";
    recommendation = "LOW PRIORITY";
    RecommendationIcon = Lightbulb;
    color = "orange";
  } else if (isLowStock) {
    conclusion =
      "Available stock is below the reorder level. Review replenishment requirements.";
    recommendation = "RESTOCK REVIEW";
    RecommendationIcon = AlertTriangle;
    color = "red";
  }

  const styles = {
    red: "bg-red-50 border-red-200 text-red-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-violet-100 rounded-xl">
          <BrainCircuit size={24} className="text-violet-600" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            AI Explanation
          </h2>
          <p className="text-sm text-slate-500">
            Understanding the recommendation
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {reasons.map((reason) => {
          const Icon = reason.icon;

          return (
            <div key={reason.title} className="flex gap-3">
              <div className="p-2 bg-slate-100 rounded-lg h-fit">
                <Icon size={20} className="text-slate-600" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {reason.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {reason.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-7 p-5 rounded-xl border ${styles[color as keyof typeof styles]}`}>
        <div className="flex items-center gap-2 mb-2">
          <RecommendationIcon size={20} />
          <h3 className="font-bold text-sm">
            {recommendation}
          </h3>
        </div>

        <p className="text-sm">
          {conclusion}
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-5">
        Rule-based demonstration using sample inventory data.
        Nemotron integration will provide AI-generated explanations later.
      </p>

    </div>
  );
}

export default AIExplanation;