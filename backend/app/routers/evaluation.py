"""
Evaluation & Latent Space Router
Serves benchmark comparison tables, confusion matrices, and 3D PCA coordinates.
"""

from fastapi import APIRouter, HTTPException
from app.schemas import ModelEvaluationResponse, PCAPointsResponse
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api", tags=["Evaluation"])


@router.get("/models/evaluation", response_model=ModelEvaluationResponse)
async def get_model_evaluation():
    """
    Returns cross-validation metrics, confusion matrix, and feature importances
    for academic viva defense and model comparison.
    """
    if not ml_service.metrics:
        raise HTTPException(
            status_code=404,
            detail="Evaluation metrics not found. Please ensure train_models.py has been run."
        )
    return ModelEvaluationResponse(**ml_service.metrics)


@router.get("/clusters/pca-points", response_model=PCAPointsResponse)
async def get_pca_points():
    """
    Returns pre-computed 2D/3D PCA coordinates and cluster assignments
    for interactive Plotly background scatter plots.
    """
    points = ml_service.metrics.get("pca_sample_points", [])
    return PCAPointsResponse(
        status="success",
        total_points=len(points),
        points=points
    )
