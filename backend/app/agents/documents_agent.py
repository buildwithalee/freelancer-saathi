import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)

from sqlalchemy.orm import Session

from app.models.bank_transaction import BankTransaction


DOCUMENTS_DIR = "generated_documents"


def generate_transaction_receipt(
    db: Session,
    transaction_id: str
):
    transaction = (
        db.query(BankTransaction)
        .filter(
            BankTransaction.transaction_id == transaction_id
        )
        .first()
    )

    if not transaction:
        return {
            "success": False,
            "message": "Transaction not found."
        }

    if transaction.status != "COMPLETED":
        return {
            "success": False,
            "message": (
                "Receipt can only be generated "
                "for completed transactions."
            )
        }

    os.makedirs(
        DOCUMENTS_DIR,
        exist_ok=True
    )

    filename = (
        f"receipt_{transaction.transaction_id}.pdf"
    )

    filepath = os.path.join(
        DOCUMENTS_DIR,
        filename
    )

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReceiptTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=22,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        "ReceiptSubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=20
    )

    story = []

    story.append(
        Paragraph(
            "Freelancer Saathi",
            title_style
        )
    )

    story.append(
        Paragraph(
            "Mock Bank Transaction Receipt",
            subtitle_style
        )
    )

    story.append(
        Paragraph(
            "<b>Transaction Completed Successfully</b>",
            styles["Heading2"]
        )
    )

    story.append(
        Spacer(1, 10)
    )

    data = [
        [
            "Transaction ID",
            transaction.transaction_id
        ],
        [
            "Approval ID",
            str(transaction.approval_id)
        ],
        [
            "Action",
            transaction.action_type
        ],
        [
            "Source Amount",
            f"{transaction.source_amount:.2f} "
            f"{transaction.source_currency}"
        ],
        [
            "Exchange Rate",
            f"1 USD = "
            f"{transaction.exchange_rate:.2f} PKR"
        ],
        [
            "Converted Amount",
            f"{transaction.target_amount:.2f} "
            f"{transaction.target_currency}"
        ],
        [
            "Status",
            transaction.status
        ],
        [
            "Data Source",
            "Mock Bank API"
        ]
    ]

    table = Table(
        data,
        colWidths=[
            55 * mm,
            105 * mm
        ]
    )

    table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                colors.HexColor("#F2F2F2")
            ),
            (
                "FONTNAME",
                (0, 0),
                (0, -1),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                8
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                8
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                8
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                8
            )
        ])
    )

    story.append(table)

    story.append(
        Spacer(1, 20)
    )

    story.append(
        Paragraph(
            "This document was generated automatically "
            "by the Freelancer Saathi Documents Agent.",
            styles["Normal"]
        )
    )

    story.append(
        Spacer(1, 8)
    )

    story.append(
        Paragraph(
            "<b>Demo Notice:</b> This receipt uses mock "
            "banking and exchange-rate data. No real "
            "financial transaction was performed.",
            styles["Normal"]
        )
    )

    doc.build(story)

    return {
        "success": True,
        "message": "Transaction receipt generated successfully.",
        "transaction_id": transaction.transaction_id,
        "filename": filename,
        "filepath": filepath
    }