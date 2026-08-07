# FastAPI Backend REST API Contract

This document outlines the OpenAPI specification and JSON schemas for all endpoints exposed by the FinSight backend.

---

## 1. Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/upload-statement` | Ingests multipart CSV file and returns features + predictions |
| `POST` | `/api/predict-features` | Takes an 8-dimensional feature payload and returns predictions |
| `GET` | `/api/models/evaluation` | Returns benchmark performance metrics across all models |
| `GET` | `/api/clusters/pca-points` | Returns sampled 2D/3D PCA points and centroids for visualization |
| `GET` | `/api/samples/{profile_id}` | Returns pre-built sample statements for instant 1-click viva demos |
| `GET` | `/api/health` | Service health and loaded model status check |

---

## 2. Detailed Schemas

### `POST /api/upload-statement`
- **Request**: Multipart Form Data with file field `file` (`.csv`).
- **Response (`200 OK`)**:
```json
{
  "status": "success",
  "statement_summary": {
    "total_transactions": 365,
    "date_range": { "from": "2025-01-01", "to": "2025-12-31" },
    "total_credits": 1280000.0,
    "total_debits": 890000.0
  },
  "extracted_features": {
    "annual_credit_sum": 1280000.0,
    "annual_debit_sum": 890000.0,
    "net_savings_rate": 0.304,
    "investment_ratio": 0.18,
    "discretionary_ratio": 0.22,
    "rent_emi_ratio": 0.28,
    "monthly_credit_std": 14200.5,
    "micro_upi_count": 215
  },
  "predictions": {
    "estimated_annual_income": 1245000.0,
    "income_confidence_interval": [1190000.0, 1300000.0],
    "predicted_tax_slab": {
      "class_id": 4,
      "bracket_name": "₹12,00,001 - ₹15,00,000",
      "base_rate_percent": 20.0,
      "confidence": 0.884,
      "probabilities": [0.01, 0.02, 0.04, 0.05, 0.88, 0.00]
    },
    "assigned_cluster": {
      "cluster_id": 1,
      "persona_name": "Balanced Professional",
      "pca_2d_coord": [1.42, -0.85],
      "pca_3d_coord": [1.42, -0.85, 0.31]
    }
  }
}
```

---

### `GET /api/models/evaluation`
- **Response (`200 OK`)**:
```json
{
  "regression_comparison": [
    { "model_name": "Ridge Regression", "rmse": 48200.0, "mae": 34100.0, "r2_score": 0.912 },
    { "model_name": "Random Forest Regressor", "rmse": 29400.0, "mae": 19800.0, "r2_score": 0.968 },
    { "model_name": "Gradient Boosting Regressor", "rmse": 28100.0, "mae": 18900.0, "r2_score": 0.973 }
  ],
  "classification_comparison": [
    { "model_name": "Logistic Regression", "accuracy": 0.865, "macro_f1": 0.858 },
    { "model_name": "Decision Tree", "accuracy": 0.892, "macro_f1": 0.889 },
    { "model_name": "Random Forest Classifier", "accuracy": 0.954, "macro_f1": 0.951 },
    { "model_name": "Support Vector Classifier (RBF)", "accuracy": 0.941, "macro_f1": 0.938 }
  ],
  "confusion_matrix": [
    [195, 5, 0, 0, 0, 0],
    [4, 188, 8, 0, 0, 0],
    [0, 6, 189, 5, 0, 0],
    [0, 0, 7, 186, 7, 0],
    [0, 0, 0, 6, 190, 4],
    [0, 0, 0, 0, 5, 195]
  ],
  "feature_importance": [
    { "feature": "annual_credit_sum", "importance": 0.42 },
    { "feature": "rent_emi_ratio", "importance": 0.18 },
    { "feature": "investment_ratio", "importance": 0.15 },
    { "feature": "net_savings_rate", "importance": 0.11 },
    { "feature": "discretionary_ratio", "importance": 0.08 },
    { "feature": "monthly_credit_std", "importance": 0.04 },
    { "feature": "micro_upi_count", "importance": 0.02 }
  ]
}
```
