"""
Sample Presets Router
Serves 1-click viva demonstration profiles and downloadable sample CSVs.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Response
from app.schemas import SampleProfileItem, UploadStatementResponse
from app.services.sample_service import sample_service
from app.services.statement_parser import statement_parser
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api/samples", tags=["Samples"])


@router.get("", response_model=List[SampleProfileItem])
async def list_sample_profiles():
    """Returns list of pre-configured sample Indian financial profiles."""
    return sample_service.get_all_samples()


@router.get("/{profile_id}/csv")
async def download_sample_csv(profile_id: str):
    """Downloads sample CSV statement for the selected profile."""
    csv_bytes = sample_service.get_sample_csv_bytes(profile_id)
    if not csv_bytes:
        raise HTTPException(status_code=404, detail=f"Sample profile '{profile_id}' not found.")
    
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={profile_id}_statement.csv"}
    )


@router.post("/{profile_id}/analyze", response_model=UploadStatementResponse)
async def analyze_sample_profile(profile_id: str):
    """Instantly analyzes preset sample profile without requiring manual CSV upload."""
    csv_bytes = sample_service.get_sample_csv_bytes(profile_id)
    if not csv_bytes:
        raise HTTPException(status_code=404, detail=f"Sample profile '{profile_id}' not found.")

    summary, features = statement_parser.parse_and_extract(csv_bytes)
    predictions = ml_service.predict(features.model_dump())

    return UploadStatementResponse(
        status="success",
        statement_summary=summary,
        extracted_features=features,
        predictions=predictions
    )
