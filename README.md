<div align="center">

# 🛡️ ActDesk
### Autonomous Support Agent with an Autonomy Dial

**A production-grade B2B SaaS customer-support agent built for the Indian D2C ecosystem.**

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?style=for-the-badge&logo=python)](backend)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](backend)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](frontend)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)

</div>

---

## 🎯 What is ActDesk?

Most AI chatbots deflect: they answer FAQs and hand off anything requiring real action to a human queue. **Businesses don't trust AI with money.**

**ActDesk solves this** by separating the AI's **intent** from its **authority**.

- 🧠 **The LLM proposes** — it parses the customer message (English, Hindi, Hinglish) and proposes a JSON tool call.
- 🛡️ **The Policy Engine decides** — a strict server-side engine validates every rule (₹500 auto-refund limit, 30-day frequency caps, order status checks) before execution.
- ✅ **The Customer gets resolution** — refunds issued, deliveries rescheduled, addresses updated in seconds.
- 📋 **The Admin gets an audit trail** — every action is logged with actor, rule version, and 1-click undo.

**No prompt injection can talk the agent past the rules.**

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🎛️ **Autonomy Dial** | Per-tool **Auto / Needs Approval / Never** mode with custom thresholds |
| 🔐 **RBAC** | Store Admin (edit rules, undo anything) vs Support Agent (approvals, own undo only) |
| 🇮🇳 **Hinglish Support** | Native English + Hindi + Hinglish intent detection |
| 🔁 **Idempotent Refunds** | `Idempotency-Key` headers prevent duplicate charges |
| ↩️ **1-Click Undo** | Reversible actions (address, reschedule, pre-dispatch cancel) restore via DB snapshot |
| ⏳ **Approval Queue** | Over-limit actions route to staff with full conversation context |
| 📜 **Audit Log** | Every action logged with actor, rule version, args, and result |
| 🛡️ **100% Red-Team Defense** | 10-attack adversarial benchmark passes with **zero** unauthorized executions |
| 📊 **Ops Dashboard** | Real-time KPIs: resolution rate, CSAT, refund value, policy blocks |
| 💬 **Customer Sandbox** | Live chat widget with OTP verification and live policy tags |

---

## 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                        CUSTOMER SANDBOX                          │
│   Chat Widget → OTP verify → Hinglish message → AI proposes      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              AGENT SERVICE  (agent_service.py)                   │
│   analyze_intent_and_extract_tool() → PII guard → Intent + Args  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              POLICY ENGINE  (policy_engine.py)                   │
│   Evaluates autonomy_rules → auto / needs_approval / refused     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         ┌────────┐    ┌─────────┐    ┌────────┐
         │ EXECUTE│    │ APPROVE │    │ REFUSE │
         └───┬────┘    └────┬────┘    └────┬───┘
             │              │              │
             ▼              ▼              ▼
      ┌──────────────────────────────────────────┐
      │  PostgreSQL (orders, refunds, rules)     │
      │  MongoDB Atlas (transcripts, feedback)   │
      │  Redis (sessions, cache, rate limits)    │
      └──────────────────────────────────────────┘
