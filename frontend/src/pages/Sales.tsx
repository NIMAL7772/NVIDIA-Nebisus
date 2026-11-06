
import { useEffect, useState } from "react";
import {
  Search,
  IndianRupee,
  ShoppingCart,
  Package,
  TrendingUp,
  Plus,
  X,
} from "lucide-react";

import { apiRequest } from "../services/api";

interface Sale {
  id: number;
  order_id: string;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  created_at: string;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  selling_price: number;
  current_stock: number;
}

function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const loadData = async () => {
    const [salesData, productsData] = await Promise.all([
      apiRequest<Sale[]>("/api/sales/"),
      apiRequest<Product[]>("/api/inventory/"),
    ]);

    setSales(salesData);
    setProducts(productsData);
  };

  useEffect(() => {
    loadData()
      .catch(() => setError("Unable to load sales data"))
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find(
    (product) => product.id === Number(productId)
  );

  const totalAmount = selectedProduct
    ? selectedProduct.selling_price * quantity
    : 0;

  const completedSales = sales.filter(
    (sale) => sale.status === "Completed"
  );

  const totalRevenue = completedSales.reduce(
    (sum, sale) => sum + sale.total_amount,
    0
  );

  const totalUnits = completedSales.reduce(
    (sum, sale) => sum + sale.quantity,
    0
  );

  const completedOrders = completedSales.length;

  const averageOrder = completedOrders
    ? totalRevenue / completedOrders
    : 0;

  const filteredSales = sales.filter(
    (sale) =>
      sale.order_id.toLowerCase().includes(search.toLowerCase()) ||
      sale.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const resetForm = () => {
    setProductId("");
    setQuantity(1);
    setError("");
    setShowForm(false);
  };

  const handleCreateSale = async () => {
    if (!selectedProduct) {
      setError("Please select a product");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > selectedProduct.current_stock
    ) {
      setError("Please enter a valid quantity within available stock");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await apiRequest<{
        message: string;
        order_id: string;
        total_amount: number;
        remaining_stock: number;
      }>("/api/sales/", {
        method: "POST",
        body: {
          order_id: `ORD-${Date.now()}`,
          product_id: selectedProduct.id,
          quantity,
        },
      });

      await loadData();

      setSuccess(
        `Sale recorded successfully! Order ${result.order_id}. Remaining stock: ${result.remaining_stock}.`
      );

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to record sale"
      );
    } finally {
      setSaving(false);
    }
  };

  const summaryCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: <IndianRupee />,
    },
    {
      title: "Completed Orders",
      value: completedOrders,
      icon: <ShoppingCart />,
    },
    {
      title: "Units Sold",
      value: totalUnits,
      icon: <Package />,
    },
    {
      title: "Average Order Value",
      value: formatCurrency(Math.round(averageOrder)),
      icon: <TrendingUp />,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Sales Management
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Track revenue, orders and product sales.
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setSuccess("");
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-semibold"
        >
          <Plus size={18} />
          Record Sale
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm">
          {success}
        </div>
      )}

      {error && !showForm && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-5 rounded-xl border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {card.title}
              </p>

              <div className="text-blue-600">
                {card.icon}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mt-3">
              {loading ? "..." : card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 bg-slate-100 px-4 py-3 rounded-lg">
          <Search size={18} className="text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or product..."
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

        <div className="p-5 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">
            Recent Transactions
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Showing {filteredSales.length} transactions
          </p>
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-500">
            Loading sales transactions...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {sale.order_id}
                    </td>

                    <td className="px-6 py-4">
                      {sale.product_name}
                    </td>

                    <td className="px-6 py-4">
                      {sale.quantity}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(sale.total_amount)}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(sale.created_at).toLocaleDateString("en-IN")}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sale.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : sale.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredSales.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Record New Sale
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Enter product and quantity details.
                </p>
              </div>

              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Product
                </label>

                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setQuantity(1);
                    setError("");
                  }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a product</option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                      disabled={product.current_stock === 0}
                    >
                      {product.name} — {product.current_stock} units available
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Available Stock
                    </span>

                    <span className="font-semibold text-slate-800">
                      {selectedProduct.current_stock} units
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Selling Price
                    </span>

                    <span className="font-semibold text-slate-800">
                      {formatCurrency(selectedProduct.selling_price)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.current_stock ?? undefined}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(Number(e.target.value));
                    setError("");
                  }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />

                {selectedProduct &&
                  quantity > selectedProduct.current_stock && (
                    <p className="text-xs text-red-600 mt-2">
                      Quantity exceeds available stock.
                    </p>
                  )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Total Sale Amount
                </p>

                <h3 className="text-2xl font-bold text-blue-800 mt-1">
                  {formatCurrency(totalAmount)}
                </h3>
              </div>

              <button
                onClick={handleCreateSale}
                disabled={
                  saving ||
                  !selectedProduct ||
                  !Number.isInteger(quantity) ||
                  quantity <= 0 ||
                  quantity > (selectedProduct?.current_stock ?? 0)
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold text-sm"
              >
                {saving ? "Recording Sale..." : "Save Sale"}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Sales;
