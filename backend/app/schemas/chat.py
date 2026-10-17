from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class StartSessionRequest(BaseModel):
    phone: str = Field(..., description="Customer phone number (e.g. +919876543210 or 9876543210)")
    order_id: str = Field(..., description="Customer order ID (e.g. ORD-10023)")

class StartSessionResponse(BaseModel):
    session_id: str
    message: str
    verified: bool
    mock_otp: str # Provided in response for easy testing / demo
    order_id: str
    phone: str

class VerifyOtpRequest(BaseModel):
    otp: str = Field(..., min_length=4, max_length=8)

class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)

class ChatMessage(BaseModel):
    id: str
    sender: str # "user" or "agent" or "system"
    text: str
    timestamp: str
    tool_executed: Optional[str] = None
    tool_result: Optional[Dict[str, Any]] = None
    policy_status: Optional[str] = None # "auto_executed", "queued_for_approval", "refused", "info_only"
    pending_action_id: Optional[str] = None

class AgentReplyResponse(BaseModel):
    reply: str
    session_id: str
    detected_intent: str
    proposed_tool: Optional[str] = None
    policy_decision: str # "auto_executed", "queued_for_approval", "refused", "no_tool_needed"
    pending_approval: bool = False
    pending_action_id: Optional[str] = None
    order_context: Optional[Dict[str, Any]] = None
    messages: List[ChatMessage] = []

class FeedbackRequest(BaseModel):
    rating: str = Field(..., description="'up' or 'down'")
    comment: Optional[str] = None

class ConversationResponse(BaseModel):
    id: str
    session_id: str
    phone: Optional[str] = None
    order_id: Optional[str] = None
    verified: bool
    messages: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
