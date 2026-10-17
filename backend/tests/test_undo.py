import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.customer import Customer, Address
from app.models.order import Order, DeliverySlot
from app.models.action import ActionLog
from app.services.order_service import update_address_service, reschedule_delivery_service
from app.services.audit_service import undo_action

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    cust = Customer(id="cust-undo", phone="+919876511111", name="Undo Tester")
    session.add(cust)
    session.flush()

    addr = Address(
        customer_id=cust.id,
        street="Old Street 10",
        city="Pune",
        state="Maharashtra",
        pincode="411001",
        is_default=True
    )
    session.add(addr)
    session.flush()

    ord1 = Order(id="ORD-UNDO", customer_id=cust.id, address_id=addr.id, status="processing", total_paise=99900)
    session.add(ord1)

    slot = DeliverySlot(
        order_id=ord1.id,
        slot_date="2026-10-20",
        time_window="10:00 AM - 01:00 PM",
        status="booked"
    )
    session.add(slot)
    session.commit()

    yield session
    session.close()

def test_address_change_and_one_click_undo(db_session):
    # Step 1: Update address to Mumbai
    update_res = update_address_service(
        db=db_session,
        order_id="ORD-UNDO",
        street="New High Street 42",
        city="Mumbai",
        state="Maharashtra",
        pincode="400001",
        actor="support_agent",
        rule_version=1
    )
    
    order = db_session.query(Order).filter(Order.id == "ORD-UNDO").first()
    assert order.address.city == "Mumbai"
    assert order.address.pincode == "400001"

    # Find the logged action
    log_entry = db_session.query(ActionLog).filter(
        ActionLog.tool == "update_address",
        ActionLog.is_reverted == False
    ).first()
    assert log_entry is not None
    assert log_entry.reversible is True

    # Step 2: One-click Undo
    undo_res = undo_action(
        db=db_session,
        action_id=log_entry.id,
        reverted_by="admin_supervisor"
    )
    assert "Successfully reverted" in undo_res["message"]

    # Step 3: Check database restored
    db_session.refresh(order)
    assert order.address.city == "Pune"
    assert order.address.pincode == "411001"
    assert log_entry.is_reverted is True
    assert log_entry.reverted_by == "admin_supervisor"
