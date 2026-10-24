from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.payment import Payment


router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


SUPPORTED_CURRENCIES = {
    "USD"
}


class PaymentCreate(BaseModel):
    amount: float = Field(
        gt=0,
        le=1_000_000
    )

    currency: str = Field(
        default="USD",
        min_length=3,
        max_length=3
    )

    platform: str = Field(
        min_length=2,
        max_length=100
    )

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, value: str):
        currency = value.strip().upper()

        if currency not in SUPPORTED_CURRENCIES:
            raise ValueError(
                "Currently only USD payments "
                "are supported."
            )

        return currency

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, value: str):
        platform = value.strip()

        if not platform:
            raise ValueError(
                "Platform cannot be empty."
            )

        return platform


@router.post("/")
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db)
):
    try:
        new_payment = Payment(
            amount=round(payment.amount, 2),
            currency=payment.currency,
            platform=payment.platform,
            status="received",
            is_processed=False
        )

        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)

        return {
            "success": True,
            "message":
                "Payment received successfully",
            "payment": {
                "id":
                    new_payment.id,
                "amount":
                    new_payment.amount,
                "currency":
                    new_payment.currency,
                "platform":
                    new_payment.platform,
                "status":
                    new_payment.status,
                "is_processed":
                    new_payment.is_processed,
                "received_at":
                    new_payment.received_at
            }
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Payment could not be saved "
                "safely."
            )
        )


@router.get("/")
def get_payments(
    db: Session = Depends(get_db)
):
    try:
        payments = (
            db.query(Payment)
            .order_by(
                Payment.id.desc()
            )
            .all()
        )

        return {
            "success": True,
            "total": len(payments),
            "payments": payments
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail=(
                "Payments could not be "
                "retrieved."
            )
        )