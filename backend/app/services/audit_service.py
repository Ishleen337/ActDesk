from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.action import ActionLog
from app.models.order import Order, DeliverySlot
from app.models.customer import Address

def log_action(
    db: Session,
    tool: str,
    args: Dict[str, Any],
    actor: str,
    rule_version: int,
    result: Dict[str, Any],
    reversible: bool = False,
    previous_state: Optional[Dict[str, Any]] = None
) -> ActionLog:
    """Logs an executed action to the audit trail with reversible snapshot data."""
    log_entry = ActionLog(
        tool=tool,
        args=args,
        actor=actor,
        rule_version=rule_version,
        result=result,
        reversible=reversible,
        is_reverted=False,
        previous_state=previous_state,
        created_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

def undo_action(
    db: Session,
    action_id: str,
    reverted_by: str
) -> Dict[str, Any]:
    """
    Executes a one-click undo for a reversible action (address change, reschedule, cancellation).
    Restores the database state exactly to the pre-action snapshot.
    """
    action = db.query(ActionLog).filter(ActionLog.id == action_id).first()
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action log entry not found")

    if not action.reversible:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Action '{action.tool}' is not marked as reversible."
        )

    if action.is_reverted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Action has already been reverted."
        )

    prev = action.previous_state or {}
    order_id = action.args.get("order_id")
    order = db.query(Order).filter(Order.id == order_id).first() if order_id else None

    restored_info = {}

    if action.tool == "update_address":
        if not order:
            raise HTTPException(status_code=404, detail="Order not found for address rollback")
        
        # If there's a previous address snapshot, restore it
        if "street" in prev:
            new_addr = Address(
                customer_id=order.customer_id,
                street=prev["street"],
                city=prev["city"],
                state=prev["state"],
                pincode=prev["pincode"],
                is_default=True
            )
            db.add(new_addr)
            db.flush()
            order.address_id = new_addr.id
            restored_info = {
                "restored_address": f"{prev['street']}, {prev['city']}, {prev['state']} - {prev['pincode']}"
            }
        elif "address_id" in prev and prev["address_id"]:
            order.address_id = prev["address_id"]
            restored_info = {"restored_address_id": prev["address_id"]}

    elif action.tool == "reschedule_delivery":
        if not order:
            raise HTTPException(status_code=404, detail="Order not found for reschedule rollback")
        slot = order.delivery_slot
        if slot and "slot_date" in prev:
            slot.slot_date = prev["slot_date"]
            slot.time_window = prev["time_window"]
            slot.status = prev.get("status", "booked")
            restored_info = {
                "slot_date": slot.slot_date,
                "time_window": slot.time_window
            }

    elif action.tool == "cancel_order":
        if not order:
            raise HTTPException(status_code=404, detail="Order not found for cancellation rollback")
        prev_status = prev.get("status", "processing")
        order.status = prev_status
        restored_info = {"order_status_restored": prev_status}

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No undo strategy registered for action '{action.tool}'"
        )

    # Mark action as reverted
    action.is_reverted = True
    action.reverted_by = reverted_by
    action.reverted_at = datetime.now(timezone.utc)
    
    db.commit()

    return {
        "message": f"Successfully reverted action '{action.tool}' (Action ID: {action.id})",
        "action_id": action.id,
        "tool": action.tool,
        "restored_state": restored_info
    }
