
import { apiRequest } from "./api";

export interface PurchaseOrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_cost: number;
  received_quantity: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: string;
  order_date: string | null;
  expected_delivery: string | null;
  total_amount: number;
  status: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderCreate {
  supplier: string;
  expected_delivery: string | null;
  items: {
    product_id: number;
    quantity: number;
    unit_cost: number;
  }[];
}

export interface GoodsReceiveRequest {
  items: {
    item_id: number;
    received_quantity: number;
  }[];
}

// Get all purchase orders
export function getPurchaseOrders() {
  return apiRequest<PurchaseOrder[]>("/api/purchase-orders/");
}

// Get purchase order by ID
export function getPurchaseOrder(id: number) {
  return apiRequest<PurchaseOrder>(`/api/purchase-orders/${id}`);
}

// Create purchase order
export function createPurchaseOrder(data: PurchaseOrderCreate) {
  return apiRequest<PurchaseOrder>("/api/purchase-orders/", {
    method: "POST",
    body: data,
  });
}

// Update purchase order status
export function updatePurchaseOrderStatus(
  id: number,
  newStatus: string
) {
  return apiRequest(
    `/api/purchase-orders/${id}/status?new_status=${encodeURIComponent(newStatus)}`,
    { method: "PATCH" }
  );
}

// Receive goods
export function receivePurchaseOrder(
  id: number,
  data: GoodsReceiveRequest
) {
  return apiRequest(
    `/api/purchase-orders/${id}/receive`,
    {
      method: "POST",
      body: data,
    }
  );
}
