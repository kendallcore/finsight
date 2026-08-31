"""
FinSight Statement Parsing Service
Ingests raw CSV, TXT, and PDF banking statements with flexible column auto-detection
and computes summary metadata + 16D feature vectors + business OPEX/CAPEX metrics.
"""

import io
import re
import os
import tempfile
import subprocess
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, Optional

from app.services.feature_engineering import (
    FinancialFeatureExtractor,
    detect_payment_mode,
    detect_category
)
from app.schemas import StatementSummary, ExtractedFeatures


class StatementParser:
    """Parses arbitrary Indian bank statement CSVs and PDFs into standard schema."""

    @staticmethod
    def parse_pdf_bytes(pdf_bytes: bytes, password: Optional[str] = None) -> pd.DataFrame:
        """
        Parses text from bank statement PDFs using pdftotext (preferred for layout)
        or pypdf as fallback. Reconstructs running balances and maps to standard schema.
        """
        text = ""
        # 1. Try pdftotext with layout preservation
        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(pdf_bytes)
                tmp_path = tmp.name
            
            cmd = ["pdftotext", "-layout"]
            if password:
                cmd.extend(["-upw", str(password)])
            cmd.extend([tmp_path, "-"])
            
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            text = proc.stdout.decode("utf-8", errors="ignore")
            os.remove(tmp_path)
        except Exception:
            # 2. Fallback to pypdf
            try:
                import pypdf
                pdf_file = io.BytesIO(pdf_bytes)
                reader = pypdf.PdfReader(pdf_file)
                if reader.is_encrypted and password:
                    reader.decrypt(str(password))
                pages_text = [page.extract_text() or "" for page in reader.pages]
                text = "\x0c".join(pages_text)
            except Exception as e:
                raise ValueError(f"Unable to decrypt or parse PDF bank statement: {str(e)}")

        if not text.strip():
            raise ValueError("PDF statement contains no readable text. Ensure password is valid if encrypted.")

        pages = text.split("\x0c")
        parsed_txns = []
        current_txn = None

        for p_idx, page in enumerate(pages):
            lines = page.splitlines()
            for line in lines:
                if "STATEMENT SUMMARY" in line:
                    break

                # Detect transaction start line (e.g. '01/04/25 ... 01/04/25 ... 100.00 ... 55,034.69')
                m = re.search(r"^\s*(\d{2}/\d{2}/\d{2,4})\s+(.+?)(\d{2}/\d{2}/\d{2,4})\s+(.+)$", line)
                if m:
                    if current_txn:
                        parsed_txns.append(current_txn)

                    txn_date = m.group(1)
                    middle_text = m.group(2)
                    val_date = m.group(3)
                    after_val_dt = m.group(4)
                    nums = re.findall(r"[\d,]+\.\d{2}", after_val_dt)

                    if len(nums) >= 2:
                        amt = float(nums[0].replace(",", ""))
                        bal = float(nums[1].replace(",", ""))
                    elif len(nums) == 1:
                        amt = float(nums[0].replace(",", ""))
                        bal = 0.0
                    else:
                        amt = 0.0
                        bal = 0.0

                    current_txn = {
                        "date": txn_date,
                        "narration": middle_text.strip(),
                        "value_date": val_date,
                        "amount": amt,
                        "closing_balance": bal,
                        "page": p_idx + 1
                    }
                else:
                    # Multi-line narration continuation
                    if current_txn and line.strip() and not line.strip().startswith("*"):
                        if not any(h in line for h in ["Page No", "Account Branch", "Address", "RTGS/NEFT", "Nomination", "From :"]):
                            current_txn["narration"] += " " + line.strip()

        if current_txn:
            parsed_txns.append(current_txn)

        if not parsed_txns:
            # Fallback: scan for any lines with standard date and amount
            for line in text.splitlines():
                dm = re.match(r"^\s*(\d{2}[/-]\d{2}[/-]\d{2,4})\s+(.+)", line)
                if dm:
                    nums = re.findall(r"[\d,]+\.\d{2}", line)
                    if nums:
                        parsed_txns.append({
                            "date": dm.group(1),
                            "narration": dm.group(2),
                            "amount": float(nums[0].replace(",", "")),
                            "closing_balance": float(nums[-1].replace(",", "")) if len(nums) > 1 else 0.0,
                            "type": "CREDIT" if any(w in line.upper() for w in ["CR", "CREDIT", "DEPOSIT", "SALARY"]) else "DEBIT"
                        })

        if not parsed_txns:
            raise ValueError("No transaction records could be extracted from the PDF statement.")

        # Reconstruct Credit/Debit directions via running balances if balances exist
        if len(parsed_txns) > 1 and all("closing_balance" in t for t in parsed_txns):
            first_bal = parsed_txns[0]["closing_balance"]
            first_amt = parsed_txns[0]["amount"]
            is_cr = any(w in parsed_txns[0]["narration"].upper() for w in ["CR", "CREDIT", "SALARY", "DEPOSIT", "REFUND", "DIVIDEND"])
            prev_bal = (first_bal - first_amt) if is_cr else (first_bal + first_amt)

            for t in parsed_txns:
                amt = t["amount"]
                bal = t["closing_balance"]
                if abs((prev_bal + amt) - bal) < 0.05:
                    t["type"] = "CREDIT"
                elif abs((prev_bal - amt) - bal) < 0.05:
                    t["type"] = "DEBIT"
                else:
                    t["type"] = "CREDIT" if any(w in t["narration"].upper() for w in ["CR", "CREDIT", "SALARY", "DEPOSIT", "REFUND"]) else "DEBIT"
                prev_bal = bal if bal > 0 else prev_bal

        standardized_rows = []
        for t in parsed_txns:
            narration = t.get("narration", "TRANSACTION")
            ttype = t.get("type", "DEBIT")
            standardized_rows.append({
                "date": t.get("date", "2025-01-01"),
                "amount": t.get("amount", 0.0),
                "type": ttype,
                "narration": narration,
                "payment_mode": detect_payment_mode(narration),
                "category": detect_category(narration, ttype)
            })

        return pd.DataFrame(standardized_rows)

    @staticmethod
    def normalize_csv_statement(csv_bytes: bytes) -> pd.DataFrame:
        """Reads CSV/TXT bytes and maps columns to standard names."""
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
            raw_date = str(row[date_col]) if date_col and pd.notna(row[date_col]) else "2025-01-01"
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
    def parse_and_extract(
        cls,
        file_bytes: bytes,
        filename: str = "statement.csv",
        password: Optional[str] = None
    ) -> Tuple[StatementSummary, ExtractedFeatures, Dict[str, float]]:
        """Parses CSV/PDF and extracts statement summary + 16D feature vector + business metrics."""
        is_pdf = filename.lower().endswith(".pdf") or file_bytes.startswith(b"%PDF")
        
        if is_pdf:
            df = cls.parse_pdf_bytes(file_bytes, password=password)
        else:
            df = cls.normalize_csv_statement(file_bytes)
        
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

        extractor = FinancialFeatureExtractor()
        business_metrics = extractor.extract_business_breakdown(df)

        summary = StatementSummary(
            total_transactions=total_txns,
            date_range={"from": date_from, "to": date_to},
            total_credits=round(total_credits, 2),
            total_debits=round(total_debits, 2),
            detected_opex=business_metrics["detected_opex"],
            detected_capex=business_metrics["detected_capex"],
            digital_receipts_ratio=business_metrics["digital_receipts_ratio"]
        )

        features_dict = extractor.extract_from_dataframe(df)
        features = ExtractedFeatures(**features_dict)

        return summary, features, business_metrics


statement_parser = StatementParser()

