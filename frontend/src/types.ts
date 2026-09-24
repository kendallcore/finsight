export interface CategorySpendItem {
  category: string;
  amount: number;
  transaction_count: number;
  percentage_of_total: number;
}

export interface TransactionRecord {
  date: string;
  narration: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | string;
  category: string;
  payment_mode: string;
}

export interface MonthlyCategorySpend {
  month: string;
  category: string;
  amount: number;
}

export interface StatementSummary {
  filename?: string;
  account_holder_name?: string;
  account_number?: string;
  account_type?: string;
  suggested_entity_type?: string;
  opening_balance?: number;
  closing_balance?: number;
  total_transactions: number;
  date_range: {
    from: string;
    to: string;
  };
  total_credits: number;
  total_debits: number;
  detected_opex?: number;
  detected_capex?: number;
  digital_receipts_ratio?: number;
  category_breakdown?: CategorySpendItem[];
  monthly_category_breakdown?: MonthlyCategorySpend[];
}

export interface ExtractedFeatures {
  log_annual_credit: number;
  log_annual_debit: number;
  net_savings_ratio: number;
  monthly_burn_rate: number;
  salary_inflow_ratio: number;
  monthly_credit_cv: number;
  salary_regularity_score: number;
  bonus_lump_sum_ratio: number;
  investment_ratio: number;
  fixed_obligation_ratio: number;
  discretionary_ratio: number;
  tax_shield_ratio: number;
  upi_velocity_index: number;
  micro_spend_density: number;
  log_avg_ticket_size: number;
  capital_gains_flux: number;
}

export interface LifestyleArchetypePrediction {
  archetype_id: number;
  archetype_name: string;
  confidence: number;
  probabilities: number[];
  summary: string;
  key_traits: string[];
}

export interface LifestyleDiagnostics {
  financial_health_score: number;
  health_grade: string;
  cash_runway_months: number;
  needs_ratio_percent: number;
  wants_ratio_percent: number;
  savings_ratio_percent: number;
  top_spend_leakages: string[];
  coaching_insights: string[];
}

export interface TaxSlabPrediction {
  class_id: number;
  bracket_name: string;
  base_rate_percent: number;
  confidence: number;
  probabilities: number[];
}

export interface AssignedCluster {
  cluster_id: number;
  persona_name: string;
  pca_2d_coord: [number, number];
  pca_3d_coord: [number, number, number];
}

export interface TaxBreakdownSummary {
  entity_type?: string;
  gross_income: number;
  standard_deduction: number;
  deductible_opex?: number;
  capex_investment?: number;
  depreciation_allowance?: number;
  deemed_profit_rate_percent?: number;
  taxable_income: number;
  base_tax_liability: number;
  section_87a_rebate: number;
  net_tax_payable: number;
  effective_tax_rate_percent: number;
  regime_notes?: string;
}


export interface PredictionOutput {
  estimated_annual_income: number;
  income_confidence_interval: [number, number];
  lifestyle_archetype?: LifestyleArchetypePrediction;
  lifestyle_diagnostics?: LifestyleDiagnostics;
  assigned_cluster: AssignedCluster;
  predicted_tax_slab?: TaxSlabPrediction;
  tax_breakdown?: TaxBreakdownSummary;
}

export interface InsightItem {
  rule_id: string;
  category: string;
  insight: string;
  impact_rupees: number;
  confidence: number;
  effort: 1 | 2 | 3;
}

export interface AnomalyItem {
  transaction_date: string;
  narration: string;
  amount: number;
  category: string;
  z_score: number;
  narrative: string;
  confidence: number;
}

export interface SimulationPath {
  path_id: string;
  name: string;
  description: string;
  required_changes: string[];
  projected_health_delta: number;
  projected_runway_delta: number;
  /** The exact 16D vector the backend scored, so slider changes replay its projection. */
  projected_features: Record<string, number>;
  baseline_health_score: number;
  baseline_runway_months: number;
}

export type PersonaAxis =
  | 'Essentials'
  | 'Lifestyle'
  | 'Savings'
  | 'Investing'
  | 'Digital Velocity';

export interface PersonaComparison {
  user_archetype: string;
  user_scores: Record<PersonaAxis, number>;
  benchmark_scores: Record<string, Record<PersonaAxis, number>>;
}

export interface InsightResponse {
  status: string;
  persona_critique: string;
  user_archetype: string;
  archetype_id: number;
  archetype_confidence: number;
  monthly_income: number;
  monthly_spend: number;
  insights: InsightItem[];
  anomalies: AnomalyItem[];
  simulation_paths: SimulationPath[];
  persona_comparison: PersonaComparison;
  tracked_savings_potential: number;
}

export interface InsightRequest {
  features: Partial<ExtractedFeatures> & Record<string, number>;
  category_breakdown?: CategorySpendItem[];
  monthly_category_breakdown?: MonthlyCategorySpend[];
  transactions?: TransactionRecord[];
  archetype_id?: number;
  archetype_name?: string;
  archetype_confidence?: number;
  statement_months?: number;
  total_credits?: number;
  total_debits?: number;
}

export interface UploadStatementResponse {
  status: string;
  statement_summary: StatementSummary;
  extracted_features: ExtractedFeatures;
  predictions: PredictionOutput;
  transactions?: TransactionRecord[];
  category_breakdown?: CategorySpendItem[];
  monthly_category_breakdown?: MonthlyCategorySpend[];
  insights?: InsightResponse | null;
  persona_emphasis?: InsightItem | null;
}

export interface PredictFeaturesResponse {
  status: string;
  extracted_features: ExtractedFeatures;
  predictions: PredictionOutput;
  insights?: InsightResponse | null;
}

export interface RegressionBenchmarkItem {
  model_name: string;
  r2_score: number;
  rmse: number;
  mae: number;
  mape_percent: number;
}

export interface ClassificationBenchmarkItem {
  model_name: string;
  accuracy: number;
  macro_f1: number;
  weighted_f1: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface ModelEvaluationResponse {
  status: string;
  tax_regime_year: string;
  feature_count: number;
  regression_comparison: RegressionBenchmarkItem[];
  classification_comparison: ClassificationBenchmarkItem[];
  best_models: {
    regression: string;
    classification: string;
  };
  confusion_matrix: number[][];
  confusion_matrix_labels: string[];
  feature_importance: FeatureImportanceItem[];
  clustering: {
    n_clusters: number;
    silhouette_score: number;
    personas: Record<string, string>;
  };
  pca_variance: {
    explained_variance_ratio: number[];
    total_explained_variance: number;
  };
}

export interface PCAPoint {
  user_id: number;
  pca_x: number;
  pca_y: number;
  pca_z: number;
  cluster_id: number;
  tax_slab_class: number;
  annual_income: number;
}

export interface PCAPointsResponse {
  status: string;
  total_points: number;
  points: PCAPoint[];
}

export interface SampleProfileItem {
  profile_id: string;
  title: string;
  subtitle?: string;
  category: string;
  description: string;
  annual_income_approx: number;
  monthly_inflow?: string;
  discretionary_ratio?: string;
  savings_buffer?: string;
  primary_channel?: string;
  archetype_expected?: string;
  tax_slab_expected: string;
  persona_expected: string;
  transaction_count: number;
  download_url: string;
}
