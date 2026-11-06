from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.product import Product

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):

    total_products = db.query(Product).count()

    total_stock = db.query(
        func.coalesce(func.sum(Product.current_stock), 0)
    ).scalar()

    low_stock = db.query(Product).filter(
        Product.current_stock > 0,
        Product.current_stock <= Product.reorder_point
    ).count()

    out_of_stock = db.query(Product).filter(
        Product.current_stock == 0
    ).count()

    return {
        "total_products": total_products,
        "total_stock_units": total_stock,
        "low_stock_items": low_stock,
        "out_of_stock_items": out_of_stock
    }