import os
import re

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from fastapi.responses import FileResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.agents.documents_agent import (
    generate_transaction_receipt
)
from app.database import get_db
from app.models.bank_transaction import BankTransaction


router = APIRouter(
    prefix="/documents",
    tags=["Documents Agent"]
)


# -------------------------------------------------
# Helper: Validate Transaction ID
# -------------------------------------------------

def validate_transaction_id(
    transaction_id: str
):
    clean_id = transaction_id.strip().upper()

    if not re.fullmatch(
        r"MOCK-[A-Z0-9]+",
        clean_id
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid transaction ID format."
            )
        )

    return clean_id


# -------------------------------------------------
# Generate Transaction Receipt
# -------------------------------------------------

@router.post("/receipt/{transaction_id}")
def create_receipt(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    transaction_id = (
        validate_transaction_id(
            transaction_id
        )
    )

    try:
        transaction = (
            db.query(BankTransaction)
            .filter(
                BankTransaction.transaction_id
                == transaction_id
            )
            .first()
        )

        if not transaction:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found."
            )

        if transaction.status != "COMPLETED":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Receipt cannot be generated "
                    "because the transaction is "
                    "not completed."
                )
            )

        result = (
            generate_transaction_receipt(
                db=db,
                transaction_id=transaction_id
            )
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get(
                    "message",
                    "Receipt generation failed."
                )
            )

        result["download_url"] = (
            "/documents/receipt/"
            f"{transaction_id}/download"
        )

        return result

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Receipt could not be "
                "generated safely."
            )
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected error occurred "
                "while generating the receipt."
            )
        )


# -------------------------------------------------
# Download Transaction Receipt
# -------------------------------------------------

@router.get("/receipt/{transaction_id}/download")
def download_receipt(
    transaction_id: str
):
    transaction_id = (
        validate_transaction_id(
            transaction_id
        )
    )

    filename = (
        f"receipt_{transaction_id}.pdf"
    )

    filepath = os.path.join(
        "generated_documents",
        filename
    )

    if not os.path.isfile(filepath):
        raise HTTPException(
            status_code=404,
            detail=(
                "Receipt not found. "
                "Generate the receipt first."
            )
        )

    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=filename
    )