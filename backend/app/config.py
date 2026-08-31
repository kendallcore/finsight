"""
FinSight Backend Configuration
Defines file paths, model locations, and runtime settings.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "FinSight Smart Financial Intelligence API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    TAX_REGIME_YEAR: str = "FY 2025-26"
    
    # Model Artifacts
    SCALER_PATH: Path = MODELS_DIR / "scaler.joblib"
    INCOME_REGRESSOR_PATH: Path = MODELS_DIR / "income_regressor.joblib"
    TAX_CLASSIFIER_PATH: Path = MODELS_DIR / "tax_classifier.joblib"
    KMEANS_PATH: Path = MODELS_DIR / "kmeans_personas.joblib"
    PCA_PATH: Path = MODELS_DIR / "pca_projector.joblib"
    METRICS_PATH: Path = MODELS_DIR / "evaluation_metrics.json"
    
    # Data Artifacts
    USER_PROFILES_PATH: Path = DATA_DIR / "user_profiles.csv"
    SYNTHETIC_TXNS_PATH: Path = DATA_DIR / "synthetic_transactions.csv"
    REAL_PROFILES_PATH: Path = DATA_DIR / "real_user_profiles_agami.csv"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/finsight.db"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    model_config = {
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()
