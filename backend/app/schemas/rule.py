from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class RuleConditions(BaseModel):
    max_amount_paise: Optional[int] = Field(50000, description="Max amount in paise allowed automatically")
    allowed_order_statuses: Optional[List[str]] = Field(["delivered", "shipped", "processing"], description="Allowed statuses for automatic resolution")
    max_refunds_per_month: Optional[int] = Field(2, description="Max refunds allowed in the last 30 days")
    max_days_since_delivery: Optional[int] = Field(7, description="Max days since delivery eligible for auto refund")

class RuleCreate(BaseModel):
    tool: str = Field(..., description="Tool name: get_order_status, cancel_order, issue_refund, reschedule_delivery, update_address, escalate")
    mode: str = Field(..., description="Mode: auto, approval, never")
    conditions: Optional[Dict[str, Any]] = None

class RuleUpdate(BaseModel):
    mode: Optional[str] = Field(None, description="Mode: auto, approval, never")
    conditions: Optional[Dict[str, Any]] = None

class RuleResponse(BaseModel):
    id: str
    tool: str
    mode: str
    conditions: Dict[str, Any]
    version: int
    active: bool
    updated_by: str
    created_at: datetime

    model_config = {"from_attributes": True}
