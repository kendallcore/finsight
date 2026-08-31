"""
End-to-End Pipeline Verification Test
Loads raw bank transaction CSV, extracts 16D feature vector, scales it,
and runs inference across Income Regressor, Tax Slab Classifier, Persona K-Means, and PCA Projector.
"""

import os
import joblib
import pandas as pd
import numpy as np

from feature_engineering import FinancialFeatureExtractor, FEATURE_NAMES

def test_inference():
    print("Testing End-to-End Inference Pipeline...")

    # Check model artifacts
    required_models = [
        "models/scaler.joblib",
        "models/income_regressor.joblib",
        "models/tax_classifier.joblib",
        "models/kmeans_personas.joblib",
        "models/pca_projector.joblib"
    ]
    for m in required_models:
        assert os.path.exists(m), f"Missing model artifact: {m}"

    # Load artifacts
    scaler = joblib.load("models/scaler.joblib")
    regressor = joblib.load("models/income_regressor.joblib")
    classifier = joblib.load("models/tax_classifier.joblib")
    kmeans = joblib.load("models/kmeans_personas.joblib")
    pca = joblib.load("models/pca_projector.joblib")

    # Load sample transactions
    sample_df = pd.read_csv("data/synthetic_transactions.csv")
    first_user_id = sample_df["user_id"].iloc[0]
    user_txns = sample_df[sample_df["user_id"] == first_user_id]
    print(f"Loaded {len(user_txns)} transactions for User ID: {first_user_id}")

    # Extract 16D features
    extractor = FinancialFeatureExtractor()
    features = extractor.extract_from_dataframe(user_txns)
    feat_vector = np.array([[features[k] for k in FEATURE_NAMES]], dtype=np.float64)
    print(f"Extracted 16D Feature Vector:\n{pd.Series(features)}")

    # Scale
    scaled_vector = scaler.transform(feat_vector)

    # Predict Income (Regression)
    pred_income = float(regressor.predict(scaled_vector)[0])
    print(f"\n→ Predicted Gross Annual Income: ₹{pred_income:,.2f}")

    # Predict Tax Slab (Classification)
    pred_slab_id = int(classifier.predict(scaled_vector)[0])
    pred_probs = classifier.predict_proba(scaled_vector)[0]
    slab_names = [
        "Class 0: Up to ₹4,00,000 (0% - Nil)",
        "Class 1: ₹4,00,001 - ₹8,00,000 (5%)",
        "Class 2: ₹8,00,001 - ₹12,00,000 (10%)",
        "Class 3: ₹12,00,001 - ₹16,00,000 (15%)",
        "Class 4: ₹16,00,001 - ₹20,00,000 (20%)",
        "Class 5: ₹20,00,001 - ₹24,00,000 (25%)",
        "Class 6: Above ₹24,00,000 (30%)"
    ]
    print(f"→ Predicted FY 2025-26 Tax Slab: {slab_names[pred_slab_id]} (Confidence: {pred_probs[pred_slab_id]*100:.1f}%)")

    # Predict Persona (Clustering)
    pred_cluster_id = int(kmeans.predict(scaled_vector)[0])
    persona_names = {
        0: "High-Growth Wealth Builder",
        1: "Balanced Corporate Professional",
        2: "Discretionary Lifestyle Spender",
        3: "Entry-Level / Student Saver"
    }
    print(f"→ Assigned Spending Persona: Cluster {pred_cluster_id} ({persona_names[pred_cluster_id]})")

    # PCA 3D Coordinates
    pca_coords = pca.transform(scaled_vector)[0]
    print(f"→ PCA Latent Space Coordinates: [x={pca_coords[0]:.3f}, y={pca_coords[1]:.3f}, z={pca_coords[2]:.3f}]")

    print("\n✓ ALL END-TO-END INFERENCE TESTS PASSED!")

if __name__ == "__main__":
    test_inference()
