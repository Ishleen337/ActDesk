import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON, Text
from app.core.database import Base

class PendingAction(Base):
    __tablename__ = "pending_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(64), index=True, nullable=True)
    customer_id = Column(String(36), index=True, nullable=True)
    order_id = Column(String(36), index=True, nullable=True)
    tool = Column(String(64), index=True, nullable=False)
    args = Column(JSON, default=dict, nullable=False)
    rule_version = Column(Integer, nullable=False)
    status = Column(String(32), default="pending", index=True, nullable=False) # pending, approved, rejected, edited
    reason_for_queue = Column(Text, nullable=True) # e.g. "Amount ₹800 exceeds automatic threshold ₹500"
    
    proposed_by = Column(String(64), default="agent_service", nullable=False)
    decided_by = Column(String(64), nullable=True)
    decision_notes = Column(Text, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class ActionLog(Base):
    __tablename__ = "action_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tool = Column(String(64), index=True, nullable=False)
    args = Column(JSON, default=dict, nullable=False)
    actor = Column(String(64), nullable=False) # agent_service, store_admin, support_agent
    rule_version = Column(Integer, nullable=False)
    result = Column(JSON, default=dict, nullable=False)
    reversible = Column(Boolean, default=False, nullable=False)
    is_reverted = Column(Boolean, default=False, nullable=False)
    reverted_by = Column(String(64), nullable=True)
    reverted_at = Column(DateTime, nullable=True)
    previous_state = Column(JSON, nullable=True) # Used for 1-click undo!
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
