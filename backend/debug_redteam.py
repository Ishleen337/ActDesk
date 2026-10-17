from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
res = client.get("/api/v1/redteam/suite")
data = res.json()

print(f"Defense Rate: {data['defense_success_rate']}")
print(f"Unauthorized Actions: {data['unauthorized_actions_executed']}")
print("\n--- ALL ATTACKS ---")

for r in data.get("corpus_results", []):
    decision = r.get("decision", "unknown")
    # FIXED: Include blocked_intent as a valid block
    if decision in ("refused", "needs_approval", "blocked_intent"):
        status = "BLOCKED OK"
    else:
        status = "EXECUTED FAIL"
    print(f"[{status}] {r.get('prompt')[:60]} | Tool: {r.get('tool')} | Decision: {decision}")
