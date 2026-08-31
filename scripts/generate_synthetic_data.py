"""
FinSight Synthetic Indian Banking Dataset Generator
Generates realistic banking transactions and 16D feature vectors for 5,000 Indian taxpayers
calibrated against FY 2025-26 Section 115BAC (7 Slabs) and 4 Persona Archetypes.
"""

import os
import uuid
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Tuple


# FY 2025-26 Tax Slab Function
def calculate_tax_slab_fy25_26(gross_income: float, is_salaried: bool = True) -> Tuple[int, str, float]:
    std_deduction = 75000.0 if is_salaried else 0.0
    taxable_income = max(0.0, gross_income - std_deduction)

    if taxable_income <= 400000:
        return 0, "Up to ₹4,00,000 (0% - Nil)", 0.0
    elif taxable_income <= 800000:
        return 1, "₹4,00,001 - ₹8,00,000 (5%)", 5.0
    elif taxable_income <= 1200000:
        return 2, "₹8,00,001 - ₹12,00,000 (10%)", 10.0
    elif taxable_income <= 1600000:
        return 3, "₹12,00,001 - ₹16,00,000 (15%)", 15.0
    elif taxable_income <= 2000000:
        return 4, "₹16,00,001 - ₹20,00,000 (20%)", 20.0
    elif taxable_income <= 2400000:
        return 5, "₹20,00,001 - ₹24,00,000 (25%)", 25.0
    else:
        return 6, "Above ₹24,00,000 (30%)", 30.0


def generate_profiles(n_profiles: int = 5000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    random.seed(seed)

    records = []

    # Persona archetypes:
    # 0: High-Growth Wealth Builder (Invests 25-45%, low discretionary)
    # 1: Balanced Corporate Professional (Stable salary, balanced fixed & savings)
    # 2: Discretionary Lifestyle Spender (High dining/travel 30-50%, low savings)
    # 3: Entry-Level / Student Saver (Low total income, high micro-UPI, low fixed)
    persona_distributions = [0.25, 0.35, 0.25, 0.15]

    for user_id in range(1, n_profiles + 1):
        persona = int(np.random.choice([0, 1, 2, 3], p=persona_distributions))

        # Income distribution tailored across 7 tax slabs
        income_tier = np.random.choice([0, 1, 2, 3, 4, 5, 6], p=[0.12, 0.20, 0.22, 0.18, 0.14, 0.08, 0.06])

        if income_tier == 0:
            gross_income = np.random.uniform(200000, 450000)
        elif income_tier == 1:
            gross_income = np.random.uniform(450001, 870000)
        elif income_tier == 2:
            gross_income = np.random.uniform(870001, 1270000)
        elif income_tier == 3:
            gross_income = np.random.uniform(1270001, 1670000)
        elif income_tier == 4:
            gross_income = np.random.uniform(1670001, 2070000)
        elif income_tier == 5:
            gross_income = np.random.uniform(2070001, 2470000)
        else:
            gross_income = np.random.exponential(scale=600000) + 2475000
            gross_income = min(gross_income, 6000000)

        gross_income = round(gross_income, -2)
        slab_class, slab_name, slab_rate = calculate_tax_slab_fy25_26(gross_income, is_salaried=True)

        # Cashflow & Spending characteristics based on Persona
        if persona == 0:  # Wealth Builder
            net_savings_ratio = np.random.uniform(0.35, 0.65)
            investment_ratio = np.random.uniform(0.25, 0.45)
            fixed_ratio = np.random.uniform(0.20, 0.35)
            discretionary_ratio = np.random.uniform(0.10, 0.22)
            tax_shield_ratio = np.random.uniform(0.08, 0.18)
            salary_inflow_ratio = np.random.uniform(0.80, 0.98)
            salary_regularity = 1.0
            monthly_cv = np.random.uniform(0.03, 0.15)
            upi_velocity = np.random.uniform(0.40, 0.70)
            micro_spend_density = np.random.uniform(0.02, 0.08)
            capital_gains_flux = np.random.uniform(0.02, 0.15)
            bonus_ratio = np.random.uniform(0.05, 0.20)
        elif persona == 1:  # Balanced Professional
            net_savings_ratio = np.random.uniform(0.20, 0.40)
            investment_ratio = np.random.uniform(0.12, 0.25)
            fixed_ratio = np.random.uniform(0.30, 0.45)
            discretionary_ratio = np.random.uniform(0.20, 0.35)
            tax_shield_ratio = np.random.uniform(0.04, 0.12)
            salary_inflow_ratio = np.random.uniform(0.85, 0.99)
            salary_regularity = 1.0
            monthly_cv = np.random.uniform(0.02, 0.10)
            upi_velocity = np.random.uniform(0.60, 0.85)
            micro_spend_density = np.random.uniform(0.04, 0.12)
            capital_gains_flux = np.random.uniform(0.00, 0.05)
            bonus_ratio = np.random.uniform(0.05, 0.15)
        elif persona == 2:  # Discretionary Spender
            net_savings_ratio = np.random.uniform(-0.05, 0.18)
            investment_ratio = np.random.uniform(0.00, 0.10)
            fixed_ratio = np.random.uniform(0.30, 0.50)
            discretionary_ratio = np.random.uniform(0.35, 0.60)
            tax_shield_ratio = np.random.uniform(0.00, 0.05)
            salary_inflow_ratio = np.random.uniform(0.70, 0.95)
            salary_regularity = np.random.choice([0.83, 0.92, 1.0])
            monthly_cv = np.random.uniform(0.08, 0.25)
            upi_velocity = np.random.uniform(0.75, 0.95)
            micro_spend_density = np.random.uniform(0.10, 0.25)
            capital_gains_flux = 0.0
            bonus_ratio = np.random.uniform(0.00, 0.10)
        else:  # Entry / Student Saver
            net_savings_ratio = np.random.uniform(0.10, 0.35)
            investment_ratio = np.random.uniform(0.02, 0.12)
            fixed_ratio = np.random.uniform(0.15, 0.35)
            discretionary_ratio = np.random.uniform(0.25, 0.45)
            tax_shield_ratio = np.random.uniform(0.00, 0.04)
            salary_inflow_ratio = np.random.uniform(0.50, 0.90)
            salary_regularity = np.random.choice([0.58, 0.75, 0.92, 1.0])
            monthly_cv = np.random.uniform(0.15, 0.45)
            upi_velocity = np.random.uniform(0.85, 0.98)
            micro_spend_density = np.random.uniform(0.15, 0.35)
            capital_gains_flux = 0.0
            bonus_ratio = 0.0

        # Calculate annual credit & debit totals with slight stochastic perturbation
        annual_credit = gross_income * np.random.uniform(0.98, 1.05)
        monthly_burn_rate = 1.0 - net_savings_ratio
        annual_debit = annual_credit * monthly_burn_rate

        log_annual_credit = np.log1p(annual_credit)
        log_annual_debit = np.log1p(annual_debit)
        avg_ticket = (annual_credit + annual_debit) / np.random.uniform(350, 750)
        log_avg_ticket_size = np.log1p(avg_ticket)

        records.append({
            "user_id": user_id,
            "log_annual_credit": round(float(log_annual_credit), 4),
            "log_annual_debit": round(float(log_annual_debit), 4),
            "net_savings_ratio": round(float(net_savings_ratio), 4),
            "monthly_burn_rate": round(float(monthly_burn_rate), 4),
            "salary_inflow_ratio": round(float(salary_inflow_ratio), 4),
            "monthly_credit_cv": round(float(monthly_cv), 4),
            "salary_regularity_score": round(float(salary_regularity), 4),
            "bonus_lump_sum_ratio": round(float(bonus_ratio), 4),
            "investment_ratio": round(float(investment_ratio), 4),
            "fixed_obligation_ratio": round(float(fixed_ratio), 4),
            "discretionary_ratio": round(float(discretionary_ratio), 4),
            "tax_shield_ratio": round(float(tax_shield_ratio), 4),
            "upi_velocity_index": round(float(upi_velocity), 4),
            "micro_spend_density": round(float(micro_spend_density), 4),
            "log_avg_ticket_size": round(float(log_avg_ticket_size), 4),
            "capital_gains_flux": round(float(capital_gains_flux), 4),
            "true_annual_income": round(float(gross_income), 2),
            "tax_slab_class": int(slab_class),
            "behavior_cluster": int(persona)
        })

    df = pd.DataFrame(records)
    return df


def generate_sample_statements(profiles_df: pd.DataFrame, n_samples: int = 5) -> List[pd.DataFrame]:
    """Generates detailed transaction statements for representative preset profiles."""
    statements = []
    start_date = datetime(2025, 1, 1)

    narrations_pool = {
        "SALARY": ["ACH CR - INFOSYS LTD", "SALARY CREDIT - TCS CORP", "NEFT CR - GOOGLE INDIA", "CMS SALARY CR - WIPRO"],
        "RENT": ["UPI - RENT TO LANDLORD", "NEFT - NOBROKER RENT", "CRED RENT PAY"],
        "EMI": ["ACH DR - HDFC HOME LOAN", "ECS - ICICI AUTO LOAN", "BAJAJ FINSERV EMI"],
        "FOOD": ["UPI - SWIGGY BANGALORE", "UPI - ZOMATO HYDERABAD", "BLINKIT GURGAON", "ZEPTO MUMBAI"],
        "SHOPPING": ["AMAZON PAY INDIA", "FLIPKART INTERNET", "MYNTRA DESIGNS"],
        "TRAVEL": ["UPI - UBER INDIA", "OLA CABS", "MAKEMYTRIP TRIP"],
        "UTILITIES": ["UPI - BESCOM ELECTRICITY", "BBPS - AIRTEL FIBER", "INDANE GAS"],
        "INVESTMENT": ["ACH DR - ZERODHA SIP", "GROWW MUTUAL FUND", "KFINTECH MF SIP"],
        "TAX_SHIELD": ["PPF DEPOSIT SBI", "NPS TRUST CONTRIBUTION", "HDFC ERGO HEALTH"],
        "REDEMPTION": ["ACH CR - ZERODHA BROKING", "GROWW REDEMPTION", "DIVIDEND TCS"]
    }

    sample_users = profiles_df.sample(n=n_samples, random_state=42)

    for _, u in sample_users.iterrows():
        txns = []
        user_id = int(u["user_id"])
        income = u["true_annual_income"]
        monthly_income = income / 12.0

        for month in range(12):
            m_date = start_date + timedelta(days=month * 30 + 1)

            # Monthly Salary
            txns.append({
                "transaction_id": f"TXN_{uuid.uuid4().hex[:8].upper()}",
                "user_id": user_id,
                "date": m_date.strftime("%Y-%m-%d"),
                "amount": round(monthly_income, 2),
                "type": "CREDIT",
                "category": "SALARY",
                "narration": random.choice(narrations_pool["SALARY"]),
                "payment_mode": "ACH"
            })

            # Monthly Rent
            if u["fixed_obligation_ratio"] > 0.1:
                rent_amt = round(monthly_income * u["fixed_obligation_ratio"] * 0.6, 2)
                txns.append({
                    "transaction_id": f"TXN_{uuid.uuid4().hex[:8].upper()}",
                    "user_id": user_id,
                    "date": (m_date + timedelta(days=4)).strftime("%Y-%m-%d"),
                    "amount": rent_amt,
                    "type": "DEBIT",
                    "category": "RENT",
                    "narration": random.choice(narrations_pool["RENT"]),
                    "payment_mode": "UPI"
                })

            # Monthly SIP / Investments
            if u["investment_ratio"] > 0.05:
                inv_amt = round(monthly_income * u["investment_ratio"], 2)
                txns.append({
                    "transaction_id": f"TXN_{uuid.uuid4().hex[:8].upper()}",
                    "user_id": user_id,
                    "date": (m_date + timedelta(days=7)).strftime("%Y-%m-%d"),
                    "amount": inv_amt,
                    "type": "DEBIT",
                    "category": "INVESTMENT",
                    "narration": random.choice(narrations_pool["INVESTMENT"]),
                    "payment_mode": "ACH"
                })

            # Micro UPI Food / Grocery transactions
            n_micro = random.randint(15, 30)
            for _ in range(n_micro):
                txn_day = random.randint(1, 28)
                txns.append({
                    "transaction_id": f"TXN_{uuid.uuid4().hex[:8].upper()}",
                    "user_id": user_id,
                    "date": (m_date.replace(day=txn_day)).strftime("%Y-%m-%d"),
                    "amount": round(random.uniform(40, 480), 2),
                    "type": "DEBIT",
                    "category": "FOOD",
                    "narration": random.choice(narrations_pool["FOOD"]),
                    "payment_mode": "UPI"
                })

        user_txns_df = pd.DataFrame(txns)
        statements.append(user_txns_df)

    return statements


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    print("Generating 5,000 synthetic Indian taxpayer profiles...")
    profiles_df = generate_profiles(5000, seed=42)
    profiles_df.to_csv("data/user_profiles.csv", index=False)
    print(f"Saved {len(profiles_df)} profiles to data/user_profiles.csv")
    print(f"Tax Slab Distribution:\n{profiles_df['tax_slab_class'].value_counts().sort_index()}")
    print(f"Behavior Persona Distribution:\n{profiles_df['behavior_cluster'].value_counts().sort_index()}")

    sample_stmts = generate_sample_statements(profiles_df, n_samples=5)
    all_sample_txns = pd.concat(sample_stmts, ignore_index=True)
    all_sample_txns.to_csv("data/synthetic_transactions.csv", index=False)
    print(f"Saved sample transaction stream to data/synthetic_transactions.csv")
