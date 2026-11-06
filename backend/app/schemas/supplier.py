from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    contact_person: Optional[str] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    gst_number: Optional[str] = Field(
        default=None,
        min_length=15,
        max_length=15
    )
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    contact_person: Optional[str] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    gst_number: Optional[str] = Field(
        default=None,
        min_length=15,
        max_length=15
    )
    address: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)