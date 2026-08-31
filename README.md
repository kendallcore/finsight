# FinSight (Financial Intelligence & Statutory Tax Estimation Engine)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E.svg)](https://scikit-learn.org)
[![Hugging Face Models](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Models-orange)](https://huggingface.co/sanjeevafk/finsight-indian-tax-models)
[![Hugging Face Datasets](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Datasets-yellow)](https://huggingface.co/datasets/sanjeevafk/indian-banking-tax-profiles-2025)
[![Hugging Face Spaces](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Spaces-blue)](https://huggingface.co/spaces/sanjeevafk/finsight)

FinSight is a production-grade machine learning system that automates bank statement diagnostic analysis, extracts 16-dimensional financial behavioral vectors, predicts annual gross income via regression, classifies statutory tax slabs under the Indian New Tax Regime (Section 115BAC - FY 2025-26), and discovers spending personas through unsupervised geometric clustering.

---

## Key Capabilities

1. **Automated 16D Feature Extraction**: Aggregates raw transactional histories (credits, debits, UPI velocities, SIP allocations, fixed living obligations, and deposit regularities) into standardized numeric representations.
2. **Supervised Income Regression**: Estimates gross annual income using an ensemble Random Forest regressor ($R^2 = 0.9977$, $\text{RMSE} = \text{₹34,815}$, $\text{MAPE} = 1.30\%$).
3. **Multi-Class Tax Slab Classification**: Predicts statutory tax brackets across 7 classes under Section 115BAC with 98.35% accuracy and 0.9556 Macro F1.
4. **Statutory Tax Waterfall Calculation**: Computes standard deduction (₹75,000), Section 87A rebate (up to ₹60,000), net tax liability, and effective tax rates with a ₹12.75 Lakh zero-tax ceiling.
5. **Unsupervised Persona Clustering ($k$-Means)**: Identifies 4 distinct financial behavioral clusters with Silhouette score optimization ($k=4$, $\text{Silhouette} = 0.3285$).
6. **Latent Space Dimensionality Reduction (PCA)**: Projects 16-dimensional financial behaviors into interactive 2D and 3D WebGL scatter spaces capturing 79.22% cumulative variance.
7. **Production Real-Data Benchmark**: Validated on 51,945 real Indian bank transactions across 200 accounts ($R^2 = 0.9657$, $\text{MAPE} = 2.51\%$, sub-45ms median latency).

---

## Machine Learning Architecture

```
                                 +---------------------------------+
                                 |    Raw Bank Statement (CSV)     |
                                 +----------------+----------------+
                                                  |
                                                  v
                                 +---------------------------------+
                                 |   16D Feature Extraction Engine |
                                 |   - Cashflow Scale & Magnitude  |
                                 |   - Inflow Regularity & CV      |
                                 |   - Outflow Allocations (SIP)   |
                                 |   - Digital UPI Velocity Index  |
                                 +----------------+----------------+
                                                  |
                        +-------------------------+-------------------------+
                        |                                                   |
                        v                                                   v
          +------------------------------+                    +------------------------------+
          | 1. Income Regressor          |                    | 2. Tax Slab Classifier       |
          | - Random Forest / GBR        |                    | - Gradient Boosting (7 Slabs)|
          | - Target: Gross Income (INR) |                    | - Target: Classes 0 to 6     |
          | - R2 = 0.9977, MAPE = 1.30%  |                    | - Accuracy = 98.35%          |
          +--------------+---------------+                    +--------------+---------------+
                         |                                                   |
                         +------------------------+--------------------------+
                                                  |
                        +-------------------------+-------------------------+
                        |                                                   |
                        v                                                   v
          +------------------------------+                    +------------------------------+
          | 3. Persona Clustering Engine |                    | 4. Latent Space Projector    |
          | - K-Means (k=4 Personas)     |                    | - 3D PCA Decomposition       |
          | - Silhouette Score = 0.3285  |                    | - Explained Variance = 79.22%|
          +------------------------------+                    +------------------------------+
```

---

## Indian Tax System Modeling (Section 115BAC - FY 2025-26)

| Slab Class | Taxable Income Range (INR) | Base Tax Rate | Effective Statutory Impact |
| :---: | :--- | :---: | :--- |
| **Class 0** | Up to 4,00,000 | 0% (Nil) | Basic Exemption Limit |
| **Class 1** | 4,00,001 to 8,00,000 | 5% | Covered under Section 87A rebate |
| **Class 2** | 8,00,001 to 12,00,000 | 10% | Section 87A rebate up to 60,000 -> 0 INR Effective Tax |
| **Class 3** | 12,00,001 to 16,00,000 | 15% | Standard corporate professional bracket |
| **Class 4** | 16,00,001 to 20,00,000 | 20% | Senior technical / managerial bracket |
| **Class 5** | 20,00,001 to 24,00,000 | 25% | Executive bracket |
| **Class 6** | Above 24,00,000 | 30% | Highest marginal rate |

*Note: Salaried individuals receive a standard deduction of 75,000 INR, establishing an effective zero-tax ceiling at 12.75 Lakh INR.*

---

## Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | Vite 6, React 19, TypeScript, Tailwind CSS, Lucide Icons | Minimalist SPA, drag-and-drop CSV upload, what-if sliders |
| **Visualizations** | Plotly.js (WebGL 3D Scatter), Recharts | Interactive 3D PCA cluster exploration, confusion matrix, spend allocations |
| **Backend API** | FastAPI (Python 3.12), Pydantic v2, Uvicorn, SQLAlchemy | High-performance REST API, async statement parsing & real-time inference |
| **ML Engine** | scikit-learn, NumPy, pandas, joblib, scipy | 16D feature extraction, Random Forest, GBR, K-Means, PCA |
| **Persistence** | SQLite (SQLAlchemy ORM) | Lightweight local persistence for historical uploads and cached benchmarks |
| **Containerization**| Docker (Multi-stage Node 22 + Python 3.12-slim) | Single-command portable deployment |

---

## Quickstart

### Option 1: 1-Click Launch Script
```bash
git clone https://github.com/sanjeevafk/finsight.git
cd finsight
./run.sh
```

### Option 2: Docker Compose
```bash
docker compose up --build
```

- **Web Dashboard**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Repository Structure

```
finsight/
├── Dockerfile                          # Multi-stage container definition
├── docker-compose.yml                  # Container orchestration
├── run.sh                              # Automated local startup script
├── LICENSE                             # Apache License 2.0
├── docs/                               # System Architecture & Technical Specifications
│   ├── ARCHITECTURE.md                 # System architecture & component design
│   ├── ML_SPECIFICATION.md             # 16D features, loss functions & benchmark metrics
│   ├── INDIAN_TAX_SYSTEM.md            # FY 2025-26 7-slab Section 115BAC specifications
│   ├── SYNTHETIC_DATA_SCHEMA.md        # Transaction generator schema & multi-source fusion
│   └── API_CONTRACT.md                 # OpenAPI REST endpoints & request/response schemas
├── data/                               # Dataset directory
│   ├── user_profiles.csv               # 10,000 master profiles (16D feature matrix)
│   ├── real_user_profiles_agami.csv    # 200 real Indian accounts feature vectors
│   └── synthetic_transactions.csv      # Sample transaction streams
├── models/                             # Serialized scikit-learn models (.joblib)
│   ├── income_regressor.joblib         # Random Forest Regressor (R2 = 0.9977)
│   ├── tax_classifier.joblib           # Gradient Boosting Classifier (Acc = 98.35%)
│   ├── kmeans_personas.joblib          # K-Means Persona Clustering (k=4)
│   ├── pca_projector.joblib            # 3D PCA Latent Space Projector
│   ├── scaler.joblib                   # StandardScaler transformation model
│   ├── evaluation_metrics.json         # Cross-validation leaderboards & confusion matrix
│   └── production_benchmark_report.json# 51k real-data validation report
├── scripts/                            # Data processing & benchmark scripts
│   ├── feature_engineering.py          # 16D high-dimensional feature extractor
│   ├── build_comprehensive_dataset.py  # Multi-source real data fusion engine
│   ├── train_models.py                 # Multi-algorithm training & evaluation
│   ├── benchmark_production_real_data.py # Production real-data benchmark suite
│   └── test_pipeline.py                # End-to-end inference verification
├── backend/                            # FastAPI Python REST Application
│   ├── app/                            # Config, routers, schemas, services, database
│   ├── requirements.txt                # Python dependencies
│   └── tests/                          # Pytest integration test suite
└── frontend/                           # Vite + React 19 TypeScript Web Application
    ├── src/                            # Navbar, DiagnosticView, Simulator, EvaluationHub, PCA
    └── dist/                           # Production static build
```

---

## API Endpoints

- `POST /api/upload-statement`: Uploads raw CSV bank statement, extracts 16D feature vector, and runs multi-model inference.
- `POST /api/predict-features`: Runs real-time inference on direct 16-dimensional slider values.
- `GET /api/models/evaluation`: Returns cross-validation metrics, confusion matrices, and feature importance rankings.
- `GET /api/clusters/pca-points`: Returns 2D and 3D PCA coordinates and cluster assignments.
- `GET /api/samples`: Returns pre-calibrated demonstration financial profiles.
- `GET /api/health`: Returns service health status and loaded model states.

---

## Benchmarks & Performance Summary

| Metric | Income Regressor | Tax Classifier (7 Slabs) | Clustering ($k=4$) | PCA (3D) |
| :--- | :---: | :---: | :---: | :---: |
| **Model** | Random Forest | Gradient Boosting | K-Means | SVD Linear |
| **Validation Metric** | $R^2 = 0.9977$ | Accuracy = $98.35\%$ | Silhouette = $0.3285$ | Explained Var = $79.22\%$ |
| **Error / Loss** | $\text{RMSE} = \text{₹34,815}$ | $\text{Macro F1} = 0.9556$ | WCSS optimized | $\text{MSE}_{\text{recon}} < 0.05$ |
| **Real Holdout Data** | $R^2 = 0.9657$ | Accuracy = $100.0\%$ | 4 Personas | Spatial separation |
| **Latency (p50)** | $< 2\text{ ms}$ | $< 3\text{ ms}$ | $< 1\text{ ms}$ | $< 1\text{ ms}$ |

---

## License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.
