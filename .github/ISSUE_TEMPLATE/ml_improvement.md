---
name: ML / Model Improvement
about: Propose improvements to 16D feature engineering, model architectures, hyperparameter tuning, or clustering
title: '[ML] '
labels: 'ml/data'
assignees: ''
---

## Current Model Baseline
- **Target Subsystem**: [e.g. Income Regressor, Tax Slab Classifier, K-Means Clustering, PCA Latent Space]
- **Current Baseline Metric**: [e.g. Income Regressor $R^2 = 0.9977$, Tax Slab Classifier Accuracy = 98.35%]

## Dataset / Feature Vector Context
- **Feature(s) Affected**: [e.g. `monthly_credit_cv`, `discretionary_ratio`, new proposed 17th feature]
- **Dataset Source**: [e.g. `user_profiles.csv`, Kaggle UPI, synthetic transaction generator]

## Proposed Change
Describe the algorithm, feature engineering change, or hyperparameter optimization approach you propose:
- [ ] New feature extraction logic
- [ ] Model architecture swap (e.g. XGBoost / LightGBM vs Random Forest)
- [ ] Hyperparameter tuning strategy
- [ ] Clustering / Persona re-calibration

## Expected Metrics & Validation
What metrics do you expect to improve? (e.g. Lower RMSE on holdout real user accounts, higher Silhouette score for $k=4$ or $k=5$).

## Reproducibility Steps
List the scripts (e.g. `scripts/train_models.py`, `scripts/feature_engineering.py`) and seed settings required to reproduce your proposed benchmark result.
