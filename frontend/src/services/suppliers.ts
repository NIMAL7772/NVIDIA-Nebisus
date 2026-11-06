import { apiRequest } from "./api";

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  address: string | null;
  created_at: string | null;
}

export interface SupplierCreate {
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  address: string | null;
}

export type SupplierUpdate = Partial<SupplierCreate>;

// Get all suppliers
export function getSuppliers() {
  return apiRequest<Supplier[]>("/api/suppliers/");
}

// Get supplier by ID
export function getSupplier(id: number) {
  return apiRequest<Supplier>(`/api/suppliers/${id}`);
}

// Create supplier
export function createSupplier(data: SupplierCreate) {
  return apiRequest<Supplier>("/api/suppliers/", {
    method: "POST",
    body: data,
  });
}

// Update supplier
export function updateSupplier(id: number, data: SupplierUpdate) {
  return apiRequest<Supplier>(`/api/suppliers/${id}`, {
    method: "PATCH",
    body: data,
  });
}

// Delete supplier
export function deleteSupplier(id: number) {
  return apiRequest<{ message: string }>(`/api/suppliers/${id}`, {
    method: "DELETE",
  });
}