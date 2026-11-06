
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    sku = Column(String(50), unique=True, nullable=False, index=True)

    name = Column(String(150), nullable=False)

    category = Column(String(100), nullable=True)

    supplier = Column(String(150), nullable=True)

    unit_cost = Column(Float, default=0.0)

    selling_price = Column(Float, default=0.0)

    current_stock = Column(Integer, default=0)

    reorder_point = Column(Integer, default=0)

    target_days = Column(Integer, default=14)

    lead_time_days = Column(Integer, default=5)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
