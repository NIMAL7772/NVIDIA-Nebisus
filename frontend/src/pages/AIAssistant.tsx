
import { useEffect, useRef, useState } from "react";
import { Bot, User, Send, Sparkles, AlertTriangle, PackageCheck } from "lucide-react";
import { apiRequest } from "../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  status: string;
  model: string;
  question: string;
  insights: string;
}

interface ReorderRecommendation {
  product_id: number;
  name: string;
  current_stock: number;
  days_of_cover: number | null;
  pending_purchase_units: number;
  recommended_order_quantity: number;
  risk: "out_of_stock" | "stockout_risk" | "low_stock" | "healthy";
}

interface AIOverview {
  sales_window_days: number;
  reorder_recommendations: ReorderRecommendation[];
}

function AIAssistant() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<AIOverview | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your STOCK AI Assistant. I can help you understand inventory, sales, demand trends and stock management. What would you like to know?",
    },
  ]);

  // Reference for automatic scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiRequest<AIOverview>("/api/ai/overview")
      .then(setOverview)
      .catch(() => setOverview(null));
  }, []);

  // Send question to NVIDIA Nemotron
  const handleSend = async (suggestedQuestion?: string) => {
    const question = (suggestedQuestion ?? input).trim();

    if (!question || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await apiRequest<AIResponse>("/api/ai/insights", {
  method: "POST",
  body: {
    question,
    history: messages.slice(-10).map(({ role, content }) => ({
      role,
      content,
    })),
  },
});

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.insights,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Unable to get AI response: ${error.message}`
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const suggestedQuestions = [
    "Which products have low stock?",
    "Which products could run out before their supplier lead time?",
    "Suggest products to reorder, including open purchase orders",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
          <Bot size={25} />
        </div>

        <div>
          <h1 className="font-bold text-slate-800 text-lg">
            STOCK AI Assistant
          </h1>
          <p className="text-sm text-slate-500">
            Intelligent inventory assistant
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          NVIDIA Nemotron
        </div>
      </div>

      {overview && (
        <div className="px-6 pt-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <AlertTriangle size={17} className="text-amber-500" />
                Inventory signals
              </div>
              <span className="text-xs text-slate-500">
                Based on the last {overview.sales_window_days} days of completed sales
              </span>
            </div>
            {overview.reorder_recommendations.length ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {overview.reorder_recommendations.slice(0, 3).map((item) => (
                  <div key={item.product_id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.current_stock} in stock
                      {item.days_of_cover !== null ? ` · ${item.days_of_cover} days cover` : " · no recent demand data"}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-blue-700">
                      {item.recommended_order_quantity > 0
                        ? `Suggested order: ${item.recommended_order_quantity} units`
                        : item.pending_purchase_units > 0
                        ? `${item.pending_purchase_units} units already on order`
                        : item.risk.replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                <PackageCheck size={17} /> No current reorder signals.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Bot size={20} />
              </div>
            )}

            <div
              className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-blue-600 text-white whitespace-pre-wrap"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-slate-900">
                        {children}
                      </strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 mb-3 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 mb-3 space-y-1">
                        {children}
                      </ol>
                    ),
                    h2: ({ children }) => (
                      <h2 className="font-bold text-base mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-semibold mb-2">
                        {children}
                      </h3>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>

            {message.role === "user" && (
              <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center">
                <User size={20} />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bot size={20} />
            </div>

            <div className="bg-slate-100 rounded-xl px-4 py-3 text-sm text-slate-500">
              Nemotron is analyzing your data...
            </div>
          </div>
        )}

        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />

      </div>

      {/* Suggested Questions */}
      <div className="px-6 pb-3 flex flex-wrap gap-2">
        {suggestedQuestions.map((question) => (
          <button
            key={question}
            onClick={() => handleSend(question)}
            disabled={loading}
            className="text-xs border border-slate-200 rounded-full px-3 py-2 text-slate-600 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
          >
            <Sparkles size={12} className="inline mr-1" />
            {question}
          </button>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-5 border-t border-slate-200">
        <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSend();
              }
            }}
            placeholder="Ask STOCK AI anything..."
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-sm py-2"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-3 rounded-lg"
          >
            <Send size={18} />
          </button>
        </div>

        <p className="text-xs text-center text-slate-400 mt-3">
          Powered by NVIDIA Nemotron
        </p>
      </div>

    </div>
  );
}

export default AIAssistant;
