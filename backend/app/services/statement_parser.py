"""
FinSight Statement Parsing Service
Ingests raw CSV banking statements with flexible column auto-detection
and computes summary metadata + 16D feature vectors.
"""

import io
import re
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any

from app.services.feature_engineering import FinancialFeatureExtractor, detect_payment_mode, detect_category
from app.schemas import StatementSummary, ExtractedFeatures

class StatementParser:
    """Parses arbitrary Indian bank statement CSVs into standard schema."""

    @staticmethod
    def normalize_statement(csv_bytes: bytes) -> pd.DataFrame:
        """Reads CSV bytes and maps columns to standard names."""
        df = pd.read_csv(io.BytesIO(csv_bytes))
        
        # Lowercase column names for fuzzy mapping
        cols_lower = {c: c.strip().lower() for c in df.columns}
        
        # Column mappings
        date_col = next((c for c, l in cols_lower.items() if "date" in l or "time" in l), None)
        desc_col = next((c for c, l in cols_lower.items() if "narration" in l or "desc" in l or "particular" in l or "detail" in l or "remark" in l), None)
        credit_col = next((c for c, l in cols_lower.items() if "credit" in l or "deposit" in l or "cr" == l), None)
        debit_col = next((c for c, l in cols_lower.items() if "debit" in l or "withdrawal" in l or "dr" == l), None)
        amount_col = next((c for c, l in cols_lower.items() if "amount" in l or "txn_amount" in l), None)
        type_col = next((c for c, l in cols_lower.items() if "type" in l or "cr/dr" in l or "d/c" in l), None)
        mode_col = next((c for c, l in cols_lower.items() if "mode" in l or "channel" in l or "rail" in l), None)
        cat_col = next((c for c, l in cols_lower.items() if "cat" in l), None)

        standardized_rows = []

        for _, row in df.iterrows():
            # Date
            raw_date = str(row[date_col]) if date_col and pd.notna(row[date_col]) else "2025-01-01"
            
            # Narration
            narration = str(row[desc_col]) if desc_col and pd.notna(row[desc_col]) else "TRANSACTION"

            # Determine Amount and Direction (Credit vs Debit)
            if credit_col and debit_col:
                cr_val = float(pd.to_numeric(row[credit_col], errors="coerce") or 0.0)
                dr_val = float(pd.to_numeric(row[debit_col], errors="coerce") or 0.0)
                if cr_val > 0:
                    txn_type = "CREDIT"
                    amount = cr_val
                else:
                    txn_type = "DEBIT"
                    amount = dr_val
            elif amount_col:
                amount = abs(float(pd.to_numeric(row[amount_col], errors="coerce") or 0.0))
                if type_col and pd.notna(row[type_col]):
                    t_str = str(row[type_col]).upper()
                    txn_type = "CREDIT" if "CR" in t_str or "CREDIT" in t_str or "+" in t_str else "DEBIT"
                else:
                    # Heuristic based on narration
                    txn_type = "CREDIT" if any(w in narration.upper() for w in ["SALARY", "CR", "DEPOSIT", "DIVIDEND", "REFUND"]) else "DEBIT"
            else:
                amount = 0.0
                txn_type = "DEBIT"

            payment_mode = str(row[mode_col]) if mode_col and pd.notna(row[mode_col]) else detect_payment_mode(narration)
            category = str(row[cat_col]) if cat_col and pd.notna(row[cat_col]) else detect_category(narration, txn_type)

            standardized_rows.append({
                "date": raw_date,
                "amount": amount,
                "type": txn_type,
                "narration": narration,
                "payment_mode": payment_mode,
                "category": category
            })

        return pd.DataFrame(standardized_rows)

    @classmethod
    def parse_and_extract(cls, csv_bytes: bytes) -> Tuple[StatementSummary, ExtractedFeatures]:
        """Parses CSV and extracts statement summary + 16D feature vector."""
        df = cls.normalize_statement(csv_bytes)
        
        # Summary
        total_txns = len(df)
        credits_df = df[df["type"] == "CREDIT"]
        debits_df = df[df["type"] == "DEBIT"]
        total_credits = float(credits_df["amount"].sum())
        total_debits = float(debits_df["amount"].sum())

        dates = pd.to_datetime(df["date"], dayfirst=True, format="mixed", errors="coerce").dropna()
        if len(dates) > 0:
            date_from = dates.min().strftime("%Y-%m-%d")
            date_to = dates.max().strftime("%Y-%m-%d")
        else:
            date_from = "2025-01-01"
            date_to = "2025-12-31"

        summary = StatementSummary(
            total_transactions=total_txns,
            date_range={"from": date_from, "to": date_to},
            total_credits=round(total_credits, 2),
            total_debits=round(total_debits, 2)
        )

        # Features
        extractor = FinancialFeatureExtractor()
        features_dict = extractor.extract_from_dataframe(df)
        features = ExtractedFeatures(**features_dict)

        return summary, features

statement_parser = StatementParser()
