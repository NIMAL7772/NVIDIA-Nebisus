
import { useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { apiRequest } from "../../services/api";

interface AIResponse {
  status: string;
  model: string;
  question: string;
  insights: string;
}

function AIInsights() {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateInsights = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<AIResponse>(
        "/api/ai/insights",
        {
          method: "POST",
          body: {
            question:
              "Analyze my inventory. Identify low-stock products, sales performance and recommend actions to improve inventory management.",
          },
        }
      );

      setInsights(response.insights);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate AI insights"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-violet-100 p-3 rounded-lg">
          <BrainCircuit className="text-violet-600" size={23} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            AI Insights
          </h2>
          <p className="text-sm text-slate-500">
            Powered by NVIDIA Nemotron
          </p>
        </div>
      </div>

      {!insights && !loading && (
        <div className="py-6 text-center">
          <Sparkles
            className="mx-auto text-violet-500 mb-3"
            size={30}
          />
          <p className="text-sm text-slate-600">
            Generate intelligent recommendations using your
            actual inventory and sales data.
          </p>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center">
          <Loader2
            className="animate-spin mx-auto text-violet-600 mb-3"
            size={28}
          />
          <p className="text-sm text-slate-500">
            Nemotron is analysing your business data...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          <AlertTriangle size={16} className="inline mr-2" />
          {error}
        </div>
      )}

      {insights && !loading && (
        <div className="bg-violet-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-violet-700 mb-3">
            NEMOTRON ANALYSIS
          </p>

          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-6">
            {insights}
          </div>
        </div>
      )}

      <button
        onClick={generateInsights}
        disabled={loading}
        className="mt-6 w-full flex items-center justify-center gap-2
        bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold
        hover:bg-blue-700 disabled:opacity-50"
      >
        <Sparkles size={17} />
        {loading ? "Analysing..." : "Generate AI Insights"}
      </button>

    </div>
  );
}

export default AIInsights;
