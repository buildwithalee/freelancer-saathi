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

from app.agents.guardian_agent import (
    create_approval_request,
    decide_approval
)
from app.database import get_db
from app.models.approval import Approval
from app.models.audit_log import AuditLog


router = APIRouter(
    prefix="/approvals",
    tags=["Guardian & Approvals"]
)


SUPPORTED_ACTIONS = {
    "CONVERT_USD_TO_PKR"
}

SUPPORTED_CURRENCIES = {
    "USD"
}

SUPPORTED_DECISIONS = {
    "APPROVED",
    "REJECTED"
}


# -------------------------------------------------
# Request Models
# -------------------------------------------------

class ApprovalCreate(BaseModel):
    action_type: str = Field(
        min_length=2,
        max_length=100
    )

    amount: float = Field(
        gt=0,
        le=1_000_000
    )

    currency: str = Field(
        default="USD",
        min_length=3,
        max_length=3
    )

    reason: str = Field(
        min_length=5,
        max_length=500
    )

    @field_validator("action_type")
    @classmethod
    def validate_action_type(
        cls,
        value: str
    ):
        action = value.strip().upper()

        if action not in SUPPORTED_ACTIONS:
            raise ValueError(
                "Unsupported financial action."
            )

        return action

    @field_validator("currency")
    @classmethod
    def validate_currency(
        cls,
        value: str
    ):
        currency = value.strip().upper()

        if currency not in SUPPORTED_CURRENCIES:
            raise ValueError(
                "Currently only USD approvals "
                "are supported."
            )

        return currency

    @field_validator("reason")
    @classmethod
    def validate_reason(
        cls,
        value: str
    ):
        reason = value.strip()

        if len(reason) < 5:
            raise ValueError(
                "Approval reason is too short."
            )

        return reason


class ApprovalDecision(BaseModel):
    decision: str

    @field_validator("decision")
    @classmethod
    def validate_decision(
        cls,
        value: str
    ):
        decision = value.strip().upper()

        if decision not in SUPPORTED_DECISIONS:
            raise ValueError(
                "Decision must be APPROVED "
                "or REJECTED."
            )

        return decision


# -------------------------------------------------
# Create Approval
# -------------------------------------------------

@router.post("/")
def request_approval(
    request: ApprovalCreate,
    db: Session = Depends(get_db)
):
    try:
        approval = create_approval_request(
            db=db,
            action_type=request.action_type,
            amount=round(
                request.amount,
                2
            ),
            currency=request.currency,
            reason=request.reason
        )

        return {
            "success": True,
            "message": (
                "Guardian Agent requires "
                "user approval."
            ),
            "approval": {
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
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Approval request could not "
                "be created safely."
            )
        )


# -------------------------------------------------
# Get Approvals
# -------------------------------------------------

@router.get("/")
def get_approvals(
    db: Session = Depends(get_db)
):
    try:
        approvals = (
            db.query(Approval)
            .order_by(
                Approval.id.desc()
            )
            .all()
        )

        return {
            "success": True,
            "total": len(approvals),
            "approvals": approvals
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail=(
                "Approval records could not "
                "be retrieved."
            )
        )


# -------------------------------------------------
# Decide Approval
# -------------------------------------------------

@router.post("/{approval_id}/decision")
def approval_decision(
    approval_id: int,
    request: ApprovalDecision,
    db: Session = Depends(get_db)
):
    if approval_id <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Approval ID must be "
                "greater than 0."
            )
        )

    try:
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

        if approval.status != "PENDING":
            raise HTTPException(
                status_code=409,
                detail=(
                    "This approval has already "
                    f"been {approval.status.lower()}."
                )
            )

        result = decide_approval(
            db=db,
            approval_id=approval_id,
            decision=request.decision
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get(
                    "message",
                    "Approval decision failed."
                )
            )

        return result

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Approval decision could not "
                "be completed safely."
            )
        )


# -------------------------------------------------
# Audit Logs
# -------------------------------------------------

@router.get("/audit/logs")
def get_audit_logs(
    db: Session = Depends(get_db)
):
    try:
        logs = (
            db.query(AuditLog)
            .order_by(
                AuditLog.id.desc()
            )
            .all()
        )

        return {
            "success": True,
            "total": len(logs),
            "logs": logs
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail=(
                "Audit logs could not "
                "be retrieved."
            )
        )