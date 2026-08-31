"""
Pydantic Schemas for FinSight API
Defines request payloads and standardized response models.
"""

from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field


class StatementSummary(BaseModel):
    total_transactions: int
    date_range: Dict[str, str]
    total_credits: float
    total_debits: float
    detected_opex: float = 0.0
    detected_capex: float = 0.0
    digital_receipts_ratio: float = 1.0


class ExtractedFeatures(BaseModel):
    log_annual_credit: float
    log_annual_debit: float
    net_savings_ratio: float
    monthly_burn_rate: float
    salary_inflow_ratio: float
    monthly_credit_cv: float
    salary_regularity_score: float
    bonus_lump_sum_ratio: float
    investment_ratio: float
    fixed_obligation_ratio: float
    discretionary_ratio: float
    tax_shield_ratio: float
    upi_velocity_index: float
    micro_spend_density: float
    log_avg_ticket_size: float
    capital_gains_flux: float


class TaxSlabPrediction(BaseModel):
    class_id: int
    bracket_name: str
    base_rate_percent: float
    confidence: float
    probabilities: List[float]


class AssignedCluster(BaseModel):
    cluster_id: int
    persona_name: str
    pca_2d_coord: List[float]
    pca_3d_coord: List[float]


class TaxBreakdownSummary(BaseModel):
    entity_type: str = "salaried_individual"
    gross_income: float
    standard_deduction: float = 0.0
    deductible_opex: float = 0.0
    capex_investment: float = 0.0
    depreciation_allowance: float = 0.0
    deemed_profit_rate_percent: Optional[float] = None
    taxable_income: float
    base_tax_liability: float
    section_87a_rebate: float
    net_tax_payable: float
    effective_tax_rate_percent: float
    regime_notes: Optional[str] = None


class PredictionOutput(BaseModel):
    estimated_annual_income: float
    income_confidence_interval: List[float]
    predicted_tax_slab: TaxSlabPrediction
    tax_breakdown: TaxBreakdownSummary
    assigned_cluster: AssignedCluster


class UploadStatementResponse(BaseModel):
    status: str = "success"
    statement_summary: StatementSummary
    extracted_features: ExtractedFeatures
    predictions: PredictionOutput


class ManualFeatureInput(BaseModel):
    entity_type: str = Field("salaried_individual", description="Tax entity type: salaried_individual, presumptive_business_44ad, presumptive_professional_44ada, regular_business_pnl")
    opex_amount: float = Field(0.0, ge=0.0, description="Deductible OPEX for business P&L")
    capex_amount: float = Field(0.0, ge=0.0, description="Capex for depreciation under Sec 32")
    log_annual_credit: float = Field(..., description="Log of annual credit inflows")
    log_annual_debit: float = Field(..., description="Log of annual debit outflows")
    net_savings_ratio: float = Field(0.30, ge=-1.0, le=1.0)
    monthly_burn_rate: float = Field(0.70, ge=0.0, le=2.0)
    salary_inflow_ratio: float = Field(0.90, ge=0.0, le=1.0)
    monthly_credit_cv: float = Field(0.10, ge=0.0, le=5.0)
    salary_regularity_score: float = Field(1.0, ge=0.0, le=1.0)
    bonus_lump_sum_ratio: float = Field(0.05, ge=0.0, le=1.0)
    investment_ratio: float = Field(0.15, ge=0.0, le=1.0)
    fixed_obligation_ratio: float = Field(0.30, ge=0.0, le=1.0)
    discretionary_ratio: float = Field(0.25, ge=0.0, le=1.0)
    tax_shield_ratio: float = Field(0.05, ge=0.0, le=1.0)
    upi_velocity_index: float = Field(0.70, ge=0.0, le=1.0)
    micro_spend_density: float = Field(0.08, ge=0.0, le=1.0)
    log_avg_ticket_size: float = Field(7.5, ge=0.0, le=20.0)
    capital_gains_flux: float = Field(0.0, ge=0.0, le=1.0)


class PredictFeaturesResponse(BaseModel):
    status: str = "success"
    extracted_features: ExtractedFeatures
    predictions: PredictionOutput


class RegressionBenchmarkItem(BaseModel):
    model_name: str
    r2_score: float
    rmse: float
    mae: float
    mape_percent: float


class ClassificationBenchmarkItem(BaseModel):
    model_name: str
    accuracy: float
    macro_f1: float
    weighted_f1: float


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class ModelEvaluationResponse(BaseModel):
    status: str = "success"
    tax_regime_year: str
    feature_count: int
    regression_comparison: List[RegressionBenchmarkItem]
    classification_comparison: List[ClassificationBenchmarkItem]
    best_models: Dict[str, str]
    confusion_matrix: List[List[int]]
    confusion_matrix_labels: List[str]
    feature_importance: List[FeatureImportanceItem]
    clustering: Dict[str, Any]
    pca_variance: Dict[str, Any]


class PCAPoint(BaseModel):
    user_id: int
    pca_x: float
    pca_y: float
    pca_z: float
    cluster_id: int
    tax_slab_class: int
    annual_income: float


class PCAPointsResponse(BaseModel):
    status: str = "success"
    total_points: int
    points: List[PCAPoint]


class SampleProfileItem(BaseModel):
    profile_id: str
    title: str
    category: str
    description: str
    annual_income_approx: float
    tax_slab_expected: str
    persona_expected: str
    transaction_count: int
    download_url: str
