# FinSight System Architecture & Engineering Design

```text
+----------------------------------------------------------------------------------------------------+
|                                  Vite 6 + React 19 Web Application                                 |
|  +---------------------------+  +---------------------------+  +--------------------------------+  |
|  |   Overview & Telemetry    |  |   Statement Diagnostic    |  |   What-If Simulator (16 Sliders|  |
|  |   - Hero Balance Summary  |  |   - Multi-Bank CSV/PDF    |  |   - Real-Time Counterfactuals  |  |
|  |   - Spend Trend Charts    |  |   - 16D Feature Radar     |  |   - Live Archetype Re-scoring  |  |
|  |   - Top Outflow Feed      |  |   - 50/30/20 & Runway     |  |   - Dynamic Manifold Preserv.  |  |
|  +---------------------------+  +-------------+-------------+  +---------------+----------------+  |
|  +--------------------------------------------+  +-----------------------------+                   |
|  |   Model Evaluation Hub                     |  |   Profile Simulations Lab   |                   |
|  |   - 98.40% Benchmark Leaderboard           |  |   - 4 Archetype Presets     |                   |
|  |   - Confusion Matrix & Gini Importance     |  |   - Real-World Account Data |                   |
|  |   - Interactive WebGL 3D PCA Scatter Space |  |   - Instant Pre-load Engine |                   |
|  +--------------------------------------------+  +-----------------------------+                   |
+-------------------------------------------------------|--------------------------------------------+
                                                        | HTTP / REST (JSON & Multipart)
                                                        v
+----------------------------------------------------------------------------------------------------+
|                                        FastAPI Python Backend                                      |
|  +---------------------------+  +---------------------------+  +--------------------------------+  |
|  | /api/upload-statement     |  | /api/predict-features     |  | /api/models/evaluation         |  |
|  | Multipart Ingestion Engine|  | Realtime Inference Engine |  | Cross-Validation Leaderboard   |  |
|  +-------------+-------------+  +-------------+-------------+  +---------------+----------------+  |
+----------------|------------------------------|--------------------------------|-------------------+
                 |                              |                                |
                 v                              v                                v
+----------------------------------------------------------------------------------------------------+
|                                    ML Pipeline & Business Logic                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | 1. Statement Normalization: Multi-line PDF & CSV (HDFC, SBI, ICICI, IDFC FIRST, Agami)       |  |
|  | 2. 16D Feature Extractor: Cashflow Scale, Inflow Stability, Allocation Ratios, Digital Vel.  |  |
|  | 3. StandardScaler Transformation: Zero-mean unit-variance scaling on log-dampened features  |  |
|  | 4. Supervised Archetype Classifier: Gradient Boosting (Winner: 98.40% Acc, 0.9820 Macro F1) |  |
|  | 5. Supervised Turnover Regressor: Random Forest Regressor (Winner: R2 = 0.9977, MAPE = 1.30%) |  |
|  | 6. Unsupervised Clustering: k-Means (k=4 Cohorts, Silhouette Score = 0.3285)                 |  |
|  | 7. Latent Space Projection: 3D PCA (Captures 79.22% Cumulative Variance via SVD)             |  |
|  | 8. Spending Insights Engine: Personal Z-Score Anomaly Detection & 50/30/20 Budget Adherence |  |
|  +----------------------------------------------------------------------------------------------+  |
+-----------------------------------------------+----------------------------------------------------+
                                                |
                 +------------------------------+--------------------------------+
                 |                                                               |
                 v                                                               v
+--------------------------------+                             +-------------------------------------+
|        SQLite Database         |                             |      Serialized Model Hub           |
| • User statement upload logs   |                             | • scaler.joblib                     |
| • Historical profile records   |                             | • income_regressor.joblib           |
| • Cached evaluation metrics    |                             | • tax_classifier.joblib (archetype) |
| • Pre-calibrated sample data   |                             | • kmeans_personas.joblib            |
|                                |                             | • pca_projector.joblib              |
+--------------------------------+                             +-------------------------------------+
```

---

## 1. System Components

### A. Frontend Web Application (`frontend/`)
- **Core Framework**: Vite 6, React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Plotly.js (WebGL 3D).
- **Dual-Theme Engine**: Light and dark themes with persistent user preference storage in `localStorage`.
- **Key Modules**:
  - **Overview Dashboard**: High-level financial telemetry, balance trends, monthly outflow distributions, and recent transaction feeds.
  - **Statement Diagnostic & Outflow Lab**: Drag-and-drop ingestion of multi-bank CSV and PDF statements; extracts and visualizes the 16-dimensional behavioral vector, computes 50/30/20 budget adherence, and determines emergency cash runway.
  - **What-If Counterfactual Simulator**: 16 real-time slider controls enabling examiners to simulate behavioral shifts (e.g., reallocating discretionary dining into SIP investments) with live archetype re-classification and manifold preservation (`Savings Ratio + Burn Rate = 1.0`).
  - **Model Evaluation Hub**: Algorithm benchmark leaderboard comparing Gradient Boosting, Random Forest, SVM, and linear baselines; features interactive confusion matrices, Gini feature importance rankings, and an interactive WebGL 3D PCA scatter plot.
  - **Profile Simulations Lab**: Pre-calibrated presets across all four behavioral archetypes and real accounts for one-click testing and demonstration.

### B. FastAPI REST Backend (`backend/`)
- **Technology**: FastAPI (Python 3.12), Pydantic v2, Uvicorn, NumPy, pandas, SQLAlchemy.
- **Statement Ingestion Engine**:
  - Normalizes statements across major Indian financial institutions: HDFC Bank, State Bank of India, ICICI Bank, IDFC FIRST Bank, and Agami.
  - Handles multi-line PDF transaction tables, ATM reversal reconciliation, and false-positive substring collision prevention.
- **Core Endpoints**:
  - `POST /api/upload-statement`: Accepts multipart statement uploads, parses transactions, extracts 16D behavioral vectors, and executes multi-model inference.
  - `POST /api/predict-features`: Evaluates raw 16D feature inputs in real time for counterfactual what-if simulations.
  - `GET /api/models/evaluation`: Returns cross-validation leaderboards, confusion matrices, and feature importance rankings.
  - `GET /api/clusters/pca-points`: Returns 2D and 3D PCA spatial projections with archetype cluster assignments.
  - `GET /api/samples`: Returns pre-calibrated reference profiles.
  - `GET /api/health`: Provides system health and model availability status.

### C. Machine Learning Pipeline (`models/` & `backend/app/services/`)
- **16D Feature Extractor**: Translates raw transactional logs into domain-calibrated behavioral dimensions structured across four functional quadrants:
  1. Cashflow Scale & Magnitude (`log_annual_credit`, `log_annual_debit`, `net_savings_ratio`, `monthly_burn_rate`)
  2. Inflow Stability & Regularity (`salary_inflow_ratio`, `monthly_credit_cv`, `salary_regularity_score`, `bonus_lump_sum_ratio`)
  3. Outflow Allocation Dynamics (`investment_ratio`, `fixed_obligation_ratio`, `discretionary_ratio`, `tax_shield_ratio`)
  4. Digital Velocity & Micro-Spending (`upi_velocity_index`, `micro_spend_density`, `log_avg_ticket_size`, `capital_gains_flux`)
- **StandardScaler**: Normalizes feature vectors using fitted training distribution parameters:
  $$\tilde{\mathbf{x}} = \frac{\mathbf{x} - \boldsymbol{\mu}}{\boldsymbol{\sigma}}$$
- **Supervised Archetype Classifier**: Classifies users into four lifestyle archetypes (Frugal Minimalist, Experiential Spender, High-Burn Consumer, Strategic Wealth Builder) using Gradient Boosting (98.40% Accuracy, 0.9820 Macro F1).
- **Supervised Turnover Regressor**: Predicts continuous annual turnover volume via Random Forest Regression ($R^2 = 0.9977$, $\text{MAPE} = 1.30\%$).
- **Unsupervised Cohort Clustering**: Groups users into behavioral clusters using k-Means ($k=4$, Silhouette Score = 0.3285).
- **3D PCA Latent Space Projector**: Decomposes 16D space into 3 principal components capturing 79.22% of cumulative variance for WebGL rendering.

### D. Deterministic Spending Insights Engine
- **Z-Score Anomaly Detection**: Identifies atypical spending spikes relative to the user's historical transaction distribution, dynamically damped by statement history depth.
- **Quantified Rupee Recovery**: Associates actionable savings potential with identified spending leaks (e.g., dining surges, recurring subscription creep).
- **Budget Diagnostics**: Computes mathematical compliance against the 50/30/20 financial rule and projects emergency cash runway:
  $$\text{Emergency Runway (Months)} = \left(\frac{\text{Net Savings}}{\text{Monthly Burn Rate}}\right) \times 12$$

### E. Data and Persistence Layer
- `data/user_profiles.csv`: Master dataset of 10,000 behavioral feature profiles.
- `data/sample_statements/`: Dedicated statement presets for instant profile demonstration.
- `finsight.db`: SQLite database caching statement upload histories and session results.
- `models/*.joblib`: Serialized scikit-learn models and transformation artifacts.
