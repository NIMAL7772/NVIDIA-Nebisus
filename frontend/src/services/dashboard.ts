import { apiRequest } from "./api";

export interface DashboardSummary {
  total_products: number;
  total_stock_units: number;
  low_stock_items: number;
  out_of_stock_items: number;
}

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>("/api/dashboard/summary");
}