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
    "total_transactions": 482,
    "date_range": { "from": "2025-01-01", "to": "2025-12-31" },
    "total_credits": 1450000.0,
    "total_debits": 980000.0
  },
  "extracted_features": {
    "log_annual_credit": 14.187,
    "log_annual_debit": 13.795,
    "net_savings_ratio": 0.324,
    "monthly_burn_rate": 0.676,
    "salary_inflow_ratio": 0.885,
    "monthly_credit_cv": 0.082,
    "salary_regularity_score": 1.0,
    "bonus_lump_sum_ratio": 0.115,
    "investment_ratio": 0.185,
    "fixed_obligation_ratio": 0.312,
    "discretionary_ratio": 0.214,
    "tax_shield_ratio": 0.085,
    "upi_velocity_index": 0.725,
    "micro_spend_density": 0.064,
    "log_avg_ticket_size": 7.621,
    "capital_gains_flux": 0.0
  },
  "predictions": {
    "estimated_annual_income": 1420000.0,
    "income_confidence_interval": [1365000.0, 1475000.0],
    "predicted_tax_slab": {
      "class_id": 3,
      "bracket_name": "₹12,00,001 - ₹16,00,000",
      "base_rate_percent": 15.0,
      "confidence": 0.942,
      "probabilities": [0.00, 0.01, 0.02, 0.942, 0.028, 0.00, 0.00]
    },
    "assigned_cluster": {
      "cluster_id": 1,
      "persona_name": "Balanced Corporate Professional",
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
    { "model_name": "Ridge Regression", "rmse": 41200.0, "mae": 28400.0, "r2_score": 0.948 },
    { "model_name": "Random Forest Regressor", "rmse": 22100.0, "mae": 14800.0, "r2_score": 0.984 },
    { "model_name": "Gradient Boosting Regressor", "rmse": 19400.0, "mae": 12900.0, "r2_score": 0.989 }
  ],
  "classification_comparison": [
    { "model_name": "Logistic Regression", "accuracy": 0.912, "macro_f1": 0.908 },
    { "model_name": "Support Vector Classifier (RBF)", "accuracy": 0.962, "macro_f1": 0.958 },
    { "model_name": "Random Forest Classifier", "accuracy": 0.974, "macro_f1": 0.971 },
    { "model_name": "Gradient Boosting Classifier", "accuracy": 0.978, "macro_f1": 0.975 }
  ],
  "confusion_matrix": [
    [142, 3, 0, 0, 0, 0, 0],
    [2, 138, 4, 0, 0, 0, 0],
    [0, 3, 140, 3, 0, 0, 0],
    [0, 0, 2, 141, 3, 0, 0],
    [0, 0, 0, 2, 139, 4, 0],
    [0, 0, 0, 0, 3, 142, 2],
    [0, 0, 0, 0, 0, 2, 145]
  ],
  "feature_importance": [
    { "feature": "log_annual_credit", "importance": 0.34 },
    { "feature": "salary_inflow_ratio", "importance": 0.16 },
    { "feature": "log_annual_debit", "importance": 0.12 },
    { "feature": "fixed_obligation_ratio", "importance": 0.10 },
    { "feature": "investment_ratio", "importance": 0.08 },
    { "feature": "net_savings_ratio", "importance": 0.06 },
    { "feature": "salary_regularity_score", "importance": 0.05 },
    { "feature": "tax_shield_ratio", "importance": 0.04 },
    { "feature": "discretionary_ratio", "importance": 0.03 },
    { "feature": "monthly_credit_cv", "importance": 0.02 }
  ]
}
```
