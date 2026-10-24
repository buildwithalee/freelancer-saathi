from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)

    action_type = Column(
        String(100),
        nullable=False
    )

    amount = Column(
        Float,
        nullable=True
    )

    currency = Column(
        String(10),
        nullable=True
    )

    reason = Column(
        String(500),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="PENDING"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    decided_at = Column(
        DateTime(timezone=True),
        nullable=True
    )