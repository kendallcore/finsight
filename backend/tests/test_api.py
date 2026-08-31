"""
FinSight Backend API Test Suite
Validates all endpoints, Pydantic schemas, and ML inference outputs.
"""

import pytest
import io
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["tax_regime_year"] == "FY 2025-26"
    assert data["models_loaded"] is True
    assert data["features_dimension"] == 16
    assert data["tax_slab_classes"] == 7


def test_model_evaluation_endpoint():
    response = client.get("/api/models/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["regression_comparison"]) >= 3
    assert len(data["classification_comparison"]) >= 3
    assert len(data["confusion_matrix"]) == 7
    assert len(data["confusion_matrix_labels"]) == 7
    assert len(data["feature_importance"]) == 16


def test_pca_points_endpoint():
    response = client.get("/api/clusters/pca-points")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_points"] > 0
    first_pt = data["points"][0]
    assert "pca_x" in first_pt
    assert "pca_y" in first_pt
    assert "pca_z" in first_pt
    assert "cluster_id" in first_pt


def test_sample_profiles_endpoints():
    response = client.get("/api/samples")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
    
    # Test analyze sample
    analyze_resp = client.post("/api/samples/balanced_pro/analyze")
    assert analyze_resp.status_code == 200
    res_data = analyze_resp.json()
    assert res_data["status"] == "success"
    assert "predictions" in res_data
    assert "tax_breakdown" in res_data["predictions"]


def test_predict_features_manual():
    payload = {
        "log_annual_credit": 14.18,
        "log_annual_debit": 13.79,
        "net_savings_ratio": 0.32,
        "monthly_burn_rate": 0.68,
        "salary_inflow_ratio": 0.88,
        "monthly_credit_cv": 0.08,
        "salary_regularity_score": 1.0,
        "bonus_lump_sum_ratio": 0.10,
        "investment_ratio": 0.18,
        "fixed_obligation_ratio": 0.31,
        "discretionary_ratio": 0.21,
        "tax_shield_ratio": 0.08,
        "upi_velocity_index": 0.72,
        "micro_spend_density": 0.06,
        "log_avg_ticket_size": 7.62,
        "capital_gains_flux": 0.0
    }
    response = client.post("/api/predict-features", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["predictions"]["estimated_annual_income"] > 0
    assert data["predictions"]["predicted_tax_slab"]["class_id"] in range(7)
    assert len(data["predictions"]["predicted_tax_slab"]["probabilities"]) == 7


def test_upload_statement_csv():
    # Construct a minimal realistic bank CSV
    csv_content = """date,amount,type,narration,payment_mode,category
2025-01-01,100000,CREDIT,ACH CR - INFOSYS LTD,ACH,SALARY
2025-01-05,25000,DEBIT,UPI - RENT TO LANDLORD,UPI,RENT
2025-01-10,15000,DEBIT,ACH DR - ZERODHA SIP,ACH,INVESTMENT
2025-01-15,350,DEBIT,UPI - SWIGGY BANGALORE,UPI,FOOD
2025-02-01,100000,CREDIT,ACH CR - INFOSYS LTD,ACH,SALARY
2025-02-05,25000,DEBIT,UPI - RENT TO LANDLORD,UPI,RENT
"""
    files = {"file": ("test_statement.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/upload-statement", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["statement_summary"]["total_transactions"] == 6
    assert data["predictions"]["estimated_annual_income"] > 0
    assert data["predictions"]["tax_breakdown"]["gross_income"] > 0
