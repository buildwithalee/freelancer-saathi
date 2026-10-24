from datetime import datetime

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.approval import Approval
from app.models.audit_log import AuditLog


# -------------------------------------------------
# Create Approval Request
# -------------------------------------------------

def create_approval_request(
    db: Session,
    action_type: str,
    amount: float,
    currency: str,
    reason: str
):
    try:
        approval = Approval(
            action_type=action_type,
            amount=amount,
            currency=currency,
            reason=reason,
            status="PENDING"
        )

        db.add(approval)

        # Generate approval ID before creating
        # the audit log, without committing.
        db.flush()

        audit = AuditLog(
            actor="Guardian Agent",
            action="APPROVAL_REQUEST_CREATED",
            reason=(
                f"Approval #{approval.id} created. "
                f"{reason}"
            ),
            status="PENDING"
        )

        db.add(audit)

        # Approval + audit log are saved together.
        db.commit()

        db.refresh(approval)

        return approval

    except SQLAlchemyError:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# -------------------------------------------------
# Decide Approval
# -------------------------------------------------

def decide_approval(
    db: Session,
    approval_id: int,
    decision: str
):
    try:
        if approval_id <= 0:
            return {
                "success": False,
                "message":
                    "Invalid approval ID."
            }

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

        if approval.status != "PENDING":
            return {
                "success": False,
                "message": (
                    "This approval has already "
                    "been decided."
                )
            }

        decision = decision.strip().upper()

        if decision not in {
            "APPROVED",
            "REJECTED"
        }:
            return {
                "success": False,
                "message": (
                    "Decision must be APPROVED "
                    "or REJECTED."
                )
            }

        # -----------------------------------------
        # Update approval
        # -----------------------------------------

        approval.status = decision
        approval.decided_at = datetime.now()

        # -----------------------------------------
        # Create audit record
        # -----------------------------------------

        audit = AuditLog(
            actor="User",
            action=f"REQUEST_{decision}",
            reason=(
                f"User {decision.lower()} "
                f"approval #{approval.id}"
            ),
            status=decision
        )

        db.add(audit)

        # -----------------------------------------
        # Validate pending DB changes
        # -----------------------------------------

        db.flush()

        # -----------------------------------------
        # Atomic commit
        # -----------------------------------------
        # Approval decision + audit record are
        # committed together.

        db.commit()

        db.refresh(approval)

        return {
            "success": True,
            "approval_id":
                approval.id,
            "action_type":
                approval.action_type,
            "status":
                approval.status,
            "message": (
                f"Request successfully "
                f"{decision.lower()}."
            )
        }

    except SQLAlchemyError:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise