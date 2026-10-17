from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.order_service import (
    get_order_details,
    cancel_order_service,
    issue_refund_service,
    reschedule_delivery_service,
    update_address_service
)
from app.models.order import Order
from app.models.customer import Customer
from app.schemas.order import (
    CancelOrderRequest,
    IssueRefundRequest,
    RescheduleDeliveryRequest,
    UpdateAddressRequest
)

router = APIRouter(prefix="/orders", tags=["Orders & Commerce System of Record"])

@router.get("", response_model=Dict[str, Any])
def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by Order ID, phone or customer name"),
    status_filter: Optional[str] = Query(None, description="Filter by status: created, processing, shipped, out_for_delivery, delivered, cancelled"),
    db: Session = Depends(get_db)
):
    """List orders with pagination, status filtering, and search."""
    query = db.query(Order)

    if status_filter:
        query = query.filter(Order.status == status_filter.lower())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.join(Customer).filter(
            (Order.id.ilike(search_term)) | 
            (Customer.phone.ilike(search_term)) |
            (Customer.name.ilike(search_term))
        )

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for o in orders:
        items.append({
            "id": o.id,
            "customer_id": o.customer_id,
            "customer_name": o.customer.name if o.customer else "Unknown",
            "customer_phone": o.customer.phone if o.customer else "N/A",
            "status": o.status,
            "total_paise": o.total_paise,
            "total_inr": o.total_paise / 100.0,
            "items_count": len(o.items),
            "courier": o.shipment.courier if o.shipment else None,
            "tracking_number": o.shipment.tracking_number if o.shipment else None,
            "created_at": o.created_at.isoformat()
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@router.get("/{id}")
def get_order(id: str, db: Session = Depends(get_db)):
    """Retrieve full order details and shipment status (uses 60-second cache-aside)."""
    return get_order_details(db, id, use_cache=True)

@router.post("/{id}/cancel")
def cancel_order_endpoint(
    id: str,
    req: CancelOrderRequest,
    db: Session = Depends(get_db)
):
    """Cancel an order before dispatch."""
    return cancel_order_service(
        db=db,
        order_id=id,
        reason=req.reason or "Customer requested cancellation",
        actor="staff_or_service",
        rule_version=1
    )

@router.post("/{id}/refunds")
def issue_refund_endpoint(
    id: str,
    req: IssueRefundRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    """Issue a refund. Requires an Idempotency-Key header to prevent duplicate execution."""
    if not idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Header 'Idempotency-Key' is required for state-changing refund calls."
        )

    return issue_refund_service(
        db=db,
        order_id=id,
        amount_paise=req.amount_paise,
        reason=req.reason or "Customer refund request",
        idempotency_key=idempotency_key,
        actor="staff_or_service",
        rule_version=1
    )

@router.post("/{id}/reschedule")
def reschedule_delivery_endpoint(
    id: str,
    req: RescheduleDeliveryRequest,
    db: Session = Depends(get_db)
):
    """Reschedule delivery slot."""
    return reschedule_delivery_service(
        db=db,
        order_id=id,
        new_slot_date=req.slot_date,
        new_time_window=req.time_window,
        actor="staff_or_service",
        rule_version=1
    )

@router.patch("/{id}/address")
def update_address_endpoint(
    id: str,
    req: UpdateAddressRequest,
    db: Session = Depends(get_db)
):
    """Change shipping address."""
    return update_address_service(
        db=db,
        order_id=id,
        street=req.street,
        city=req.city,
        state=req.state,
        pincode=req.pincode,
        actor="staff_or_service",
        rule_version=1
    )
