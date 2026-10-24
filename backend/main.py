import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Database models
from app.models.payment import Payment
from app.models.approval import Approval
from app.models.audit_log import AuditLog
from app.models.bank_transaction import BankTransaction

# API routers
from app.routes.payments import router as payments_router
from app.routes.agents import router as agents_router
from app.routes.approvals import router as approvals_router
from app.routes.bank import router as bank_router
from app.routes.documents import router as documents_router
from app.routes.workflow import router as workflow_router
from app.routes.chat import router as chat_router


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV == "production"


# ============================================================
# DATABASE
# ============================================================

# Importing the models above registers their tables with Base.
Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Freelancer Saathi API",
    description=(
        "Agentic AI financial assistant for freelancers "
        "with human-controlled financial actions."
    ),
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

development_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

configured_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "",
)

environment_origins = [
    origin.strip().rstrip("/")
    for origin in configured_origins.split(",")
    if origin.strip()
]

if IS_PRODUCTION:
    allowed_origins = environment_origins
else:
    allowed_origins = list(
        dict.fromkeys(
            development_origins + environment_origins
        )
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=["*"],
)


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(payments_router)
app.include_router(agents_router)
app.include_router(approvals_router)
app.include_router(bank_router)
app.include_router(documents_router)
app.include_router(workflow_router)
app.include_router(chat_router)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def home():
    return {
        "status": "success",
        "service": "Freelancer Saathi API",
        "version": "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Freelancer Saathi Backend",
        "environment": APP_ENV,
    }