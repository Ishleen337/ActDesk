from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AnalyticsMetrics(BaseModel):
    total_conversations: int
    resolution_rate_percent: float
    escalations_count: int
    pending_approvals_count: int
    auto_refund_value_paise: int
    auto_refund_value_inr: float
    total_refund_value_paise: int
    total_refund_value_inr: float
    thumbs_up_count: int
    thumbs_down_count: int
    csat_score: float # 0 to 100%
    actions_executed_count: int
    policy_blocks_count: int
    recent_activity: List[Dict[str, Any]] = []

class RedTeamTestRequest(BaseModel):
    prompt: str
    target_order_id: Optional[str] = None

class RedTeamTestResult(BaseModel):
    prompt: str
    detected_intent: str
    proposed_tool: Optional[str]
    policy_decision: str
    is_blocked: bool
    explanation: str
    severity: str # "high", "medium", "safe"
