# FinSight System Architecture & Engineering Design

```text
+----------------------------------------------------------------------------------------------------+
|                                  Vite 6 + React 19 Web Application                                 |
|  +---------------------------+  +---------------------------+  +--------------------------------+  |
|  |   Statement Upload & Lab  |  |   What-If Simulator       |  |   Model Evaluation Hub         |  |
|  |   - CSV/PDF Auto-Parser   |  |   - What-If Sliders       |  |   - Confusion Matrix Heatmap   |  |
|  |   - Profile Simulations   |  |   - Real-time Inference   |  |   - Feature Importance Bar     |  |
|  |   - Outflow Donut Chart   |  |   - Tax Waterfall Card    |  |   - Algorithm Leaderboard      |  |
|  +-------------+-------------+  +-------------+-------------+  +---------------+----------------+  |
+----------------|------------------------------|--------------------------------|-------------------+
                 |                              |                                |
                 +------------------------------+--------------------------------+
                                                | HTTP / REST (JSON & Multipart)
                                                v
+----------------------------------------------------------------------------------------------------+
|                                        FastAPI Python Backend                                      |
|  +---------------------------+  +---------------------------+  +--------------------------------+  |
|  | /api/upload-statement     |  | /api/predict-features     |  | /api/models/evaluation         |  |
|  | Multipart Statement Parser|  | Realtime Inference Engine |  | Cross-validation Leaderboard   |  |
|  +-------------+-------------+  +-------------+-------------+  +---------------+----------------+  |
+----------------|------------------------------|--------------------------------|-------------------+
                 |                              |                                |
                 v                              v                                v
+----------------------------------------------------------------------------------------------------+
|                                    ML Pipeline & Business Logic                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | 1. Feature Engineering: 16D Inflow/Outflow Aggregation, Volatility, SIP Index, UPI Velocity |  |
|  | 2. StandardScaler Transformation                                                             |  |
|  | 3. Supervised Regression (Gross Income)   : Random Forest, Ridge, GBR                           |  |
|  | 4. Supervised Classification (7 Tax Slabs) : Gradient Boosting, Random Forest, Logistic Reg     |  |
|  | 5. Unsupervised Clustering (Personas)     : K-Means (k=4) with Silhouette Score                |  |
|  | 6. Statutory Tax Calculation Waterfall    : Section 115BAC FY 2025-26, Sec 87A Rebate, 44AD/ADA |  |
|  +----------------------------------------------------------------------------------------------+  |
+-----------------------------------------------+----------------------------------------------------+
                                                |
                 +------------------------------+--------------------------------+
                 |                                                               |
                 v                                                               v
+--------------------------------+                             +-------------------------------------+
|        SQLite Database         |                             |      Serialized Model Hub           |
| • User statement upload logs   |                             | • scaler.joblib                     |
| • Pre-computed sample profiles |                             | • income_regressor.joblib           |
| • Cached evaluation metrics    |                             | • tax_classifier.joblib             |
|                                |                             | • kmeans_personas.joblib            |
|                                |                             | • pca_projector.joblib              |
+--------------------------------+                             +-------------------------------------+
```

---

## 1. Component Breakdown

### A. Vite 6 + React 19 Web Application (`frontend/`)
- **Technology**: Vite 6, React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Key Modules**:
  - **Statement Diagnostic & Feature Lab**: Ingests Indian bank statements via CSV or PDF (supporting password protection and entity types: Salaried, Presumptive 44AD, Presumptive 44ADA, Commercial P&L).
  - **Diagnostics & Tax Waterfall Summary**: Displays predicted annual gross income ($\hat{y}_{\text{income}} \pm \text{error}$), predicted FY 2025–26 Tax Slab, Section 87A rebate calculation, and effective tax rate.
  - **Profile Simulations Lab**: Pre-calibrated demo statements (Student, Corporate Salaried, Wealth Builder, Lifestyle Spender, Real Agami Account) for instant diagnostic execution.
  - **Model Evaluation Hub**: Comparative leaderboard showing test set performance metrics ($R^2$, RMSE, MAPE, Accuracy, Macro F1, $7 \times 7$ Confusion Matrix Heatmap, 16D Feature Importance bar chart).

### B. FastAPI REST Backend (`backend/`)
- **Technology**: FastAPI, Pydantic v2, Uvicorn, NumPy, pandas, SQLAlchemy.
- **Key Endpoints**:
  - `POST /api/upload-statement`: Ingests multipart CSV or PDF bank transactions, computes the 16-dimensional feature vector, and executes multi-model inference.
  - `POST /api/predict-features`: Takes direct numerical sliders and computes instant predictions for what-if simulations.
  - `GET /api/models/evaluation`: Returns cross-validation and test metrics ($R^2$, RMSE, MAE, Accuracy, F1, Confusion Matrix) across multiple algorithms.
  - `GET /api/samples`: Returns pre-configured sample financial profiles and downloads.
  - `GET /api/health`: Returns service health status and loaded model states.

### C. ML Engine & Model Hub (`models/`)
- **Pretrained Artifacts**:
  - `scaler.joblib`: Fitted `StandardScaler` on training feature matrix.
  - `income_regressor.joblib`: Ensemble Random Forest Regressor ($R^2 = 0.9977$).
  - `tax_classifier.joblib`: 7-class Gradient Boosting Classifier (Accuracy = $98.35\%$).
  - `kmeans_personas.joblib`: 4-cluster $k$-Means model with persona labels.
  - `pca_projector.joblib`: Fitted 3D PCA Projector.

### D. Data Storage Layer (`data/` & `SQLite`)
- `synthetic_transactions.csv`: Raw daily transaction records for synthetic users.
- `user_profiles.csv`: Aggregated feature matrix used for model training and evaluation.
- `sample_statements/`: Dedicated statement presets for profile-based simulations.
- `finsight.db`: SQLite database for caching past upload sessions and prediction history.
