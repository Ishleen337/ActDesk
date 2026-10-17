import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    addresses = relationship("Address", back_populates="customer", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")

class Address(Base):
    __tablename__ = "addresses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(36), ForeignKey("customers.id"), index=True, nullable=False)
    street = Column(String(256), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(12), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    customer = relationship("Customer", back_populates="addresses")
