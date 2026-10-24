import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# ============================================================
# ENVIRONMENT
# ============================================================

# Local development uses .env.
# Production platforms such as Vercel provide environment
# variables directly.
load_dotenv()

DEFAULT_DATABASE_URL = "sqlite:///./freelancer_saathi.db"

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    DEFAULT_DATABASE_URL,
).strip()


# ============================================================
# DATABASE URL NORMALIZATION
# ============================================================

# Production uses psycopg 3.
# Normalize PostgreSQL URLs so SQLAlchemy explicitly uses
# the installed psycopg driver.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg://",
        1,
    )

elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1,
    )


# ============================================================
# ENGINE CONFIGURATION
# ============================================================

# SQLite needs check_same_thread=False.
# PostgreSQL / Neon does not.
connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)


# ============================================================
# SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()