from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String
)
from sqlalchemy.sql import func

from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    amount = Column(
        Float,
        nullable=False
    )

    currency = Column(
        String(10),
        nullable=False,
        default="USD"
    )

    platform = Column(
        String(100),
        nullable=False
    )

    status = Column(
        String(50),
        nullable=False,
        default="received"
    )

    # False = amount is still available for conversion
    # True = payment has already been processed/converted
    is_processed = Column(
        Boolean,
        nullable=False,
        default=False
    )

    received_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )