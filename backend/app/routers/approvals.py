from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.action import PendingAction, ActionLog
from app.models.user import User
from app.models.conversation import Conversation
from app.routers.auth import require_role
from app.schemas.action import ActionDecisionRequest, PendingActionResponse
from app.services.order_service import (
    cancel_order_service,
    issue_refund_service,
    reschedule_delivery_service,
    update_address_service
)

router = APIRouter(prefix="/approvals", tags=["Approval Queue"])

@router.get("", response_model=Dict[str, Any])
def list_approvals(
    status_filter: Optional[str] = Query("pending", alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["store_admin", "support_agent"]))
):
    """List pending actions awaiting staff approval."""
    query = db.query(PendingAction)
    if status_filter:
        query = query.filter(PendingAction.status == status_filter.lower())

    total = query.count()
    items = query.order_by(PendingAction.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    # Enrich with conversation snippets
    result_items = []
    for item in items:
        conv_snippet = None
        if item.conversation_id:
            conv = db.query(Conversation).filter(Conversation.id == item.conversation_id).first()
            if conv and conv.messages:
                conv_snippet = conv.messages[-4:] # Last 4 messages for context

        result_items.append({
            "id": item.id,
            "conversation_id": item.conversation_id,
            "customer_id": item.customer_id,
            "order_id": item.order_id,
            "tool": item.tool,
            "args": item.args,
            "rule_version": item.rule_version,
            "status": item.status,
            "reason_for_queue": item.reason_for_queue,
            "proposed_by": item.proposed_by,
            "decided_by": item.decided_by,
            "decision_notes": item.decision_notes,
            "decided_at": item.decided_at.isoformat() if item.decided_at else None,
            "created_at": item.created_at.isoformat(),
            "conversation_snippet": conv_snippet
        })

    return {
        "items": result_items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@router.post("/{id}/decision")
def make_decision(
    id: str,
    req: ActionDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["store_admin", "support_agent"]))
):
    """
    Approve, reject, or edit a pending action.
    Executes the action if approved or edited, logs to audit trail, and notifies conversation.
    """
    pending = db.query(PendingAction).filter(PendingAction.id == id).first()
    if not pending:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending action not found")

    if pending.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Action is already '{pending.status}', decided by {pending.decided_by}"
        )

    decision = req.decision.lower()
    if decision not in ["approved", "rejected", "edited"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Decision must be 'approved', 'rejected', or 'edited'")

    final_args = req.edited_args if (decision == "edited" and req.edited_args) else pending.args
    now = datetime.now(timezone.utc)
    tool_exec_result = None

    if decision in ["approved", "edited"]:
        target_oid = final_args.get("order_id", pending.order_id)
        actor = f"{current_user.role}:{current_user.username}"

        try:
            if pending.tool == "issue_refund":
                idem_key = f"approval_refund_{pending.id}"
                tool_exec_result = issue_refund_service(
                    db=db,
                    order_id=target_oid,
                    amount_paise=final_args.get("amount_paise", 50000),
                    reason=final_args.get("reason", f"Approved by {current_user.username}"),
                    idempotency_key=idem_key,
                    actor=actor,
                    rule_version=pending.rule_version
                )
            elif pending.tool == "cancel_order":
                tool_exec_result = cancel_order_service(
                    db=db,
                    order_id=target_oid,
                    reason=final_args.get("reason", f"Manual cancellation approved by {current_user.username}"),
                    actor=actor,
                    rule_version=pending.rule_version
                )
            elif pending.tool == "update_address":
                tool_exec_result = update_address_service(
                    db=db,
                    order_id=target_oid,
                    street=final_args.get("street", ""),
                    city=final_args.get("city", ""),
                    state=final_args.get("state", ""),
                    pincode=final_args.get("pincode", ""),
                    actor=actor,
                    rule_version=pending.rule_version
                )
            elif pending.tool == "reschedule_delivery":
                tool_exec_result = reschedule_delivery_service(
                    db=db,
                    order_id=target_oid,
                    new_slot_date=final_args.get("slot_date", ""),
                    new_time_window=final_args.get("time_window", ""),
                    actor=actor,
                    rule_version=pending.rule_version
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to execute action upon approval: {str(e)}")

    # Update pending action record
    pending.status = decision
    pending.decided_by = current_user.username
    pending.decision_notes = req.notes
    pending.decided_at = now
    if decision == "edited":
        pending.args = final_args

    # Update conversation transcript so customer is informed
    if pending.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == pending.conversation_id).first()
        if conv:
            msg_list = list(conv.messages or [])
            if decision in ["approved", "edited"]:
                notice_text = f"📢 Manager Update: Your request for '{pending.tool}' has been APPROVED by support lead {current_user.username}."
                if decision == "edited":
                    notice_text += f" (Adjusted parameters: {final_args})"
            else:
                notice_text = f"📢 Manager Update: Your request for '{pending.tool}' was reviewed and REJECTED. Reason: {req.notes or 'Does not meet policy guidelines'}"

            msg_list.append({
                "id": f"mgr-update-{pending.id[:6]}",
                "sender": "system",
                "text": notice_text,
                "timestamp": now.isoformat(),
                "policy_status": decision
            })
            conv.messages = msg_list

    db.commit()

    return {
        "message": f"Action '{pending.tool}' has been {decision}.",
        "pending_id": pending.id,
        "status": decision,
        "decided_by": current_user.username,
        "execution_result": tool_exec_result
    }
