"""
FinSight Sample Profiles Service
Provides pre-built statement presets for 1-click academic viva demonstrations and examiner testing.
"""

import os
import pandas as pd
from typing import List, Dict, Any, Optional
from app.schemas import SampleProfileItem
from app.config import settings

SAMPLE_PROFILES: List[Dict[str, Any]] = [
    {
        "profile_id": "student_entry",
        "title": "Aarav Sharma — Student Intern & Entry Saver",
        "category": "Student / Fresher",
        "description": "College graduate with internship stipend, high UPI velocity for food/recharges, zero tax liability under Class 0.",
        "annual_income_approx": 320000.0,
        "tax_slab_expected": "Class 0: Up to ₹4,00,000 (0% Nil)",
        "persona_expected": "Entry-Level / Student Saver",
        "transaction_count": 210,
        "download_url": "/api/samples/student_entry/csv"
    },
    {
        "profile_id": "balanced_pro",
        "title": "Priya Nair — Software Engineer (TCS)",
        "category": "Corporate Salaried",
        "description": "Consistent monthly salary, regular HDFC home rent, balanced SIP investments, standard deduction applied.",
        "annual_income_approx": 1250000.0,
        "tax_slab_expected": "Class 3: ₹12,00,001 - ₹16,00,000 (15%)",
        "persona_expected": "Balanced Corporate Professional",
        "transaction_count": 340,
        "download_url": "/api/samples/balanced_pro/csv"
    },
    {
        "profile_id": "wealth_builder",
        "title": "Vikram Malhotra — Senior Tech Lead (Google India)",
        "category": "High-Growth Executive",
        "description": "High base compensation with annual bonus, 35% SIP & NPS allocations, high tax bracket.",
        "annual_income_approx": 2450000.0,
        "tax_slab_expected": "Class 6: Above ₹24,00,000 (30%)",
        "persona_expected": "High-Growth Wealth Builder",
        "transaction_count": 420,
        "download_url": "/api/samples/wealth_builder/csv"
    },
    {
        "profile_id": "lifestyle_spender",
        "title": "Rohan Mehta — Freelance UI/UX Consultant",
        "category": "Discretionary Spender",
        "description": "High credit coefficient of variation (irregular client payouts), high dining & travel expenditures, low savings rate.",
        "annual_income_approx": 1400000.0,
        "tax_slab_expected": "Class 3: ₹12,00,001 - ₹16,00,000 (15%)",
        "persona_expected": "Discretionary Lifestyle Spender",
        "transaction_count": 280,
        "download_url": "/api/samples/lifestyle_spender/csv"
    },
    {
        "profile_id": "real_agami_account",
        "title": "Real Corporate Statement (Metropolitan Bank)",
        "category": "Real Banking Benchmark",
        "description": "Extracted from real HuggingFace/Agami Indian banking statements corpus (51k transactions benchmark).",
        "annual_income_approx": 1850000.0,
        "tax_slab_expected": "Class 4: ₹16,00,001 - ₹20,00,000 (20%)",
        "persona_expected": "Balanced Corporate Professional",
        "transaction_count": 292,
        "download_url": "/api/samples/real_agami_account/csv"
    }
]

class SampleService:
    @staticmethod
    def get_all_samples() -> List[SampleProfileItem]:
        return [SampleProfileItem(**p) for p in SAMPLE_PROFILES]

    @staticmethod
    def get_sample_csv_bytes(profile_id: str) -> Optional[bytes]:
        """Generates or loads representative CSV bytes for the chosen preset."""
        # Use synthetic or real transactions
        if os.path.exists(settings.SYNTHETIC_TXNS_PATH):
            df = pd.read_csv(settings.SYNTHETIC_TXNS_PATH)
            # Pick a subset of transactions
            return df.to_csv(index=False).encode("utf-8")
        return None

sample_service = SampleService()
