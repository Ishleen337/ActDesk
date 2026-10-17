from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.action import ActionLog
from app.models.user import User
from app.routers.auth import require_role
from app.services.audit_service import undo_action

router = APIRouter(prefix="/actions", tags=["Audit Log & Undo"])

@router.get("", response_model=Dict[str, Any])
def get_audit_log(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tool_filter: Optional[str] = Query(None, alias="tool"),
    actor_filter: Optional[str] = Query(None, alias="actor"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["store_admin", "support_agent"]))
):
    """View chronological audit trail of all automated and manual actions."""
    query = db.query(ActionLog)
    if tool_filter:
        query = query.filter(ActionLog.tool == tool_filter)
    if actor_filter:
        query = query.filter(ActionLog.actor.ilike(f"%{actor_filter}%"))

    total = query.count()
    items = query.order_by(ActionLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [
            {
                "id": a.id,
                "tool": a.tool,
                "args": a.args,
                "actor": a.actor,
                "rule_version": a.rule_version,
                "result": a.result,
                "reversible": a.reversible,
                "is_reverted": a.is_reverted,
                "reverted_by": a.reverted_by,
                "reverted_at": a.reverted_at.isoformat() if a.reverted_at else None,
                "created_at": a.created_at.isoformat()
            }
            for a in items
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@router.post("/{id}/undo")
def undo_reversible_action(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["store_admin", "support_agent"]))
):
    """
    Execute one-click undo on a reversible action (address change, reschedule, cancellation).
    Restores the prior database state exactly.
    """
    return undo_action(db=db, action_id=id, reverted_by=current_user.username)
