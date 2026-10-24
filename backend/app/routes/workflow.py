from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.agent_workflow import analyze_finances


router = APIRouter(
    prefix="/workflow",
    tags=["Agent Workflow"]
)


@router.post("/analyze")
def run_financial_analysis(
    db: Session = Depends(get_db)
):
    return analyze_finances(db)