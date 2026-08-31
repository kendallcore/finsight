from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
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
    entity_type: str = Form("salaried_individual"),
    pdf_password: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Ingests an arbitrary Indian banking CSV, TXT, or PDF statement,
    extracts the 16D financial behavioral vector, and computes multi-model predictions
    tailored to the selected entity type (Salaried, 44AD Small Business, 44ADA Professional, Business P&L).
    """
    valid_exts = (".csv", ".txt", ".pdf")
    if not any(file.filename.lower().endswith(ext) for ext in valid_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a standard CSV, TXT, or PDF banking statement."
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

        # 1. Parse and extract features + business breakdown
        summary, features, business_metrics = statement_parser.parse_and_extract(
            file_bytes=file_bytes,
            filename=file.filename,
            password=pdf_password
        )

        # 2. Execute inference tailored to entity type
        predictions = ml_service.predict(
            features_dict=features.model_dump(),
            entity_type=entity_type,
            opex=business_metrics.get("detected_opex", 0.0),
            capex=business_metrics.get("detected_capex", 0.0),
            digital_ratio=business_metrics.get("digital_receipts_ratio", 1.0)
        )

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
        entity_type = feat_dict.pop("entity_type", "salaried_individual")
        opex_amount = feat_dict.pop("opex_amount", 0.0)
        capex_amount = feat_dict.pop("capex_amount", 0.0)

        predictions = ml_service.predict(
            features_dict=feat_dict,
            entity_type=entity_type,
            opex=opex_amount,
            capex=capex_amount
        )
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

