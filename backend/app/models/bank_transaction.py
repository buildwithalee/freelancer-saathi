from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(Integer, primary_key=True, index=True)

    approval_id = Column(
        Integer,
        nullable=False,
        unique=True
    )

    transaction_id = Column(
        String(100),
        nullable=False,
        unique=True
    )

    action_type = Column(
        String(100),
        nullable=False
    )

    source_amount = Column(
        Float,
        nullable=False
    )

    source_currency = Column(
        String(10),
        nullable=False
    )

    target_amount = Column(
        Float,
        nullable=False
    )

    target_currency = Column(
        String(10),
        nullable=False
    )

    exchange_rate = Column(
        Float,
        nullable=False
    )

    status = Column(
        String(30),
        nullable=False,
        default="COMPLETED"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )