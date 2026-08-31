export interface StatementSummary {
  total_transactions: number;
  date_range: {
    from: string;
    to: string;
  };
  total_credits: number;
  total_debits: number;
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
  gross_income: number;
  standard_deduction: number;
  taxable_income: number;
  base_tax_liability: number;
  section_87a_rebate: number;
  net_tax_payable: number;
  effective_tax_rate_percent: number;
}

export interface PredictionOutput {
  estimated_annual_income: number;
  income_confidence_interval: [number, number];
  predicted_tax_slab: TaxSlabPrediction;
  tax_breakdown: TaxBreakdownSummary;
  assigned_cluster: AssignedCluster;
}

export interface UploadStatementResponse {
  status: string;
  statement_summary: StatementSummary;
  extracted_features: ExtractedFeatures;
  predictions: PredictionOutput;
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
  category: string;
  description: string;
  annual_income_approx: number;
  tax_slab_expected: string;
  persona_expected: string;
  transaction_count: number;
  download_url: string;
}
