"""
FinSight Real Data Feature Extractor
Processes raw Indian banking transaction datasets (e.g. Agami 200 accounts, 51,945 transactions)
into standardized 16-dimensional behavioral feature vectors for real-world model validation.
"""

import os
import re
import numpy as np
import pandas as pd
from typing import Dict, List, Any

from feature_engineering import FinancialFeatureExtractor, FEATURE_NAMES

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

def process_agami_real_dataset():
    raw_path = "data/raw/indian_bank_transactions_agami.csv"
    if not os.path.exists(raw_path):
        print(f"File not found: {raw_path}")
        return

    print(f"Loading real Agami dataset from {raw_path}...")
    df_raw = pd.read_csv(raw_path)
    print(f"Loaded {len(df_raw)} transactions across {df_raw['account_number'].nunique()} accounts.")

    # Standardize column mappings
    formatted_txns = []
    for _, row in df_raw.iterrows():
        credit = float(row.get("credit", 0.0) or 0.0)
        debit = float(row.get("debit", 0.0) or 0.0)
        txn_type = "CREDIT" if credit > 0 else "DEBIT"
        amount = credit if credit > 0 else debit
        narration = str(row.get("description", ""))

        formatted_txns.append({
            "account_number": str(row["account_number"]),
            "bank_name": str(row.get("bank_name", "INDIAN BANK")),
            "date": str(row["date"]),
            "amount": amount,
            "type": txn_type,
            "narration": narration,
            "payment_mode": detect_payment_mode(narration),
            "category": detect_category(narration, txn_type)
        })

    df_clean = pd.DataFrame(formatted_txns)
    df_clean.to_csv("data/parsed_statements/agami_indian_transactions_clean.csv", index=False)
    print(f"Saved standardized transactions to data/parsed_statements/agami_indian_transactions_clean.csv")

    # Extract 16D Feature Vectors per account
    extractor = FinancialFeatureExtractor()
    account_profiles = []

    for acc_num, group in df_clean.groupby("account_number"):
        features = extractor.extract_from_dataframe(group)
        features["account_number"] = acc_num
        features["bank_name"] = group["bank_name"].iloc[0]
        features["total_transactions"] = len(group)
        features["raw_annual_credits"] = float(group[group["type"] == "CREDIT"]["amount"].sum())
        features["raw_annual_debits"] = float(group[group["type"] == "DEBIT"]["amount"].sum())
        account_profiles.append(features)

    df_profiles = pd.DataFrame(account_profiles)
    df_profiles.to_csv("data/real_user_profiles_agami.csv", index=False)
    print(f"✓ Extracted 16D features for {len(df_profiles)} real accounts to data/real_user_profiles_agami.csv")

if __name__ == "__main__":
    process_agami_real_dataset()
