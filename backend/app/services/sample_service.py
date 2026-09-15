"""
FinSight Sample Profiles Service
Provides pre-built statement presets for profile-based simulations and benchmark testing.
"""

import os
import pandas as pd
from typing import List, Dict, Any, Optional
from app.schemas import SampleProfileItem
from app.config import settings

SAMPLE_PROFILES: List[Dict[str, Any]] = [
    {
        "profile_id": "student_entry",
        "title": "Aarav Sharma",
        "subtitle": "Tier-1 Tech Fresher, Bengaluru",
        "category": "STUDENTS & INTERNS",
        "description": "Recent graduate with high discretionary spending on dining, quick-commerce, and tech gadgets. High UPI transaction velocity, low liquid buffer.",
        "annual_income_approx": 850000.0,
        "monthly_inflow": "₹70,833",
        "discretionary_ratio": "42.1%",
        "savings_buffer": "1.8 mos",
        "primary_channel": "UPI (78%)",
        "archetype_expected": "High-Burn Consumer",
        "tax_slab_expected": "Class 1: ₹4,00,001 - ₹8,00,000 (5%)",
        "persona_expected": "High-Burn Tech Fresher",
        "transaction_count": 145,
        "download_url": "/api/samples/student_entry/csv"
    },
    {
        "profile_id": "balanced_pro",
        "title": "Priya Nair",
        "subtitle": "Mid-Level Product Designer, Mumbai",
        "category": "SALARIED PROFESSIONALS",
        "description": "Balanced spender with systematic mutual fund SIPs, moderate rent, and controlled credit card utilization.",
        "annual_income_approx": 1420000.0,
        "monthly_inflow": "₹1,18,333",
        "discretionary_ratio": "28.4%",
        "savings_buffer": "4.5 mos",
        "primary_channel": "NetBanking (54%)",
        "archetype_expected": "Strategic Wealth Builder",
        "tax_slab_expected": "Class 3: ₹12,00,001 - ₹16,00,000 (15%)",
        "persona_expected": "Balanced Design Professional",
        "transaction_count": 267,
        "download_url": "/api/samples/balanced_pro/csv"
    },
    {
        "profile_id": "wealth_builder",
        "title": "Vikram Malhotra",
        "subtitle": "Senior Engineering Manager, Delhi-NCR",
        "category": "EXECUTIVES & CXO",
        "description": "High net-worth profile with multiple income streams, high tax liability, real estate investments, and aggressive portfolio rebalancing.",
        "annual_income_approx": 3850000.0,
        "monthly_inflow": "₹3,20,833",
        "discretionary_ratio": "22.8%",
        "savings_buffer": "8.2 mos",
        "primary_channel": "Credit Card (62%)",
        "archetype_expected": "Strategic Wealth Builder",
        "tax_slab_expected": "Class 6: Above ₹24,00,000 (30%)",
        "persona_expected": "High-Growth Wealth Builder",
        "transaction_count": 110,
        "download_url": "/api/samples/wealth_builder/csv"
    },
    {
        "profile_id": "lifestyle_spender",
        "title": "Rohan Mehta",
        "subtitle": "Freelance Full-Stack Developer, Pune",
        "category": "FREELANCERS & GIG WORKERS",
        "description": "Irregular cash flows, international client remittances, seasonal dry spells, and conservative liquid emergency reserves.",
        "annual_income_approx": 1140000.0,
        "monthly_inflow": "₹95,000 (avg)",
        "discretionary_ratio": "18.5%",
        "savings_buffer": "6.0 mos",
        "primary_channel": "UPI / Wire (71%)",
        "archetype_expected": "Frugal Minimalist",
        "tax_slab_expected": "Class 2: ₹8,00,001 - ₹12,00,000 (10%)",
        "persona_expected": "Conservative Freelance Developer",
        "transaction_count": 81,
        "download_url": "/api/samples/lifestyle_spender/csv"
    },
    {
        "profile_id": "real_agami_account",
        "title": "Real Banking Statement",
        "subtitle": "HDFC Bank Sample, Verified Pipeline",
        "category": "REAL BANKING STATEMENT",
        "description": "Directly exported anonymized CSV bank statement processed end-to-end through regex parser, OCR fallback, and multi-model classifier.",
        "annual_income_approx": 984000.0,
        "monthly_inflow": "₹82,000",
        "discretionary_ratio": "34.2%",
        "savings_buffer": "3.2 mos",
        "primary_channel": "NetBanking / UPI",
        "archetype_expected": "Experiential Spender",
        "tax_slab_expected": "Class 2: ₹8,00,001 - ₹12,00,000 (10%)",
        "persona_expected": "Real Banking Account Sample",
        "transaction_count": 142,
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
        preset_file = settings.SAMPLE_STATEMENTS_DIR / f"{profile_id}.csv"
        if preset_file.exists():
            with open(preset_file, "rb") as f:
                return f.read()

        # Fallback to synthetic transactions if dedicated preset file doesn't exist
        if os.path.exists(settings.SYNTHETIC_TXNS_PATH):
            df = pd.read_csv(settings.SYNTHETIC_TXNS_PATH)
            return df.to_csv(index=False).encode("utf-8")
        return None

sample_service = SampleService()
