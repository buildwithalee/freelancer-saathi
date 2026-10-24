from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.approval import Approval
from app.models.bank_transaction import BankTransaction
from app.services.mock_bank import execute_mock_conversion


router = APIRouter(
    prefix="/bank",
    tags=["Mock Bank"]
)


# -------------------------------------------------
# Execute Mock Currency Conversion
# -------------------------------------------------

@router.post("/convert/{approval_id}")
def convert_currency(
    approval_id: int,
    db: Session = Depends(get_db)
):
    # Approval IDs must always be positive.
    if approval_id <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Approval ID must be "
                "greater than 0."
            )
        )

    try:
        # -----------------------------------------
        # Verify approval exists
        # -----------------------------------------

        approval = (
            db.query(Approval)
            .filter(
                Approval.id == approval_id
            )
            .first()
        )

        if not approval:
            raise HTTPException(
                status_code=404,
                detail="Approval request not found."
            )

        # -----------------------------------------
        # Approval is mandatory
        # -----------------------------------------

        if approval.status != "APPROVED":
            raise HTTPException(
                status_code=403,
                detail=(
                    "Transaction blocked. "
                    "User approval is required "
                    "before execution."
                )
            )

        # -----------------------------------------
        # Prevent duplicate execution
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
            raise HTTPException(
                status_code=409,
                detail={
                    "message": (
                        "This approval has already "
                        "been executed."
                    ),
                    "transaction_id":
                        existing_transaction
                        .transaction_id
                }
            )

        # -----------------------------------------
        # Execute through Mock Bank service
        # -----------------------------------------

        result = execute_mock_conversion(
            db=db,
            approval_id=approval_id
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail={
                    "message": result.get(
                        "message",
                        "Mock conversion failed."
                    ),
                    "approved_amount":
                        result.get(
                            "approved_amount"
                        ),
                    "available_amount":
                        result.get(
                            "available_amount"
                        ),
                    "matched_amount":
                        result.get(
                            "matched_amount"
                        )
                }
            )

        return result

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Mock bank operation could "
                "not be completed safely."
            )
        )


# -------------------------------------------------
# Get Mock Bank Transactions
# -------------------------------------------------

@router.get("/transactions")
def get_transactions(
    db: Session = Depends(get_db)
):
    try:
        transactions = (
            db.query(BankTransaction)
            .order_by(
                BankTransaction.id.desc()
            )
            .all()
        )

        return {
            "success": True,
            "data_source": "MOCK BANK API",
            "total": len(transactions),
            "transactions": transactions
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail=(
                "Mock bank transactions "
                "could not be retrieved."
            )
        )