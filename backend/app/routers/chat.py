import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.cache import cache, SESSION_TTL_SECONDS
from app.core.rate_limiter import enforce_rate_limit
from app.models.customer import Customer
from app.models.order import Order
from app.models.conversation import Conversation, Feedback
from app.models.user import User
from app.routers.auth import require_role
from app.services.agent_service import process_agent_turn
from app.services import mongo_logger
from app.schemas.chat import (
    StartSessionRequest,
    StartSessionResponse,
    VerifyOtpRequest,
    SendMessageRequest,
    FeedbackRequest,
    ConversationResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Customer Chat & Agent Orchestration"])


# ---------------------------------------------------------------------------
# POST /chat/sessions — start + issue mock OTP
# ---------------------------------------------------------------------------
@router.post("/sessions", response_model=StartSessionResponse)
def start_chat_session(req: StartSessionRequest, db: Session = Depends(get_db)):
    """
    Start a customer support chat session.
    Verifies phone + order exist, issues a 6-digit mock OTP.
    """
    enforce_rate_limit(key=f"chat_start:{req.phone}")

    clean_phone = req.phone.strip()
    order_id = req.order_id.strip().upper()

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' was not found. Please verify your order number.",
        )

    customer = order.customer
    if customer:
        cust_phone_digits = "".join(filter(str.isdigit, customer.phone))
        req_phone_digits = "".join(filter(str.isdigit, clean_phone))
        if cust_phone_digits[-10:] != req_phone_digits[-10:]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phone number provided does not match the customer on record for {order_id}.",
            )

    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    mock_otp = settings.DEFAULT_OTP

    greeting_text = (
        f"Namaste {customer.name if customer else ''}! 🙏 "
        f"Welcome to ActDesk Support. To protect your privacy, "
        f"please enter the 6-digit OTP sent to {clean_phone}."
    )

    initial_messages = [
        {
            "id": str(uuid.uuid4()),
            "sender": "agent",
            "text": greeting_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "policy_status": "unverified",
        }
    ]

    conv = Conversation(
        session_id=session_id,
        customer_id=customer.id if customer else None,
        phone=clean_phone,
        order_id=order_id,
        verified=False,
        otp_code=mock_otp,
        messages=initial_messages,
        model_version="keyword-baseline-v1",
        created_at=datetime.now(timezone.utc),
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    # Cache session metadata
    cache.set(
        f"session:{session_id}",
        {
            "verified": False,
            "customer_id": conv.customer_id,
            "order_id": order_id,
            "phone": clean_phone,
        },
        ttl_seconds=SESSION_TTL_SECONDS,
    )

    # ---- Mirror to MongoDB ----
    mongo_logger.log_message(session_id, "agent", greeting_text)

    logger.info("session_started session=%s order=%s", session_id, order_id)

    return StartSessionResponse(
        session_id=session_id,
        message=f"Mock OTP sent to {clean_phone}. (Use '{mock_otp}' for quick verification)",
        verified=False,
        mock_otp=mock_otp,
        order_id=order_id,
        phone=clean_phone,
    )


# ---------------------------------------------------------------------------
# POST /chat/sessions/{id}/verify — OTP check
# ---------------------------------------------------------------------------
@router.post("/sessions/{id}/verify")
def verify_session_otp(id: str, req: VerifyOtpRequest, db: Session = Depends(get_db)):
    """Verify the mock OTP for a session."""
    conv = db.query(Conversation).filter(Conversation.session_id == id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")

    if req.otp != conv.otp_code and req.otp != settings.DEFAULT_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please try again.")

    conv.verified = True
    verify_text = (
        f"✅ Authentication Successful! Verified for Order {conv.order_id}. "
        f"How may I help you today?"
    )
    welcome_verified = {
        "id": str(uuid.uuid4()),
        "sender": "system",
        "text": verify_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "policy_status": "verified",
    }
    msgs = list(conv.messages or [])
    msgs.append(welcome_verified)
    conv.messages = msgs
    db.commit()

    cache.set(
        f"session:{id}",
        {
            "verified": True,
            "customer_id": conv.customer_id,
            "order_id": conv.order_id,
            "phone": conv.phone,
        },
        ttl_seconds=SESSION_TTL_SECONDS,
    )

    # ---- Mirror to MongoDB ----
    mongo_logger.log_message(id, "system", verify_text)

    return {
        "session_id": id,
        "verified": True,
        "message": "OTP verified successfully. You may now perform actions on your order.",
    }


# ---------------------------------------------------------------------------
# GET /chat/sessions/{id} — read transcript
# ---------------------------------------------------------------------------
@router.get("/sessions/{id}")
def get_session_state(id: str, db: Session = Depends(get_db)):
    """Retrieve current conversation transcript and state."""
    conv = db.query(Conversation).filter(Conversation.session_id == id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": conv.session_id,
        "order_id": conv.order_id,
        "phone": conv.phone,
        "verified": conv.verified,
        "messages": conv.messages,
        "model_version": conv.model_version,
        "created_at": conv.created_at.isoformat() if conv.created_at else None,
    }


# ---------------------------------------------------------------------------
# POST /chat/sessions/{id}/messages — agent turn
# ---------------------------------------------------------------------------
@router.post("/sessions/{id}/messages")
def send_message(id: str, req: SendMessageRequest, db: Session = Depends(get_db)):
    """
    Customer sends a message. Triggers the agent turn flow:
    Intent → Tool proposal → Policy engine → Execute/Queue/Refuse → Reply.
    """
    enforce_rate_limit(key=f"session_msg:{id}")

    conv = db.query(Conversation).filter(Conversation.session_id == id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")
    if not conv.verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session not verified. Please complete OTP verification first.",
        )

    # ---- Mirror the user message to MongoDB ----
    mongo_logger.log_message(id, "user", req.message)

    # Run the agent turn
    result = process_agent_turn(db=db, session_id=id, user_message=req.message)

    # ---- Mirror intent, tool call, decision, reply to MongoDB ----
    if isinstance(result, dict):
        intent = result.get("detected_intent") or result.get("intent")
        if intent:
            mongo_logger.log_intent(id, intent)

        tool = result.get("proposed_tool") or result.get("tool_called")
        if tool:
            mongo_logger.log_tool_call(id, tool, args={}, result=result.get("tool_result"))

        decision = result.get("policy_decision")
        if decision:
            mongo_logger.log_policy_decision(
                id,
                decision=decision,
                rule_version=1,
                reason="auto from policy engine",
            )

        reply = result.get("reply")
        if reply:
            mongo_logger.log_message(id, "agent", reply)

    return result


# ---------------------------------------------------------------------------
# POST /chat/sessions/{id}/feedback
# ---------------------------------------------------------------------------
@router.post("/sessions/{id}/feedback")
def submit_feedback(id: str, req: FeedbackRequest, db: Session = Depends(get_db)):
    """Customer submits thumbs up/down feedback."""
    conv = db.query(Conversation).filter(Conversation.session_id == id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")

    feedback = Feedback(
        conversation_id=conv.id,
        rating=req.rating.lower(),
        comment=req.comment,
        created_at=datetime.now(timezone.utc),
    )
    db.add(feedback)
    db.commit()

    # ---- Mirror to MongoDB ----
    mongo_logger.log_feedback(id, req.rating.lower(), req.comment)

    return {"message": "Thank you for your feedback!", "rating": req.rating}


# ---------------------------------------------------------------------------
# GET /chat/conversations — staff transcript list
# ---------------------------------------------------------------------------
@router.get("/conversations", response_model=Dict[str, Any])
def list_conversations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    staff: User = Depends(require_role(["store_admin", "support_agent"])),
):
    """Staff endpoint to inspect full conversation transcripts and traces."""
    query = db.query(Conversation)
    total = query.count()
    items = (
        query.order_by(Conversation.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            {
                "id": c.id,
                "session_id": c.session_id,
                "customer_id": c.customer_id,
                "phone": c.phone,
                "order_id": c.order_id,
                "verified": c.verified,
                "messages_count": len(c.messages or []),
                "detected_intents": c.detected_intents,
                "proposed_tool_calls": c.proposed_tool_calls,
                "policy_decisions": c.policy_decisions,
                "model_version": c.model_version,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in items
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }