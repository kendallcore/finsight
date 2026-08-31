"""
Inference Endpoints Router
Handles CSV statement uploads and manual what-if feature predictions.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.schemas import (
    UploadStatementResponse, PredictFeaturesResponse, ManualFeatureInput,
    ExtractedFeatures
)
from app.services.statement_parser import statement_parser
from app.services.ml_service import ml_service
from app.database.db import get_db
from app.database.models import StatementUploadRecord

router = APIRouter(prefix="/api", tags=["Inference"])


@router.post("/upload-statement", response_model=UploadStatementResponse)
async def upload_statement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Ingests an arbitrary Indian banking CSV statement, extracts the 16D financial
    behavioral feature vector, and computes multi-model predictions.
    """
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a standard CSV banking statement."
        )

    try:
        csv_bytes = await file.read()
        if len(csv_bytes) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

        # 1. Parse and extract features
        summary, features = statement_parser.parse_and_extract(csv_bytes)

        # 2. Execute inference
        predictions = ml_service.predict(features.model_dump())

        # 3. Log to SQLite
        record = StatementUploadRecord(
            filename=file.filename,
            total_transactions=summary.total_transactions,
            total_credits=summary.total_credits,
            total_debits=summary.total_debits,
            predicted_annual_income=predictions.estimated_annual_income,
            predicted_tax_slab=predictions.predicted_tax_slab.bracket_name,
            assigned_persona=predictions.assigned_cluster.persona_name,
            extracted_features_json=features.model_dump(),
            prediction_details_json=predictions.model_dump()
        )
        db.add(record)
        db.commit()

        return UploadStatementResponse(
            status="success",
            statement_summary=summary,
            extracted_features=features,
            predictions=predictions
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error parsing bank statement: {str(e)}"
        )


@router.post("/predict-features", response_model=PredictFeaturesResponse)
async def predict_features(input_data: ManualFeatureInput):
    """
    Accepts direct 16-dimensional slider values for real-time what-if simulations.
    """
    try:
        feat_dict = input_data.model_dump()
        predictions = ml_service.predict(feat_dict)
        features = ExtractedFeatures(**feat_dict)

        return PredictFeaturesResponse(
            status="success",
            extracted_features=features,
            predictions=predictions
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )
