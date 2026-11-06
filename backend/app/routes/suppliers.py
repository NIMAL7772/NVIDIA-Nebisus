from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder
from app.schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse
)

router = APIRouter(
    prefix="/api/suppliers",
    tags=["Suppliers"]
)


# GET - Retrieve all suppliers
@router.get("/", response_model=list[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):

    return db.query(Supplier).order_by(
        Supplier.id.desc()
    ).all()


# GET - Retrieve supplier by ID
@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    return supplier


# POST - Create a new supplier
@router.post(
    "/",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED
)
def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db)
):

    supplier = Supplier(
        name=supplier_data.name.strip(),
        contact_person=supplier_data.contact_person,
        phone=supplier_data.phone,
        email=str(supplier_data.email) if supplier_data.email else None,
        gst_number=supplier_data.gst_number,
        address=supplier_data.address
    )

    try:
        db.add(supplier)
        db.commit()
        db.refresh(supplier)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Supplier name or GST number already exists"
        )

    return supplier


# PATCH - Update supplier details
@router.patch(
    "/{supplier_id}",
    response_model=SupplierResponse
)
def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    update_data = supplier_data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        update_data["name"] = update_data["name"].strip()

    if "email" in update_data:
        update_data["email"] = (
            str(update_data["email"])
            if update_data["email"]
            else None
        )

    for field, value in update_data.items():
        setattr(supplier, field, value)

    try:
        db.commit()
        db.refresh(supplier)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Supplier name or GST number already exists"
        )

    return supplier


# DELETE - Delete supplier
@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    # Prevent deletion if products use this supplier
    linked_products = db.query(Product).filter(
        Product.supplier == supplier.name
    ).first()

    if linked_products:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete supplier because products are linked to it"
        )

    # Prevent deletion if purchase orders use this supplier
    linked_orders = db.query(PurchaseOrder).filter(
        PurchaseOrder.supplier == supplier.name
    ).first()

    if linked_orders:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete supplier because purchase orders are linked to it"
        )

    db.delete(supplier)
    db.commit()

    return {
        "message": "Supplier deleted successfully"
    }