from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class OrderItemResponse(BaseModel):
    id: str
    title: str
    quantity: int
    price_paise: int
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}

class ShipmentResponse(BaseModel):
    id: str
    tracking_number: str
    courier: str
    status: str
    estimated_delivery: Optional[str] = None
    current_location: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}

class DeliverySlotResponse(BaseModel):
    id: str
    slot_date: str
    time_window: str
    status: str
    updated_at: datetime

    model_config = {"from_attributes": True}

class RefundResponse(BaseModel):
    id: str
    order_id: str
    customer_id: str
    amount_paise: int
    reason: Optional[str] = None
    status: str
    idempotency_key: str
    created_at: datetime

    model_config = {"from_attributes": True}

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    status: str
    total_paise: int
    currency: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    shipment: Optional[ShipmentResponse] = None
    delivery_slot: Optional[DeliverySlotResponse] = None
    refunds: List[RefundResponse] = []

    model_config = {"from_attributes": True}

class CancelOrderRequest(BaseModel):
    reason: Optional[str] = "Customer requested cancellation"

class IssueRefundRequest(BaseModel):
    amount_paise: int = Field(..., gt=0, description="Refund amount in paise (100 paise = 1 INR)")
    reason: Optional[str] = "Customer return / dissatisfaction"

class RescheduleDeliveryRequest(BaseModel):
    slot_date: str = Field(..., description="Target delivery date in YYYY-MM-DD")
    time_window: str = Field(..., description="Target window, e.g., 02:00 PM - 05:00 PM")

class UpdateAddressRequest(BaseModel):
    street: str
    city: str
    state: str
    pincode: str
