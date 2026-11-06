from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), unique=True, nullable=False, index=True)

    contact_person = Column(String(150), nullable=True)

    phone = Column(String(20), nullable=True)

    email = Column(String(150), nullable=True)

    gst_number = Column(String(15), unique=True, nullable=True)

    address = Column(String(500), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )