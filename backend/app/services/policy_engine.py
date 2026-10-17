from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.rule import AutonomyRule
from app.models.order import Order, Refund

class PolicyDecisionResult:
    def __init__(self, decision: str, reason: str, rule_version: int, allowed: bool, requires_approval: bool):
        self.decision = decision # "auto", "needs_approval", "refused"
        self.reason = reason
        self.rule_version = rule_version
        self.allowed = allowed
        self.requires_approval = requires_approval

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision": self.decision,
            "reason": self.reason,
            "rule_version": self.rule_version,
            "allowed": self.allowed,
            "requires_approval": self.requires_approval
        }

def evaluate_policy(
    db: Session,
    tool: str,
    args: Dict[str, Any],
    customer_id: Optional[str] = None,
    order_id: Optional[str] = None
) -> PolicyDecisionResult:
    """
    Evaluates server-side autonomy policy rules outside the LLM.
    Enforces strict security boundaries, spending limits, refund counts, and order status checks.
    """
    # 1. Fetch current active rule for this tool
    rule = db.query(AutonomyRule).filter(
        AutonomyRule.tool == tool,
        AutonomyRule.active == True
    ).first()

    if not rule:
        # Default fallback: queue for approval if rule undefined
        return PolicyDecisionResult(
            decision="needs_approval",
            reason=f"No active autonomy rule configured for '{tool}'. Forwarded for approval.",
            rule_version=0,
            allowed=False,
            requires_approval=True
        )

    mode = rule.mode.lower()
    conditions = rule.conditions or {}
    rule_ver = rule.version

    # 2. Global mode checks
    if mode == "never":
        return PolicyDecisionResult(
            decision="refused",
            reason=f"Action '{tool}' is disabled by store policy (mode: NEVER).",
            rule_version=rule_ver,
            allowed=False,
            requires_approval=False
        )

    if mode == "approval":
        return PolicyDecisionResult(
            decision="needs_approval",
            reason=f"Action '{tool}' requires human agent sign-off (mode: APPROVAL).",
            rule_version=rule_ver,
            allowed=False,
            requires_approval=True
        )

    # 3. Tool-specific conditional evaluations for mode == "auto"
    target_order_id = args.get("order_id") or order_id
    order: Optional[Order] = None
    if target_order_id:
        order = db.query(Order).filter(Order.id == target_order_id).first()

    now = datetime.now(timezone.utc)

    if tool == "issue_refund":
        if not order:
            return PolicyDecisionResult(
                decision="refused",
                reason=f"Order {target_order_id} not found in store records.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=False
            )

        # Check allowed order statuses for refund
        allowed_statuses = conditions.get("allowed_order_statuses", ["delivered"])
        if order.status not in allowed_statuses:
            return PolicyDecisionResult(
                decision="refused",
                reason=f"Refunds can only be processed for orders that are '{', '.join(allowed_statuses)}'. Current status is '{order.status}'.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=False
            )

        # Check max amount threshold
        req_amount_paise = int(args.get("amount_paise", order.total_paise))
        max_amount_paise = int(conditions.get("max_amount_paise", 50000)) # Default ₹500
        if req_amount_paise > max_amount_paise:
            return PolicyDecisionResult(
                decision="needs_approval",
                reason=f"Requested refund (₹{req_amount_paise/100:.2f}) exceeds auto-approval ceiling of ₹{max_amount_paise/100:.2f}.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=True
            )

        # Check recent refund frequency (abuse limit)
        c_id = customer_id or order.customer_id
        if c_id:
            thirty_days_ago = now - timedelta(days=30)
            recent_refunds_count = db.query(Refund).filter(
                Refund.customer_id == c_id,
                Refund.created_at >= thirty_days_ago,
                Refund.status == "processed"
            ).count()

            max_refunds_month = int(conditions.get("max_refunds_per_month", 2))
            if recent_refunds_count >= max_refunds_month:
                return PolicyDecisionResult(
                    decision="needs_approval",
                    reason=f"Customer has received {recent_refunds_count} refunds in the last 30 days (limit: {max_refunds_month}). Discretionary review required.",
                    rule_version=rule_ver,
                    allowed=False,
                    requires_approval=True
                )

        # Check days since delivery
        max_days = int(conditions.get("max_days_since_delivery", 7))
        delivered_date = order.updated_at
        if order.created_at:
            # If naive datetime, replace tzinfo
            ord_time = order.updated_at.replace(tzinfo=timezone.utc) if order.updated_at.tzinfo is None else order.updated_at
            if (now - ord_time).days > max_days:
                return PolicyDecisionResult(
                    decision="needs_approval",
                    reason=f"Order was delivered over {max_days} days ago. Managerial exception approval needed.",
                    rule_version=rule_ver,
                    allowed=False,
                    requires_approval=True
                )

        # All checks passed
        return PolicyDecisionResult(
            decision="auto",
            reason="Refund qualifies under automatic autonomy rules.",
            rule_version=rule_ver,
            allowed=True,
            requires_approval=False
        )

    elif tool == "cancel_order":
        if not order:
            return PolicyDecisionResult(
                decision="refused",
                reason=f"Order {target_order_id} was not found.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=False
            )

        if order.status in ["shipped", "out_for_delivery"]:
            return PolicyDecisionResult(
                decision="needs_approval",
                reason=f"Order {order.id} is already in dispatch ('{order.status}'). Delivery cancellation requires courier intercept approval.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=True
            )

        if order.status in ["delivered", "cancelled", "returned"]:
            return PolicyDecisionResult(
                decision="refused",
                reason=f"Order {order.id} is already '{order.status}' and cannot be cancelled.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=False
            )

        # Created or processing
        return PolicyDecisionResult(
            decision="auto",
            reason="Order has not dispatched yet; auto-cancellation permitted.",
            rule_version=rule_ver,
            allowed=True,
            requires_approval=False
        )

    elif tool == "update_address":
        if not order:
            return PolicyDecisionResult(
                decision="refused",
                reason="Order not found.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=False
            )

        # Fraud guard: check for untracked, foreign, or suspicious destinations
        args_str = str(args).lower()
        if any(f in args_str for f in ["another country", "foreign", "untracked", "international", "unknown warehouse"]):
            return PolicyDecisionResult(
                decision="refused",
                reason="Security policy violation: Shipments to untracked, international or foreign destinations are strictly prohibited.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=False
            )

        if order.status in ["out_for_delivery", "delivered", "shipped"]:
            return PolicyDecisionResult(
                decision="needs_approval",
                reason=f"Order is already '{order.status}'. Destination update requires courier liaison review.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=True
            )

        return PolicyDecisionResult(
            decision="auto",
            reason="Address can be updated prior to final dispatch.",
            rule_version=rule_ver,
            allowed=True,
            requires_approval=False
        )

    elif tool == "reschedule_delivery":
        if order and order.status in ["delivered", "cancelled", "returned"]:
            return PolicyDecisionResult(
                decision="refused",
                reason=f"Cannot reschedule delivery for order with status '{order.status}'.",
                rule_version=rule_ver,
                allowed=False,
                requires_approval=False
            )

        return PolicyDecisionResult(
            decision="auto",
            reason="Delivery slot rescheduling permitted.",
            rule_version=rule_ver,
            allowed=True,
            requires_approval=False
        )

    # Safe read or escalation actions
    return PolicyDecisionResult(
        decision="auto",
        reason="Safe action automatically permitted.",
        rule_version=rule_ver,
        allowed=True,
        requires_approval=False
    )
