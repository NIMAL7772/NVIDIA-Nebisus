
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Purchase Order Item - Input
class PurchaseOrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    unit_cost: float = Field(ge=0)


# Purchase Order - Input
class PurchaseOrderCreate(BaseModel):
    supplier: str = Field(min_length=2, max_length=150)
    expected_delivery: Optional[datetime] = None
    items: list[PurchaseOrderItemCreate] = Field(min_length=1)


# Purchase Order Item - Response
class PurchaseOrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_cost: float
    received_quantity: int

    model_config = {"from_attributes": True}


# Purchase Order - Response
class PurchaseOrderResponse(BaseModel):
    id: int
    po_number: str
    supplier: str
    order_date: Optional[datetime] = None
    expected_delivery: Optional[datetime] = None
    total_amount: float
    status: str
    items: list[PurchaseOrderItemResponse]

    model_config = {"from_attributes": True}


# Goods Receiving Item
class PurchaseOrderReceiveItem(BaseModel):
    item_id: int = Field(gt=0)
    received_quantity: int = Field(gt=0)


# Goods Receiving Request
class PurchaseOrderReceive(BaseModel):
    items: list[PurchaseOrderReceiveItem] = Field(min_length=1)
