"""
FinSight Feature Engineering Pipeline (Backend Service Copy)
Improvised high-dimensional financial feature vector extractor for Indian banking transactions.
Optimized for FY 2025-26 Indian Income Tax Regime (Section 115BAC).
"""

import numpy as np
import pandas as pd
import re
from typing import Dict, List, Any, Optional, Tuple
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler, PowerTransformer


# Regular expressions for Indian Banking Narrations
SALARY_PATTERNS = re.compile(r"(?i)(salary|sal\b|ach\s*cr|neft\s*cr.*(?:ltd|corp|tech|infotech|services|consultancy|google|tcs|infosys|wipro|amazon|accenture)|cms\s*cr|payroll)")
INVESTMENT_PATTERNS = re.compile(r"(?i)(zerodha|groww|kuvera|cams|kfintech|mutual\s*fund|sip\b|uti\s*mf|nippon|hdfc\s*mf|icici\s*pru|stocks|sebi)")
TAX_SHIELD_PATTERNS = re.compile(r"(?i)(ppf|nps\b|national\s*pension|lic\s*of\s*india|max\s*life|hdfc\s*ergo|icici\s*lombard|star\s*health|insurance|sukanya)")
FIXED_OBLIGATION_PATTERNS = re.compile(r"(?i)(rent\b|landlord|nobroker|emi\b|loan|housing|auto\s*loan|bescom|tneb|mgl|indane|airtel\s*fiber|jio\s*fiber|bbps)")
DISCRETIONARY_PATTERNS = re.compile(r"(?i)(swiggy|zomato|blinkit|zepto|instamart|amazon|flipkart|myntra|makemytrip|goibibo|bookmyshow|pvr|inox|uber|ola|starbucks)")
CAPITAL_GAINS_PATTERNS = re.compile(r"(?i)(dividend|redemption|mf\s*red|zerodha\s*cr|groww\s*cr|payout)")


FEATURE_NAMES = [
    "log_annual_credit",
    "log_annual_debit",
    "net_savings_ratio",
    "monthly_burn_rate",
    "salary_inflow_ratio",
    "monthly_credit_cv",
    "salary_regularity_score",
    "bonus_lump_sum_ratio",
    "investment_ratio",
    "fixed_obligation_ratio",
    "discretionary_ratio",
    "tax_shield_ratio",
    "upi_velocity_index",
    "micro_spend_density",
    "log_avg_ticket_size",
    "capital_gains_flux"
]


def detect_payment_mode(narration: str) -> str:
    s = str(narration).upper()
    if "UPI" in s or "VPA" in s or "@" in s:
        return "UPI"
    elif "NEFT" in s:
        return "NEFT"
    elif "IMPS" in s:
        return "IMPS"
    elif "ACH" in s or "NACH" in s or "ECS" in s or "CMS" in s:
        return "ACH"
    elif "CHQ" in s or "CHEQUE" in s or "CLG" in s:
        return "CHQ"
    elif "POS" in s or "CARD" in s or "ATM" in s:
        return "POS"
    else:
        return "NETBANKING"


def detect_category(narration: str, txn_type: str) -> str:
    s = str(narration).upper()
    if txn_type == "CREDIT":
        if any(w in s for w in ["SALARY", "SAL ", "PAYROLL", "CORP", "LTD", "SERVICES", "CONSULTING", "INFOSYS", "TCS", "WIPRO", "GOOGLE"]):
            return "SALARY"
        elif any(w in s for w in ["DIVIDEND", "REDEMPTION", "ZERODHA", "GROWW", "INTEREST"]):
            return "REDEMPTION"
        elif "REFUND" in s or "REVERSAL" in s:
            return "REFUND"
        else:
            return "GENERAL_CREDIT"
    else:
        if any(w in s for w in ["RENT", "LANDLORD", "NOBROKER"]):
            return "RENT"
        elif any(w in s for w in ["EMI", "LOAN", "HOUSING", "AUTO"]):
            return "EMI"
        elif any(w in s for w in ["SWIGGY", "ZOMATO", "BLINKIT", "ZEPTO", "RESTAURANT", "CAFE", "FOOD"]):
            return "FOOD"
        elif any(w in s for w in ["AMAZON", "FLIPKART", "MYNTRA", "SHOPPING", "RETAIL"]):
            return "SHOPPING"
        elif any(w in s for w in ["UBER", "OLA", "FASTAG", "PETROL", "FUEL", "IRCTC", "MAKEMYTRIP"]):
            return "TRAVEL"
        elif any(w in s for w in ["ELECTRICITY", "BESCOM", "AIRTEL", "JIO", "GAS", "BBPS", "BILL"]):
            return "UTILITIES"
        elif any(w in s for w in ["ZERODHA", "GROWW", "MUTUAL FUND", "SIP", "STOCKS", "MF"]):
            return "INVESTMENT"
        elif any(w in s for w in ["NPS", "PPF", "INSURANCE", "LIC", "MAX LIFE", "HDFC ERGO"]):
            return "TAX_SHIELD"
        else:
            return "GENERAL_DEBIT"


class FinancialFeatureExtractor:
    """
    Extracts a 16-dimensional standardized financial behavioral feature vector
    from raw bank transaction streams.
    """

    def __init__(self, eps: float = 1e-6):
        self.eps = eps

    def extract_from_dataframe(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Extracts 16 engineered features from a user's transaction dataframe.
        Expected columns: ['date', 'amount', 'type', 'category', 'narration', 'payment_mode']
        """
        if df.empty:
            return {feat: 0.0 for feat in FEATURE_NAMES}

        df = df.copy()
        df["date"] = pd.to_datetime(df["date"], dayfirst=True, format="mixed")
        df["month"] = df["date"].dt.to_period("M")
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0).abs()
        df["type"] = df["type"].astype(str).str.upper()
        df["payment_mode"] = df["payment_mode"].astype(str).str.upper()
        df["narration"] = df["narration"].astype(str)

        credits = df[df["type"] == "CREDIT"]
        debits = df[df["type"] == "DEBIT"]

        total_credit = float(credits["amount"].sum())
        total_debit = float(debits["amount"].sum())
        total_txns = max(len(df), 1)

        # 1. Scale & Magnitude
        log_annual_credit = float(np.log1p(total_credit))
        log_annual_debit = float(np.log1p(total_debit))
        net_savings_ratio = float((total_credit - total_debit) / (total_credit + self.eps))
        monthly_burn_rate = float(total_debit / (total_credit + self.eps))

        # 2. Income Dynamics & Regularity
        salary_mask = credits["category"].astype(str).str.upper().str.contains("SALARY") | credits["narration"].apply(lambda s: bool(SALARY_PATTERNS.search(s)))
        salary_credits = credits[salary_mask]
        total_salary = float(salary_credits["amount"].sum())
        salary_inflow_ratio = float(total_salary / (total_credit + self.eps))

        monthly_credits = credits.groupby("month")["amount"].sum()
        if len(monthly_credits) > 1:
            credit_mean = float(monthly_credits.mean())
            credit_std = float(monthly_credits.std(ddof=0))
            monthly_credit_cv = float(credit_std / (credit_mean + self.eps))
        else:
            monthly_credit_cv = 0.0

        salary_months = salary_credits["month"].nunique()
        salary_regularity_score = float(min(salary_months / 12.0, 1.0))

        mean_monthly_credit = (total_credit / 12.0) if total_credit > 0 else 1.0
        bonus_credits = credits[credits["amount"] >= (2.0 * mean_monthly_credit)]["amount"].sum()
        bonus_lump_sum_ratio = float(bonus_credits / (total_credit + self.eps))

        # 3. Outflow Allocation & Tax-Shield Proxies
        inv_mask = debits["category"].astype(str).str.upper().isin(["INVESTMENT", "SIP", "MUTUAL_FUND", "STOCKS"]) | debits["narration"].apply(lambda s: bool(INVESTMENT_PATTERNS.search(s)))
        total_inv = float(debits[inv_mask]["amount"].sum())
        investment_ratio = float(total_inv / (total_credit + self.eps))

        fixed_mask = debits["category"].astype(str).str.upper().isin(["RENT", "EMI", "UTILITIES", "HOUSING"]) | debits["narration"].apply(lambda s: bool(FIXED_OBLIGATION_PATTERNS.search(s)))
        total_fixed = float(debits[fixed_mask]["amount"].sum())
        fixed_obligation_ratio = float(total_fixed / (total_debit + self.eps))

        disc_mask = debits["category"].astype(str).str.upper().isin(["FOOD", "DINING", "SHOPPING", "TRAVEL", "ENTERTAINMENT"]) | debits["narration"].apply(lambda s: bool(DISCRETIONARY_PATTERNS.search(s)))
        total_disc = float(debits[disc_mask]["amount"].sum())
        discretionary_ratio = float(total_disc / (total_debit + self.eps))

        tax_shield_mask = debits["category"].astype(str).str.upper().isin(["NPS", "PPF", "INSURANCE", "TAX_SAVING"]) | debits["narration"].apply(lambda s: bool(TAX_SHIELD_PATTERNS.search(s)))
        total_tax_shield = float(debits[tax_shield_mask]["amount"].sum())
        tax_shield_ratio = float(total_tax_shield / (total_credit + self.eps))

        # 4. Digital Velocity & Micro-Spending Density
        upi_txns = df[df["payment_mode"] == "UPI"]
        upi_velocity_index = float(len(upi_txns) / total_txns)

        micro_upi_debits = debits[(debits["payment_mode"] == "UPI") & (debits["amount"] < 500.0)]["amount"].sum()
        micro_spend_density = float(micro_upi_debits / (total_debit + self.eps))

        avg_ticket_size = float(df["amount"].mean()) if len(df) > 0 else 0.0
        log_avg_ticket_size = float(np.log1p(avg_ticket_size))

        cap_gains_mask = credits["category"].astype(str).str.upper().isin(["REDEMPTION", "DIVIDEND", "CAPITAL_GAINS"]) | credits["narration"].apply(lambda s: bool(CAPITAL_GAINS_PATTERNS.search(s)))
        total_cap_gains = float(credits[cap_gains_mask]["amount"].sum())
        capital_gains_flux = float(total_cap_gains / (total_credit + self.eps))

        return {
            "log_annual_credit": round(log_annual_credit, 4),
            "log_annual_debit": round(log_annual_debit, 4),
            "net_savings_ratio": round(net_savings_ratio, 4),
            "monthly_burn_rate": round(monthly_burn_rate, 4),
            "salary_inflow_ratio": round(salary_inflow_ratio, 4),
            "monthly_credit_cv": round(monthly_credit_cv, 4),
            "salary_regularity_score": round(salary_regularity_score, 4),
            "bonus_lump_sum_ratio": round(bonus_lump_sum_ratio, 4),
            "investment_ratio": round(investment_ratio, 4),
            "fixed_obligation_ratio": round(fixed_obligation_ratio, 4),
            "discretionary_ratio": round(discretionary_ratio, 4),
            "tax_shield_ratio": round(tax_shield_ratio, 4),
            "upi_velocity_index": round(upi_velocity_index, 4),
            "micro_spend_density": round(micro_spend_density, 4),
            "log_avg_ticket_size": round(log_avg_ticket_size, 4),
            "capital_gains_flux": round(capital_gains_flux, 4)
        }
