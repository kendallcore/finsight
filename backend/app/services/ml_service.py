"""
FinSight ML Inference & Calculation Service
Manages serialized model lifecycles, runs multi-model inference, and calculates statutory tax liability.
"""

import os
import json
import joblib
import numpy as np
from typing import Dict, List, Any, Tuple
from pathlib import Path

from app.config import settings
from app.schemas import PredictionOutput, TaxSlabPrediction, AssignedCluster, TaxBreakdownSummary


TAX_SLAB_DEFINITIONS = [
    {"class_id": 0, "bracket_name": "Up to ₹4,00,000", "base_rate_percent": 0.0, "lower": 0, "upper": 400000},
    {"class_id": 1, "bracket_name": "₹4,00,001 - ₹8,00,000", "base_rate_percent": 5.0, "lower": 400000, "upper": 800000},
    {"class_id": 2, "bracket_name": "₹8,00,001 - ₹12,00,000", "base_rate_percent": 10.0, "lower": 800000, "upper": 1200000},
    {"class_id": 3, "bracket_name": "₹12,00,001 - ₹16,00,000", "base_rate_percent": 15.0, "lower": 1200000, "upper": 1600000},
    {"class_id": 4, "bracket_name": "₹16,00,001 - ₹20,00,000", "base_rate_percent": 20.0, "lower": 1600000, "upper": 2000000},
    {"class_id": 5, "bracket_name": "₹20,00,001 - ₹24,00,000", "base_rate_percent": 25.0, "lower": 2000000, "upper": 2400000},
    {"class_id": 6, "bracket_name": "Above ₹24,00,000", "base_rate_percent": 30.0, "lower": 2400000, "upper": float("inf")},
]

PERSONA_NAMES = {
    0: "High-Growth Wealth Builder",
    1: "Balanced Corporate Professional",
    2: "Discretionary Lifestyle Spender",
    3: "Entry-Level / Student Saver"
}

FEATURE_ORDER = [
    "log_annual_credit",
    "log_annual_debit",
    "net_savings_ratio",
    "monthly_burn_rate",
    "salary_inflow_ratio",
    "monthly_credit_cv",
    "salary_regularity_score",
    "bonus_lump_sum_ratio",
    "investment_ratio",
    "fixed_obligation_ratio",
    "discretionary_ratio",
    "tax_shield_ratio",
    "upi_velocity_index",
    "micro_spend_density",
    "log_avg_ticket_size",
    "capital_gains_flux"
]


class MLService:
    """Singleton service for loading models and executing inference."""
    _instance = None

    def __init__(self):
        self.scaler = None
        self.regressor = None
        self.classifier = None
        self.kmeans = None
        self.pca = None
        self.metrics = {}
        self.load_models()

    def load_models(self):
        try:
            self.scaler = joblib.load(settings.SCALER_PATH)
            self.regressor = joblib.load(settings.INCOME_REGRESSOR_PATH)
            self.classifier = joblib.load(settings.TAX_CLASSIFIER_PATH)
            self.kmeans = joblib.load(settings.KMEANS_PATH)
            self.pca = joblib.load(settings.PCA_PATH)
            
            if os.path.exists(settings.METRICS_PATH):
                with open(settings.METRICS_PATH, "r") as f:
                    self.metrics = json.load(f)
            print("✓ Successfully loaded all ML models and scalers into memory.")
        except Exception as e:
            print(f"Warning: Error loading models: {e}. Ensure train_models.py was executed.")

    def calculate_statutory_tax(
        self,
        gross_income: float,
        is_salaried: bool = True,
        entity_type: str = "salaried_individual",
        opex: float = 0.0,
        capex: float = 0.0,
        digital_ratio: float = 1.0
    ) -> TaxBreakdownSummary:
        """
        Computes statutory tax liability under Indian Income Tax Act (FY 2025-26 - Section 115BAC).
        Supports Salaried Individuals, Presumptive Taxation (Sec 44AD/44ADA), and Business P&L with OPEX & Depreciation.
        """
        std_deduction = 0.0
        deductible_opex = 0.0
        capex_investment = 0.0
        depreciation_allowance = 0.0
        deemed_profit_rate = None
        regime_notes = ""

        if entity_type == "presumptive_business_44ad":
            # Section 44AD: 6% for digital receipts, 8% for cash on turnover up to ₹3 Crore
            deemed_rate = 6.0 if digital_ratio >= 0.95 else round((6.0 * digital_ratio) + (8.0 * (1.0 - digital_ratio)), 2)
            deemed_profit_rate = deemed_rate
            taxable_income = max(0.0, round(gross_income * (deemed_rate / 100.0), 2))
            regime_notes = f"Section 44AD Presumptive Taxation ({deemed_rate}% deemed profit on ₹{gross_income:,.2f} turnover). OPEX and depreciation are fully factored into the presumptive rate."

        elif entity_type == "presumptive_professional_44ada":
            # Section 44ADA: 50% deemed profit on gross receipts up to ₹75 Lakhs
            deemed_profit_rate = 50.0
            taxable_income = max(0.0, round(gross_income * 0.50, 2))
            regime_notes = f"Section 44ADA Presumptive Taxation (50.0% deemed profit on ₹{gross_income:,.2f} professional receipts)."

        elif entity_type == "regular_business_pnl":
            # Regular Commercial Business P&L: Gross Revenue - Deductible OPEX - Sec 32 Depreciation (15% WDV)
            deductible_opex = round(min(max(0.0, opex), gross_income), 2)
            capex_investment = round(max(0.0, capex), 2)
            depreciation_allowance = round(capex_investment * 0.15, 2)
            taxable_income = max(0.0, round(gross_income - deductible_opex - depreciation_allowance, 2))
            regime_notes = f"Commercial Business P&L: Gross revenue ₹{gross_income:,.2f} minus allowable OPEX ₹{deductible_opex:,.2f} and Section 32 Depreciation (15% WDV) ₹{depreciation_allowance:,.2f}."

        else:
            # Salaried Individual (Default)
            entity_type = "salaried_individual"
            std_deduction = 75000.0 if is_salaried else 0.0
            taxable_income = max(0.0, round(gross_income - std_deduction, 2))
            regime_notes = "Section 115BAC Salaried Individual (Standard deduction ₹75,000 + Section 87A rebate)."

        # Compute progressive statutory tax per slab on taxable_income
        base_tax = 0.0
        remaining = taxable_income

        if remaining > 2400000:
            base_tax += (remaining - 2400000) * 0.30
            remaining = 2400000
        if remaining > 2000000:
            base_tax += (remaining - 2000000) * 0.25
            remaining = 2000000
        if remaining > 1600000:
            base_tax += (remaining - 1600000) * 0.20
            remaining = 1600000
        if remaining > 1200000:
            base_tax += (remaining - 1200000) * 0.15
            remaining = 1200000
        if remaining > 800000:
            base_tax += (remaining - 800000) * 0.10
            remaining = 800000
        if remaining > 400000:
            base_tax += (remaining - 400000) * 0.05
            remaining = 400000

        # Section 87A rebate: Up to ₹60,000 if taxable income <= ₹12,00,000
        rebate_87a = 0.0
        if taxable_income <= 1200000:
            rebate_87a = min(base_tax, 60000.0)

        net_tax = max(0.0, base_tax - rebate_87a)
        effective_rate = (net_tax / gross_income * 100.0) if gross_income > 0 else 0.0

        return TaxBreakdownSummary(
            entity_type=entity_type,
            gross_income=round(gross_income, 2),
            standard_deduction=round(std_deduction, 2),
            deductible_opex=round(deductible_opex, 2),
            capex_investment=round(capex_investment, 2),
            depreciation_allowance=round(depreciation_allowance, 2),
            deemed_profit_rate_percent=deemed_profit_rate,
            taxable_income=round(taxable_income, 2),
            base_tax_liability=round(base_tax, 2),
            section_87a_rebate=round(rebate_87a, 2),
            net_tax_payable=round(net_tax, 2),
            effective_tax_rate_percent=round(effective_rate, 2),
            regime_notes=regime_notes
        )

    def predict(
        self,
        features_dict: Dict[str, float],
        entity_type: str = "salaried_individual",
        opex: float = 0.0,
        capex: float = 0.0,
        digital_ratio: float = 1.0
    ) -> PredictionOutput:
        """Executes full inference pipeline for a 16-feature input."""
        # Convert dictionary to ordered feature vector
        vector = np.array([[float(features_dict.get(feat, 0.0)) for feat in FEATURE_ORDER]], dtype=np.float64)
        scaled_vector = self.scaler.transform(vector)

        # 1. Income / Turnover Regression
        pred_income = float(self.regressor.predict(scaled_vector)[0])
        pred_income = max(100000.0, round(pred_income, 2))
        
        # Approximate 95% Confidence Interval based on model test RMSE (~₹35,000)
        ci_lower = max(50000.0, round(pred_income - 35000.0 * 1.96, 2))
        ci_upper = round(pred_income + 35000.0 * 1.96, 2)

        # 2. Tax Slab Classification (7 classes)
        pred_class_id = int(self.classifier.predict(scaled_vector)[0])
        pred_class_id = min(max(pred_class_id, 0), 6)
        
        if hasattr(self.classifier, "predict_proba"):
            probs = self.classifier.predict_proba(scaled_vector)[0].tolist()
        else:
            probs = [0.0] * 7
            probs[pred_class_id] = 1.0

        slab_info = TAX_SLAB_DEFINITIONS[pred_class_id]
        slab_confidence = float(probs[pred_class_id])

        tax_slab_pred = TaxSlabPrediction(
            class_id=pred_class_id,
            bracket_name=slab_info["bracket_name"],
            base_rate_percent=slab_info["base_rate_percent"],
            confidence=round(slab_confidence, 4),
            probabilities=[round(p, 4) for p in probs]
        )

        # 3. Persona Clustering (K-Means)
        pred_cluster_id = int(self.kmeans.predict(scaled_vector)[0])
        persona_name = PERSONA_NAMES.get(pred_cluster_id, "Standard Professional")

        # 4. Latent Space Projection (PCA)
        pca_3d = self.pca.transform(scaled_vector)[0].tolist()
        pca_2d = pca_3d[:2]

        assigned_cluster = AssignedCluster(
            cluster_id=pred_cluster_id,
            persona_name=persona_name,
            pca_2d_coord=[round(c, 4) for c in pca_2d],
            pca_3d_coord=[round(c, 4) for c in pca_3d]
        )

        # 5. Statutory Tax Calculation
        is_salaried = (entity_type == "salaried_individual")
        tax_breakdown = self.calculate_statutory_tax(
            gross_income=pred_income,
            is_salaried=is_salaried,
            entity_type=entity_type,
            opex=opex,
            capex=capex,
            digital_ratio=digital_ratio
        )

        return PredictionOutput(
            estimated_annual_income=pred_income,
            income_confidence_interval=[ci_lower, ci_upper],
            predicted_tax_slab=tax_slab_pred,
            tax_breakdown=tax_breakdown,
            assigned_cluster=assigned_cluster
        )


ml_service = MLService()
