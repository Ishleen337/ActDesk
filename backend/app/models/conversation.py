import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    phone = Column(String(20), index=True, nullable=True)
    order_id = Column(String(36), index=True, nullable=True)
    verified = Column(Boolean, default=False, nullable=False)
    otp_code = Column(String(8), default="123456", nullable=False)
    
    # Document storage format (MongoDB / JSON document equivalent)
    messages = Column(JSON, default=list, nullable=False)
    detected_intents = Column(JSON, default=list, nullable=False)
    proposed_tool_calls = Column(JSON, default=list, nullable=False)
    policy_decisions = Column(JSON, default=list, nullable=False)
    model_version = Column(String(64), default="qwen2.5-3b-instruct-q4", nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    feedbacks = relationship("Feedback", back_populates="conversation", cascade="all, delete-orphan")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id"), index=True, nullable=False)
    rating = Column(String(16), nullable=False) # "up" or "down"
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    conversation = relationship("Conversation", back_populates="feedbacks")
