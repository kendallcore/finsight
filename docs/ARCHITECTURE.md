# FinSight System Architecture & Engineering Design

```
+----------------------------------------------------------------------------------------------------+
|                                      Next.js 15 Web Application                                    |
|  +---------------------------+  +---------------------------+  +--------------------------------+  |
|  |   Statement Upload & Lab  |  |   Analytics Dashboard     |  |   Model Evaluation Hub         |  |
|  |   - CSV Parser / DragDrop |  |   - Recharts Cashflows    |  |   - Confusion Matrix (Heatmap) |  |
|  |   - 1-Click Persona Previews| |   - Lifestyle Spend Donuts|  |   - 2D/3D PCA Scatter (Plotly) |  |
|  |   - What-If Sliders       |  |   - Monthly Trend Lines   |  |   - Feature Importance Bar     |  |
|  +-------------+-------------+  +-------------+-------------+  +---------------+----------------+  |
+----------------|------------------------------|--------------------------------|-------------------+
                 |                              |                                |
                 +------------------------------+--------------------------------+
                                                | HTTP / REST (JSON & Multipart)
                                                v
+----------------------------------------------------------------------------------------------------+
|                                        FastAPI Python Backend                                      |
|  +---------------------------+  +---------------------------+  +--------------------------------+  |
|  | /api/upload-statement     |  | /api/predict              |  | /api/metrics & /api/clusters   |  |
|  | Multipart CSV Processor   |  | Realtime Inference Engine |  | Cross-validation Benchmarks    |  |
|  +-------------+-------------+  +-------------+-------------+  +---------------+----------------+  |
+----------------|------------------------------|--------------------------------|-------------------+
                 |                              |                                |
                 v                              v                                v
+----------------------------------------------------------------------------------------------------+
|                                    ML Pipeline & Business Logic                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | 1. Feature Engineering: Inflow/Outflow Aggregation, Volatility, SIP Index, Discretionary Ratio|  |
|  | 2. StandardScaler Transformation                                                             |  |
|  | 3. Supervised Regression (Annual Income) : Ridge, Random Forest, GBR                            |  |
|  | 4. Supervised Classification (Tax Slab)  : Logistic Regression, Random Forest, SVC           |  |
|  | 5. Unsupervised Clustering (Personas)    : K-Means (k=4) with Silhouette Score                |  |
|  | 6. Dimensionality Reduction (Projection) : PCA (n_components=2 & 3)                         |  |
|  +----------------------------------------------------------------------------------------------+  |
+-----------------------------------------------+----------------------------------------------------+
                                                |
                 +------------------------------+--------------------------------+
                 |                                                               |
                 v                                                               v
+--------------------------------+                             +-------------------------------------+
|        SQLite Database         |                             |      Serialized Model Hub           |
| • User statement logs          |                             | • scaler.joblib                     |
| • Pre-computed sample profiles |                             | • income_regressor.joblib           |
| • Cached evaluation metrics    |                             | • tax_classifier.joblib             |
|                                |                             | • kmeans_personas.joblib            |
|                                |                             | • pca_projector.joblib              |
+--------------------------------+                             +-------------------------------------+
```

---

## 1. Component Breakdown

### A. Next.js 15 Web Application (`frontend/`)
- **Technology**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Plotly.js.
- **Key Modules**:
  - **Upload & Feature Extraction Lab**: Ingests user bank statements via CSV or allows 1-click loading of preset Indian financial profiles (Student, Mid-level Engineer, High-Net-Worth Freelancer).
  - **Diagnostics & Tax Summary Card**: Displays predicted annual gross income ($\hat{y}_{\text{income}} \pm \text{error}$) and predicted Indian Tax Slab with class probability breakdown.
  - **2D / 3D PCA Visualizer**: Interactive Plotly canvas showing all synthetic cluster points in latent feature space, highlighting where the current user sits relative to the cluster centroids.
  - **Model Evaluation Lab**: Comparative leaderboard showing test set performance metrics for all candidate algorithms.

### B. FastAPI REST Backend (`backend/`)
- **Technology**: FastAPI, Pydantic v2, Uvicorn, NumPy, pandas.
- **Key Endpoints**:
  - `POST /api/upload`: Ingests multipart CSV bank transactions, computes the 12-dimensional feature vector, and runs inference across all 4 models.
  - `POST /api/predict-manual`: Takes direct numerical sliders (e.g., Monthly Credits, Investment Ratio) and computes instant predictions for what-if scenarios.
  - `GET /api/models/evaluation`: Returns cross-validation and test metrics ($R^2$, RMSE, MAE, Accuracy, F1, Confusion Matrix) across multiple algorithms.
  - `GET /api/clusters/pca`: Returns $(x, y, z)$ PCA coordinates and cluster assignments for background scatter visualization.
  - `GET /api/samples`: Returns pre-generated sample bank statements for instant evaluation.

### C. ML Engine & Model Hub (`models/`)
- **Pretrained Artifacts**:
  - `scaler.joblib`: Fitted `StandardScaler` on training feature matrix.
  - `regressor_rf.joblib` / `regressor_linear.joblib`: Regression models for continuous income estimation.
  - `classifier_rf.joblib` / `classifier_logreg.joblib`: Multi-class classifiers for tax slabs (Classes 0 to 5).
  - `kmeans.joblib`: 4-cluster $k$-Means model with persona labels.
  - `pca.joblib`: Fitted `PCA(n_components=3)` preserving $>85\%$ variance.

### D. Data Storage Layer (`data/` & `SQLite`)
- `synthetic_transactions.csv`: Raw daily transaction records for 5,000 synthetic Indian users.
- `user_profiles.csv`: Aggregated feature matrix used for model training and evaluation.
- `finsight.db`: SQLite database for caching past analyses and user upload sessions.
