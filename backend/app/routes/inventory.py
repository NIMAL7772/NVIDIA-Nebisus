
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from datetime import datetime, timedelta
import math

from app.core.database import get_db
from app.models.product import Product
from app.models.purchase_order import PurchaseOrderItem
from app.models.sale import Sale
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)

router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory"]
)


# GET - Retrieve all products
@router.get("/", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()


# GET - Demand-based reorder suggestions
@router.get("/reorder-suggestions")
def get_reorder_suggestions(db: Session = Depends(get_db)):

    products = db.query(Product).order_by(Product.name).all()

    suggestions = []

    start_date = datetime.now() - timedelta(days=30)

    for product in products:

        # Calculate completed units sold in the last 30 days
        total_sold = db.query(
            func.coalesce(func.sum(Sale.quantity), 0)
        ).filter(
            Sale.product_id == product.id,
            Sale.status == "Completed",
            Sale.created_at >= start_date
        ).scalar()

        total_sold = int(total_sold or 0)

        # Average daily demand
        average_daily_demand = total_sold / 30

        # Supplier lead-time demand
        lead_time_demand = (
            average_daily_demand * product.lead_time_days
        )

        # Safety stock: 3 days of average demand
        safety_stock = average_daily_demand * 3

        # Calculated reorder point
        calculated_reorder_point = (
            lead_time_demand + safety_stock
        )

        # Target stock based on target days
        target_stock = (
            average_daily_demand * product.target_days
        ) + safety_stock

        # Suggested order quantity
        reorder_quantity = max(
            0,
            math.ceil(target_stock - product.current_stock)
        )

        # Determine whether reorder is required
        needs_reorder = (
            average_daily_demand > 0
            and product.current_stock <= calculated_reorder_point
        )

        # Determine priority level
        if product.current_stock == 0:
            priority = "Critical"

        elif needs_reorder:
            priority = "High"

        elif (
            calculated_reorder_point > 0
            and product.current_stock <= calculated_reorder_point * 1.2
        ):
            priority = "Medium"

        else:
            priority = "Normal"

        suggestions.append({
            "product_id": product.id,
            "sku": product.sku,
            "product_name": product.name,
            "current_stock": product.current_stock,
            "total_sold_last_30_days": total_sold,

            "average_daily_demand": round(
                average_daily_demand, 2
            ),

            "lead_time_days": product.lead_time_days,

            "lead_time_demand": round(
                lead_time_demand, 2
            ),

            "safety_stock": round(
                safety_stock, 2
            ),

            "calculated_reorder_point": round(
                calculated_reorder_point, 2
            ),

            "target_stock": round(
                target_stock, 2
            ),

            "suggested_order_quantity": reorder_quantity,

            "needs_reorder": needs_reorder,

            "priority": priority
        })

    return {
        "analysis_period_days": 30,
        "total_products_analyzed": len(products),
        "reorder_suggestions": suggestions
    }


# GET - Retrieve a product by ID
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# POST - Add a new product
@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):

    product = Product(**product_data.model_dump())

    try:
        db.add(product)
        db.commit()
        db.refresh(product)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A product with this SKU already exists"
        )

    return product


# PATCH - Update an existing product
@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    update_data = product_data.model_dump(exclude_unset=True)

    if "sku" in update_data:
        duplicate_sku = db.query(Product.id).filter(
            Product.sku == update_data["sku"],
            Product.id != product_id
        ).first()
        if duplicate_sku:
            raise HTTPException(
                status_code=409,
                detail="A product with this SKU already exists"
            )

    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A product with this SKU already exists"
        )

    return product


# DELETE - Remove a product
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    has_sales = db.query(Sale.id).filter(
        Sale.product_id == product_id
    ).first()
    if has_sales:
        raise HTTPException(
            status_code=409,
            detail="Product cannot be deleted because it has historical sales records"
        )

    has_purchase_orders = db.query(PurchaseOrderItem.id).filter(
        PurchaseOrderItem.product_id == product_id
    ).first()
    if has_purchase_orders:
        raise HTTPException(
            status_code=409,
            detail="Product cannot be deleted because it is referenced by purchase order records"
        )

    try:
        db.delete(product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Product cannot be deleted because it is referenced by historical records"
        )

    return {"message": "Product deleted successfully"}
