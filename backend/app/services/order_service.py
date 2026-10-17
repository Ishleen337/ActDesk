import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.order import Order, Shipment, DeliverySlot, Refund, OrderItem
from app.models.customer import Address, Customer
from app.core.cache import cache, ORDER_STATUS_TTL_SECONDS, IDEMPOTENCY_TTL_SECONDS
from app.services.audit_service import log_action

def get_order_details(db: Session, order_id: str, use_cache: bool = True) -> Dict[str, Any]:
    """Retrieves order details using cache-aside pattern (60-second TTL) per PRD."""
    cache_key = f"order_status:{order_id}"
    if use_cache:
        cached = cache.get(cache_key)
        if cached:
            return cached

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")

    cust = order.customer
    addr = order.address
    shipment = order.shipment
    slot = order.delivery_slot

    items_data = [
        {
            "id": item.id,
            "title": item.title,
            "quantity": item.quantity,
            "price_paise": item.price_paise,
            "price_inr": item.price_paise / 100.0,
            "image_url": item.image_url
        }
        for item in order.items
    ]

    refunds_data = [
        {
            "id": r.id,
            "amount_paise": r.amount_paise,
            "amount_inr": r.amount_paise / 100.0,
            "status": r.status,
            "reason": r.reason,
            "idempotency_key": r.idempotency_key,
            "created_at": r.created_at.isoformat()
        }
        for r in order.refunds
    ]

    result = {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": cust.name if cust else "Unknown",
        "customer_phone": cust.phone if cust else "",
        "status": order.status,
        "total_paise": order.total_paise,
        "total_inr": order.total_paise / 100.0,
        "currency": order.currency,
        "created_at": order.created_at.isoformat(),
        "address": {
            "street": addr.street if addr else "N/A",
            "city": addr.city if addr else "N/A",
            "state": addr.state if addr else "N/A",
            "pincode": addr.pincode if addr else "N/A"
        } if addr else None,
        "shipment": {
            "tracking_number": shipment.tracking_number if shipment else "N/A",
            "courier": shipment.courier if shipment else "N/A",
            "status": shipment.status if shipment else "N/A",
            "estimated_delivery": shipment.estimated_delivery if shipment else "N/A",
            "current_location": shipment.current_location if shipment else "N/A"
        } if shipment else None,
        "delivery_slot": {
            "slot_date": slot.slot_date if slot else "N/A",
            "time_window": slot.time_window if slot else "N/A",
            "status": slot.status if slot else "N/A"
        } if slot else None,
        "items": items_data,
        "refunds": refunds_data
    }

    if use_cache:
        cache.set(cache_key, result, ttl_seconds=ORDER_STATUS_TTL_SECONDS)

    return result

def invalidate_order_cache(order_id: str) -> None:
    cache.delete(f"order_status:{order_id}")

def cancel_order_service(
    db: Session,
    order_id: str,
    reason: str,
    actor: str,
    rule_version: int
) -> Dict[str, Any]:
    """Cancels an order and logs reversible state."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status in ["cancelled", "returned", "delivered"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status '{order.status}'")

    previous_status = order.status
    order.status = "cancelled"
    order.updated_at = datetime.now(timezone.utc)
    db.commit()

    invalidate_order_cache(order_id)

    res = {
        "order_id": order_id,
        "status": "cancelled",
        "previous_status": previous_status,
        "reason": reason
    }

    log_action(
        db=db,
        tool="cancel_order",
        args={"order_id": order_id, "reason": reason},
        actor=actor,
        rule_version=rule_version,
        result=res,
        reversible=True,
        previous_state={"status": previous_status}
    )

    return res

def issue_refund_service(
    db: Session,
    order_id: str,
    amount_paise: int,
    reason: str,
    idempotency_key: str,
    actor: str,
    rule_version: int
) -> Dict[str, Any]:
    """
    Issues a refund ensuring strict idempotency.
    If the same Idempotency-Key is provided, returns the cached/saved result without re-executing.
    """
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idempotency-Key header is mandatory for refund operations."
        )

    # 1. Check idempotency in Redis/In-Memory Cache
    idem_cache_key = f"idem_refund:{idempotency_key}"
    cached_idem = cache.get(idem_cache_key)
    if cached_idem:
        return {**cached_idem, "idempotent_replay": True}

    # 2. Check DB for existing refund with this key
    existing_refund = db.query(Refund).filter(Refund.idempotency_key == idempotency_key).first()
    if existing_refund:
        payload = {
            "refund_id": existing_refund.id,
            "order_id": existing_refund.order_id,
            "amount_paise": existing_refund.amount_paise,
            "amount_inr": existing_refund.amount_paise / 100.0,
            "status": existing_refund.status,
            "reason": existing_refund.reason,
            "idempotency_key": existing_refund.idempotency_key,
            "created_at": existing_refund.created_at.isoformat(),
            "idempotent_replay": True
        }
        cache.set(idem_cache_key, payload, ttl_seconds=IDEMPOTENCY_TTL_SECONDS)
        return payload

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    refund = Refund(
        order_id=order_id,
        customer_id=order.customer_id,
        amount_paise=amount_paise,
        reason=reason,
        status="processed",
        idempotency_key=idempotency_key,
        created_at=datetime.now(timezone.utc)
    )
    db.add(refund)
    db.commit()
    db.refresh(refund)

    invalidate_order_cache(order_id)

    res = {
        "refund_id": refund.id,
        "order_id": order_id,
        "amount_paise": amount_paise,
        "amount_inr": amount_paise / 100.0,
        "status": "processed",
        "reason": reason,
        "idempotency_key": idempotency_key,
        "created_at": refund.created_at.isoformat(),
        "idempotent_replay": False
    }

    # Cache idempotency key for 24 hours
    cache.set(idem_cache_key, res, ttl_seconds=IDEMPOTENCY_TTL_SECONDS)

    log_action(
        db=db,
        tool="issue_refund",
        args={"order_id": order_id, "amount_paise": amount_paise, "reason": reason, "idempotency_key": idempotency_key},
        actor=actor,
        rule_version=rule_version,
        result=res,
        reversible=False
    )

    return res

def reschedule_delivery_service(
    db: Session,
    order_id: str,
    new_slot_date: str,
    new_time_window: str,
    actor: str,
    rule_version: int
) -> Dict[str, Any]:
    """Reschedules delivery slot with reversible snapshot."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    slot = order.delivery_slot
    if not slot:
        slot = DeliverySlot(
            order_id=order.id,
            slot_date=new_slot_date,
            time_window=new_time_window,
            status="rescheduled"
        )
        db.add(slot)
        prev_snapshot = {"slot_date": "None", "time_window": "None", "status": "none"}
    else:
        prev_snapshot = {
            "slot_date": slot.slot_date,
            "time_window": slot.time_window,
            "status": slot.status
        }
        slot.slot_date = new_slot_date
        slot.time_window = new_time_window
        slot.status = "rescheduled"
        slot.updated_at = datetime.now(timezone.utc)

    db.commit()
    invalidate_order_cache(order_id)

    res = {
        "order_id": order_id,
        "slot_date": new_slot_date,
        "time_window": new_time_window,
        "status": "rescheduled"
    }

    log_action(
        db=db,
        tool="reschedule_delivery",
        args={"order_id": order_id, "slot_date": new_slot_date, "time_window": new_time_window},
        actor=actor,
        rule_version=rule_version,
        result=res,
        reversible=True,
        previous_state=prev_snapshot
    )

    return res

def update_address_service(
    db: Session,
    order_id: str,
    street: str,
    city: str,
    state: str,
    pincode: str,
    actor: str,
    rule_version: int
) -> Dict[str, Any]:
    """Updates order shipping address and preserves previous address snapshot for 1-click undo."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    prev_addr = order.address
    prev_snapshot = {
        "address_id": order.address_id,
        "street": prev_addr.street if prev_addr else "",
        "city": prev_addr.city if prev_addr else "",
        "state": prev_addr.state if prev_addr else "",
        "pincode": prev_addr.pincode if prev_addr else ""
    }

    new_addr = Address(
        customer_id=order.customer_id,
        street=street,
        city=city,
        state=state,
        pincode=pincode,
        is_default=True
    )
    db.add(new_addr)
    db.flush()

    order.address_id = new_addr.id
    order.updated_at = datetime.now(timezone.utc)
    db.commit()

    invalidate_order_cache(order_id)

    res = {
        "order_id": order_id,
        "address_id": new_addr.id,
        "street": street,
        "city": city,
        "state": state,
        "pincode": pincode
    }

    log_action(
        db=db,
        tool="update_address",
        args={"order_id": order_id, "street": street, "city": city, "state": state, "pincode": pincode},
        actor=actor,
        rule_version=rule_version,
        result=res,
        reversible=True,
        previous_state=prev_snapshot
    )

    return res
