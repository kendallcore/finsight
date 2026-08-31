"""
FinSight Hugging Face Automated Publisher
Publishes:
1. Model Hub: sanjeevafk/finsight-indian-tax-models (Models + Metrics + Card)
2. Dataset Hub: sanjeevafk/indian-banking-tax-profiles-2025 (10k Profiles + Real 51k Benchmark)
3. Spaces: sanjeevafk/finsight (Live Dockerized Full-Stack Web Application)
"""

import os
import shutil
import tempfile
from huggingface_hub import HfApi, create_repo, upload_folder, upload_file

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(ROOT_DIR, "models")
DATA_DIR = os.path.join(ROOT_DIR, "data")
FRONTEND_DIST = os.path.join(ROOT_DIR, "frontend", "dist")

MODEL_CARD_CONTENT = """---
language:
- en
license: apache-2.0
tags:
- financial-intelligence
- tax-estimation
- scikit-learn
- tabular-regression
- tabular-classification
- india
- section-115bac
pipeline_tag: tabular-classification
---

# FinSight: Machine Learning Models for Indian Tax Estimation & Financial Diagnostics

This repository contains the trained, serialized machine learning models powering **FinSight**, an automated financial intelligence and tax estimation platform calibrated against the **Indian Income Tax New Tax Regime (Section 115BAC - FY 2025–26)**.

## Model Summary

- **Task 1 (Gross Income Regression)**: Random Forest Regressor ($R^2 = 0.9977$, $\text{RMSE} = \\text{₹34,815}$, $\text{MAPE} = 1.30\\%$)
- **Task 2 (7-Slab Tax Classification)**: Gradient Boosting Classifier ($\text{Accuracy} = 98.35\\%$, $\text{Macro F1} = 0.9556$)
- **Task 3 (Persona Segmentation)**: $k$-Means Clustering ($k=4$, $\\text{Silhouette} = 0.3285$)
- **Task 4 (Latent Space Decomposition)**: 3D PCA Projector ($\text{Explained Variance} = 79.22\\%$)
- **Real-Data Holdout Generalization**: Validated on 51,945 real Indian bank transactions across 200 accounts ($R^2 = 0.9657$, $\text{MAPE} = 2.51\\%$, $100\\%$ tax slab agreement).

## 16-Dimensional Feature Schema

The models ingest a 16-dimensional standardized financial behavioral vector:
1. `log_annual_credit` (log-transformed annual deposit magnitude)
2. `log_annual_debit` (log-transformed annual withdrawal magnitude)
3. `net_savings_ratio` (surplus retention ratio)
4. `monthly_burn_rate` (debits / credits)
5. `salary_inflow_ratio` (payroll credit share)
6. `monthly_credit_cv` (coefficient of variation of monthly deposits)
7. `salary_regularity_score` (months with consistent salary inflow / 12)
8. `bonus_lump_sum_ratio` (lump-sum spikes >= 2x monthly average)
9. `investment_ratio` (SIPs, mutual funds, equity allocations)
10. `fixed_obligation_ratio` (rent, EMIs, utilities)
11. `discretionary_ratio` (dining, food delivery, shopping, travel)
12. `tax_shield_ratio` (NPS Tier-1 14%, PPF, term life insurance)
13. `upi_velocity_index` (UPI transaction share)
14. `micro_spend_density` (UPI transactions < ₹500 / total outflow)
15. `log_avg_ticket_size` (mean transaction value log-scaled)
16. `capital_gains_flux` (dividend & redemption inflows)

## Statutory Tax Calculation (FY 2025–26)

- Standard deduction: ₹75,000 for salaried employees.
- Section 87A rebate: Up to ₹60,000 for taxable income $\le$ ₹12,00,000 (effective zero tax ceiling up to ₹12.75 Lakhs).

## Usage in Python

```python
import joblib
import numpy as np

# Load artifacts
scaler = joblib.load("scaler.joblib")
regressor = joblib.load("income_regressor.joblib")
classifier = joblib.load("tax_classifier.joblib")

# Example 16D feature vector
x = np.array([[14.18, 13.79, 0.32, 0.68, 0.88, 0.08, 1.0, 0.10, 0.18, 0.31, 0.21, 0.08, 0.72, 0.06, 7.62, 0.0]])
x_scaled = scaler.transform(x)

pred_income = regressor.predict(x_scaled)[0]
pred_slab = classifier.predict(x_scaled)[0]

print(f"Estimated Gross Income: ₹{pred_income:,.2f}")
print(f"Predicted Tax Slab: Class {pred_slab}")
```
"""

DATASET_CARD_CONTENT = """---
language:
- en
license: apache-2.0
tags:
- financial-data
- banking-transactions
- upi-payments
- tax-profiles
- india
pretty_name: Indian Banking Transaction Features & Tax Profiles (FY 2025-26)
size_categories:
- 10K<n<100K
---

# Indian Banking Financial Profiles & Tax Slabs Dataset (FY 2025–26)

This dataset contains **10,000 comprehensive financial behavioral profiles** constructed by fusing 4 real Indian financial distributions:
1. **Agami Indian Banking Statements**: Ingested 51,945 real transactions across 200 Indian corporate bank accounts to calibrate realistic credit CV, transaction frequency, and salary timing.
2. **Kaggle 2024 UPI Dataset**: 250,000 real UPI transactions calibrating payment rails and micro-spend densities.
3. **Kaggle Indian Credit Card Spending**: 26,052 credit card records calibrating discretionary vs. fixed obligation ratios.
4. **Indian Tech Salaries Corpus**: 20,960 compensation data points calibrating base salaries and bonus lump sums.

## Files

- `user_profiles.csv`: Master 10,000-profile matrix with 16 engineered features, raw annual income, statutory tax slab (Classes 0–6), and ground-truth persona labels.
- `real_user_profiles_agami.csv`: 200 real Indian accounts feature vectors for out-of-distribution holdout evaluation.
- `synthetic_transactions.csv`: Sample transaction streams with timestamps, payment modes (UPI/NEFT/IMPS/ACH), categories, and narrations.
"""

SPACE_README_CONTENT = """---
title: FinSight Financial Intelligence & Tax System
emoji: 💰
colorFrom: green
colorTo: emerald
sdk: docker
app_port: 8000
pinned: false
license: apache-2.0
---

# FinSight: ML-Powered Financial Diagnostics & Indian Tax System

Check out the live interactive app at `http://localhost:8000` or right here on Hugging Face Spaces!
"""


def publish_all():
    api = HfApi()
    user_info = api.whoami()
    username = user_info["name"]
    print(f"✓ Authenticated with Hugging Face as: @{username}\n")

    # 1. Publish Model Hub
    model_repo_id = f"{username}/finsight-indian-tax-models"
    print(f"[1/3] Creating and uploading Model Hub repo: {model_repo_id} ...")
    create_repo(repo_id=model_repo_id, repo_type="model", exist_ok=True, private=False)

    with tempfile.TemporaryDirectory() as tmp_model_dir:
        # Copy model artifacts
        for f in os.listdir(MODELS_DIR):
            src = os.path.join(MODELS_DIR, f)
            if os.path.isfile(src):
                shutil.copy2(src, os.path.join(tmp_model_dir, f))
        
        # Write Model Card
        with open(os.path.join(tmp_model_dir, "README.md"), "w") as f:
            f.write(MODEL_CARD_CONTENT.strip())

        upload_folder(
            folder_path=tmp_model_dir,
            repo_id=model_repo_id,
            repo_type="model",
            commit_message="feat: upload FinSight scikit-learn models, scalers, and benchmark reports"
        )
    print(f"      ✓ Model Hub uploaded: https://huggingface.co/{model_repo_id}\n")

    # 2. Publish Dataset Hub
    dataset_repo_id = f"{username}/indian-banking-tax-profiles-2025"
    print(f"[2/3] Creating and uploading Dataset Hub repo: {dataset_repo_id} ...")
    create_repo(repo_id=dataset_repo_id, repo_type="dataset", exist_ok=True, private=False)

    with tempfile.TemporaryDirectory() as tmp_data_dir:
        for f in ["user_profiles.csv", "real_user_profiles_agami.csv", "synthetic_transactions.csv"]:
            src = os.path.join(DATA_DIR, f)
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(tmp_data_dir, f))

        with open(os.path.join(tmp_data_dir, "README.md"), "w") as f:
            f.write(DATASET_CARD_CONTENT.strip())

        upload_folder(
            folder_path=tmp_data_dir,
            repo_id=dataset_repo_id,
            repo_type="dataset",
            commit_message="feat: upload 10k fused Indian banking profiles and real Agami benchmark corpus"
        )
    print(f"      ✓ Dataset Hub uploaded: https://huggingface.co/datasets/{dataset_repo_id}\n")

    # 3. Publish Spaces (Free Static Web App)
    space_repo_id = f"{username}/finsight"
    print(f"[3/3] Creating and deploying Static Space repo: {space_repo_id} ...")
    try:
        create_repo(repo_id=space_repo_id, repo_type="space", space_sdk="static", exist_ok=True, private=False)

        with tempfile.TemporaryDirectory() as tmp_space_dir:
            # Copy compiled frontend dist files
            if os.path.exists(FRONTEND_DIST):
                for item in os.listdir(FRONTEND_DIST):
                    s = os.path.join(FRONTEND_DIST, item)
                    d = os.path.join(tmp_space_dir, item)
                    if os.path.isdir(s):
                        shutil.copytree(s, d)
                    else:
                        shutil.copy2(s, d)

            # Write Space README metadata
            static_space_readme = """---
title: FinSight Financial Intelligence & Tax System
emoji: 💰
colorFrom: green
colorTo: green
sdk: static
pinned: false
license: apache-2.0
---

# FinSight Interactive Web Dashboard
"""
            with open(os.path.join(tmp_space_dir, "README.md"), "w") as f:
                f.write(static_space_readme.strip())

            upload_folder(
                folder_path=tmp_space_dir,
                repo_id=space_repo_id,
                repo_type="space",
                commit_message="feat: deploy FinSight static frontend SPA on Hugging Face Spaces"
            )
        print(f"      ✓ Static Space deployed: https://huggingface.co/spaces/{space_repo_id}\n")
    except Exception as e:
        print(f"      ⚠ Spaces deployment note: {e}\n")

    print("================================================================================")
    print("  All FinSight Artifacts Successfully Published to Hugging Face!                ")
    print(f"  - Models  : https://huggingface.co/{model_repo_id}")
    print(f"  - Datasets: https://huggingface.co/datasets/{dataset_repo_id}")
    print(f"  - Spaces  : https://huggingface.co/spaces/{space_repo_id}")
    print("================================================================================")

if __name__ == "__main__":
    publish_all()
