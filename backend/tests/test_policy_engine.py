import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.user import User
from app.models.customer import Customer, Address
from app.models.order import Order, Shipment, DeliverySlot, Refund
from app.models.rule import AutonomyRule
from app.services.policy_engine import evaluate_policy

# In-memory SQLite for fast testing
@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed an active rule for issue_refund
    rule = AutonomyRule(
        tool="issue_refund",
        mode="auto",
        conditions={
            "max_amount_paise": 50000, # ₹500
            "allowed_order_statuses": ["delivered"],
            "max_refunds_per_month": 2,
            "max_days_since_delivery": 7
        },
        version=1,
        active=True
    )
    session.add(rule)

    # Seed an active rule for cancel_order
    cancel_rule = AutonomyRule(
        tool="cancel_order",
        mode="auto",
        conditions={"allowed_order_statuses": ["created", "processing"]},
        version=1,
        active=True
    )
    session.add(cancel_rule)

    # Seed a customer and orders
    cust = Customer(id="cust-1", phone="+919876543210", name="Test Customer")
    session.add(cust)
    session.flush()

    ord_delivered = Order(
        id="ORD-DELIVERED",
        customer_id=cust.id,
        status="delivered",
        total_paise=129900
    )
    ord_shipped = Order(
        id="ORD-SHIPPED",
        customer_id=cust.id,
        status="shipped",
        total_paise=129900
    )
    ord_created = Order(
        id="ORD-CREATED",
        customer_id=cust.id,
        status="created",
        total_paise=89900
    )
    session.add_all([ord_delivered, ord_shipped, ord_created])
    session.commit()

    yield session
    session.close()

def test_refund_auto_approved_under_threshold(db_session):
    # ₹300 refund on delivered order <= ₹500 threshold
    res = evaluate_policy(
        db=db_session,
        tool="issue_refund",
        args={"order_id": "ORD-DELIVERED", "amount_paise": 30000},
        customer_id="cust-1",
        order_id="ORD-DELIVERED"
    )
    assert res.decision == "auto"
    assert res.allowed is True
    assert res.requires_approval is False

def test_refund_queues_for_approval_when_exceeding_threshold(db_session):
    # ₹800 refund exceeds ₹500 max_amount_paise
    res = evaluate_policy(
        db=db_session,
        tool="issue_refund",
        args={"order_id": "ORD-DELIVERED", "amount_paise": 80000},
        customer_id="cust-1",
        order_id="ORD-DELIVERED"
    )
    assert res.decision == "needs_approval"
    assert res.allowed is False
    assert res.requires_approval is True
    assert "exceeds auto-approval ceiling" in res.reason

def test_refund_refused_if_order_not_delivered(db_session):
    # Cannot refund shipped order directly
    res = evaluate_policy(
        db=db_session,
        tool="issue_refund",
        args={"order_id": "ORD-SHIPPED", "amount_paise": 30000},
        customer_id="cust-1",
        order_id="ORD-SHIPPED"
    )
    assert res.decision == "refused"
    assert res.allowed is False

def test_cancel_order_auto_on_created(db_session):
    # Order in 'created' status cancels automatically
    res = evaluate_policy(
        db=db_session,
        tool="cancel_order",
        args={"order_id": "ORD-CREATED"},
        customer_id="cust-1",
        order_id="ORD-CREATED"
    )
    assert res.decision == "auto"
    assert res.allowed is True

def test_cancel_order_needs_approval_on_shipped(db_session):
    # Order in 'shipped' requires courier intercept review
    res = evaluate_policy(
        db=db_session,
        tool="cancel_order",
        args={"order_id": "ORD-SHIPPED"},
        customer_id="cust-1",
        order_id="ORD-SHIPPED"
    )
    assert res.decision == "needs_approval"
    assert res.requires_approval is True
