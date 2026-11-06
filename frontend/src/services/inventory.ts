
import { apiRequest } from "./api";

export interface ReorderSuggestion {
  product_id: number;
  sku: string;
  product_name: string;
  current_stock: number;
  total_sold_last_30_days: number;
  average_daily_demand: number;
  lead_time_days: number;
  lead_time_demand: number;
  safety_stock: number;
  calculated_reorder_point: number;
  target_stock: number;
  suggested_order_quantity: number;
  needs_reorder: boolean;
  priority: "Critical" | "High" | "Medium" | "Normal";
}

export interface ReorderSuggestionsResponse {
  analysis_period_days: number;
  total_products_analyzed: number;
  reorder_suggestions: ReorderSuggestion[];
}

export interface ProductUpdatePayload {
  sku?: string;
  name?: string;
  category?: string | null;
  supplier?: string | null;
  unit_cost?: number;
  selling_price?: number;
  current_stock?: number;
  reorder_point?: number;
  target_days?: number;
  lead_time_days?: number;
}

export function getReorderSuggestions() {
  return apiRequest<ReorderSuggestionsResponse>(
    "/api/inventory/reorder-suggestions"
  );
}

export function updateProduct<T>(
  productId: number,
  product: ProductUpdatePayload
) {
  return apiRequest<T>(`/api/inventory/${productId}`, {
    method: "PATCH",
    body: product,
  });
}

export function deleteProduct(productId: number) {
  return apiRequest<{ message: string }>(`/api/inventory/${productId}`, {
    method: "DELETE",
  });
}
