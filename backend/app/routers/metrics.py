import time
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.conversation import Conversation
from app.models.action import PendingAction, ActionLog
from app.models.order import Refund

router = APIRouter(tags=["Metrics & Monitoring"])

@router.get("/metrics")
def prometheus_metrics(db: Session = Depends(get_db)):
    """
    Exposes metrics formatted for Prometheus scrapers:
    - messages_total
    - approvals_pending_count
    - auto_refund_value_inr
    - actions_executed_total
    """
    total_convs = db.query(Conversation).count()
    pending_approvals = db.query(PendingAction).filter(PendingAction.status == "pending").count()
    total_actions = db.query(ActionLog).count()
    
    auto_actions = db.query(ActionLog).filter(
        ActionLog.tool == "issue_refund",
        ActionLog.actor == "agent_service"
    ).all()
    auto_refund_paise = sum(a.args.get("amount_paise", 0) for a in auto_actions)
    auto_refund_inr = auto_refund_paise / 100.0

    lines = [
        "# HELP actdesk_conversations_total Total customer conversations initiated",
        "# TYPE actdesk_conversations_total counter",
        f"actdesk_conversations_total {total_convs}",
        "",
        "# HELP actdesk_approvals_pending Current count of actions awaiting human review",
        "# TYPE actdesk_approvals_pending gauge",
        f"actdesk_approvals_pending {pending_approvals}",
        "",
        "# HELP actdesk_actions_executed_total Total tool actions executed",
        "# TYPE actdesk_actions_executed_total counter",
        f"actdesk_actions_executed_total {total_actions}",
        "",
        "# HELP actdesk_auto_refund_amount_inr Cumulative automatic refunds issued in INR",
        "# TYPE actdesk_auto_refund_amount_inr counter",
        f"actdesk_auto_refund_amount_inr {auto_refund_inr:.2f}",
        ""
    ]

    return Response(content="\n".join(lines), media_type="text/plain; version=0.0.4; charset=utf-8")
