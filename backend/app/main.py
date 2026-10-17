import os
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seed_service import seed_database
from app.routers import (
    auth,
    chat,
    orders,
    rules,
    approvals,
    actions,
    analytics,
    redteam,
    metrics,
)

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


# ---------------------------------------------------------------------------
# Lifespan: DB create + seed on startup, cleanup on shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # NOTE: For Eval-1 we auto-create tables. In production use Alembic.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_database(db, target_orders_count=500)
        logger.info("Seed complete.")
    except Exception:
        logger.exception("Seed failed")
    finally:
        db.close()

    yield

    # Shutdown
    engine.dispose()
    logger.info("Shutdown complete.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ActDesk — Autonomous Support Agent & Autonomy Dial API",
    description=(
        "ActDesk resolves D2C support requests (order tracking, idempotent refunds, "
        "delivery rescheduling, address updates, escalations) under server-side "
        "per-action **Autonomy Dial** rules.\n\n"
        "- **Policy outside the model**: the model proposes JSON actions; the policy engine decides.\n"
        "- **Idempotency**: mutations require `Idempotency-Key` for safe retries.\n"
        "- **One-click undo**: reversible actions capture snapshots in the audit log.\n"
        "- **Hinglish & English**: intent recognition for Indian D2C customers.\n"
        "- **RBAC**: Store Admin / Support Agent / Verified Customer.\n"
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Idempotency-Key"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Attach a request ID for tracing."""
    rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
    request.state.request_id = rid
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response


# ---------------------------------------------------------------------------
# Global exception handler (don't leak stack traces)
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": getattr(request.state, "request_id", None)},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(rules.router, prefix=settings.API_V1_STR)
app.include_router(approvals.router, prefix=settings.API_V1_STR)
app.include_router(actions.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(redteam.router, prefix=settings.API_V1_STR)
app.include_router(metrics.router)  # /metrics for Prometheus


# ---------------------------------------------------------------------------
# Health check — actually pings the DB
# ---------------------------------------------------------------------------
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    db_ok = False
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        logger.exception("DB health check failed")
    finally:
        try:
            db.close()
        except Exception:
            pass

    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "cache": "operational",
        "policy_engine": "active",
        "version": settings.VERSION,
    }


# ---------------------------------------------------------------------------
# SPA static mount — MUST be last
# ---------------------------------------------------------------------------
frontend_dist_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)

if os.path.isdir(frontend_dist_path):
    assets_dir = os.path.join(frontend_dist_path, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    index_file = os.path.join(frontend_dist_path, "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Let API, docs, redoc, metrics, and openapi fall through to 404
        reserved = ("api/", "docs", "redoc", "metrics", "openapi.json")
        if full_path.startswith(reserved):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        return FileResponse(index_file)
else:
    @app.get("/")
    def root():
        return {
            "service": "ActDesk Autonomous Support API",
            "status": "operational",
            "version": settings.VERSION,
            "docs_url": "/docs",
            "redoc_url": "/redoc",
            "metrics_url": "/metrics",
        }