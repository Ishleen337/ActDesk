import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.customer import Customer
from app.models.order import Order, Refund
from app.services.order_service import issue_refund_service

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    cust = Customer(id="cust-idem", phone="+919876500000", name="Idem Customer")
    session.add(cust)
    session.flush()

    ord1 = Order(id="ORD-IDEM", customer_id=cust.id, status="delivered", total_paise=100000)
    session.add(ord1)
    session.commit()

    yield session
    session.close()

def test_refund_idempotency_prevents_duplicate_charge(db_session):
    idem_key = "unique-idem-key-12345"

    # First call: processes new refund
    res1 = issue_refund_service(
        db=db_session,
        order_id="ORD-IDEM",
        amount_paise=40000,
        reason="Defective zipper",
        idempotency_key=idem_key,
        actor="agent_service",
        rule_version=1
    )
    assert res1["idempotent_replay"] is False
    assert res1["amount_paise"] == 40000
    first_refund_id = res1["refund_id"]

    # Second call with the same idempotency key: must replay saved result
    res2 = issue_refund_service(
        db=db_session,
        order_id="ORD-IDEM",
        amount_paise=40000,
        reason="Defective zipper retry",
        idempotency_key=idem_key,
        actor="agent_service",
        rule_version=1
    )
    assert res2["idempotent_replay"] is True
    assert res2["refund_id"] == first_refund_id

    # Verify database has ONLY ONE refund row
    total_refunds = db_session.query(Refund).filter(Refund.order_id == "ORD-IDEM").count()
    assert total_refunds == 1
