"""
Sample Presets Router
Serves profile-based financial simulations and downloadable sample CSVs.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Response
from app.schemas import SampleProfileItem, UploadStatementResponse
from app.services.sample_service import sample_service
from app.services.statement_parser import statement_parser
from app.services.insights_service import insights_service
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

    preset_meta = next((p for p in sample_service.get_all_samples() if p.profile_id == profile_id), None)
    display_name = preset_meta.title if preset_meta else f"{profile_id}.csv"

    summary, features, business_metrics, transactions_df = statement_parser.parse_and_extract(
        file_bytes=csv_bytes,
        filename=display_name
    )
    predictions = ml_service.predict(
        features_dict=features.model_dump(),
        entity_type="salaried_individual",
        opex=business_metrics.get("detected_opex", 0.0),
        capex=business_metrics.get("detected_capex", 0.0),
        digital_ratio=business_metrics.get("digital_receipts_ratio", 1.0)
    )

    insight_request = insights_service.request_from_statement(
        features=features.model_dump(),
        transactions_df=transactions_df,
        summary=summary,
        archetype_prediction=predictions.lifestyle_archetype,
    )

    return UploadStatementResponse(
        status="success",
        statement_summary=summary,
        extracted_features=features,
        predictions=predictions,
        transactions=statement_parser.build_transaction_records(transactions_df),
        category_breakdown=summary.category_breakdown,
        monthly_category_breakdown=summary.monthly_category_breakdown,
        insights=insights_service.generate(insight_request)
    )

