import re

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from pydantic import (
    BaseModel,
    Field,
    field_validator
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db

from app.agents.income_agent import get_income_summary
from app.agents.fx_advisor import get_fx_advice
from app.agents.guardian_agent import decide_approval
from app.agents.documents_agent import generate_transaction_receipt

from app.models.approval import Approval
from app.models.bank_transaction import BankTransaction

from app.services.ai_chat import ask_freelancer_saathi
from app.services.agent_workflow import analyze_finances
from app.services.mock_bank import execute_mock_conversion


router = APIRouter(
    prefix="/chat",
    tags=["AI Chat"]
)


# -------------------------------------------------
# Request Model
# -------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000
    )

    @field_validator("message")
    @classmethod
    def validate_message(
        cls,
        value: str
    ):
        clean_message = value.strip()

        if not clean_message:
            raise ValueError(
                "Message cannot be empty."
            )

        return clean_message


# -------------------------------------------------
# Helper: Extract approval decision
# -------------------------------------------------

def extract_approval_decision(
    message: str
):
    text = message.lower()

    approval_match = re.search(
        r"(?:approval|request)\s*#?\s*(\d+)",
        text
    )

    if not approval_match:
        return None

    approval_id = int(
        approval_match.group(1)
    )

    approve_words = [
        "approve",
        "approved",
        "accept",
        "yes",
        "haan",
        "han"
    ]

    reject_words = [
        "reject",
        "rejected",
        "decline",
        "deny",
        "cancel"
    ]

    if any(
        word in text
        for word in approve_words
    ):
        return {
            "approval_id": approval_id,
            "decision": "APPROVED"
        }

    if any(
        word in text
        for word in reject_words
    ):
        return {
            "approval_id": approval_id,
            "decision": "REJECTED"
        }

    return None


# -------------------------------------------------
# Helper: Extract execution request
# -------------------------------------------------

def extract_execution_request(
    message: str
):
    text = message.lower()

    approval_match = re.search(
        r"(?:approval|request)\s*#?\s*(\d+)",
        text
    )

    if not approval_match:
        return None

    execution_words = [
        "execute",
        "convert",
        "conversion",
        "transaction",
        "run"
    ]

    if not any(
        word in text
        for word in execution_words
    ):
        return None

    return {
        "approval_id": int(
            approval_match.group(1)
        )
    }


# -------------------------------------------------
# Helper: Extract receipt request
# -------------------------------------------------

def extract_receipt_request(
    message: str
):
    text = message.lower()

    receipt_words = [
        "receipt",
        "pdf",
        "rasid",
        "raseed"
    ]

    action_words = [
        "generate",
        "create",
        "banao",
        "bana",
        "download",
        "do",
        "de"
    ]

    has_receipt_word = any(
        word in text
        for word in receipt_words
    )

    has_action_word = any(
        word in text
        for word in action_words
    )

    if not (
        has_receipt_word
        and has_action_word
    ):
        return None

    transaction_match = re.search(
        r"(MOCK-[A-Z0-9]+)",
        message,
        re.IGNORECASE
    )

    if not transaction_match:
        return None

    return {
        "transaction_id":
            transaction_match
            .group(1)
            .upper()
    }


# -------------------------------------------------
# Helper: Get approval details
# -------------------------------------------------

def get_approval_details(
    db: Session,
    approval_id: int
):
    approval = (
        db.query(Approval)
        .filter(
            Approval.id == approval_id
        )
        .first()
    )

    if not approval:
        return None

    return {
        "id":
            approval.id,
        "action_type":
            approval.action_type,
        "amount":
            approval.amount,
        "currency":
            approval.currency,
        "reason":
            approval.reason,
        "status":
            approval.status
    }


# -------------------------------------------------
# Helper: Get transaction details
# -------------------------------------------------

def get_transaction_details(
    db: Session,
    transaction_id: str
):
    transaction = (
        db.query(BankTransaction)
        .filter(
            BankTransaction.transaction_id
            == transaction_id
        )
        .first()
    )

    if not transaction:
        return None

    return {
        "transaction_id":
            transaction.transaction_id,
        "approval_id":
            transaction.approval_id,
        "action_type":
            transaction.action_type,
        "source_amount":
            transaction.source_amount,
        "source_currency":
            transaction.source_currency,
        "target_amount":
            transaction.target_amount,
        "target_currency":
            transaction.target_currency,
        "exchange_rate":
            transaction.exchange_rate,
        "status":
            transaction.status
    }


# -------------------------------------------------
# Main Chat Endpoint
# -------------------------------------------------

@router.post("/")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    try:
        user_message = request.message

        # -----------------------------------------
        # 1. Get verified financial context
        # -----------------------------------------

        income = get_income_summary(db)
        fx = get_fx_advice()

        # -----------------------------------------
        # 2. Detect user intents
        # -----------------------------------------

        approval_request = (
            extract_approval_decision(
                user_message
            )
        )

        execution_request = (
            extract_execution_request(
                user_message
            )
        )

        receipt_request = (
            extract_receipt_request(
                user_message
            )
        )

        approval_details = None
        approval_decision = None
        bank_execution = None
        transaction_details = None
        receipt_result = None
        workflow_result = None

        # -----------------------------------------
        # 3. Handle approval decision
        # -----------------------------------------

        if approval_request:
            approval_id = approval_request[
                "approval_id"
            ]

            if approval_id <= 0:
                approval_decision = {
                    "success": False,
                    "message":
                        "Invalid approval ID."
                }

            else:
                approval_details = (
                    get_approval_details(
                        db,
                        approval_id
                    )
                )

                if not approval_details:
                    approval_decision = {
                        "success": False,
                        "message":
                            "Approval request not found."
                    }

                elif (
                    approval_details["status"]
                    != "PENDING"
                ):
                    approval_decision = {
                        "success": False,
                        "message": (
                            "This approval has already "
                            f"been "
                            f"{approval_details['status'].lower()}."
                        )
                    }

                else:
                    approval_decision = (
                        decide_approval(
                            db=db,
                            approval_id=approval_id,
                            decision=(
                                approval_request[
                                    "decision"
                                ]
                            )
                        )
                    )

                    approval_details = (
                        get_approval_details(
                            db,
                            approval_id
                        )
                    )

        # -----------------------------------------
        # 4. Handle execution request
        # -----------------------------------------

        elif execution_request:
            approval_id = execution_request[
                "approval_id"
            ]

            if approval_id <= 0:
                bank_execution = {
                    "success": False,
                    "message":
                        "Invalid approval ID."
                }

            else:
                approval_details = (
                    get_approval_details(
                        db,
                        approval_id
                    )
                )

                if not approval_details:
                    bank_execution = {
                        "success": False,
                        "message":
                            "Approval request not found."
                    }

                elif (
                    approval_details["status"]
                    != "APPROVED"
                ):
                    bank_execution = {
                        "success": False,
                        "message": (
                            "Transaction blocked. "
                            "User approval is required "
                            "before execution."
                        )
                    }

                else:
                    bank_execution = (
                        execute_mock_conversion(
                            db=db,
                            approval_id=approval_id
                        )
                    )

                    if (
                        bank_execution
                        and bank_execution.get(
                            "transaction"
                        )
                    ):
                        transaction_id = (
                            bank_execution[
                                "transaction"
                            ][
                                "transaction_id"
                            ]
                        )

                        transaction_details = (
                            get_transaction_details(
                                db,
                                transaction_id
                            )
                        )

                    elif (
                        bank_execution
                        and bank_execution.get(
                            "transaction_id"
                        )
                    ):
                        transaction_details = (
                            get_transaction_details(
                                db,
                                bank_execution[
                                    "transaction_id"
                                ]
                            )
                        )

        # -----------------------------------------
        # 5. Handle receipt request
        # -----------------------------------------

        elif receipt_request:
            transaction_id = (
                receipt_request[
                    "transaction_id"
                ]
            )

            transaction_details = (
                get_transaction_details(
                    db,
                    transaction_id
                )
            )

            if not transaction_details:
                receipt_result = {
                    "success": False,
                    "message":
                        "Transaction not found."
                }

            elif (
                transaction_details["status"]
                != "COMPLETED"
            ):
                receipt_result = {
                    "success": False,
                    "message": (
                        "Receipt cannot be generated "
                        "because the transaction is "
                        "not completed."
                    )
                }

            else:
                receipt_result = (
                    generate_transaction_receipt(
                        db=db,
                        transaction_id=
                            transaction_id
                    )
                )

                if (
                    receipt_result
                    and receipt_result.get(
                        "success"
                    )
                ):
                    receipt_result[
                        "download_url"
                    ] = (
                        "/documents/receipt/"
                        f"{transaction_id}/download"
                    )

        # -----------------------------------------
        # 6. Run workflow only when relevant
        # -----------------------------------------

        else:
            finance_words = [
                "income",
                "payment",
                "payments",
                "earning",
                "earnings",
                "usd",
                "pkr",
                "rate",
                "fx",
                "convert",
                "conversion",
                "approve",
                "approval",
                "financial",
                "finance",
                "paisa",
                "paise",
                "kamai",
                "balance"
            ]

            if any(
                word in user_message.lower()
                for word in finance_words
            ):
                workflow_result = (
                    analyze_finances(db)
                )

                if workflow_result.get(
                    "approval"
                ):
                    approval_details = (
                        workflow_result[
                            "approval"
                        ]
                    )

        # -----------------------------------------
        # 7. Refresh financial state
        # -----------------------------------------

        income = get_income_summary(db)

        # -----------------------------------------
        # 8. Build trusted AI context
        # -----------------------------------------

        context = f"""
VERIFIED FREELANCER SAATHI DATA

INCOME SUMMARY
Period: {income['period']}
Payment count: {income['payment_count']}
Total income: {income['total_income']} {income['currency']}
Already processed amount: {income['processed_amount']} {income['currency']}
Available for conversion: {income['available_for_conversion']} {income['currency']}
Available unprocessed payment count: {income['available_payment_count']}

IMPORTANT INCOME INTERPRETATION
- Total income is historical income received during the period.
- Total income is NOT the same as available balance.
- Already processed amount has already been handled/converted.
- Only "Available for conversion" can be considered for a new conversion.
- Never tell the user that processed income is still available.
- Never recommend converting more than the verified available-for-conversion amount.
- If available for conversion is 0, clearly say that no income is currently available for a new conversion.

FX ADVISOR
Pair: {fx['pair']}
Current mock rate: {fx['current_rate']}
30-day mock average: {fx['average_30_days']}
Recommendation: {fx['recommendation']}
Reason: {fx['reason']}
Data source: {fx['data_source']}
Disclaimer: {fx['disclaimer']}
"""

        # -----------------------------------------
        # 9. Add workflow context
        # -----------------------------------------

        if workflow_result:
            context += f"""

WORKFLOW RESULT
Approval required: {
    workflow_result.get(
        'approval_required'
    )
}
Assistant message: {
    workflow_result.get(
        'assistant_message'
    )
}
"""

        # -----------------------------------------
        # 10. Add approval context
        # -----------------------------------------

        if approval_details:
            context += f"""

APPROVAL DETAILS
Approval ID: {
    approval_details.get('id')
}
Action type: {
    approval_details.get(
        'action_type'
    )
}
Amount: {
    approval_details.get('amount')
}
Currency: {
    approval_details.get(
        'currency'
    )
}
Status: {
    approval_details.get('status')
}
Reason: {
    approval_details.get('reason')
}
"""

        # -----------------------------------------
        # 11. Add approval decision context
        # -----------------------------------------

        if approval_decision:
            context += f"""

APPROVAL DECISION RESULT
{approval_decision}
"""

        # -----------------------------------------
        # 12. Add bank execution context
        # -----------------------------------------

        if bank_execution:
            context += f"""

MOCK BANK EXECUTION RESULT
{bank_execution}
"""

        # -----------------------------------------
        # 13. Add transaction context
        # -----------------------------------------

        if transaction_details:
            context += f"""

VERIFIED TRANSACTION DETAILS
{transaction_details}
"""

        # -----------------------------------------
        # 14. Add receipt context
        # -----------------------------------------

        if receipt_result:
            context += f"""

RECEIPT RESULT
{receipt_result}
"""

        # -----------------------------------------
        # 15. Final AI rules
        # -----------------------------------------

        context += """

FINAL RESPONSE RULES

Use only the verified data above for financial facts.

Never invent:
- balances
- payments
- approval statuses
- transaction statuses
- exchange rates
- receipts

The "Total income" field is informational only.
It does NOT mean that the full amount is still available.

For a new conversion, always use the
"Available for conversion" amount.

If available for conversion is zero,
do not tell the user to convert the
already processed income.

Approval and execution are separate:
APPROVED does not mean EXECUTED.

A transaction is completed only when
verified transaction or bank execution
data confirms COMPLETED.

If an approval or transaction operation
was blocked, clearly explain that the
NEW attempt was blocked.

Do not incorrectly claim that an older
successful transaction failed simply
because a duplicate attempt was blocked.

All bank and FX functionality in this
project currently uses MOCK/DEMO data.

Never describe a mock transaction as a
real bank transaction.
"""

        # -----------------------------------------
        # 16. Send trusted context to AI
        # -----------------------------------------

        ai_input = f"""
USER MESSAGE:
{user_message}

SYSTEM VERIFIED CONTEXT:
{context}
"""

        ai_response = (
            ask_freelancer_saathi(
                ai_input
            )
        )

        # -----------------------------------------
        # 17. Handle AI service failure safely
        # -----------------------------------------

        if not ai_response.get(
            "success"
        ):
            return {
                "success": False,
                "assistant":
                    "Freelancer Saathi",
                "message":
                    ai_response.get(
                        "message",
                        (
                            "AI service filhal "
                            "available nahi hai."
                        )
                    ),
                "model":
                    ai_response.get(
                        "model"
                    ),
                "requires_approval": (
                    workflow_result.get(
                        "approval_required",
                        False
                    )
                    if workflow_result
                    else False
                ),
                "approval": (
                    workflow_result.get(
                        "approval"
                    )
                    if workflow_result
                    else None
                ),
                "approval_details":
                    approval_details,
                "approval_decision":
                    approval_decision,
                "bank_execution":
                    bank_execution,
                "transaction":
                    transaction_details,
                "receipt":
                    receipt_result
            }

        # -----------------------------------------
        # 18. Successful API response
        # -----------------------------------------

        return {
            "success": True,

            "assistant":
                ai_response.get(
                    "assistant",
                    "Freelancer Saathi"
                ),

            "message":
                ai_response.get(
                    "message"
                ),

            "model":
                ai_response.get(
                    "model"
                ),

            "requires_approval": (
                workflow_result.get(
                    "approval_required",
                    False
                )
                if workflow_result
                else False
            ),

            "approval": (
                workflow_result.get(
                    "approval"
                )
                if workflow_result
                else None
            ),

            "approval_details":
                approval_details,

            "approval_decision":
                approval_decision,

            "bank_execution":
                bank_execution,

            "transaction":
                transaction_details,

            "receipt":
                receipt_result
        }

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Chat request could not be "
                "completed because of a "
                "database error."
            )
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Chat request could not be "
                "completed safely."
            )
        )