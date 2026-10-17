from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ActionDecisionRequest(BaseModel):
    decision: str = Field(..., description="Decision: 'approved', 'rejected', or 'edited'")
    edited_args: Optional[Dict[str, Any]] = Field(None, description="Updated arguments if edited")
    notes: Optional[str] = Field(None, description="Reason or internal note for the decision")

class PendingActionResponse(BaseModel):
    id: str
    conversation_id: Optional[str] = None
    customer_id: Optional[str] = None
    order_id: Optional[str] = None
    tool: str
    args: Dict[str, Any]
    rule_version: int
    status: str
    reason_for_queue: Optional[str] = None
    proposed_by: str
    decided_by: Optional[str] = None
    decision_notes: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class ActionLogResponse(BaseModel):
    id: str
    tool: str
    args: Dict[str, Any]
    actor: str
    rule_version: int
    result: Dict[str, Any]
    reversible: bool
    is_reverted: bool
    reverted_by: Optional[str] = None
    reverted_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class UndoResponse(BaseModel):
    message: str
    action_id: str
    tool: str
    restored_state: Dict[str, Any]
