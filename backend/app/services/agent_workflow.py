from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.agents.income_agent import get_income_summary
from app.agents.fx_advisor import get_fx_advice
from app.agents.guardian_agent import (
    create_approval_request
)
from app.models.approval import Approval


SUPPORTED_ACTION = "CONVERT_USD_TO_PKR"
SUPPORTED_CURRENCY = "USD"


# -------------------------------------------------
# Helper: Safe money value
# -------------------------------------------------

def to_money(value):
    return Decimal(
        str(value)
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


# -------------------------------------------------
# Main Financial Workflow
# -------------------------------------------------

def analyze_finances(
    db: Session
):
    """
    Main Freelancer Saathi financial analysis workflow.

    Safety rules:
    - Only unprocessed income can be considered.
    - Never execute a bank transaction automatically.
    - User approval is always required.
    - Do not create duplicate pending approvals.
    """

    try:
        # -----------------------------------------
        # 1. Get verified financial information
        # -----------------------------------------

        income = get_income_summary(db)
        fx = get_fx_advice()

        available_amount = to_money(
            income[
                "available_for_conversion"
            ]
        )

        total_income = to_money(
            income[
                "total_income"
            ]
        )

        result = {
            "workflow":
                "Freelancer Saathi Financial Analysis",

            "income":
                income,

            "fx_advice":
                fx,

            "approval_required":
                False,

            "approval":
                None
        }

        # -----------------------------------------
        # 2. No unprocessed income available
        # -----------------------------------------

        if available_amount <= Decimal(
            "0.00"
        ):
            result["assistant_message"] = (
                f"You received "
                f"${float(total_income):.2f} "
                "during the last 7 days, "
                "but all available income has "
                "already been processed. "
                "There is currently $0.00 "
                "available for a new conversion. "
                "No approval request was created."
            )

            return result

        # -----------------------------------------
        # 3. Validate income currency
        # -----------------------------------------

        if (
            income.get("currency")
            != SUPPORTED_CURRENCY
        ):
            result["assistant_message"] = (
                "The available income currency "
                "is not currently supported for "
                "automatic conversion analysis. "
                "No approval request was created."
            )

            return result

        # -----------------------------------------
        # 4. FX recommends conversion
        # -----------------------------------------

        if (
            fx.get("recommendation")
            == "CONSIDER_CONVERTING"
        ):
            # -------------------------------------
            # Find existing pending approvals
            # -------------------------------------

            pending_approvals = (
                db.query(Approval)
                .filter(
                    Approval.action_type
                    == SUPPORTED_ACTION,

                    Approval.currency
                    == SUPPORTED_CURRENCY,

                    Approval.status
                    == "PENDING"
                )
                .order_by(
                    Approval.id.desc()
                )
                .all()
            )

            # -------------------------------------
            # Reuse exact matching approval
            # -------------------------------------

            existing_approval = None

            for pending_approval in (
                pending_approvals
            ):
                pending_amount = to_money(
                    pending_approval.amount
                )

                if (
                    pending_amount
                    == available_amount
                ):
                    existing_approval = (
                        pending_approval
                    )
                    break

            if existing_approval:
                result[
                    "approval_required"
                ] = True

                result["approval"] = {
                    "id":
                        existing_approval.id,

                    "action_type":
                        existing_approval
                        .action_type,

                    "amount":
                        existing_approval.amount,

                    "currency":
                        existing_approval.currency,

                    "reason":
                        existing_approval.reason,

                    "status":
                        existing_approval.status
                }

                result[
                    "assistant_message"
                ] = (
                    f"${float(available_amount):.2f} "
                    "is currently available for "
                    "conversion. "
                    f"{fx['reason']} "
                    f"Approval request "
                    f"#{existing_approval.id} "
                    "is already pending. "
                    "No duplicate approval "
                    "was created."
                )

                return result

            # -------------------------------------
            # 5. Protect against stale approvals
            # -------------------------------------
            # If another pending conversion
            # approval exists for a different
            # amount, do not silently create
            # another competing approval.

            if pending_approvals:
                stale_approval = (
                    pending_approvals[0]
                )

                result[
                    "assistant_message"
                ] = (
                    f"${float(available_amount):.2f} "
                    "is currently available for "
                    "conversion, but approval "
                    f"#{stale_approval.id} is "
                    "already pending for "
                    f"${stale_approval.amount:.2f}. "
                    "No new approval was created "
                    "to avoid conflicting pending "
                    "financial actions."
                )

                return result

            # -------------------------------------
            # 6. Create new approval
            # -------------------------------------

            approval = (
                create_approval_request(
                    db=db,
                    action_type=
                        SUPPORTED_ACTION,
                    amount=
                        float(
                            available_amount
                        ),
                    currency=
                        SUPPORTED_CURRENCY,
                    reason=
                        fx["reason"]
                )
            )

            result[
                "approval_required"
            ] = True

            result["approval"] = {
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

            result[
                "assistant_message"
            ] = (
                f"${float(available_amount):.2f} "
                "is currently available for "
                "conversion. "
                f"{fx['reason']} "
                "I created an approval request, "
                "but no transaction will happen "
                "until you approve it."
            )

            return result

        # -----------------------------------------
        # 7. FX does not recommend conversion
        # -----------------------------------------

        result["assistant_message"] = (
            f"${float(available_amount):.2f} "
            "is currently available for "
            "conversion. "
            f"{fx['reason']} "
            "No financial action has been "
            "started."
        )

        return result

    except SQLAlchemyError:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise