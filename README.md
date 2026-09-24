# FinSight — Behavioral Spending Analysis & Financial Archetype Intelligence

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E.svg)](https://scikit-learn.org)

FinSight is a machine learning system designed to parse raw Indian bank statements, extract high-dimensional behavioral features, classify lifestyle spending archetypes, and provide actionable financial health diagnostics.

Developed as a term project for an Intro to Machine Learning course, FinSight demonstrates an end-to-end applied ML pipeline—from domain-specific feature engineering to supervised classification, regression, unsupervised clustering, and counterfactual simulation.

---

## Key Capabilities

- **Multi-Bank Statement Ingestion**: Normalizes transaction records and reconciles unstructured narratives across major Indian banks (CSV and PDF formats).
- **16D Behavioral Feature Engineering**: Translates raw transactions into four functional quadrants: Cashflow Scale, Inflow Stability, Allocation Ratios, and Digital Velocity.
- **Lifestyle Archetype Classification**: Categorizes user financial behavior into four distinct archetypes (Frugal Minimalist, Experiential Spender, High-Burn Consumer, Strategic Wealth Builder) using a Gradient Boosting Classifier.
- **Cashflow Turnover Regression**: Predicts annual turnover volume via ensemble Random Forest regression.
- **Unsupervised Clustering & 3D PCA**: Identifies behavioral cohorts using k-Means clustering and visualizes latent geometries with interactive 3D WebGL scatter plots.
- **Deterministic Coaching & Diagnostics**: Evaluates 50/30/20 budget adherence, emergency cash runway, and personalized z-score anomaly detection for recurring leaks and spending spikes.
- **What-If Counterfactual Simulator**: Real-time 16-slider interactive sandbox demonstrating how behavioral shifts impact archetype classification and financial resilience.

---

## Machine Learning Architecture

| Task | Primary Model | Baseline / Comparison | Key Metric |
| :--- | :--- | :--- | :--- |
| **Archetype Classification** | Gradient Boosting Classifier | Random Forest, SVM, Logistic Regression | 98.40% Accuracy, 0.9820 Macro F1 |
| **Turnover Regression** | Random Forest Regressor | Gradient Boosting, Ridge Regression | R² = 0.9977, MAPE = 1.30% |
| **Cohort Clustering** | k-Means (k=4) | Hierarchical Clustering | Silhouette Score = 0.3285 |
| **Dimensionality Reduction** | Principal Component Analysis | Truncated SVD | 79.22% Cumulative Variance (3 components) |

---

## Technology Stack

- **Backend**: FastAPI (Python 3.12), Pydantic v2, SQLAlchemy, Uvicorn
- **Machine Learning**: scikit-learn, NumPy, pandas, joblib, SciPy
- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, Recharts, Plotly.js (WebGL 3D)
- **Quality Assurance**: Pytest (125 specs), Vitest (31 specs), 100% pass rate

---

## Quickstart

### Automated Script (Linux / macOS)

```bash
git clone https://github.com/sanjeevafk/finsight.git
cd finsight
./run.sh
```

### Manual Setup

1. **Backend**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

- **Dashboard**: http://localhost:8000 (or http://localhost:5173 during Vite development)
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

---

## Core API Endpoints

- `POST /api/upload-statement`: Ingests bank statement files (CSV/PDF), extracts 16D features, and generates diagnostics.
- `POST /api/predict-features`: Evaluates raw 16D feature inputs for real-time what-if simulation.
- `GET /api/models/evaluation`: Returns benchmark metrics, confusion matrices, and feature importance rankings.
- `GET /api/clusters/pca-points`: Serves 2D and 3D PCA coordinates and cluster assignments.
- `GET /api/samples`: Provides demonstration profiles representing each lifestyle archetype.

---

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
