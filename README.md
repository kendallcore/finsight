# FinSight (Smart Financial Intelligence & Tax Estimation System)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.0+-black.svg)](https://nextjs.org)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E.svg)](https://scikit-learn.org)

> **FinSight** is an end-to-end Machine Learning-powered financial analytics and tax estimation platform designed for university Project-Based Learning (PBL) in *Introduction to Machine Learning*. It automates bank statement ingestion, extracts high-dimensional financial feature vectors, predicts annual taxable income (Regression), classifies Indian Tax Slabs (Multi-Class Classification), segments spending personas (K-Means Clustering), and projects financial distributions into 2D/3D visual space (PCA).

---

## 🎯 Executive Overview & Core Problem

### The Problem
- Traditional tax calculators require users to manually calculate and enter their exact taxable income, gross salary, and deduction summaries.
- Bank statements contain hundreds of unstructured micro-transactions (UPI, NEFT, IMPS, RTGS, POS), making it labor-intensive for individuals and tax consultants (CAs) to manually aggregate income streams, detect lifestyle patterns, and project tax liability.
- Most personal finance tools act purely as expense trackers or use opaque rules rather than statistical learning algorithms with transparent model evaluation and explainability.

### The FinSight Solution
FinSight provides a **data-driven financial diagnostics assistant**:
1. **Automated Statement Feature Extraction**: Aggregates raw transactional history (credits, debits, UPI velocity, SIPs, fixed obligations) into a structured feature vector.
2. **Supervised Regression**: Predicts estimated gross annual taxable income with baseline vs. ensemble model comparisons ($R^2$, RMSE, MAE).
3. **Supervised Classification**: Classifies users into official Indian Tax Slabs (Section 115BAC New Tax Regime) with class probability confidence scores and confusion matrix evaluation.
4. **Unsupervised Clustering ($k$-Means)**: Discovers natural financial personas (*Aggressive Wealth Builder*, *Balanced Professional*, *Discretionary Spender*, *Entry/Student Saver*) with Silhouette score optimization.
5. **Dimensionality Reduction (PCA)**: Projects multi-dimensional financial behavior vectors into interactive 2D and 3D visual coordinates.
6. **Model Explainability & Evaluation Hub**: Interactive dashboard for professors and evaluators displaying feature importances, confusion matrices, ROC/PR curves, and side-by-side metric tables.

---

## 🔬 Machine Learning Architecture

```
                                 ┌─────────────────────────────────┐
                                 │   Raw Bank Statement (CSV)      │
                                 └────────────────┬────────────────┘
                                                  │
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │   Feature Extraction Pipeline   │
                                 │   - Annual Credits & Debits     │
                                 │   - Investment / Inflow Ratio   │
                                 │   - Discretionary Spend Ratio   │
                                 │   - Salary Credit Volatility    │
                                 │   - Micro-UPI Velocity Index    │
                                 └────────────────┬────────────────┘
                                                  │
                       ┌──────────────────────────┴──────────────────────────┐
                       │                                                     │
                       ▼                                                     ▼
         ┌──────────────────────────────┐                      ┌──────────────────────────────┐
         │ 1. Income Regression Model   │                      │ 2. Tax Slab Classifier       │
         │ • Ridge vs Random Forest/GBR │                      │ • Logistic Reg vs RF vs SVC  │
         │ • Target: Annual Income (₹)  │                      │ • Target: Slabs 0 to 6       │
         │ • Metrics: RMSE, MAE, R²     │                      │ • Metrics: Accuracy, F1, CM  │
         └──────────────┬───────────────┘                      └──────────────┬───────────────┘
                        │                                                     │
                        └──────────────────────────┬──────────────────────────┘
                                                   │
                        ┌──────────────────────────┴──────────────────────────┐
                        │                                                     │
                        ▼                                                     ▼
         ┌──────────────────────────────┐                      ┌──────────────────────────────┐
         │ 3. Persona Clustering        │                      │ 4. PCA Projection Visualizer │
         │ • K-Means (Elbow + Silhouette│                      │ • 2D / 3D Coordinate Mapping │
         │ • Personas: Savers / Spenders│                      │ • Explained Variance Ratio   │
         └──────────────────────────────┘                      └──────────────────────────────┘
```

---

## 🇮🇳 Indian Tax System Modeling (Section 115BAC - FY 2025–26)

FinSight is calibrated against the official **Indian Income Tax New Tax Regime** (FY 2025–26 / Finance Act 2025):

| Slab Class | Taxable Income Range (₹) | Base Tax Rate | Effective Notes |
| :---: | :--- | :---: | :--- |
| **Class 0** | Up to ₹4,00,000 | 0% (Nil) | Basic Exemption Limit |
| **Class 1** | ₹4,00,001 to ₹8,00,000 | 5% | Fully covered under Section 87A rebate |
| **Class 2** | ₹8,00,001 to ₹12,00,000 | 10% | Sec 87A rebate up to ₹60,000 $\rightarrow$ **₹0 Effective Tax** |
| **Class 3** | ₹12,00,001 to ₹16,00,000 | 15% | Standard professional bracket |
| **Class 4** | ₹16,00,001 to ₹20,00,000 | 20% | Senior tech / managerial bracket |
| **Class 5** | ₹20,00,001 to ₹24,00,000 | 25% | Executive bracket |
| **Class 6** | Above ₹24,00,000 | 30% | Highest marginal rate |

*Note: Salaried individuals receive a flat **₹75,000 standard deduction**, lifting the effective zero-tax ceiling to **₹12.75 Lakhs**.*

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | Vite 6, React 19, TypeScript, Tailwind CSS, Lucide Icons | Minimalist high-density UI, drag-and-drop CSV upload, what-if sliders |
| **Visualizations** | Plotly.js (WebGL 3D Scatter), Recharts (Donuts & Bars) | Interactive 3D PCA cluster exploration, confusion matrix, spend allocations |
| **Backend API** | FastAPI (Python 3.12), Pydantic v2, Uvicorn, SQLAlchemy | High-performance REST API, async statement parsing & real-time inference |
| **ML Engine** | scikit-learn, NumPy, pandas, joblib | 16D feature extraction, GBR regression ($R^2=0.998$), Random Forest / GBC (98.35% acc) |
| **Database** | SQLite (SQLAlchemy ORM) | Lightweight local persistence for historical uploads and cached benchmarks |
| **Data Fusion** | Agami Statements (51k txns), Kaggle UPI, Tech Salaries | 10,000 unified profiles grounded in real Indian banking behavior |

---

## ⚡ Quickstart (1-Click Launch)

Run the full-stack application (FastAPI backend + Vite SPA) with a single command:

```bash
# 1. Clone & enter repository
git clone https://github.com/sanjeevafk/finsight.git
cd finsight

# 2. Run automated launcher (installs dependencies, trains models, and launches server)
./run.sh
```

- **Interactive Web Dashboard**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger REST API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 📁 Repository Structure

```
finsight/
├── run.sh                              # 1-Click full-stack launch script
├── docs/                               # Detailed Project Documentation
│   ├── original/                       # Original college PBL requirements (PDF & DOCX)
│   ├── ARCHITECTURE.md                 # System architecture & component design
│   ├── ML_SPECIFICATION.md             # 16D features, mathematical loss functions & metrics
│   ├── INDIAN_TAX_SYSTEM.md            # FY 2025-26 7-slab Section 115BAC specifications
│   ├── SYNTHETIC_DATA_SCHEMA.md        # Transaction generator schema & multi-source fusion
│   ├── ROADMAP.md                      # 4-week execution roadmap & milestones
│   ├── VIVA_AND_DEMO_GUIDE.md          # Viva defense script, FAQs & examiner answers
│   └── API_CONTRACT.md                 # OpenAPI REST endpoints & request/response schemas
├── data/                               # Dataset directory (real & fused profiles)
│   ├── user_profiles.csv               # 10,000 master profiles (16D feature matrix)
│   ├── real_user_profiles_agami.csv    # 200 real Indian accounts feature vectors
│   └── synthetic_transactions.csv      # Sample transaction streams
├── models/                             # Serialized scikit-learn models (.joblib)
│   ├── income_regressor.joblib         # Random Forest Regressor (R² = 0.9977)
│   ├── tax_classifier.joblib           # Gradient Boosting Classifier (Acc = 98.35%)
│   ├── kmeans_personas.joblib          # K-Means Persona Clustering (k=4)
│   ├── pca_projector.joblib            # 3D PCA Latent Space Projector
│   └── evaluation_metrics.json         # Benchmark leaderboards & confusion matrix
├── scripts/                            # Data generation, extraction & training scripts
│   ├── feature_engineering.py          # 16D high-dimensional feature extractor
│   ├── build_comprehensive_dataset.py  # Multi-source real data fusion engine
│   ├── train_models.py                 # Multi-algorithm training & evaluation
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

## 🚀 4-Week Milestone Roadmap

| Milestone | Timeframe | Focus Deliverable |
| :--- | :--- | :--- |
| **Phase 1: ML Core & Data** | Week 1 | Synthetic data generator (5,000 profiles), scikit-learn models trained & exported |
| **Phase 2: FastAPI Backend** | Week 2 | REST endpoints for CSV ingestion, prediction, metrics, and PCA coordinates |
| **Phase 3: Next.js Frontend** | Week 3 | Dashboard UI, CSV upload flow, interactive Recharts/Plotly graphs |
| **Phase 4: Model Lab & Demo** | Week 4 | Model comparison lab, feature importances, 1-click viva presets, presentation deck |

---

## 💡 Key Highlights for Academic Viva & Evaluation

1. **Deterministic ML vs. Generative LLMs**: Demonstrates classical tabular machine learning with bounded mathematical guarantees rather than ungrounded conversational LLM prompts.
2. **Transparent Model Comparison**: Evaluates multiple algorithms per task (Linear Regression vs. Random Forest; Logistic Regression vs. SVC) rather than presenting a single opaque model.
3. **Unsupervised + Supervised Synergy**: Seamlessly ties transaction classification and income regression back into $k$-Means clustering and PCA spatial representations.
4. **Zero-PII Privacy Architecture**: Runs local inference without sending private banking statements to third-party proprietary clouds.

---

## 👥 Contributors & Academic Context

- **Course**: Introduction to Machine Learning (PBL / Mini-Project)
- **Project Title**: FinSight: Machine Learning-based Financial Intelligence System
- **Repository**: Private Academic Repository (`sanjeevafk/finsight`)
