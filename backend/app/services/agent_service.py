import re
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.action import PendingAction
from app.models.order import Order
from app.schemas.chat import ChatMessage
from app.services.policy_engine import evaluate_policy
from app.services.order_service import (
    get_order_details,
    cancel_order_service,
    issue_refund_service,
    reschedule_delivery_service,
    update_address_service
)


def analyze_intent_and_extract_tool(
    user_message: str,
    active_order: Optional[Dict[str, Any]] = None
) -> Tuple[str, Optional[str], Dict[str, Any]]:
    """
    Detects user intent from English or Hinglish text and proposes a tool call with arguments.
    Supports robust regex and semantic keyword matching for direct Indian D2C scenarios.
    """
    text = user_message.lower().strip()
    
    # 🚨 SECURITY GUARD: Block PII / data exfiltration attempts BEFORE any intent matching
    PII_BLOCKLIST = [
        "customer table", "all phone", "all customers", "all users",
        "all addresses", "all address", "all numbers",
        "show me all", "show all", "list all", "list all customers",
        "dump the database", "dump database", "dump all",
        "untracked warehouse", "warehouse in another country",
        "system prompt", "api key", "api keys", "database password",
        "secret key", "secret api", "reveal prompt", "print instruction",
        "select *", "drop table", "leak"
    ]
    for pattern in PII_BLOCKLIST:
        if pattern in text:
            return "blocked_intent", None, {}
    
    order_id = active_order.get("id") if active_order else None

    # Check for order ID in message if not in active context
    order_match = re.search(r'\b(ord-\d{4,6})\b', text)
    if order_match:
        order_id = order_match.group(1).upper()

    # 1. Escalation / Human Agent
    if any(k in text for k in ["human agent", "talk to human", "speak to human", "connect to human", "transfer to human", "real person", "call me", "talk to person", "insan se baat", "support team", "escalat"]):
        return "escalate", "escalate", {
            "order_id": order_id,
            "reason": user_message,
            "priority": "high" if "urgent" in text or "gussa" in text else "normal"
        }

    # 2. Refund / Money Back / Return
    if any(k in text for k in ["refund", "paise wapas", "paisa wapas", "return", "damaged", "kharab", "tuta", "wrong item", "rupaye wapas"]):
        # Extract requested amount if specified (e.g., ₹50,000, Rs. 1000, 500 rs)
        amount_paise = None
        amt_match = re.search(r'(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:rs|rupees|rupaye)?', text)
        if amt_match:
            try:
                raw_amt = amt_match.group(1).replace(",", "")
                amt_inr = int(raw_amt)
                if amt_inr >= 1:
                    amount_paise = amt_inr * 100
            except ValueError:
                pass
        
        if not amount_paise and active_order:
            amount_paise = active_order.get("total_paise", 49900)
        elif not amount_paise:
            amount_paise = 49900

        return "refund_order", "issue_refund", {
            "order_id": order_id,
            "amount_paise": amount_paise,
            "reason": user_message
        }

    # 3. Cancel Order
    if any(k in text for k in ["cancel", "radh", "rok do", "don't want", "galti se", "nahi chahiye"]):
        return "cancel_order", "cancel_order", {
            "order_id": order_id,
            "reason": user_message
        }

    # 4. Reschedule Delivery
    if any(k in text for k in ["reschedule", "kal aana", "parso", "timing", "time slot", "deliver later", "shaam ko", "subah", "delivery time"]):
        # Determine slot date and window
        slot_date = (datetime.now(timezone.utc)).strftime("%Y-%m-%d")
        time_window = "03:00 PM - 06:00 PM"
        if "evening" in text or "shaam" in text or "raat" in text:
            time_window = "06:00 PM - 09:00 PM"
        elif "morning" in text or "subah" in text:
            time_window = "09:00 AM - 12:00 PM"
        elif "afternoon" in text or "dophar" in text:
            time_window = "12:00 PM - 03:00 PM"

        return "reschedule_delivery", "reschedule_delivery", {
            "order_id": order_id,
            "slot_date": slot_date,
            "time_window": time_window
        }

    # 5. Update Address
    if ("address" in text or "pata" in text or "destination" in text) and not any(bad in text for bad in ["dump", "leak", "select *", "drop table", "all customers", "all users", "all phone", "customer table"]):
        # Extract sample address elements if provided
        pincode_match = re.search(r'\b\d{6}\b', text)
        pincode = pincode_match.group(0) if pincode_match else "400001"
        city = "Mumbai"
        for c in ["Delhi", "Mumbai", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata", "Jaipur"]:
            if c.lower() in text:
                city = c
                break

        # If suspicious destination mentioned, preserve in street so policy engine catches it
        street_val = user_message if any(susp in text for susp in ["untracked", "foreign", "country", "warehouse"]) else "Plot 42, Green Avenue, New Sector"

        return "update_address", "update_address", {
            "order_id": order_id,
            "street": street_val,
            "city": city,
            "state": "Maharashtra" if city in ["Mumbai", "Pune"] else "Karnataka",
            "pincode": pincode
        }

    # 6. Where is my order / Tracking / Status
    if any(k in text for k in ["where", "status", "track", "kahan", "kab tak", "kab aayega", "delivery kab", "order info", "dispatch"]):
        return "track_order", "get_order_status", {
            "order_id": order_id
        }

    # 7. Greeting / General conversation
    if any(k in text for k in ["hello", "hi", "hey", "namaste", "namaskar", "kese ho", "help"]):
        return "greeting", None, {}

    # Default fallback
    return "general_query", None, {}


def process_agent_turn(
    db: Session,
    session_id: str,
    user_message: str
) -> Dict[str, Any]:
    """
    Executes the Turn Flow:
    1. Check verification
    2. Model proposes tool call
    3. Schema validation
    4. Policy engine evaluates (outside model)
    5. Execute, queue for approval, or refuse
    6. Generate response from tool result
    """
    conv = db.query(Conversation).filter(Conversation.session_id == session_id).first()
    if not conv:
        raise ValueError(f"Session {session_id} not found.")

    now_iso = datetime.now(timezone.utc).isoformat()
    msg_id = str(uuid.uuid4())

    # Record incoming user message
    user_entry = {
        "id": msg_id,
        "sender": "user",
        "text": user_message,
        "timestamp": now_iso
    }
    
    current_messages = list(conv.messages or [])
    current_messages.append(user_entry)

    # 1. Verification Guard: customer must verify OTP before seeing or modifying order
    if not conv.verified:
        agent_reply_text = (
            "Namaste! 🙏 For your security, please verify your mobile number and order with the OTP sent to your phone "
            "before we can access order details or process changes."
        )
        reply_entry = {
            "id": str(uuid.uuid4()),
            "sender": "agent",
            "text": agent_reply_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "policy_status": "unverified"
        }
        current_messages.append(reply_entry)
        conv.messages = current_messages
        db.commit()

        return {
            "reply": agent_reply_text,
            "session_id": session_id,
            "detected_intent": "unverified",
            "proposed_tool": None,
            "policy_decision": "unverified",
            "pending_approval": False,
            "messages": [ChatMessage(**m) for m in current_messages]
        }

    # 2. Retrieve verified order context
    order_context = None
    if conv.order_id:
        try:
            order_context = get_order_details(db, conv.order_id, use_cache=True)
        except Exception:
            pass

    # 3. Model proposes tool call from intent
    detected_intent, proposed_tool, tool_args = analyze_intent_and_extract_tool(user_message, order_context)
    if not tool_args.get("order_id") and conv.order_id:
        tool_args["order_id"] = conv.order_id

    # 4. If no tool is needed (greetings / general conversation / blocked_intent)
    if not proposed_tool:
        is_hinglish = any(w in user_message.lower() for w in ["kahan", "kab", "kese", "batao", "shukriya", "paise"])
        
        if detected_intent == "blocked_intent":
            reply_text = (
                "I'm sorry, but I cannot fulfill that request. It appears to violate our security and privacy policy. "
                "If you have a genuine support issue, please let me know how I can help with your order."
            )
        elif detected_intent == "greeting":
            reply_text = (
                f"Namaste {order_context.get('customer_name', '')}! 🙏 Main ActDesk assistant hoon. "
                f"Aapke order {conv.order_id} se related main aapki kya madad kar sakta hoon? "
                "Aap order tracking, refund, delivery reschedule ya address change puchh sakte hain."
                if is_hinglish else
                f"Hello {order_context.get('customer_name', 'there')}! I'm your ActDesk support assistant. "
                f"How can I help you today with order {conv.order_id}? You can track your shipment, request a refund, reschedule delivery, or update your address."
            )
        else:
            reply_text = (
                f"Main aapke order {conv.order_id} ke status, delivery reschedule, address update ya refund me help kar sakta hoon. Kripya batayein aap kya chahte hain."
                if is_hinglish else
                f"I can assist you with live tracking, delivery rescheduling, address updates, or refunds for order {conv.order_id}. How may I help?"
            )

        agent_entry = {
            "id": str(uuid.uuid4()),
            "sender": "agent",
            "text": reply_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "policy_status": "refused" if detected_intent == "blocked_intent" else "info_only"
        }
        current_messages.append(agent_entry)
        conv.messages = current_messages
        db.commit()

        return {
            "reply": reply_text,
            "session_id": session_id,
            "detected_intent": detected_intent,
            "proposed_tool": None,
            "policy_decision": "refused" if detected_intent == "blocked_intent" else "no_tool_needed",
            "pending_approval": False,
            "order_context": order_context,
            "messages": [ChatMessage(**m) for m in current_messages]
        }

    # 5. Schema Validation & Server-Side Policy Engine Decision
    policy_res = evaluate_policy(
        db=db,
        tool=proposed_tool,
        args=tool_args,
        customer_id=conv.customer_id,
        order_id=conv.order_id
    )

    decision = policy_res.decision # "auto", "needs_approval", "refused"
    reply_text = ""
    tool_result = None
    pending_action_id = None
    requires_approval_flag = False

    # Path A: Policy says REFUSED
    if decision == "refused":
        reply_text = (
            f"❌ Store policy exception: We could not perform '{proposed_tool}'. "
            f"Reason: {policy_res.reason}"
        )

    # Path B: Policy says NEEDS APPROVAL
    elif decision == "needs_approval":
        requires_approval_flag = True
        pending_act = PendingAction(
            conversation_id=conv.id,
            customer_id=conv.customer_id,
            order_id=conv.order_id,
            tool=proposed_tool,
            args=tool_args,
            rule_version=policy_res.rule_version,
            status="pending",
            reason_for_queue=policy_res.reason,
            proposed_by="agent_service",
            created_at=datetime.now(timezone.utc)
        )
        db.add(pending_act)
        db.commit()
        db.refresh(pending_act)
        pending_action_id = pending_act.id

        reply_text = (
            f"⏳ Request routed to Approval Queue: {policy_res.reason}\n\n"
            f"Our store operations team has received your request (Reference #{pending_act.id[:8]}). "
            "A support manager will review and confirm this shortly. You don't need to re-submit."
        )

    # Path C: Policy says AUTO - Execute immediately!
    elif decision == "auto":
        rule_v = policy_res.rule_version
        actor = "agent_service"
        target_oid = tool_args.get("order_id", conv.order_id)

        try:
            if proposed_tool == "get_order_status":
                tool_result = get_order_details(db, target_oid, use_cache=False)
                ship = tool_result.get("shipment") or {}
                status_val = tool_result.get("status", "processing")
                reply_text = (
                    f"📦 Order {target_oid} Status: {status_val.upper()}\n"
                    f"• Courier: {ship.get('courier', 'N/A')} (Tracking: {ship.get('tracking_number', 'N/A')})\n"
                    f"• Current Location: {ship.get('current_location', 'In Transit')}\n"
                    f"• Estimated Delivery: {ship.get('estimated_delivery', 'In 2-3 business days')}"
                )

            elif proposed_tool == "cancel_order":
                tool_result = cancel_order_service(
                    db=db,
                    order_id=target_oid,
                    reason=tool_args.get("reason", "Customer requested via chat"),
                    actor=actor,
                    rule_version=rule_v
                )
                reply_text = (
                    f"✅ Order {target_oid} has been cancelled successfully.\n"
                    "Since the package has not left our fulfillment warehouse, your order was stopped and any payment will be returned."
                )

            elif proposed_tool == "issue_refund":
                # Ensure Idempotency-Key
                idempotency_key = f"auto_refund_{target_oid}_{msg_id[:8]}"
                amount = tool_args.get("amount_paise", 49900)
                tool_result = issue_refund_service(
                    db=db,
                    order_id=target_oid,
                    amount_paise=amount,
                    reason=tool_args.get("reason", "Customer complaint"),
                    idempotency_key=idempotency_key,
                    actor=actor,
                    rule_version=rule_v
                )
                reply_text = (
                    f"💸 Refund of ₹{amount/100:.2f} has been processed successfully!\n"
                    f"• Refund ID: {tool_result.get('refund_id')}\n"
                    f"• Idempotency Ref: {idempotency_key}\n"
                    "Amount will reflect in your original payment method in 2-4 business days."
                )

            elif proposed_tool == "reschedule_delivery":
                tool_result = reschedule_delivery_service(
                    db=db,
                    order_id=target_oid,
                    new_slot_date=tool_args.get("slot_date", "Tomorrow"),
                    new_time_window=tool_args.get("time_window", "03:00 PM - 06:00 PM"),
                    actor=actor,
                    rule_version=rule_v
                )
                reply_text = (
                    f"📅 Delivery rescheduled successfully for Order {target_oid}!\n"
                    f"• New Date: {tool_result.get('slot_date')}\n"
                    f"• Time Window: {tool_result.get('time_window')}"
                )

            elif proposed_tool == "update_address":
                tool_result = update_address_service(
                    db=db,
                    order_id=target_oid,
                    street=tool_args.get("street", "New Address"),
                    city=tool_args.get("city", "Mumbai"),
                    state=tool_args.get("state", "Maharashtra"),
                    pincode=tool_args.get("pincode", "400001"),
                    actor=actor,
                    rule_version=rule_v
                )
                reply_text = (
                    f"📍 Shipping address updated for Order {target_oid}!\n"
                    f"• Address: {tool_result.get('street')}, {tool_result.get('city')}, {tool_result.get('state')} - {tool_result.get('pincode')}"
                )

            elif proposed_tool == "escalate":
                reply_text = (
                    f"🚨 Your conversation for Order {target_oid} has been escalated to our human priority support queue. "
                    "A senior support specialist will join shortly."
                )
        except Exception as e:
            reply_text = f"An error occurred while executing {proposed_tool}: {str(e)}"
            decision = "error"

    # Refresh order context after execution
    if conv.order_id:
        try:
            order_context = get_order_details(db, conv.order_id, use_cache=False)
        except Exception:
            pass

    # Save agent reply to conversation log
    agent_msg_entry = {
        "id": str(uuid.uuid4()),
        "sender": "agent",
        "text": reply_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tool_executed": proposed_tool if decision == "auto" else None,
        "tool_result": tool_result,
        "policy_status": decision,
        "pending_action_id": pending_action_id
    }
    current_messages.append(agent_msg_entry)
    
    conv.messages = current_messages
    intents = list(conv.detected_intents or [])
    intents.append(detected_intent)
    conv.detected_intents = intents

    proposals = list(conv.proposed_tool_calls or [])
    proposals.append({"tool": proposed_tool, "args": tool_args})
    conv.proposed_tool_calls = proposals

    decisions = list(conv.policy_decisions or [])
    decisions.append({"tool": proposed_tool, "decision": decision, "reason": policy_res.reason})
    conv.policy_decisions = decisions

    db.commit()

    return {
        "reply": reply_text,
        "session_id": session_id,
        "detected_intent": detected_intent,
        "proposed_tool": proposed_tool,
        "policy_decision": decision,
        "pending_approval": requires_approval_flag,
        "pending_action_id": pending_action_id,
        "order_context": order_context,
        "messages": [ChatMessage(**m) for m in current_messages]
    }