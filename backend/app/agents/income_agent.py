from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.payment import Payment


def get_income_summary(db: Session):
    seven_days_ago = datetime.now() - timedelta(days=7)

    recent_payments = (
        db.query(Payment)
        .filter(
            Payment.received_at >= seven_days_ago
        )
        .all()
    )

    total_income = sum(
        payment.amount
        for payment in recent_payments
    )

    available_payments = [
        payment
        for payment in recent_payments
        if not payment.is_processed
    ]

    available_for_conversion = sum(
        payment.amount
        for payment in available_payments
    )

    processed_amount = (
        total_income - available_for_conversion
    )

    return {
        "agent": "Income Agent",
        "period": "Last 7 days",
        "payment_count": len(recent_payments),
        "total_income": round(total_income, 2),
        "processed_amount": round(
            processed_amount,
            2
        ),
        "available_for_conversion": round(
            available_for_conversion,
            2
        ),
        "available_payment_count": len(
            available_payments
        ),
        "currency": "USD",
        "message": (
            f"You received ${total_income:.2f} "
            f"from {len(recent_payments)} payment(s) "
            "during the last 7 days. "
            f"${available_for_conversion:.2f} "
            "is currently available for conversion."
        )
    }