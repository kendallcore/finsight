# 4-Week Milestone Execution Roadmap

This roadmap breaks down the 1-month development cycle into weekly actionable deliverables for building, validating, and demoing **FinSight**.

---

## 📅 Sprint Overview

```
Week 1: Data & Models       Week 2: FastAPI Backend     Week 3: Next.js Frontend    Week 4: Demo & Polish
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│ • dataset_generator.py│   │ • FastAPI scaffold    │   │ • Next.js 15 UI       │   │ • 1-Click Demo cases  │
│ • Feature engineering │   │ • /api/upload endpoint│   │ • Plotly/Recharts     │   │ • Model Lab Heatmaps  │
│ • scikit-learn models │   │ • /api/predict engine │   │ • CSV drag-and-drop   │   │ • PPT & Viva Defense  │
│ • Export .joblib      │   │ • SQLite integration  │   │ • 3D PCA Visualizer   │   │ • Deployment (Render) │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

---

## 🗓️ Week-by-Week Breakdown

| Phase | Focus Area | Status | Deliverable |
| :--- | :--- | :---: | :--- |
| **Phase 1** | **ML Core & 16D Feature Engineering** | ✅ **Completed** | 10,000 fused profiles, 16D feature pipeline, $R^2=0.998$ Random Forest regressor, 98.35% GBC classifier, $k=4$ K-Means, and 3D PCA projector |
| **Phase 2** | **FastAPI REST Backend** | ✅ **Completed** | Async CSV statement parser, multi-model inference, Section 115BAC statutory tax calculator, and Pytest suite |
| **Phase 3** | **Vite React 19 Frontend SPA** | ✅ **Completed** | Minimalist high-density UI, drag-and-drop CSV diagnostic, what-if sliders, 3D Plotly WebGL scatter, and evaluation leaderboards |
| **Phase 4** | **Viva Defense & 1-Click Launch** | ✅ **Completed** | 1-Click launcher script (`./run.sh`), examiner Q&A guide, 5 calibrated demonstration presets |

### Week 1: Data Engineering & Core ML Pipeline
- [ ] Implement `scripts/generate_dataset.py` with 5,000 realistic Indian transaction records.
- [ ] Implement `scripts/feature_extractor.py` to aggregate raw transactions into feature vectors.
- [ ] Train & Compare **Regression Models**:
  - Linear Regression vs. Ridge vs. Random Forest Regressor.
  - Calculate RMSE, MAE, and $R^2$ scores.
- [ ] Train & Compare **Classification Models**:
  - Multinomial Logistic Regression vs. Decision Tree vs. Random Forest Classifier vs. SVC.
  - Calculate Accuracy, Precision, Recall, Macro-F1, and Confusion Matrices.
- [ ] Fit **$k$-Means Clustering** ($k=4$) and compute Silhouette Analysis.
- [ ] Fit **PCA Model** (2D & 3D components) and export explained variance ratios.
- [ ] Export all fitted estimators and scalers to `models/*.joblib`.

### Week 2: FastAPI REST API & Ingestion Engine
- [ ] Initialize Python backend with FastAPI, Pydantic v2, and Uvicorn.
- [ ] Build `POST /api/upload-statement`: Accepts CSV, extracts features, and runs live inference.
- [ ] Build `POST /api/predict-manual`: Allows instant what-if slider parameter testing.
- [ ] Build `GET /api/evaluation/metrics`: Serves pre-computed model comparison benchmark tables.
- [ ] Build `GET /api/clusters/pca-points`: Serves 2D/3D coordinates for interactive scatter plotting.
- [ ] Add SQLite database persistence to store statement analysis records.

### Week 3: Next.js 15 Web Application & Visualizations
- [ ] Scaffold Next.js 15 app with Tailwind CSS and Lucide React.
- [ ] Build **Statement Upload View**: Clean drag-and-drop file uploader with instant feature cards.
- [ ] Build **Tax & Income Summary Card**: Displays predicted income ($\pm \text{error}$) and tax slab with confidence gauge.
- [ ] Build **Spending Analytics Dashboard**: Monthly inflow/outflow bar charts and lifestyle spend donut graphs.
- [ ] Build **Interactive 2D/3D PCA Visualizer**: Render clusters using Plotly.js / Canvas with the user's live position highlighted.

### Week 4: Model Comparison Lab, Viva Prep & Deployment
- [ ] Build **Model Evaluation Lab Tab**: Side-by-side metric tables, confusion matrix heatmap, and feature importance rankings.
- [ ] Embed **3 One-Click Demo Personas** (*College Intern*, *Mid-level Software Engineer*, *High-Net-Worth Freelancer*) so the viva presentation runs smoothly without relying on file uploads.
- [ ] Prepare project presentation slides (PPT), architecture diagrams, and report documentation.
- [ ] Deploy frontend to Vercel and backend to Render / Hugging Face Spaces.
