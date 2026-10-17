from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.rule import AutonomyRule
from app.models.user import User
from app.routers.auth import require_role
from app.schemas.rule import RuleCreate, RuleUpdate, RuleResponse

router = APIRouter(prefix="/autonomy-rules", tags=["Autonomy Dial & Policy Rules"])

@router.get("", response_model=List[RuleResponse])
def get_active_rules(db: Session = Depends(get_db)):
    """Retrieve all current active autonomy rules."""
    rules = db.query(AutonomyRule).filter(AutonomyRule.active == True).order_by(AutonomyRule.tool.asc()).all()
    return rules

@router.get("/history/{tool}", response_model=List[RuleResponse])
def get_rule_history(tool: str, db: Session = Depends(get_db)):
    """Retrieve version history for a specific tool rule."""
    history = db.query(AutonomyRule).filter(AutonomyRule.tool == tool).order_by(AutonomyRule.version.desc()).all()
    return history

@router.patch("/{tool}", response_model=RuleResponse)
def update_autonomy_rule(
    tool: str,
    req: RuleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["store_admin"])) # Restricted to Store Admin per PRD
):
    """
    Update an autonomy rule mode or conditions.
    Immutable versioning: deactivates old version and creates new incremented version.
    """
    current_rule = db.query(AutonomyRule).filter(
        AutonomyRule.tool == tool,
        AutonomyRule.active == True
    ).first()

    new_mode = req.mode if req.mode else (current_rule.mode if current_rule else "auto")
    new_conditions = req.conditions if req.conditions is not None else (current_rule.conditions if current_rule else {})
    new_version = (current_rule.version + 1) if current_rule else 1

    if current_rule:
        current_rule.active = False
        db.add(current_rule)

    new_rule = AutonomyRule(
        tool=tool,
        mode=new_mode,
        conditions=new_conditions,
        version=new_version,
        active=True,
        updated_by=admin.username
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)

    return new_rule

@router.post("", response_model=RuleResponse)
def create_autonomy_rule(
    req: RuleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["store_admin"]))
):
    """Create or set a new autonomy rule version (Admin only)."""
    current = db.query(AutonomyRule).filter(
        AutonomyRule.tool == req.tool,
        AutonomyRule.active == True
    ).first()

    next_version = (current.version + 1) if current else 1
    if current:
        current.active = False
        db.add(current)

    rule = AutonomyRule(
        tool=req.tool,
        mode=req.mode,
        conditions=req.conditions or {},
        version=next_version,
        active=True,
        updated_by=admin.username
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule
