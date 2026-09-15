"""
Insights Router
Serves the rule-based coaching feed, anomaly narratives and improvement paths.
"""

from fastapi import APIRouter, HTTPException

from app.schemas import InsightRequest, InsightResponse
from app.services.insights_service import insights_service
from app.services.sample_service import sample_service
from app.services.statement_parser import statement_parser

router = APIRouter(prefix="/api", tags=["Insights"])


@router.post("/insights", response_model=InsightResponse)
async def create_insights(payload: InsightRequest) -> InsightResponse:
    """
    Accepts a 16D feature vector plus optional category breakdown / transaction records and
    returns ROI-ranked insights, anomaly narratives, improvement paths and the persona benchmark.
    """
    if not payload.features:
        raise HTTPException(status_code=422, detail="At least one feature value is required to generate insights.")
    try:
        return insights_service.generate(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Insight generation failed: {str(exc)}")


@router.get("/insights/{profile_id}", response_model=InsightResponse)
async def get_profile_insights(profile_id: str) -> InsightResponse:
    """
    Returns the full coaching payload for a preset sample profile, reusing the same
    parse -> categorize -> reason pipeline an uploaded statement goes through.
    """
    csv_bytes = sample_service.get_sample_csv_bytes(profile_id)
    if not csv_bytes:
        raise HTTPException(status_code=404, detail=f"Sample profile '{profile_id}' not found.")

    try:
        summary, features, _business_metrics, transactions_df = statement_parser.parse_and_extract(
            file_bytes=csv_bytes,
            filename=f"{profile_id}.csv"
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse sample profile: {str(exc)}")

    request = insights_service.request_from_statement(
        features=features.model_dump(),
        transactions_df=transactions_df,
        summary=summary,
    )
    return insights_service.generate(request)
