
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)

    po_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    supplier = Column(String(150), nullable=False)

    order_date = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    expected_delivery = Column(DateTime(timezone=True), nullable=True)

    total_amount = Column(Float, default=0.0)

    status = Column(
        String(30),
        default="Pending",
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    items = relationship(
        "PurchaseOrderItem",
        back_populates="purchase_order",
        cascade="all, delete-orphan"
    )


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)

    purchase_order_id = Column(
        Integer,
        ForeignKey("purchase_orders.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    quantity = Column(Integer, nullable=False)

    unit_cost = Column(Float, nullable=False)

    received_quantity = Column(
        Integer,
        default=0,
        nullable=False
    )

    purchase_order = relationship(
        "PurchaseOrder",
        back_populates="items"
    )

    product = relationship("Product")
