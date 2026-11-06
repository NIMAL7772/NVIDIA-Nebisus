
import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  Search,
  RefreshCw,
  Plus,
  X,
  Trash2,
  Truck,
} from "lucide-react";

import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  type PurchaseOrder,
} from "../services/purchaseOrders";


import { apiRequest } from "../services/api";

interface Product {
  id: number;
  sku: string;
  name: string;
  supplier: string | null;
  unit_cost: number;
  current_stock: number;
}
interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  gst_number: string;
  address: string;
}

interface OrderItem {
  product_id: number;
  name: string;
  sku: string;
  quantity: number;
  unit_cost: number;
}

function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [registeredSuppliers, setRegisteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Create order states
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [supplier, setSupplier] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Goods Receiving states
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [receivingOrder, setReceivingOrder] =
    useState<PurchaseOrder | null>(null);
  // Purchase Order Details states
const [showDetails, setShowDetails] = useState(false);
const [selectedOrder, setSelectedOrder] =
  useState<PurchaseOrder | null>(null);
const [detailsLoading, setDetailsLoading] = useState(false);
const [detailsError, setDetailsError] = useState("");

  const [receivedQuantities, setReceivedQuantities] = useState<
    Record<number, number>
  >({});

  const [receiving, setReceiving] = useState(false);
  const [receiveError, setReceiveError] = useState("");

  // Load purchase orders
  const loadOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getPurchaseOrders();
      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load purchase orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load inventory products
useEffect(() => {
  loadOrders();

  apiRequest<Product[]>("/api/inventory/")
    .then(setProducts)
    .catch(() => setFormError("Unable to load inventory products."));

  apiRequest<Supplier[]>("/api/suppliers/")
    .then(setRegisteredSuppliers)
    .catch(() => setFormError("Unable to load registered suppliers."));
}, []);

  // Supplier list
const suppliers = registeredSuppliers.map(
  (supplier) => supplier.name
);

  // Products belonging to selected supplier
  const supplierProducts = products.filter(
    (product) => product.supplier === supplier
  );

  const selectedProductData = products.find(
    (product) => product.id === Number(selectedProduct)
  );

  // Calculate purchase total
  const totalAmount = orderItems.reduce(
    (total, item) => total + item.quantity * item.unit_cost,
    0
  );

  // Reset create order form
  const resetForm = () => {
    setSupplier("");
    setExpectedDelivery("");
    setSelectedProduct("");
    setQuantity(1);
    setUnitCost(0);
    setOrderItems([]);
    setFormError("");
  };

  // Add product to purchase order
  const handleAddItem = () => {
    setFormError("");

    if (!selectedProductData) {
      setFormError("Please select a product.");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitCost) ||
      unitCost < 0
    ) {
      setFormError("Enter a valid quantity and unit cost.");
      return;
    }

    if (
      orderItems.some(
        (item) => item.product_id === selectedProductData.id
      )
    ) {
      setFormError("This product has already been added.");
      return;
    }

    setOrderItems((previous) => [
      ...previous,
      {
        product_id: selectedProductData.id,
        name: selectedProductData.name,
        sku: selectedProductData.sku,
        quantity,
        unit_cost: unitCost,
      },
    ]);

    setSelectedProduct("");
    setQuantity(1);
    setUnitCost(0);
  };

  // Create purchase order
  const handleCreateOrder = async () => {
    setFormError("");

    if (!supplier) {
      setFormError("Please select a supplier.");
      return;
    }

    if (orderItems.length === 0) {
      setFormError("Please add at least one product.");
      return;
    }

    setSaving(true);

    try {
      await createPurchaseOrder({
        supplier,
        expected_delivery: expectedDelivery
          ? `${expectedDelivery}T00:00:00`
          : null,
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      });

      resetForm();
      setShowForm(false);
      await loadOrders();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to create purchase order"
      );
    } finally {
      setSaving(false);
    }
  };

  // Open goods receiving modal
  const openReceiveForm = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    setReceivedQuantities({});
    setReceiveError("");
    setShowReceiveForm(true);
  };
  const handleViewDetails = async (orderId: number) => {
  setDetailsLoading(true);
  setDetailsError("");
  setSelectedOrder(null);
  setShowDetails(true);

  try {
    const data = await getPurchaseOrder(orderId);
    setSelectedOrder(data);
  } catch (err) {
    setDetailsError(
      err instanceof Error
        ? err.message
        : "Unable to load purchase order details"
    );
  } finally {
    setDetailsLoading(false);
  }
};

  // Receive goods
  const handleReceiveGoods = async () => {
    if (!receivingOrder) return;

    setReceiveError("");

    const receivedItems = receivingOrder.items
      .filter((item) => (receivedQuantities[item.id] || 0) > 0)
      .map((item) => ({
        item_id: item.id,
        received_quantity: receivedQuantities[item.id],
      }));

    if (receivedItems.length === 0) {
      setReceiveError("Enter at least one received quantity.");
      return;
    }

    const invalidQuantity = receivingOrder.items.some((item) => {
      const entered = receivedQuantities[item.id] || 0;
      const remaining = item.quantity - item.received_quantity;

      return (
        !Number.isInteger(entered) ||
        entered < 0 ||
        entered > remaining
      );
    });

    if (invalidQuantity) {
      setReceiveError("Received quantity cannot exceed the remaining quantity.");
      return;
    }

    setReceiving(true);

    try {
      await receivePurchaseOrder(receivingOrder.id, {
        items: receivedItems,
      });

      setShowReceiveForm(false);
      setReceivingOrder(null);
      setReceivedQuantities({});

      await loadOrders();
    } catch (err) {
      setReceiveError(
        err instanceof Error
          ? err.message
          : "Unable to receive goods"
      );
    } finally {
      setReceiving(false);
    }
  };

  // Dashboard calculations
  const pendingOrders = orders.filter(
    (order) =>
      order.status === "Pending" || order.status === "Ordered"
  ).length;

  const receivedOrders = orders.filter(
    (order) => order.status === "Received"
  ).length;

  const totalValue = orders.reduce(
    (total, order) => total + order.total_amount,
    0
  );

  // Search and status filter
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.po_number.toLowerCase().includes(search.toLowerCase()) ||
      order.supplier.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status badge styles
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Received":
        return "bg-green-100 text-green-700";
      case "Partially Received":
        return "bg-blue-100 text-blue-700";
      case "Ordered":
        return "bg-purple-100 text-purple-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="space-y-7">

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Purchase Order Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage suppliers, purchase orders and incoming inventory.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 border border-slate-200 bg-white rounded-lg font-medium disabled:opacity-60"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus size={18} />
            Create Purchase Order
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            title: "Total Orders",
            value: orders.length,
            icon: ShoppingCart,
            color: "text-blue-600",
          },
          {
            title: "Pending Orders",
            value: pendingOrders,
            icon: Clock,
            color: "text-amber-600",
          },
          {
            title: "Received Orders",
            value: receivedOrders,
            icon: CheckCircle,
            color: "text-green-600",
          },
          {
            title: "Total Purchase Value",
            value: `₹${totalValue.toLocaleString("en-IN")}`,
            icon: Package,
            color: "text-purple-600",
          },
        ].map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{card.title}</p>
                <Icon size={22} className={card.color} />
              </div>

              <h2 className="text-2xl font-bold text-slate-800 mt-5">
                {card.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search PO number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-lg bg-white outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Ordered">Ordered</option>
          <option value="Partially Received">Partially Received</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">Purchase Orders</h2>
          <p className="text-sm text-slate-500 mt-1">
            {filteredOrders.length} orders found
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading purchase orders...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            {error}
            <button
              onClick={loadOrders}
              className="block mx-auto mt-3 text-blue-600 underline"
            >
              Try again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart
              size={35}
              className="mx-auto text-slate-300 mb-3"
            />
            <p className="font-medium text-slate-700">
              No purchase orders found
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Create a purchase order to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Order Date</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(order.id)}
                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {order.po_number}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {order.supplier}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {order.order_date
                        ? new Date(order.order_date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {order.items.length}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      ₹{order.total_amount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {order.status !== "Received" &&
                        order.status !== "Cancelled" && (
                          <button
                            onClick={() => openReceiveForm(order)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium whitespace-nowrap"
                          >
                            <Truck size={15} />
                            Receive Goods
                          </button>
                        )}

                      {(order.status === "Received" ||
                        order.status === "Cancelled") && (
                        <span className="text-slate-400 text-xs">
                          No action
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Purchase Order Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Create Purchase Order
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Select a supplier and add products to the order.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="text-slate-500 hover:text-red-500"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Supplier and Delivery Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Supplier
                  </label>

                  <select
                    value={supplier}
                    onChange={(e) => {
                      setSupplier(e.target.value);
                      setSelectedProduct("");
                      setOrderItems([]);
                    }}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                  >
                    <option value="">Select Supplier</option>

                    {suppliers.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Expected Delivery
                  </label>

                  <input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-slate-800">
                  Add Products
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Product
                  </label>

                  <select
                    value={selectedProduct}
                    disabled={!supplier}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);

                      const product = products.find(
                        (item) => item.id === Number(e.target.value)
                      );

                      setUnitCost(product?.unit_cost ?? 0);
                    }}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm disabled:bg-slate-100"
                  >
                    <option value="">
                      {supplier ? "Select Product" : "Select supplier first"}
                    </option>

                    {supplierProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Number(e.target.value))
                      }
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unit Cost (₹)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitCost}
                      onChange={(e) =>
                        setUnitCost(Number(e.target.value))
                      }
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!supplier || !selectedProduct}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              </div>

              {/* Added Items */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">
                  Order Items ({orderItems.length})
                </h3>

                {orderItems.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg">
                    No products added yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="p-3 text-left">Product</th>
                          <th className="p-3">Quantity</th>
                          <th className="p-3">Unit Cost</th>
                          <th className="p-3">Subtotal</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>

                      <tbody>
                        {orderItems.map((item) => (
                          <tr key={item.product_id} className="border-t">
                            <td className="p-3">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-slate-400">
                                {item.sku}
                              </p>
                            </td>

                            <td className="p-3 text-center">
                              {item.quantity}
                            </td>

                            <td className="p-3 text-center">
                              ₹{item.unit_cost.toLocaleString("en-IN")}
                            </td>

                            <td className="p-3 text-center font-medium">
                              ₹{(item.quantity * item.unit_cost).toLocaleString("en-IN")}
                            </td>

                            <td className="p-3 text-center">
                              <button
                                onClick={() =>
                                  setOrderItems((previous) =>
                                    previous.filter(
                                      (product) =>
                                        product.product_id !== item.product_id
                                    )
                                  )
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={17} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
                <span className="font-semibold text-slate-700">
                  Total Purchase Amount
                </span>

                <span className="text-xl font-bold text-blue-700">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg border text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateOrder}
                  disabled={saving || orderItems.length === 0}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Purchase Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goods Receiving Modal */}
      {showReceiveForm && receivingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Receive Goods
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {receivingOrder.po_number} — {receivingOrder.supplier}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowReceiveForm(false);
                  setReceivingOrder(null);
                  setReceivedQuantities({});
                  setReceiveError("");
                }}
                disabled={receiving}
                className="text-slate-500 hover:text-red-500"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Enter the quantity received for each product. Only the
                  entered quantities will be added to your inventory.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-4 text-left">Product ID</th>
                      <th className="p-4 text-center">Ordered</th>
                      <th className="p-4 text-center">Received</th>
                      <th className="p-4 text-center">Remaining</th>
                      <th className="p-4 text-center">Receive Now</th>
                    </tr>
                  </thead>

                  <tbody>
                    {receivingOrder.items.map((item) => {
                      const remaining =
                        item.quantity - item.received_quantity;

                      return (
                        <tr key={item.id} className="border-t">
                          <td className="p-4 font-medium">
                            Product #{item.product_id}
                          </td>

                          <td className="p-4 text-center">
                            {item.quantity}
                          </td>

                          <td className="p-4 text-center">
                            {item.received_quantity}
                          </td>

                          <td className="p-4 text-center font-semibold">
                            {remaining}
                          </td>

                          <td className="p-4">
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              step="1"
                              disabled={remaining === 0}
                              value={receivedQuantities[item.id] ?? 0}
                              onChange={(e) =>
                                setReceivedQuantities((previous) => ({
                                  ...previous,
                                  [item.id]: Number(e.target.value),
                                }))
                              }
                              className="w-24 mx-auto block border border-slate-200 rounded-lg px-3 py-2 text-center disabled:bg-slate-100"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {receiveError && (
                <p className="text-sm text-red-600">
                  {receiveError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  onClick={() => {
                    setShowReceiveForm(false);
                    setReceivingOrder(null);
                    setReceivedQuantities({});
                    setReceiveError("");
                  }}
                  disabled={receiving}
                  className="px-5 py-2 rounded-lg border text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={handleReceiveGoods}
                  disabled={receiving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                >
                  <Truck size={16} />
                  {receiving ? "Processing..." : "Confirm Goods Received"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Purchase Order Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Purchase Order Details
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Complete purchase order information
                </p>
              </div>

              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedOrder(null);
                  setDetailsError("");
                }}
                className="text-slate-500 hover:text-red-500"
                aria-label="Close purchase order details"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <div className="py-12 text-center text-slate-500">
                  Loading purchase order details...
                </div>
              ) : detailsError ? (
                <div className="py-12 text-center text-red-600">
                  {detailsError}
                  <button
                    onClick={() => {
                      if (selectedOrder) {
                        handleViewDetails(selectedOrder.id);
                      }
                    }}
                    className="block mx-auto mt-3 text-blue-600 underline"
                  >
                    Try again
                  </button>
                </div>
              ) : selectedOrder ? (
                <div className="space-y-6">
                  {/* Order Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs text-slate-500">PO Number</p>
                      <p className="font-bold text-blue-600 mt-1">
                        {selectedOrder.po_number}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs text-slate-500">Supplier</p>
                      <p className="font-semibold text-slate-800 mt-1">
                        {selectedOrder.supplier}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs text-slate-500">Order Date</p>
                      <p className="font-semibold text-slate-800 mt-1">
                        {selectedOrder.order_date
                          ? new Date(selectedOrder.order_date).toLocaleDateString("en-IN")
                          : "—"}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs text-slate-500">Expected Delivery</p>
                      <p className="font-semibold text-slate-800 mt-1">
                        {selectedOrder.expected_delivery
                          ? new Date(selectedOrder.expected_delivery).toLocaleDateString("en-IN")
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  {/* Order Status */}
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Order Status</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(selectedOrder.status)}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3">
                      Ordered Products
                    </h3>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3 text-center">Ordered</th>
                            <th className="p-3 text-center">Received</th>
                            <th className="p-3 text-center">Remaining</th>
                            <th className="p-3 text-center">Unit Cost</th>
                            <th className="p-3 text-right">Subtotal</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedOrder.items.map((item) => {
                            const product = products.find(
                              (p) => p.id === item.product_id
                            );
                            const remaining = Math.max(
                              0,
                              item.quantity - item.received_quantity
                            );

                            return (
                              <tr key={item.id} className="border-t border-slate-100">
                                <td className="p-3">
                                  <p className="font-medium text-slate-800">
                                    {product?.name || `Product #${item.product_id}`}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {product?.sku || "SKU unavailable"}
                                  </p>
                                </td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-center text-green-700 font-medium">
                                  {item.received_quantity}
                                </td>
                                <td className="p-3 text-center">{remaining}</td>
                                <td className="p-3 text-center">
                                  ₹{item.unit_cost.toLocaleString("en-IN")}
                                </td>
                                <td className="p-3 text-right font-medium">
                                  ₹{(item.quantity * item.unit_cost).toLocaleString("en-IN")}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-blue-50 p-5 rounded-lg flex flex-wrap justify-between items-center gap-3">
                    <span className="font-semibold text-slate-700">
                      Total Purchase Amount
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      ₹{selectedOrder.total_amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  No purchase order details available.
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedOrder(null);
                    setDetailsError("");
                  }}
                  className="px-5 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default PurchaseOrders;
