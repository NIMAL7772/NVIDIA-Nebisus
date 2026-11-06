
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from datetime import date
from app.core.database import get_db
from app.models.product import Product
from app.models.sale import Sale
from sqlalchemy import func

router = APIRouter(prefix="/api/sales", tags=["Sales"])


# Get all sales
@router.get("/")
def get_sales(db: Session = Depends(get_db)):
    sales = db.query(Sale).order_by(Sale.id.desc()).all()

    result = []

    for sale in sales:
        product = db.query(Product).filter(
            Product.id == sale.product_id
        ).first()

        result.append({
            "id": sale.id,
            "order_id": sale.order_id,
            "product_id": sale.product_id,
            "product_name": product.name if product else None,
            "quantity": sale.quantity,
            "unit_price": sale.unit_price,
            "total_amount": sale.total_amount,
            "status": sale.status,
            "created_at": sale.created_at
        })

    return result


# Create a sale
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_data: dict,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == sale_data.get("product_id")
    ).with_for_update().first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    quantity = sale_data.get("quantity")
    if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity <= 0:
        raise HTTPException(
            status_code=422,
            detail="Quantity must be a positive integer"
        )

    if product.current_stock < quantity:
        raise HTTPException(
            status_code=400,
            detail="Insufficient stock"
        )

    unit_price = product.selling_price
    total_amount = quantity * unit_price

    sale = Sale(
        order_id=sale_data.get("order_id"),
        product_id=product.id,
        quantity=quantity,
        unit_price=unit_price,
        total_amount=total_amount,
        status="Completed"
    )

    try:
        product.current_stock -= quantity
        db.add(sale)
        db.commit()
        db.refresh(sale)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Order ID already exists"
        )

    return {
        "message": "Sale recorded successfully",
        "order_id": sale.order_id,
        "product_name": product.name,
        "quantity": sale.quantity,
        "total_amount": sale.total_amount,
        "remaining_stock": product.current_stock
    }
# Get monthly revenue
@router.get("/monthly-revenue")
def get_monthly_revenue(db: Session = Depends(get_db)):

    current_year = date.today().year

    results = (
        db.query(
            func.strftime("%m", Sale.created_at).label("month"),
            func.sum(Sale.total_amount).label("revenue")
        )
        .filter(
            Sale.status == "Completed",
            func.strftime("%Y", Sale.created_at) == str(current_year)
        )
        .group_by(func.strftime("%m", Sale.created_at))
        .all()
    )

    revenue_by_month = {
        int(month): float(revenue)
        for month, revenue in results
    }

    months = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"
    ]

    return [
        {
            "month": months[i],
            "revenue": revenue_by_month.get(i + 1, 0)
        }
        for i in range(12)
    ]

# Get top selling products
@router.get("/top-products")
def get_top_products(db: Session = Depends(get_db)):

    results = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("name"),
            func.sum(Sale.quantity).label("sales"),
            func.sum(Sale.total_amount).label("revenue")
        )
        .join(Sale, Sale.product_id == Product.id)
        .filter(Sale.status == "Completed")
        .group_by(Product.id, Product.name)
        .order_by(func.sum(Sale.quantity).desc())
        .limit(5)
        .all()
    )

    return [
        {
            "product_id": item.product_id,
            "name": item.name,
            "sales": int(item.sales),
            "revenue": float(item.revenue)
        }
        for item in results
    ]
