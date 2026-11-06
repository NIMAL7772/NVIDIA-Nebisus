
from pydantic import BaseModel, ConfigDict, Field, field_validator


# Used when adding a new product
class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)
    category: str | None = None
    supplier: str | None = None
    unit_cost: float = Field(default=0.0, ge=0)
    selling_price: float = Field(default=0.0, ge=0)
    current_stock: int = Field(default=0, ge=0)
    reorder_point: int = Field(default=0, ge=0)
    target_days: int = Field(default=14, ge=1)
    lead_time_days: int = Field(default=5, ge=0)


# Used when updating an existing product
class ProductUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    category: str | None = None
    supplier: str | None = None
    unit_cost: float | None = Field(default=None, ge=0)
    selling_price: float | None = Field(default=None, ge=0)
    current_stock: int | None = Field(default=None, ge=0)
    reorder_point: int | None = Field(default=None, ge=0)
    target_days: int | None = Field(default=None, ge=1)
    lead_time_days: int | None = Field(default=None, ge=0)

    @field_validator(
        "sku",
        "name",
        "unit_cost",
        "selling_price",
        "current_stock",
        "reorder_point",
        "target_days",
        "lead_time_days",
    )
    @classmethod
    def required_values_cannot_be_null(cls, value):
        if value is None:
            raise ValueError("This field cannot be null")
        return value


# Used when returning product information
class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    name: str
    category: str | None
    supplier: str | None
    unit_cost: float
    selling_price: float
    current_stock: int
    reorder_point: int
    target_days: int
    lead_time_days: int
