from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AddressBase(BaseModel):
    street: str
    city: str
    state: str
    pincode: str
    is_default: bool = False

class AddressResponse(AddressBase):
    id: str
    customer_id: str
    created_at: datetime

    model_config = {"from_attributes": True}

class CustomerBase(BaseModel):
    phone: str
    name: str
    email: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime
    addresses: List[AddressResponse] = []

    model_config = {"from_attributes": True}
