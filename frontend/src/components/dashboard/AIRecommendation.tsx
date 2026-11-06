import {
  BrainCircuit,
  ShoppingCart,
  PackageCheck,
  Clock,
  Lightbulb,
} from "lucide-react";

interface Props {
  category: string;
  popularity: number;
  change: string;
}

function AIRecommendation({ category, popularity, change }: Props) {
  const demandChange = Number(change.replace("%", ""));

  let recommendation = "MAINTAIN STOCK";
  let explanation = "Demand is relatively stable. Continue monitoring inventory levels.";
  let action = "Monitor stock regularly";
  let color = "blue";
  let Icon = PackageCheck;

  if (popularity >= 80 && demandChange >= 10) {
    recommendation = "RESTOCK NOW";
    explanation = `${category} shows high popularity and an increasing demand trend. Consider replenishing stock to avoid shortages.`;
    action = "Consider placing a restock order";
    color = "red";
    Icon = ShoppingCart;
  } else if (popularity < 40 || demandChange <= -4) {
    recommendation = "LOW PRIORITY";
    explanation = `${category} currently shows relatively low or declining demand. Avoid unnecessary excess inventory.`;
    action = "Review stock before ordering";
    color = "orange";
    Icon = Clock;
  }

  const styles = {
    red: {
      background: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      icon: "text-red-600",
    },
    blue: {
      background: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: "text-blue-600",
    },
    orange: {
      background: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      icon: "text-orange-600",
    },
  };

  const style = styles[color as keyof typeof styles];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-violet-100 rounded-xl">
          <BrainCircuit size={24} className="text-violet-600" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            AI Stock Recommendation
          </h2>

          <p className="text-sm text-slate-500">
            Inventory decision support
          </p>
        </div>
      </div>

      <div className={`rounded-xl border p-5 ${style.background} ${style.border}`}>

        <p className="text-xs font-semibold text-slate-500 mb-2">
          RECOMMENDED ACTION
        </p>

        <div className="flex items-center gap-3">
          <Icon size={28} className={style.icon} />

          <h3 className={`text-2xl font-bold ${style.text}`}>
            {recommendation}
          </h3>
        </div>

        <p className="text-sm text-slate-600 mt-4">
          {explanation}
        </p>

      </div>

      <div className="mt-5 flex items-start gap-3">
        <Lightbulb className="text-amber-500 mt-1" size={20} />

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Suggested Action
          </p>

          <p className="text-sm text-slate-500 mt-1">
            {action}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Preliminary rule-based recommendation using demonstration metrics.
        NVIDIA Nemotron integration will be added later.
      </p>

    </div>
  );
}

export default AIRecommendation;