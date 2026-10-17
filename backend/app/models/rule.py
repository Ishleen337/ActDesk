import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON
from app.core.database import Base

class AutonomyRule(Base):
    __tablename__ = "autonomy_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tool = Column(String(64), index=True, nullable=False) 
    # get_order_status, list_orders, cancel_order, issue_refund, reschedule_delivery, update_address, escalate
    mode = Column(String(32), nullable=False) # auto, approval, never
    conditions = Column(JSON, default=dict, nullable=False)
    # e.g.: {
    #   "max_amount_paise": 50000, 
    #   "allowed_order_statuses": ["delivered", "shipped"],
    #   "max_refunds_per_month": 2,
    #   "max_days_since_delivery": 7
    # }
    version = Column(Integer, default=1, nullable=False)
    active = Column(Boolean, default=True, index=True, nullable=False)
    updated_by = Column(String(128), default="system", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
