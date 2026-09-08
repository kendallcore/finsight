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
    assert len(data) == 5
    profile_ids = [p["profile_id"] for p in data]
    assert "student_entry" in profile_ids
    assert "balanced_pro" in profile_ids
    assert "wealth_builder" in profile_ids
    assert "lifestyle_spender" in profile_ids
    assert "real_agami_account" in profile_ids

    # 1. Test CSV downloads for all 5 presets
    for pid in profile_ids:
        csv_resp = client.get(f"/api/samples/{pid}/csv")
        assert csv_resp.status_code == 200
        assert "text/csv" in csv_resp.headers.get("content-type", "")
        assert len(csv_resp.content) > 100

    # 2. Test analysis for student_entry: Class 0 Nil
    student_resp = client.post("/api/samples/student_entry/analyze")
    assert student_resp.status_code == 200
    st_data = student_resp.json()
    assert st_data["predictions"]["estimated_annual_income"] < 450000.0
    assert st_data["predictions"]["predicted_tax_slab"]["class_id"] == 0
    assert st_data["predictions"]["tax_breakdown"]["net_tax_payable"] == 0.0

    # 3. Test analysis for wealth_builder: Class 6 high tax bracket
    wb_resp = client.post("/api/samples/wealth_builder/analyze")
    assert wb_resp.status_code == 200
    wb_data = wb_resp.json()
    assert wb_data["predictions"]["estimated_annual_income"] > 2400000.0
    assert wb_data["predictions"]["predicted_tax_slab"]["class_id"] == 6
    assert wb_data["predictions"]["tax_breakdown"]["net_tax_payable"] > 200000.0
    assert wb_data["predictions"]["assigned_cluster"]["persona_name"] == "High-Growth Wealth Builder"

    # 4. Test analysis for balanced_pro
    bp_resp = client.post("/api/samples/balanced_pro/analyze")
    assert bp_resp.status_code == 200
    bp_data = bp_resp.json()
    assert 1000000.0 < bp_data["predictions"]["estimated_annual_income"] < 1500000.0
    assert bp_data["predictions"]["predicted_tax_slab"]["class_id"] in [2, 3]

    # 5. Test analysis for lifestyle_spender
    ls_resp = client.post("/api/samples/lifestyle_spender/analyze")
    assert ls_resp.status_code == 200
    ls_data = ls_resp.json()
    assert 1200000.0 < ls_data["predictions"]["estimated_annual_income"] < 1600000.0
    assert ls_data["predictions"]["predicted_tax_slab"]["class_id"] == 3


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
    response = client.post("/api/upload-statement", files=files, data={"entity_type": "salaried_individual"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["statement_summary"]["total_transactions"] == 6
    assert data["predictions"]["estimated_annual_income"] > 0
    assert data["predictions"]["tax_breakdown"]["gross_income"] > 0
    assert data["predictions"]["tax_breakdown"]["standard_deduction"] == 75000.0


def test_upload_statement_pdf_real():
    import os
    pdf_paths = [
        "/home/sanjeev/Downloads/Acct Statement_1553_31082026_16.39.39.pdf",
        "/home/prajan/Downloads/IDFCFIRSTBankstatement_10188941711.pdf"
    ]
    target_path = next((p for p in pdf_paths if os.path.exists(p)), None)
    if not target_path:
        pytest.skip("Test statement PDF not present in environment.")
    
    with open(target_path, "rb") as f:
        files = {"file": (os.path.basename(target_path), f, "application/pdf")}
        data_payload = {"entity_type": "salaried_individual"}
        if "1553" in target_path:
            data_payload = {"entity_type": "presumptive_business_44ad", "pdf_password": "254214884"}
            
        response = client.post(
            "/api/upload-statement",
            files=files,
            data=data_payload
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["statement_summary"]["total_transactions"] >= 500
    assert data["statement_summary"]["digital_receipts_ratio"] > 0.80


def test_business_pnl_tax_with_depreciation():
    payload = {
        "entity_type": "regular_business_pnl",
        "opex_amount": 3500000.0,
        "capex_amount": 800000.0, # 15% depreciation = 120,000
        "log_annual_credit": 15.6,
        "log_annual_debit": 15.5,
        "net_savings_ratio": 0.10,
        "monthly_burn_rate": 0.90,
        "salary_inflow_ratio": 0.0,
        "monthly_credit_cv": 0.50,
        "salary_regularity_score": 0.5,
        "bonus_lump_sum_ratio": 0.0,
        "investment_ratio": 0.0,
        "fixed_obligation_ratio": 0.25,
        "discretionary_ratio": 0.05,
        "tax_shield_ratio": 0.0,
        "upi_velocity_index": 0.90,
        "micro_spend_density": 0.02,
        "log_avg_ticket_size": 8.5,
        "capital_gains_flux": 0.0
    }
    response = client.post("/api/predict-features", json=payload)
    assert response.status_code == 200
    data = response.json()
    tb = data["predictions"]["tax_breakdown"]
    assert tb["entity_type"] == "regular_business_pnl"
    assert tb["deductible_opex"] == 3500000.0
    assert tb["capex_investment"] == 800000.0
    assert tb["depreciation_allowance"] == 120000.0
    assert tb["taxable_income"] == round(tb["gross_income"] - 3500000.0 - 120000.0, 2)
