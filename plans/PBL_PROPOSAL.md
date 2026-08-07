# Project-Based Learning (PBL) Proposal

## Project Title
**FinSight: Machine Learning-based Financial Intelligence System**  
*(Alternative Title: Smart Financial Intelligence & Tax Estimation System)*

---

## 1. Core Idea & Context
A web application that analyzes a user's financial activity using machine learning to:
1. Estimate annual gross income from transaction activity.
2. Predict the likely income tax slab under the Indian tax system.
3. Classify users into financial behavior personas using unsupervised clustering.
4. Visualize high-dimensional financial patterns using Principal Component Analysis (PCA).

The system is intended as an **intelligent financial analysis and diagnostic assistant**, not as an automated legal tax-filing or fraud detection engine.

---

## 2. Academic Focus & Curriculum Alignment
Demonstrate practical, end-to-end applications of core Machine Learning algorithms taught in an *Introduction to Machine Learning* course:

- **Regression**: Estimate continuous annual income ($y \in \mathbb{R}^+$).
- **Classification**: Predict discrete tax slab classes ($y \in \{0, 1, 2, 3, 4, 5\}$).
- **Clustering**: Group users by financial behavior using $k$-Means and Silhouette analysis.
- **Dimensionality Reduction (PCA)**: Reduce multi-dimensional feature vectors to 2D/3D visual projections.
- **Model Comparison**: Compare baseline models against ensemble techniques using standard evaluation metrics ($R^2$, RMSE, MAE, Accuracy, Precision, Recall, F1, Confusion Matrix).

---

## 3. Problem Statement
Many individuals and financial professionals (such as Chartered Accountants) spend significant time manually analyzing bank statements to estimate taxable income, categorize expenditures, and understand cashflow dynamics. 

Existing tax calculators rely on users to manually calculate and enter precise gross figures and cannot infer financial insights from raw transactional data. This project automates financial feature extraction and predictive modeling using models trained on a transparent, realistic synthetic dataset while maintaining transparency that predictions are statistical estimates rather than legal tax advice.

---

## 4. Tech Stack

- **Frontend**: Next.js 15 (React 19), Tailwind CSS, Lucide Icons
- **Visualizations**: Plotly.js / Recharts (2D/3D PCA Scatter, Confusion Matrix, Cashflow Breakdowns)
- **Backend API**: FastAPI (Python 3.11+) with Pydantic v2
- **Machine Learning**: scikit-learn, pandas, NumPy, joblib
- **Database**: SQLite (local transaction/profile storage)
- **Dataset**: Realistic Synthetic Indian Financial Transaction Generator (NumPy/Faker)
- **Deployment**: Vercel (Frontend) + Render / Hugging Face Spaces (Backend & ML Demo)

---

## 5. Expected Outcomes & Key Features

1. **Bank Statement Ingestion**: Upload bank statement in CSV / structured format, with 1-click preset sample datasets for quick demonstration.
2. **Automated Feature Extraction**: Aggregate daily/monthly debits and credits into statistical ratios (savings rate, discretionary spend index, investment ratio, income volatility).
3. **Multi-Model Predictive Outputs**:
   - Estimated Annual Gross Income (₹) with error bounds.
   - Predicted Indian Tax Slab with class probability distribution.
   - Financial Behavior Persona assignment (e.g., *Conservative Investor*, *Discretionary Spender*).
4. **Interactive Analytics Dashboard**: Spending breakdown by category, monthly inflow/outflow cashflows, and lifestyle ratios.
5. **Model Evaluation & Explainability Hub**:
   - Side-by-side metric comparison (Linear Regression vs. Random Forest; Logistic Regression vs. Random Forest vs. SVC).
   - Interactive Confusion Matrix heatmap.
   - Feature Importance ranking chart.
   - 2D / 3D PCA cluster scatter plot with dynamic user positioning.

---

## 6. Innovation & Differentiators

- **Machine Learning over Rule Engines**: Uses learned statistical relationships rather than hardcoded static formulas.
- **Multi-Paradigm ML Integration**: Combines regression, classification, clustering, and PCA within a single cohesive product.
- **Transparent Synthetic Data Pipeline**: Generates reproducible financial distributions modeled on Indian banking patterns (UPI, NEFT, SIPs, EMIs).
- **Explainable Predictions**: Exposes feature importance and model evaluation metrics to the end user.
