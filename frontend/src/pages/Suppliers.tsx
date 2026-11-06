
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Building2,
  Pencil,
  Trash2,
  X,
  FileText,
} from "lucide-react";

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type Supplier,
} from "../services/suppliers";

interface SupplierForm {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  gst_number: string;
  address: string;
}

const emptyForm: SupplierForm = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  gst_number: "",
  address: "",
};

function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState<Supplier | null>(null);

  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load suppliers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openAddForm = () => {
    setEditingSupplier(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);

    setForm({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      gst_number: supplier.gst_number || "",
      address: supplier.address || "",
    });

    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }

    if (
      form.gst_number.trim() &&
      !/^[0-9A-Z]{15}$/.test(form.gst_number.trim().toUpperCase())
    ) {
      setFormError("Enter a valid 15-character GST number.");
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setFormError("Enter a valid email address.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      gst_number: form.gst_number.trim().toUpperCase() || null,
      address: form.address.trim() || null,
    };

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);
      } else {
        await createSupplier(payload);
      }

      setShowForm(false);
      setEditingSupplier(null);
      setForm(emptyForm);

      await loadSuppliers();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to save supplier"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${supplier.name}?`
    );

    if (!confirmed) return;

    setDeletingId(supplier.id);
    setError("");

    try {
      await deleteSupplier(supplier.id);
      await loadSuppliers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete supplier"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = search.toLowerCase();

    return (
      supplier.name.toLowerCase().includes(query) ||
      (supplier.contact_person || "").toLowerCase().includes(query) ||
      (supplier.gst_number || "").toLowerCase().includes(query) ||
      (supplier.email || "").toLowerCase().includes(query)
    );
  });

  const updateField = (field: keyof SupplierForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-7">

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Supplier Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage supplier information, contact details and GST records.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadSuppliers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 border border-slate-200 bg-white rounded-lg font-medium disabled:opacity-60"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus size={18} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Total Suppliers</p>
            <Building2 size={22} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-5">
            {suppliers.length}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Suppliers with GST</p>
            <FileText size={22} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-5">
            {suppliers.filter((supplier) => supplier.gst_number).length}
          </h2>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search supplier, contact, email or GST number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Supplier Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">
            Registered Suppliers
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {filteredSuppliers.length} suppliers found
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading suppliers...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2
              size={35}
              className="mx-auto text-slate-300 mb-3"
            />
            <p className="font-medium text-slate-700">
              No suppliers found
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Add a supplier to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">GST Number</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">
                        {supplier.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {supplier.email || "No email"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-slate-700">
                        {supplier.contact_person || "—"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {supplier.phone || "No phone"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">
                        {supplier.gst_number || "Not provided"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500 max-w-xs">
                      {supplier.address || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(supplier)}
                          title="Edit supplier"
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(supplier)}
                          disabled={deletingId === supplier.id}
                          title="Delete supplier"
                          className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter supplier company and contact information.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="text-slate-500 hover:text-red-500"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Supplier / Company Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter company name"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    value={form.contact_person}
                    onChange={(e) => updateField("contact_person", e.target.value)}
                    placeholder="Contact person name"
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="Mobile number"
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="supplier@example.com"
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    GST Number
                  </label>
                  <input
                    maxLength={15}
                    value={form.gst_number}
                    onChange={(e) => updateField("gst_number", e.target.value.toUpperCase())}
                    placeholder="15-character GSTIN"
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Enter supplier address"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg border text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingSupplier
                    ? "Update Supplier"
                    : "Save Supplier"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
