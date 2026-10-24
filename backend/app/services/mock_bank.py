import uuid
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.approval import Approval
from app.models.audit_log import AuditLog
from app.models.bank_transaction import BankTransaction
from app.models.payment import Payment


MOCK_USD_PKR_RATE = Decimal("282.50")


# -------------------------------------------------
# Helper: Safe money conversion
# -------------------------------------------------

def to_money(value):
    return Decimal(
        str(value)
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


# -------------------------------------------------
# Execute Mock USD -> PKR Conversion
# -------------------------------------------------

def execute_mock_conversion(
    db: Session,
    approval_id: int
):
    try:
        # -----------------------------------------
        # 1. Validate approval ID
        # -----------------------------------------

        if approval_id <= 0:
            return {
                "success": False,
                "message":
                    "Invalid approval ID."
            }

        # -----------------------------------------
        # 2. Approval must exist
        # -----------------------------------------

        approval = (
            db.query(Approval)
            .filter(
                Approval.id == approval_id
            )
            .first()
        )

        if not approval:
            return {
                "success": False,
                "message":
                    "Approval request not found."
            }

        # -----------------------------------------
        # 3. User approval is mandatory
        # -----------------------------------------

        if approval.status != "APPROVED":
            return {
                "success": False,
                "message": (
                    "Transaction blocked. "
                    "User approval is required."
                )
            }

        # -----------------------------------------
        # 4. Prevent duplicate execution
        # -----------------------------------------

        existing_transaction = (
            db.query(BankTransaction)
            .filter(
                BankTransaction.approval_id
                == approval_id
            )
            .first()
        )

        if existing_transaction:
            return {
                "success": False,
                "message": (
                    "This approval has already "
                    "been executed."
                ),
                "transaction_id":
                    existing_transaction
                    .transaction_id
            }

        # -----------------------------------------
        # 5. Validate supported action
        # -----------------------------------------

        if (
            approval.action_type
            != "CONVERT_USD_TO_PKR"
        ):
            return {
                "success": False,
                "message": (
                    "Mock Bank only supports "
                    "CONVERT_USD_TO_PKR "
                    "for this demo."
                )
            }

        # -----------------------------------------
        # 6. Validate approval currency
        # -----------------------------------------

        if approval.currency != "USD":
            return {
                "success": False,
                "message": (
                    "Mock Bank conversion "
                    "currently supports USD only."
                )
            }

        approved_amount = to_money(
            approval.amount
        )

        if approved_amount <= 0:
            return {
                "success": False,
                "message": (
                    "Transaction blocked because "
                    "the approved amount is invalid."
                )
            }

        # -----------------------------------------
        # 7. Get unprocessed USD payments
        # -----------------------------------------

        available_payments = (
            db.query(Payment)
            .filter(
                Payment.currency == "USD",
                Payment.is_processed.is_(False)
            )
            .order_by(
                Payment.id.asc()
            )
            .all()
        )

        available_amount = sum(
            (
                to_money(payment.amount)
                for payment
                in available_payments
            ),
            Decimal("0.00")
        )

        available_amount = to_money(
            available_amount
        )

        # -----------------------------------------
        # 8. Verify enough income exists
        # -----------------------------------------

        if (
            available_amount
            < approved_amount
        ):
            return {
                "success": False,
                "message": (
                    "Transaction blocked. "
                    "There is not enough "
                    "unprocessed USD income "
                    "available for this approved "
                    "conversion."
                ),
                "approved_amount":
                    float(approved_amount),
                "available_amount":
                    float(available_amount)
            }

        # -----------------------------------------
        # 9. Match complete payment records
        # -----------------------------------------

        selected_payments = []
        selected_amount = Decimal(
            "0.00"
        )

        for payment in available_payments:
            if (
                selected_amount
                >= approved_amount
            ):
                break

            payment_amount = to_money(
                payment.amount
            )

            next_amount = to_money(
                selected_amount
                + payment_amount
            )

            # Never partially process a payment.
            if (
                next_amount
                > approved_amount
            ):
                return {
                    "success": False,
                    "message": (
                        "Transaction blocked "
                        "because the approved "
                        "amount does not match "
                        "complete unprocessed "
                        "payment records."
                    ),
                    "approved_amount":
                        float(
                            approved_amount
                        ),
                    "matched_amount":
                        float(
                            selected_amount
                        )
                }

            selected_payments.append(
                payment
            )

            selected_amount = (
                next_amount
            )

        selected_amount = to_money(
            selected_amount
        )

        if (
            selected_amount
            != approved_amount
        ):
            return {
                "success": False,
                "message": (
                    "Transaction blocked "
                    "because the approved "
                    "amount could not be "
                    "matched to available "
                    "payments."
                ),
                "approved_amount":
                    float(
                        approved_amount
                    ),
                "matched_amount":
                    float(
                        selected_amount
                    )
            }

        # -----------------------------------------
        # 10. Calculate mock conversion
        # -----------------------------------------

        target_amount = to_money(
            approved_amount
            * MOCK_USD_PKR_RATE
        )

        transaction_id = (
            "MOCK-"
            + uuid.uuid4()
            .hex[:10]
            .upper()
        )

        # -----------------------------------------
        # 11. Create bank transaction
        # -----------------------------------------

        transaction = BankTransaction(
            approval_id=approval.id,
            transaction_id=
                transaction_id,
            action_type=
                approval.action_type,
            source_amount=
                float(
                    approved_amount
                ),
            source_currency=
                approval.currency,
            target_amount=
                float(
                    target_amount
                ),
            target_currency="PKR",
            exchange_rate=
                float(
                    MOCK_USD_PKR_RATE
                ),
            status="COMPLETED"
        )

        db.add(transaction)

        # -----------------------------------------
        # 12. Mark matched payments processed
        # -----------------------------------------

        processed_payment_ids = []

        for payment in selected_payments:
            payment.is_processed = True

            processed_payment_ids.append(
                payment.id
            )

        # -----------------------------------------
        # 13. Create audit log
        # -----------------------------------------

        audit = AuditLog(
            actor="Mock Bank API",
            action=(
                "MOCK_CONVERSION_EXECUTED"
            ),
            reason=(
                f"Approved request "
                f"#{approval.id} was executed "
                f"using mock banking data. "
                f"Processed payment IDs: "
                f"{processed_payment_ids}"
            ),
            status="COMPLETED"
        )

        db.add(audit)

        # -----------------------------------------
        # 14. Flush before final commit
        # -----------------------------------------
        # This asks the database to validate
        # pending changes before we permanently
        # commit them.

        db.flush()

        # -----------------------------------------
        # 15. Atomic commit
        # -----------------------------------------
        # Transaction record + payment states +
        # audit log are committed together.
        #
        # If anything above fails, the exception
        # handlers below roll everything back.

        db.commit()

        db.refresh(transaction)

        # -----------------------------------------
        # 16. Return verified result
        # -----------------------------------------

        return {
            "success": True,
            "message": (
                "Mock bank conversion "
                "completed."
            ),
            "transaction": {
                "transaction_id":
                    transaction
                    .transaction_id,

                "approval_id":
                    transaction
                    .approval_id,

                "from": {
                    "amount":
                        transaction
                        .source_amount,
                    "currency":
                        transaction
                        .source_currency
                },

                "to": {
                    "amount":
                        transaction
                        .target_amount,
                    "currency":
                        transaction
                        .target_currency
                },

                "exchange_rate":
                    transaction
                    .exchange_rate,

                "status":
                    transaction
                    .status,

                "processed_payment_ids":
                    processed_payment_ids
            },
            "data_source":
                "MOCK BANK API"
        }

    except SQLAlchemyError:
        # -----------------------------------------
        # Database safety rollback
        # -----------------------------------------

        db.rollback()

        return {
            "success": False,
            "message": (
                "Mock bank transaction failed "
                "and all database changes were "
                "rolled back safely."
            )
        }

    except Exception:
        # -----------------------------------------
        # Unexpected error safety rollback
        # -----------------------------------------

        db.rollback()

        return {
            "success": False,
            "message": (
                "Mock bank transaction could "
                "not be completed. No partial "
                "financial changes were saved."
            )
        }