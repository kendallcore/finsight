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


HEADER_KEYWORDS = [
    "statement of account", "customer id", "account no", "statement period",
    "customer name", "account branch", "communication", "branch address",
    "email id", "ifsc", "phone no", "micr", "ckyc id", "account opening",
    "nomination", "account status", "nominee name", "account type",
    "opening balance", "total debit", "total credit", "closing balance",
    "transaction date", "particulars", "debit", "credit", "balance",
    "page no", "account branch", "address", "rtgs/neft", "from :", "cheque no",
    "currency", "inr", "registered office", "important message", "important safety tips",
    "contact us", "grievance redressal", "commonly used abbreviations", "end of the statement",
    "value date", "transaction", "cheque", "date", "no.", "chennai", "tamil nadu", "india"
]


def is_header_line(line: str) -> bool:
    s = line.strip().lower()
    if not s:
        return True
    if s in ["date", "date no", "cheque no", "no", "transaction", "particulars", "value date"]:
        return True
    for k in HEADER_KEYWORDS:
        if k in s:
            return True
    if re.search(r"page\s+\d+\s+of\s+\d+", s):
        return True
    if re.match(r"^\s*(?:[\d,]+\.\d{2}\s*){2,}$", line):
        return True
    return False


class StatementParser:
    """Parses arbitrary Indian bank statement CSVs and PDFs into standard schema."""

    @staticmethod
    def parse_pdf_bytes(pdf_bytes: bytes, password: Optional[str] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Parses text from bank statement PDFs using pdftotext (preferred for layout)
        or pypdf as fallback. Extracts account metadata, official statement summaries,
        and accurately classifies debit/credit transactions across multi-layout Indian bank PDFs.
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

        # 3. Extract Account Metadata
        first_page = text.split("\x0c")[0]
        account_holder = None
        account_no = None
        account_type = None

        for l in first_page.splitlines()[:35]:
            s = l.strip()
            if any(s.startswith(p) for p in ["M/S.", "MR.", "MS.", "MRS."]):
                account_holder = re.split(r"\s{4,}", s)[0].strip()
                break
            elif "CUSTOMER NAME" in s:
                m = re.search(r"CUSTOMER\s+NAME\s*:\s*(.+)", s)
                if m:
                    account_holder = re.split(r"\s{4,}", m.group(1).strip())[0].strip()
                    break

        acc_m = re.search(r"Account\s+No\s*:\s*([A-Za-z0-9\s]+)", first_page, re.IGNORECASE)
        if acc_m:
            account_no = acc_m.group(1).split()[0].strip()

        type_m = re.search(r"Account\s+Type\s*:\s*([^\n]+)", first_page, re.IGNORECASE)
        if type_m:
            account_type = type_m.group(1).strip()

        meta_str = f"{account_holder or ''} {account_no or ''} {account_type or ''}".upper()
        is_biz = any(k in meta_str for k in [
            "CAGEN", "CURRENT", "BIZ", "ENTERPRISE", "M/S", "PVT LTD", "LIMITED",
            "LLP", "TRADERS", "AGENCY", "GYM", "STORES", "SHOP", "COMMERCIAL"
        ])
        suggested_entity = "presumptive_business_44ad" if is_biz else "salaried_individual"

        # 4. Extract Official Statement Summary if present
        official_summary = {}
        sum_m = re.search(
            r"STATEMENT\s+SUMMARY\s*:-.*?\n\s*Opening\s+Balance\s+Dr\s+Count\s+Cr\s+Count\s+Debits\s+Credits\s+Closing\s+Bal\s*\n\s*([\d,]+\.\d{2})\s+(\d+)\s+(\d+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})",
            text,
            re.DOTALL
        )
        if sum_m:
            official_summary = {
                "opening_balance": float(sum_m.group(1).replace(",", "")),
                "dr_count": int(sum_m.group(2)),
                "cr_count": int(sum_m.group(3)),
                "total_debits": float(sum_m.group(4).replace(",", "")),
                "total_credits": float(sum_m.group(5).replace(",", "")),
                "closing_balance": float(sum_m.group(6).replace(",", ""))
            }
        else:
            idfc_sum = re.search(
                r"Opening\s+Balance\s+Total\s+Debit\s+Total\s+Credit\s+Closing\s+Balance\s*\n\s*([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})",
                text
            )
            if idfc_sum:
                official_summary = {
                    "opening_balance": float(idfc_sum.group(1).replace(",", "")),
                    "total_debits": float(idfc_sum.group(2).replace(",", "")),
                    "total_credits": float(idfc_sum.group(3).replace(",", "")),
                    "closing_balance": float(idfc_sum.group(4).replace(",", ""))
                }

        op_m = re.search(r"Opening\s+Balance[^\n\d]*([\d,]+\.\d{2})", text, re.IGNORECASE)
        opening_bal = float(op_m.group(1).replace(",", "")) if op_m else official_summary.get("opening_balance")

        # 5. Determine Column Header Offsets if HDFC-style layout
        split_pos = None
        for l in text.splitlines():
            if "Withdrawal Amt." in l and "Deposit Amt." in l:
                split_pos = (l.find("Withdrawal Amt.") + l.find("Deposit Amt.")) / 2
                break
            elif "Particulars" in l and "Debit" in l and "Credit" in l and "Balance" in l:
                split_pos = (l.find("Debit") + l.find("Credit")) / 2
                break

        lines = text.splitlines()

        # Flexibly match dates like 01/04/2025, 19-May-2025, 19-May-25, 01-04-2025
        DATE_PAT = r"(\d{1,2}[-/\s](?:[A-Za-z]{3}|\d{1,2})[-/\s]\d{2,4})"

        pattern_two_dates_narration = re.compile(r"^\s*" + DATE_PAT + r"\s+(.+?)\s+" + DATE_PAT + r"\s+(.+)$")
        pattern_two_dates = re.compile(r"^\s*" + DATE_PAT + r"\s+" + DATE_PAT + r"\s+(.+)$")
        pattern_one_date = re.compile(r"^\s*" + DATE_PAT + r"\s+(.+)$")

        date_lines_info = []

        for idx, line in enumerate(lines):
            if "STATEMENT SUMMARY" in line:
                break

            mA = pattern_two_dates_narration.search(line)
            if mA:
                d1, mid, d2, rest = mA.group(1), mA.group(2), mA.group(3), mA.group(4)
                nums = re.findall(r"[\d,]+\.\d{2}", rest)
                if nums:
                    date_lines_info.append({
                        "line_idx": idx,
                        "date": d1,
                        "value_date": d2,
                        "mid_text": mid.strip(),
                        "nums": nums,
                        "line_text": line
                    })
                    continue

            mB = pattern_two_dates.search(line)
            if mB:
                d1, d2, rest = mB.group(1), mB.group(2), mB.group(3)
                nums = re.findall(r"[\d,]+\.\d{2}", rest)
                if nums:
                    mid_text = re.sub(r"[\d,]+\.\d{2}", "", rest).strip()
                    date_lines_info.append({
                        "line_idx": idx,
                        "date": d1,
                        "value_date": d2,
                        "mid_text": mid_text,
                        "nums": nums,
                        "line_text": line
                    })
                    continue

            mC = pattern_one_date.search(line)
            if mC:
                d1, rest = mC.group(1), mC.group(2)
                nums = re.findall(r"[\d,]+\.\d{2}", rest)
                if nums:
                    mid_text = re.sub(r"[\d,]+\.\d{2}", "", rest).strip()
                    date_lines_info.append({
                        "line_idx": idx,
                        "date": d1,
                        "value_date": d1,
                        "mid_text": mid_text,
                        "nums": nums,
                        "line_text": line
                    })

        parsed_txns = []

        if date_lines_info:
            for i, info in enumerate(date_lines_info):
                curr_idx = info["line_idx"]
                prev_idx = date_lines_info[i-1]["line_idx"] if i > 0 else -1
                next_idx = date_lines_info[i+1]["line_idx"] if i < len(date_lines_info)-1 else len(lines)

                between_prev = [lines[j].strip() for j in range(prev_idx + 1, curr_idx) if not is_header_line(lines[j])]

                leading_lines = []
                if i > 0 and len(between_prev) >= 2:
                    leading_lines = between_prev[1:]
                elif i > 0 and len(between_prev) == 1:
                    leading_lines = between_prev
                elif i == 0:
                    leading_lines = between_prev

                next_between = [lines[j].strip() for j in range(curr_idx + 1, next_idx) if not is_header_line(lines[j])]
                trailing_lines = [next_between[0]] if len(next_between) >= 1 else []

                narration_parts = leading_lines + ([info["mid_text"]] if info["mid_text"] else []) + trailing_lines
                narration = " ".join([p for p in narration_parts if p]).strip()
                if not narration:
                    narration = "TRANSACTION"

                nums = info["nums"]
                line = info["line_text"]

                # Debit vs Credit positioning check for HDFC / ICICI column layouts
                matches = list(re.finditer(r"(-?[\d,]+\.\d{2})", line))
                txn_type = None

                if split_pos is not None and len(matches) >= 2:
                    pos = matches[-2].start()
                    txn_type = "DEBIT" if pos < split_pos else "CREDIT"

                if len(nums) >= 2:
                    amt = float(nums[0].replace(",", ""))
                    bal = float(nums[1].replace(",", ""))
                elif len(nums) == 1:
                    amt = float(nums[0].replace(",", ""))
                    bal = 0.0
                else:
                    amt = 0.0
                    bal = 0.0

                txn_dict = {
                    "date": info["date"],
                    "narration": narration,
                    "amount": amt,
                    "closing_balance": bal,
                    "value_date": info.get("value_date", info["date"])
                }
                if txn_type:
                    txn_dict["type"] = txn_type

                parsed_txns.append(txn_dict)

        if not parsed_txns:
            # Fallback: scan for any lines with standard date and amount
            for line in text.splitlines():
                dm = re.match(r"^\s*(\d{1,2}[-/\s](?:[A-Za-z]{3}|\d{1,2})[-/\s]\d{2,4})\s+(.+)", line)
                if dm:
                    nums = list(re.finditer(r"(-?[\d,]+\.\d{2})", line))
                    if nums:
                        parsed_txns.append({
                            "date": dm.group(1),
                            "narration": dm.group(2).strip(),
                            "amount": float(nums[0].group().replace(",", "")),
                            "closing_balance": float(nums[-1].group().replace(",", "")) if len(nums) > 1 else 0.0,
                            "type": "CREDIT" if any(w in line.upper() for w in ["CR", "CREDIT", "DEPOSIT", "SALARY"]) else "DEBIT"
                        })

        if not parsed_txns:
            raise ValueError("No transaction records could be extracted from the PDF statement.")

        # Reconstruct Credit/Debit directions via running balances if balances exist and not already assigned by column split
        if len(parsed_txns) > 1 and all("closing_balance" in t for t in parsed_txns):
            for idx in range(len(parsed_txns)):
                t = parsed_txns[idx]
                if "type" in t:
                    continue
                amt = t["amount"]
                bal = t["closing_balance"]

                if idx > 0:
                    prev_bal = parsed_txns[idx-1]["closing_balance"]
                    diff = bal - prev_bal
                    if abs(diff - amt) < 0.05:
                        t["type"] = "CREDIT"
                    elif abs(abs(diff) - amt) < 0.05:
                        t["type"] = "DEBIT"
                    else:
                        t["type"] = "CREDIT" if any(w in t["narration"].upper() for w in ["CR", "CREDIT", "SALARY", "DEPOSIT", "REFUND", "INTEREST"]) else "DEBIT"
                else:
                    if opening_bal is not None:
                        if abs((opening_bal + amt) - bal) < 0.05:
                            t["type"] = "CREDIT"
                        elif abs((opening_bal - amt) - bal) < 0.05:
                            t["type"] = "DEBIT"
                        else:
                            t["type"] = "CREDIT" if any(w in t["narration"].upper() for w in ["CR", "CREDIT", "SALARY", "DEPOSIT", "REFUND", "INTEREST"]) else "DEBIT"
                    else:
                        t["type"] = "CREDIT" if any(w in t["narration"].upper() for w in ["CR", "CREDIT", "SALARY", "DEPOSIT", "REFUND", "INTEREST"]) else "DEBIT"
        else:
            for t in parsed_txns:
                if "type" not in t:
                    t["type"] = "CREDIT" if any(w in t["narration"].upper() for w in ["CR", "CREDIT", "SALARY", "DEPOSIT", "REFUND"]) else "DEBIT"

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

        metadata = {
            "account_holder_name": account_holder,
            "account_number": account_no,
            "account_type": account_type,
            "suggested_entity_type": suggested_entity,
            "opening_balance": official_summary.get("opening_balance", opening_bal),
            "closing_balance": official_summary.get("closing_balance"),
            "official_summary": official_summary
        }
        return pd.DataFrame(standardized_rows), metadata

    @staticmethod
    def normalize_csv_statement(csv_bytes: bytes) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Reads CSV/TXT bytes and maps columns to standard names."""
        df = pd.read_csv(io.BytesIO(csv_bytes))

        cols_lower = {c: c.strip().lower() for c in df.columns}

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

        metadata = {
            "account_holder_name": None,
            "account_number": None,
            "account_type": None,
            "suggested_entity_type": "salaried_individual",
            "opening_balance": None,
            "closing_balance": None,
            "official_summary": {}
        }
        return pd.DataFrame(standardized_rows), metadata

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
            df, metadata = cls.parse_pdf_bytes(file_bytes, password=password)
        else:
            df, metadata = cls.normalize_csv_statement(file_bytes)

        # Summary
        total_txns = len(df)
        official_sum = metadata.get("official_summary", {})
        if official_sum and official_sum.get("total_credits") is not None and official_sum.get("total_debits") is not None:
            total_credits = float(official_sum["total_credits"])
            total_debits = float(official_sum["total_debits"])
        else:
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
            filename=filename,
            account_holder_name=metadata.get("account_holder_name"),
            account_number=metadata.get("account_number"),
            account_type=metadata.get("account_type"),
            suggested_entity_type=metadata.get("suggested_entity_type", "salaried_individual"),
            opening_balance=metadata.get("opening_balance"),
            closing_balance=metadata.get("closing_balance"),
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
