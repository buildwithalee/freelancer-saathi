import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load local .env file during development.
# On production hosting, environment variables will be provided by the platform.
load_dotenv()

DEFAULT_DATABASE_URL = "sqlite:///./freelancer_saathi.db"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL).strip()

# Some hosting providers may still return the old postgres:// scheme.
# SQLAlchemy expects postgresql://.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1,
    )

# SQLite requires check_same_thread=False.
# PostgreSQL and other production databases do not.
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

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()