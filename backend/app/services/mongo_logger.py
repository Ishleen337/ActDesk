"""
MongoDB Atlas mirror for conversation transcripts.

Runs alongside the existing Postgres writes so the same data lives in
BOTH stores (Postgres for ACID, Mongo for document-style transcripts).

Failures here are logged but never break the chat flow.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, Any, Dict

from pymongo import MongoClient
from pymongo.errors import PyMongoError

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---- lazy singleton client ----
_client: Optional[MongoClient] = None
_db = None


def _get_db():
    """Return the Mongo database handle. Reuses the connection."""
    global _client, _db
    if _db is None:
        try:
            _client = MongoClient(
                settings.MONGO_URL,
                serverSelectionTimeoutMS=5000,
                uuidRepresentation="standard",
            )
            _db = _client[settings.MONGO_DB]
            # ping to verify
            _client.admin.command("ping")
            logger.info("Mongo connected: %s/%s", settings.MONGO_URL.split("@")[-1], settings.MONGO_DB)
        except PyMongoError as e:
            logger.warning("Mongo unavailable: %s — skipping Mongo mirror", e)
            _db = None
    return _db


def _now():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Public API — call these from anywhere; they never raise
# ---------------------------------------------------------------------------
def log_message(session_id: str, sender: str, text: str, extra: Optional[Dict[str, Any]] = None):
    """Append a message to the session's conversation document."""
    db = _get_db()
    if db is None:
        return
    doc = {"sender": sender, "text": text, "ts": _now()}
    if extra:
        doc.update(extra)
    try:
        db.conversations.update_one(
            {"session_id": session_id},
            {
                "$setOnInsert": {"created_at": _now(), "model_version": "keyword-baseline-v1"},
                "$set": {"updated_at": _now()},
                "$push": {"messages": doc},
            },
            upsert=True,
        )
    except PyMongoError as e:
        logger.warning("Mongo log_message failed: %s", e)


def log_intent(session_id: str, intent: str):
    db = _get_db()
    if db is None:
        return
    try:
        db.conversations.update_one(
            {"session_id": session_id},
            {"$push": {"detected_intents": intent}},
            upsert=True,
        )
    except PyMongoError as e:
        logger.warning("Mongo log_intent failed: %s", e)


def log_tool_call(session_id: str, tool: str, args: dict, result: Optional[dict] = None):
    db = _get_db()
    if db is None:
        return
    entry = {"tool": tool, "args": args, "ts": _now()}
    if result is not None:
        entry["result"] = result
    try:
        db.conversations.update_one(
            {"session_id": session_id},
            {"$push": {"proposed_tool_calls": entry}},
            upsert=True,
        )
    except PyMongoError as e:
        logger.warning("Mongo log_tool_call failed: %s", e)


def log_policy_decision(session_id: str, decision: str, rule_version: int = 1, reason: str = ""):
    db = _get_db()
    if db is None:
        return
    try:
        db.conversations.update_one(
            {"session_id": session_id},
            {"$push": {"policy_decisions": {
                "decision": decision,
                "rule_version": rule_version,
                "reason": reason,
                "ts": _now(),
            }}},
            upsert=True,
        )
    except PyMongoError as e:
        logger.warning("Mongo log_policy_decision failed: %s", e)


def log_feedback(session_id: str, rating: str, comment: Optional[str] = None):
    db = _get_db()
    if db is None:
        return
    try:
        db.feedback.insert_one({
            "session_id": session_id,
            "rating": rating,
            "comment": comment,
            "created_at": _now(),
        })
    except PyMongoError as e:
        logger.warning("Mongo log_feedback failed: %s", e)