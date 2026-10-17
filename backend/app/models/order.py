import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True) # e.g. ORD-10023
    customer_id = Column(String(36), ForeignKey("customers.id"), index=True, nullable=False)
    address_id = Column(String(36), ForeignKey("addresses.id"), nullable=True)
    status = Column(String(32), default="created", index=True, nullable=False) 
    # created, processing, shipped, out_for_delivery, delivered, cancelled, returned
    total_paise = Column(Integer, nullable=False)
    currency = Column(String(8), default="INR", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    customer = relationship("Customer", back_populates="orders")
    address = relationship("Address")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    shipment = relationship("Shipment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    delivery_slot = relationship("DeliverySlot", back_populates="order", uselist=False, cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), index=True, nullable=False)
    title = Column(String(256), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    price_paise = Column(Integer, nullable=False)
    image_url = Column(String(512), nullable=True)

    order = relationship("Order", back_populates="items")

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), unique=True, index=True, nullable=False)
    tracking_number = Column(String(64), unique=True, index=True, nullable=False)
    courier = Column(String(64), nullable=False) # BlueDart, Delhivery, Shadowfax, Xpressbees
    status = Column(String(32), default="manifested", nullable=False)
    estimated_delivery = Column(String(64), nullable=True)
    current_location = Column(String(128), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    order = relationship("Order", back_populates="shipment")

class DeliverySlot(Base):
    __tablename__ = "delivery_slots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), unique=True, index=True, nullable=False)
    slot_date = Column(String(32), nullable=False) # YYYY-MM-DD
    time_window = Column(String(64), nullable=False) # e.g. 10:00 AM - 01:00 PM
    status = Column(String(32), default="booked", nullable=False) # booked, rescheduled
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    order = relationship("Order", back_populates="delivery_slot")

class Refund(Base):
    __tablename__ = "refunds"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), index=True, nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), index=True, nullable=False)
    amount_paise = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(32), default="processed", nullable=False) # processed, pending_approval, rejected
    idempotency_key = Column(String(128), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    order = relationship("Order", back_populates="refunds")
    customer = relationship("Customer")
