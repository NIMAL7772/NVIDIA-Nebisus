
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
)
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    PurchaseOrderReceive,
)

import uuid

router = APIRouter(
    prefix="/api/purchase-orders",
    tags=["Purchase Orders"]
)


# POST - Create a purchase order
@router.post(
    "/",
    response_model=PurchaseOrderResponse,
    status_code=status.HTTP_201_CREATED
)
def create_purchase_order(
    order_data: PurchaseOrderCreate,
    db: Session = Depends(get_db)
):

    product_ids = [item.product_id for item in order_data.items]

    # Prevent duplicate products in the same order
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=400,
            detail="A product can only appear once in a purchase order"
        )

    products = db.query(Product).filter(
        Product.id.in_(product_ids)
    ).all()

    product_map = {product.id: product for product in products}

    if len(product_map) != len(product_ids):
        raise HTTPException(
            status_code=404,
            detail="One or more products were not found"
        )

    # Validate that all products belong to the selected supplier
    for product in products:
        if not product.supplier or (
            product.supplier.strip().casefold()
            != order_data.supplier.strip().casefold()
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Supplier mismatch for product: {product.name}"
            )

    total_amount = sum(
        item.quantity * item.unit_cost
        for item in order_data.items
    )

    po_number = f"PO-{uuid.uuid4().hex[:8].upper()}"

    purchase_order = PurchaseOrder(
        po_number=po_number,
        supplier=order_data.supplier.strip(),
        expected_delivery=order_data.expected_delivery,
        total_amount=total_amount,
        status="Pending"
    )

    for item in order_data.items:
        purchase_order.items.append(
            PurchaseOrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_cost=item.unit_cost,
                received_quantity=0
            )
        )

    try:
        db.add(purchase_order)
        db.commit()
        db.refresh(purchase_order)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Unable to create purchase order"
        )

    return purchase_order


# GET - Retrieve all purchase orders
@router.get(
    "/",
    response_model=list[PurchaseOrderResponse]
)
def get_purchase_orders(db: Session = Depends(get_db)):

    return db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.items)
    ).order_by(
        PurchaseOrder.id.desc()
    ).all()


# GET - Retrieve purchase order by ID
@router.get(
    "/{order_id}",
    response_model=PurchaseOrderResponse
)
def get_purchase_order(
    order_id: int,
    db: Session = Depends(get_db)
):

    order = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.items)
    ).filter(
        PurchaseOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found"
        )

    return order


# PATCH - Update purchase order status
@router.patch("/{order_id}/status")
def update_purchase_order_status(
    order_id: int,
    new_status: str,
    db: Session = Depends(get_db)
):

    allowed_statuses = [
        "Pending",
        "Ordered",
        "Received",
        "Cancelled"
    ]

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid purchase order status"
        )

    order = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found"
        )

    if order.status == "Received":
        raise HTTPException(
            status_code=400,
            detail="Received orders cannot change status"
        )

    if order.status == "Cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cancelled orders cannot change status"
        )

    order.status = new_status

    db.commit()
    db.refresh(order)

    return {
        "message": "Purchase order status updated",
        "po_number": order.po_number,
        "status": order.status
    }


# POST - Receive goods from a purchase order
@router.post("/{order_id}/receive")
def receive_purchase_order(
    order_id: int,
    receive_data: PurchaseOrderReceive,
    db: Session = Depends(get_db)
):

    order = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found"
        )

    if order.status in ["Cancelled", "Received"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot receive goods for a {order.status.lower()} order"
        )

    # Prevent duplicate item IDs in one request
    item_ids = [item.item_id for item in receive_data.items]

    if len(item_ids) != len(set(item_ids)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate purchase order items are not allowed"
        )

    # Validate all received quantities before updating stock
    updates = []

    for received_item in receive_data.items:

        order_item = db.query(PurchaseOrderItem).filter(
            PurchaseOrderItem.id == received_item.item_id,
            PurchaseOrderItem.purchase_order_id == order.id
        ).first()

        if not order_item:
            raise HTTPException(
                status_code=404,
                detail=f"Purchase order item {received_item.item_id} not found"
            )

        remaining_quantity = (
            order_item.quantity - order_item.received_quantity
        )

        if received_item.received_quantity > remaining_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot receive more than the remaining quantity for item {order_item.id}"
            )

        product = db.query(Product).filter(
            Product.id == order_item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {order_item.product_id} not found"
            )

        updates.append(
            (order_item, product, received_item.received_quantity)
        )

    # Apply all validated updates
    for order_item, product, quantity in updates:

        order_item.received_quantity += quantity
        product.current_stock += quantity

    # Determine whether the entire order has been received
    all_received = all(
        item.received_quantity == item.quantity
        for item in order.items
    )

    any_received = any(
        item.received_quantity > 0
        for item in order.items
    )

    if all_received:
        order.status = "Received"
    elif any_received:
        order.status = "Partially Received"
    else:
        order.status = "Ordered"

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update received inventory"
        )

    return {
        "message": "Goods received successfully",
        "po_number": order.po_number,
        "status": order.status,
        "received_items": [
            {
                "item_id": item.id,
                "product_id": item.product_id,
                "received_quantity": item.received_quantity,
                "ordered_quantity": item.quantity
            }
            for item in order.items
        ]
    }

