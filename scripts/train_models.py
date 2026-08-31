"""
FinSight Model Training & Benchmarking Pipeline
Trains Supervised Regression, Multi-Class 7-Slab Classification (FY 2025-26),
K-Means Clustering, and PCA Projections. Serializes artifacts to models/ directory.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import (
    r2_score, mean_squared_error, mean_absolute_error, mean_absolute_percentage_error,
    accuracy_score, f1_score, confusion_matrix, classification_report, silhouette_score
)

from feature_engineering import FEATURE_NAMES


def train_and_evaluate_all():
    os.makedirs("models", exist_ok=True)

    # 1. Load Data
    data_path = "data/user_profiles.csv"
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Run generate_synthetic_data.py first.")

    df = pd.read_csv(data_path)
    X = df[FEATURE_NAMES].values
    y_income = df["true_annual_income"].values
    y_slab = df["tax_slab_class"].values
    y_cluster_true = df["behavior_cluster"].values

    # Train / Test Split
    X_train, X_test, y_inc_train, y_inc_test, y_slab_train, y_slab_test = train_test_split(
        X, y_income, y_slab, test_size=0.20, random_state=42, stratify=y_slab
    )

    # 2. Fit Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    X_all_scaled = scaler.transform(X)

    joblib.dump(scaler, "models/scaler.joblib")
    print("✓ Saved models/scaler.joblib")

    # 3. Supervised Regression Models (Annual Income)
    print("\n--- Training Supervised Regression Models ---")
    reg_models = {
        "Ridge Regression": Ridge(alpha=1.0),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
    }

    regression_benchmarks = []
    best_reg_score = -float("inf")
    best_reg_model = None
    best_reg_name = None

    for name, model in reg_models.items():
        model.fit(X_train_scaled, y_inc_train)
        y_pred = model.predict(X_test_scaled)

        r2 = float(r2_score(y_inc_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_inc_test, y_pred)))
        mae = float(mean_absolute_error(y_inc_test, y_pred))
        mape = float(mean_absolute_percentage_error(y_inc_test, y_pred)) * 100.0

        regression_benchmarks.append({
            "model_name": name,
            "r2_score": round(r2, 4),
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
            "mape_percent": round(mape, 2)
        })
        print(f"{name:30s} | R²: {r2:.4f} | RMSE: ₹{rmse:,.2f} | MAE: ₹{mae:,.2f} | MAPE: {mape:.2f}%")

        if r2 > best_reg_score:
            best_reg_score = r2
            best_reg_model = model
            best_reg_name = name

    joblib.dump(best_reg_model, "models/income_regressor.joblib")
    joblib.dump(reg_models["Ridge Regression"], "models/income_regressor_baseline.joblib")
    print(f"✓ Saved best regressor ({best_reg_name}) to models/income_regressor.joblib")

    # 4. Supervised Multi-Class Classification (7 Tax Slabs)
    print("\n--- Training Supervised Classification Models (7 Tax Slabs) ---")
    clf_models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest Classifier": RandomForestClassifier(n_estimators=150, max_depth=14, random_state=42, n_jobs=-1),
        "Support Vector Classifier (RBF)": SVC(kernel="rbf", C=5.0, probability=True, random_state=42),
        "Gradient Boosting Classifier": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42)
    }

    classification_benchmarks = []
    best_clf_score = -float("inf")
    best_clf_model = None
    best_clf_name = None
    best_cm = None

    for name, model in clf_models.items():
        model.fit(X_train_scaled, y_slab_train)
        y_pred = model.predict(X_test_scaled)

        acc = float(accuracy_score(y_slab_test, y_pred))
        macro_f1 = float(f1_score(y_slab_test, y_pred, average="macro"))
        weighted_f1 = float(f1_score(y_slab_test, y_pred, average="weighted"))
        cm = confusion_matrix(y_slab_test, y_pred).tolist()

        classification_benchmarks.append({
            "model_name": name,
            "accuracy": round(acc, 4),
            "macro_f1": round(macro_f1, 4),
            "weighted_f1": round(weighted_f1, 4)
        })
        print(f"{name:32s} | Accuracy: {acc*100:.2f}% | Macro F1: {macro_f1:.4f} | Weighted F1: {weighted_f1:.4f}")

        if macro_f1 > best_clf_score:
            best_clf_score = macro_f1
            best_clf_model = model
            best_clf_name = name
            best_cm = cm

    joblib.dump(best_clf_model, "models/tax_classifier.joblib")
    joblib.dump(clf_models["Logistic Regression"], "models/tax_classifier_baseline.joblib")
    print(f"✓ Saved best classifier ({best_clf_name}) to models/tax_classifier.joblib")

    # 5. Feature Importances (From Best Ensemble)
    rf_clf = clf_models["Random Forest Classifier"]
    importances = rf_clf.feature_importances_
    feature_importance_list = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    ]

    # 6. Unsupervised Clustering (K-Means k=4)
    print("\n--- Training K-Means Persona Clustering ---")
    kmeans = KMeans(n_clusters=4, init="k-means++", n_init=10, random_state=42)
    cluster_labels = kmeans.fit_predict(X_all_scaled)
    sil_score = float(silhouette_score(X_all_scaled, cluster_labels))
    print(f"K-Means (k=4) Silhouette Score: {sil_score:.4f}")

    joblib.dump(kmeans, "models/kmeans_personas.joblib")
    print("✓ Saved models/kmeans_personas.joblib")

    # 7. Dimensionality Reduction (PCA 2D & 3D)
    print("\n--- Computing Latent PCA Space ---")
    pca_3d = PCA(n_components=3, random_state=42)
    X_pca_3d = pca_3d.fit_transform(X_all_scaled)
    evr = pca_3d.explained_variance_ratio_.tolist()
    total_evr = float(np.sum(evr))
    print(f"PCA Top-3 Explained Variance: {total_evr*100:.2f}% (Ratios: {[round(r, 4) for r in evr]})")

    joblib.dump(pca_3d, "models/pca_projector.joblib")
    print("✓ Saved models/pca_projector.joblib")

    # Sample PCA points for frontend visualization
    sample_indices = np.random.choice(len(df), size=min(500, len(df)), replace=False)
    pca_sample_points = [
        {
            "user_id": int(df.iloc[idx]["user_id"]),
            "pca_x": round(float(X_pca_3d[idx, 0]), 4),
            "pca_y": round(float(X_pca_3d[idx, 1]), 4),
            "pca_z": round(float(X_pca_3d[idx, 2]), 4),
            "cluster_id": int(cluster_labels[idx]),
            "tax_slab_class": int(y_slab[idx]),
            "annual_income": float(y_income[idx])
        }
        for idx in sample_indices
    ]

    # Persona definitions
    persona_names = {
        0: "High-Growth Wealth Builder",
        1: "Balanced Corporate Professional",
        2: "Discretionary Lifestyle Spender",
        3: "Entry-Level / Student Saver"
    }

    # 8. Compile Complete Benchmark Hub Artifact
    evaluation_hub = {
        "status": "success",
        "tax_regime_year": "FY 2025-26",
        "feature_count": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "regression_comparison": regression_benchmarks,
        "classification_comparison": classification_benchmarks,
        "best_models": {
            "regression": best_reg_name,
            "classification": best_clf_name
        },
        "confusion_matrix": best_cm,
        "confusion_matrix_labels": [
            "Class 0 (0%)", "Class 1 (5%)", "Class 2 (10%)",
            "Class 3 (15%)", "Class 4 (20%)", "Class 5 (25%)", "Class 6 (30%)"
        ],
        "feature_importance": feature_importance_list,
        "clustering": {
            "n_clusters": 4,
            "silhouette_score": round(sil_score, 4),
            "personas": persona_names
        },
        "pca_variance": {
            "explained_variance_ratio": [round(r, 4) for r in evr],
            "total_explained_variance": round(total_evr, 4)
        },
        "pca_sample_points": pca_sample_points
    }

    with open("models/evaluation_metrics.json", "w") as f:
        json.dump(evaluation_hub, f, indent=2)
    print("✓ Saved comprehensive benchmark metrics to models/evaluation_metrics.json")


if __name__ == "__main__":
    train_and_evaluate_all()
