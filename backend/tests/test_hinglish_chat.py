import pytest
from app.services.agent_service import analyze_intent_and_extract_tool

def test_hinglish_where_is_my_order():
    intent, tool, args = analyze_intent_and_extract_tool("Mera order kab tak deliver hoga?")
    assert intent == "track_order"
    assert tool == "get_order_status"

def test_hinglish_refund_request():
    intent, tool, args = analyze_intent_and_extract_tool("Product damaged hai, paise wapas kardo please")
    assert intent == "refund_order"
    assert tool == "issue_refund"

def test_hinglish_reschedule():
    intent, tool, args = analyze_intent_and_extract_tool("Delivery kal shaam ko reschedule kardo")
    assert intent == "reschedule_delivery"
    assert tool == "reschedule_delivery"
    assert args["time_window"] == "06:00 PM - 09:00 PM"

def test_hinglish_cancellation():
    intent, tool, args = analyze_intent_and_extract_tool("Galti se order ho gaya, order cancel karo")
    assert intent == "cancel_order"
    assert tool == "cancel_order"

def test_escalate_to_human():
    intent, tool, args = analyze_intent_and_extract_tool("Mujhe human agent se baat karni hai")
    assert intent == "escalate"
    assert tool == "escalate"
