
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Package,
  AlertTriangle,
  XCircle,
  Boxes,
  Plus,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { apiRequest } from "../services/api";
import {
  deleteProduct,
  updateProduct,
  type ProductUpdatePayload,
} from "../services/inventory";

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  supplier: string | null;
  unit_cost: number;
  selling_price: number;
  current_stock: number;
  reorder_point: number;
  target_days: number;
  lead_time_days: number;
}

const initialFormData = {
  sku: "",
  name: "",
  category: "",
  supplier: "",
  unit_cost: 0,
  selling_price: 0,
  current_stock: 0,
  reorder_point: 15,
  target_days: 14,
  lead_time_days: 5,
};

function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Add Product modal states
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState(initialFormData);

  const loadProducts = useCallback(() => {
    setLoading(true);
    apiRequest<Product[]>("/api/inventory/")
      .then((data) => {
        setProducts(data);
        setError("");
      })
      .catch(() => setError("Unable to load inventory"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch products from FastAPI
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Add product to database
  const handleSaveProduct = async () => {
    setSaving(true);
    setFormError("");

    try {
      if (editingProduct) {
        await updateProduct<Product>(
          editingProduct.id,
          formData as ProductUpdatePayload
        );
        setSuccessMessage("Product updated successfully.");
      } else {
        await apiRequest<Product>("/api/inventory/", {
          method: "POST",
          body: formData,
        });
        setSuccessMessage("Product added successfully.");
      }

      await loadProducts();
      setFormData({ ...initialFormData });
      setEditingProduct(null);
      setShowForm(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to add product"
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditForm = (product: Product) => {
    setFormError("");
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category ?? "",
      supplier: product.supplier ?? "",
      unit_cost: product.unit_cost,
      selling_price: product.selling_price,
      current_stock: product.current_stock,
      reorder_point: product.reorder_point,
      target_days: product.target_days,
      lead_time_days: product.lead_time_days,
    });
    setShowForm(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    setFormError("");
    try {
      const result = await deleteProduct(deleteTarget.id);
      await loadProducts();
      setSuccessMessage(result.message);
      setDeleteTarget(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to delete product"
      );
    } finally {
      setSaving(false);
    }
  };

  // Category filter
  const categories = [
    "All",
    ...new Set(
      products
        .map((p) => p.category)
        .filter((item): item is string => Boolean(item))
    ),
  ];

  // Search and category filtering
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  // Inventory calculations
  const lowStock = products.filter(
    (p) => p.current_stock > 0 &&
      p.current_stock <= p.reorder_point
  ).length;

  const outOfStock = products.filter(
    (p) => p.current_stock === 0
  ).length;

  const totalStock = products.reduce(
    (sum, p) => sum + p.current_stock,
    0
  );

  return (
    <div className="space-y-6">

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Inventory Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor and manage your product stock.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError("");
            setEditingProduct(null);
            setFormData({ ...initialFormData });
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-medium"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Loading and Error */}
      {loading && (
        <p className="text-blue-600 text-sm">
          Loading inventory...
        </p>
      )}

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="font-medium hover:text-green-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <SummaryCard
          title="Total Products"
          value={products.length}
          icon={<Package />}
        />

        <SummaryCard
          title="Total Stock Units"
          value={totalStock}
          icon={<Boxes />}
        />

        <SummaryCard
          title="Low Stock Items"
          value={lowStock}
          icon={<AlertTriangle />}
        />

        <SummaryCard
          title="Out of Stock"
          value={outOfStock}
          icon={<XCircle />}
        />
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-3 bg-slate-100 px-4 py-3 rounded-lg flex-1">
          <Search size={18} className="text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 rounded-lg border border-slate-200 text-sm outline-none"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">
            Product Inventory
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Showing {filteredProducts.length} products
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading && !error && filteredProducts.map((product) => {
                const status =
                  product.current_stock === 0
                    ? "Out of Stock"
                    : product.current_stock <= product.reorder_point
                    ? "Low Stock"
                    : "In Stock";

                return (
                  <tr
                    key={product.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {product.name}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {product.category || "Uncategorized"}
                    </td>

                    <td className="px-6 py-4">
                      {product.current_stock} units
                    </td>

                    <td className="px-6 py-4">
                      ₹{product.selling_price}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          status === "In Stock"
                            ? "bg-green-100 text-green-700"
                            : status === "Low Stock"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          aria-label={`Edit ${product.name}`}
                          title="Edit product"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormError("");
                            setDeleteTarget(product);
                          }}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          aria-label={`Delete ${product.name}`}
                          title="Delete product"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && !error && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {editingProduct
                    ? "Update the selected product details."
                    : "Enter your product details."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-500 hover:text-red-500"
              >
                <X size={22} />
              </button>
            </div>

            {/* Product Form */}
            <form
              className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProduct();
              }}
            >
              {[
                { label: "SKU", name: "sku", type: "text" },
                { label: "Product Name", name: "name", type: "text" },
                { label: "Category", name: "category", type: "text" },
                { label: "Supplier", name: "supplier", type: "text" },
                { label: "Unit Cost (₹)", name: "unit_cost", type: "number" },
                { label: "Selling Price (₹)", name: "selling_price", type: "number" },
                { label: "Current Stock", name: "current_stock", type: "number" },
                { label: "Reorder Point", name: "reorder_point", type: "number" },
                { label: "Target Days", name: "target_days", type: "number" },
                { label: "Lead Time Days", name: "lead_time_days", type: "number" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {field.label}
                  </label>

                  <input
                    required
                    type={field.type}
                    min={field.type === "number" ? 0 : undefined}
                    step={
                      field.name === "unit_cost" ||
                      field.name === "selling_price"
                        ? "0.01"
                        : "1"
                    }
                    value={formData[field.name as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData((previous) => ({
                        ...previous,
                        [field.name]:
                          field.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              ))}

              {formError && (
                <p className="md:col-span-2 text-sm text-red-600">
                  {formError}
                </p>
              )}

              {/* Modal Buttons */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg border text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800">Delete Product</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Delete <span className="font-semibold text-slate-800">{deleteTarget.name}</span>?
              This cannot be undone. Products connected to sales or purchase-order history will be protected.
            </p>

            {formError && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setDeleteTarget(null);
                }}
                disabled={saving}
                className="rounded-lg border px-5 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={saving}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className="text-blue-600">{icon}</div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mt-3">
        {value.toLocaleString("en-IN")}
      </h2>
    </div>
  );
}

export default Inventory;
