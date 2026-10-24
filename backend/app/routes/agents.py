from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.income_agent import get_income_summary
from app.agents.fx_advisor import get_fx_advice
from app.database import get_db


router = APIRouter(
    prefix="/agents",
    tags=["AI Agents"]
)


@router.get("/income-summary")
def income_summary(
    db: Session = Depends(get_db)
):
    return get_income_summary(db)


@router.get("/fx-advice")
def fx_advice():
    return get_fx_advice()