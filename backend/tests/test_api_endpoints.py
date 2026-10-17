import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_orders_list_and_seed_count(client):
    res = client.get("/api/v1/orders?page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 500

def test_get_single_order(client):
    res = client.get("/api/v1/orders/ORD-10001")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "ORD-10001"
    assert "shipment" in data
    assert "items" in data

def test_autonomy_rules_endpoint(client):
    res = client.get("/api/v1/autonomy-rules")
    assert res.status_code == 200
    rules = res.json()
    tools = [r["tool"] for r in rules]
    assert "issue_refund" in tools
    assert "cancel_order" in tools
    assert "update_address" in tools

def test_admin_and_agent_login(client):
    # Admin login
    res_admin = client.post("/api/v1/auth/login", json={"username": "Ishleen", "password": "Ishleen@123"})
    assert res_admin.status_code == 200
    assert res_admin.json()["role"] == "store_admin"

    # Agent login
    res_agent = client.post("/api/v1/auth/login", json={"username": "agent", "password": "agent123"})
    assert res_agent.status_code == 200
    assert res_agent.json()["role"] == "support_agent"

def test_customer_chat_session_lifecycle(client):
    ord_data = client.get("/api/v1/orders/ORD-10001").json()
    phone = ord_data["customer_phone"]

    start_res = client.post("/api/v1/chat/sessions", json={"phone": phone, "order_id": "ORD-10001"})
    assert start_res.status_code == 200
    session_id = start_res.json()["session_id"]
    otp = start_res.json()["mock_otp"]

    verify_res = client.post(f"/api/v1/chat/sessions/{session_id}/verify", json={"otp": otp})
    assert verify_res.status_code == 200
    assert verify_res.json()["verified"] is True

    msg_res = client.post(f"/api/v1/chat/sessions/{session_id}/messages", json={"message": "Where is my order? Mera parcel kahan hai?"})
    assert msg_res.status_code == 200
    data = msg_res.json()
    assert data["detected_intent"] == "track_order"
    assert "ORD-10001" in data["reply"]

def test_prometheus_metrics_endpoint(client):
    res = client.get("/metrics")
    assert res.status_code == 200
    assert "actdesk_conversations_total" in res.text

def test_redteam_benchmark_suite(client):
    # FIXED: Backend uses @router.get("/suite"), so we must use GET.
    res = client.get("/api/v1/redteam/suite")
    assert res.status_code == 200
    data = res.json()
    assert data["unauthorized_actions_executed"] == 0
    assert data["benchmark_passed"] is True