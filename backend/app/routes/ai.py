
from datetime import datetime, timedelta
from math import ceil

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.sale import Sale
from app.services.ai_service import ask_nemotron

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])

SALES_WINDOW_DAYS = 30
OPEN_PURCHASE_ORDER_STATUSES = ("Pending", "Ordered", "Partially Received")


class ChatMessage(BaseModel):
    role: str
    content: str = Field(min_length=1, max_length=4_000)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in {"user", "assistant"}:
            raise ValueError("History roles must be 'user' or 'assistant'.")
        return value


class AIRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1_000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=10)


def _currency(value: float) -> str:
    return f"₹{value:,.2f}"


def build_inventory_intelligence(db: Session) -> dict:
    """Return explainable, database-derived inventory intelligence."""
    products = db.query(Product).order_by(Product.name).all()
    cutoff = datetime.utcnow() - timedelta(days=SALES_WINDOW_DAYS)

    sales_rows = (
        db.query(
            Sale.product_id,
            func.coalesce(func.sum(Sale.quantity), 0).label("units"),
            func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
        )
        .filter(Sale.status == "Completed", Sale.created_at >= cutoff)
        .group_by(Sale.product_id)
        .all()
    )
    sales_by_product = {
        row.product_id: {"units": int(row.units), "revenue": float(row.revenue)}
        for row in sales_rows
    }

    pending_rows = (
        db.query(
            PurchaseOrderItem.product_id,
            func.coalesce(
                func.sum(PurchaseOrderItem.quantity - PurchaseOrderItem.received_quantity),
                0,
            ).label("units"),
        )
        .join(PurchaseOrder, PurchaseOrder.id == PurchaseOrderItem.purchase_order_id)
        .filter(PurchaseOrder.status.in_(OPEN_PURCHASE_ORDER_STATUSES))
        .group_by(PurchaseOrderItem.product_id)
        .all()
    )
    pending_by_product = {
        row.product_id: max(0, int(row.units)) for row in pending_rows
    }

    total_revenue, total_units_sold = db.query(
        func.coalesce(func.sum(Sale.total_amount), 0),
        func.coalesce(func.sum(Sale.quantity), 0),
    ).filter(Sale.status == "Completed").one()

    product_metrics = []
    recommendations = []
    for product in products:
        recent_sales = sales_by_product.get(product.id, {"units": 0, "revenue": 0.0})
        units_30d = recent_sales["units"]
        daily_demand = units_30d / SALES_WINDOW_DAYS
        pending_units = pending_by_product.get(product.id, 0)
        lead_time_days = max(product.lead_time_days or 0, 0)
        target_days = max(product.target_days or 0, 0)
        days_of_cover = round(product.current_stock / daily_demand, 1) if daily_demand else None
        lead_time_demand = ceil(daily_demand * lead_time_days)
        target_stock = max(product.reorder_point or 0, ceil(daily_demand * target_days))
        recommended_order = max(0, target_stock - product.current_stock - pending_units)

        if product.current_stock == 0:
            risk = "out_of_stock"
        elif daily_demand and product.current_stock < lead_time_demand:
            risk = "stockout_risk"
        elif product.current_stock <= (product.reorder_point or 0):
            risk = "low_stock"
        else:
            risk = "healthy"

        metric = {
            "product_id": product.id,
            "name": product.name,
            "sku": product.sku,
            "category": product.category or "Uncategorised",
            "supplier": product.supplier or "Not assigned",
            "unit_cost": float(product.unit_cost or 0),
            "selling_price": float(product.selling_price or 0),
            "current_stock": product.current_stock,
            "reorder_point": product.reorder_point or 0,
            "lead_time_days": lead_time_days,
            "target_days": target_days,
            "units_sold_30d": units_30d,
            "revenue_30d": recent_sales["revenue"],
            "average_daily_demand": round(daily_demand, 2),
            "days_of_cover": days_of_cover,
            "pending_purchase_units": pending_units,
            "recommended_order_quantity": recommended_order,
            "risk": risk,
        }
        product_metrics.append(metric)
        if risk != "healthy" or recommended_order:
            recommendations.append(metric)

    risk_order = {"out_of_stock": 0, "stockout_risk": 1, "low_stock": 2, "healthy": 3}
    recommendations.sort(key=lambda item: (risk_order[item["risk"]], -item["units_sold_30d"]))
    product_metrics.sort(key=lambda item: (-item["units_sold_30d"], item["name"].casefold()))

    return {
        "generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "sales_window_days": SALES_WINDOW_DAYS,
        "summary": {
            "total_products": len(products),
            "total_revenue": float(total_revenue),
            "total_units_sold": int(total_units_sold),
            "low_stock_products": sum(
                item["risk"] in {"out_of_stock", "stockout_risk", "low_stock"}
                for item in product_metrics
            ),
        },
        "products": product_metrics,
        "reorder_recommendations": recommendations,
    }


def intelligence_context(intelligence: dict) -> str:
    summary = intelligence["summary"]
    lines = [
        "STOCK AI VERIFIED BUSINESS DATA",
        f"Sales window for demand: last {intelligence['sales_window_days']} days.",
        f"Total products: {summary['total_products']}",
        f"Completed-sales revenue (all time): {_currency(summary['total_revenue'])}",
        f"Completed-sales units (all time): {summary['total_units_sold']}",
        f"Products requiring attention: {summary['low_stock_products']}",
        "",
        "PRODUCT INVENTORY, DEMAND, AND SUPPLY:",
    ]
    for item in intelligence["products"]:
        cover = f"{item['days_of_cover']} days" if item["days_of_cover"] is not None else "unknown (no completed sales in window)"
        lines.append(
            f"- {item['name']} (SKU {item['sku']}; {item['category']}): "
            f"stock {item['current_stock']}; reorder point {item['reorder_point']}; "
            f"last-30-day sales {item['units_sold_30d']} units / {_currency(item['revenue_30d'])}; "
            f"average daily demand {item['average_daily_demand']}; cover {cover}; "
            f"supplier {item['supplier']}; unit cost {_currency(item['unit_cost'])}; "
            f"lead time {item['lead_time_days']} days; target cover {item['target_days']} days; "
            f"open PO units {item['pending_purchase_units']}; risk {item['risk']}; "
            f"calculated recommended order {item['recommended_order_quantity']} units."
        )
    lines.append("")
    lines.append(
        "Rules: Recommendations are calculations from recorded sales and settings, not forecasts. "
        "If a product has no sales in the 30-day window, say that demand evidence is insufficient."
    )
    return "\n".join(lines)


@router.get("/overview")
def get_ai_overview(db: Session = Depends(get_db)):
    """Expose explainable demand and reorder calculations for the dashboard."""
    return build_inventory_intelligence(db)


@router.post("/insights")
def generate_insights(request: AIRequest, db: Session = Depends(get_db)):
    intelligence = build_inventory_intelligence(db)
    if not intelligence["products"]:
        raise HTTPException(status_code=400, detail="No inventory data available for AI analysis.")

    try:
        answer = ask_nemotron(
            question=request.question,
            context=intelligence_context(intelligence),
            history=[message.model_dump() for message in request.history],
        )
        return {
            "status": "success",
            "model": "Nemotron",
            "question": request.question,
            "insights": answer,
        }
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error))
