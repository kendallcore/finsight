"""
Unit tests for the transaction categorization + 16D feature engineering layer, and for the
category / time-series aggregations added to the statement parser.
"""

import math

import pandas as pd
import pytest

from app.services.feature_engineering import (
    FEATURE_NAMES,
    FinancialFeatureExtractor,
    detect_category,
    detect_payment_mode,
    parse_amount,
)
from app.services.statement_parser import StatementParser, MAX_TRANSACTION_RECORDS


def make_transactions(rows):
    return pd.DataFrame(
        [
            {
                "date": r[0],
                "amount": r[1],
                "type": r[2],
                "narration": r[3],
                "payment_mode": r[4],
                "category": r[5],
            }
            for r in rows
        ]
    )


# ---------------------------------------------------------------------------
# detect_payment_mode
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "narration,expected",
    [
        ("UPI/504723/SWIGGY FOOD", "UPI"),
        ("PAYTO VPA rahul@okhdfcbank", "UPI"),
        ("NEFT Cr-174220616991-ICIC", "NEFT"),
        ("IMPS Dr someone", "IMPS"),
        ("ACH CR - INFOSYS LTD PAYROLL", "ACH"),
        ("NACH DR LIC PREMIUM", "ACH"),
        ("ECS CR SALARY", "ACH"),
        ("CMS CR SALARY ABC", "ACH"),
        ("CHQ NO 004213", "CHQ"),
        ("POS SWIPE 1145 HDFC BANK", "POS"),
        ("ATM CASH WD", "POS"),
        ("TRANSFER TO SAVINGS", "NETBANKING"),
    ],
)
def test_detect_payment_mode(narration, expected):
    assert detect_payment_mode(narration) == expected


# ---------------------------------------------------------------------------
# detect_category
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "narration,txn_type,expected",
    [
        ("ACH CR - TCS CORP SALARY", "CREDIT", "SALARY"),
        ("PAYROLL CREDIT Q3", "CREDIT", "SALARY"),
        ("STIPEND JUN", "CREDIT", "SALARY"),
        ("GOOGLE INDIA DIGITAL PAYMENT", "CREDIT", "BUSINESS_MERCHANT_RECEIPT"),
        ("PAYTM SETTL MERCHANT", "CREDIT", "BUSINESS_MERCHANT_RECEIPT"),
        ("NEFT Cr-ICIC-ZERODHA REDEMPTION", "CREDIT", "REDEMPTION"),
        ("REVERSAL RTGS REFUND", "CREDIT", "REFUND"),
        ("MISC TRANSFER IN", "CREDIT", "GENERAL_CREDIT"),
        ("UPI - SWIGGY BANGALORE", "DEBIT", "FOOD"),
        ("ZOMATO ORDER", "DEBIT", "FOOD"),
        ("BLINKIT GROCERIES", "DEBIT", "FOOD"),
        ("AMAZON INDIA RETAIL", "DEBIT", "SHOPPING"),
        ("MYNTRA PURCHASE", "DEBIT", "SHOPPING"),
        ("UBER TRIP INDIA", "DEBIT", "TRAVEL"),
        ("FASTAG TOLL", "DEBIT", "TRAVEL"),
        ("IRCTC BOOKING", "DEBIT", "TRAVEL"),
        ("GROWW MUTUAL FUND SIP", "DEBIT", "INVESTMENT"),
        ("NPS CONTRIB", "DEBIT", "TAX_SHIELD"),
        ("LIC PREMIUM", "DEBIT", "TAX_SHIELD"),
        ("UPI - RENT TO LANDLORD", "DEBIT", "RENT"),
        ("BESCOM ELECTRICITY BILL", "DEBIT", "UTILITIES"),
        ("EMI - BAJAJ FINSERV", "DEBIT", "EMI"),
        ("MACHINERY PURCHASE", "DEBIT", "CAPEX_EQUIPMENT"),
        ("SOME UNKNOWN DR", "DEBIT", "GENERAL_DEBIT"),
    ],
)
def test_detect_category(narration, txn_type, expected):
    assert detect_category(narration, txn_type) == expected


# ---------------------------------------------------------------------------
# FinancialFeatureExtractor.extract_from_dataframe
# ---------------------------------------------------------------------------
def test_empty_frame_returns_all_zero_features():
    features = FinancialFeatureExtractor().extract_from_dataframe(make_transactions([]))
    assert set(features.keys()) == set(FEATURE_NAMES)
    assert all(value == 0.0 for value in features.values())


def test_feature_vector_has_sixteen_named_dimensions():
    frame = make_transactions(
        [("2025-01-01", 100000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY")]
    )
    features = FinancialFeatureExtractor().extract_from_dataframe(frame)
    assert len(features) == 16
    assert len(FEATURE_NAMES) == 16


def test_savings_and_burn_are_complementary():
    """net_savings_ratio (of credit) and monthly_burn_rate (of credit) must sum to ~1."""
    frame = make_transactions(
        [
            ("2025-01-01", 100000, "CREDIT", "ACH CR - INFOSYS SALARY", "ACH", "SALARY"),
            ("2025-01-05", 60000, "DEBIT", "UPI - RENT TO LANDLORD", "UPI", "RENT"),
        ]
    )
    features = FinancialFeatureExtractor().extract_from_dataframe(frame)
    assert features["net_savings_ratio"] == pytest.approx(0.4, abs=1e-3)
    assert features["monthly_burn_rate"] == pytest.approx(0.6, abs=1e-3)
    assert features["net_savings_ratio"] + features["monthly_burn_rate"] == pytest.approx(1.0, abs=1e-3)


def test_log_magnitudes_use_log1p_of_totals():
    frame = make_transactions(
        [
            ("2025-01-01", 100000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY"),
            ("2025-01-05", 40000, "DEBIT", "SWIGGY FOOD", "UPI", "FOOD"),
        ]
    )
    features = FinancialFeatureExtractor().extract_from_dataframe(frame)
    assert features["log_annual_credit"] == pytest.approx(math.log1p(100000), abs=1e-3)
    assert features["log_annual_debit"] == pytest.approx(math.log1p(40000), abs=1e-3)


def test_discretionary_and_fixed_ratios_are_shares_of_outflow():
    rows = [
        ("2025-01-01", 100000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY"),
        ("2025-01-05", 50000, "DEBIT", "UPI - RENT TO LANDLORD", "UPI", "RENT"),
        ("2025-01-06", 25000, "DEBIT", "SWIGGY BANGALORE", "UPI", "FOOD"),
        ("2025-01-07", 25000, "DEBIT", "AMAZON INDIA", "POS", "SHOPPING"),
    ]
    features = FinancialFeatureExtractor().extract_from_dataframe(make_transactions(rows))
    assert features["fixed_obligation_ratio"] == pytest.approx(0.5, abs=1e-3)
    assert features["discretionary_ratio"] == pytest.approx(0.5, abs=1e-3)


def test_upi_velocity_counts_all_channels():
    frame = make_transactions(
        [
            ("2025-01-01", 100000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY"),
            ("2025-01-05", 200, "DEBIT", "UPI CHAI", "UPI", "FOOD"),
            ("2025-01-06", 200, "DEBIT", "UPI CHAI", "UPI", "FOOD"),
            ("2025-01-07", 200, "DEBIT", "SWIGGY", "POS", "FOOD"),
            ("2025-01-08", 200, "DEBIT", "SWIGGY", "POS", "FOOD"),
        ]
    )
    assert FinancialFeatureExtractor().extract_from_dataframe(frame)["upi_velocity_index"] == pytest.approx(0.4, abs=1e-3)


def test_micro_spend_density_only_counts_small_upi_debits():
    frame = make_transactions(
        [
            ("2025-01-01", 100000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY"),
            ("2025-01-05", 300, "DEBIT", "UPI CHAI", "UPI", "FOOD"),
            ("2025-01-06", 400, "DEBIT", "UPI CHAI", "UPI", "FOOD"),
            ("2025-01-07", 9000, "DEBIT", "UPI RENT", "UPI", "RENT"),
        ]
    )
    assert FinancialFeatureExtractor().extract_from_dataframe(frame)["micro_spend_density"] == pytest.approx(
        700 / 9700, abs=1e-3
    )


def test_salary_regularity_counts_distinct_salary_months():
    frame = make_transactions(
        [
            ("2025-01-01", 50000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY"),
            ("2025-02-01", 50000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY"),
            ("2025-03-01", 50000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY"),
        ]
    )
    assert FinancialFeatureExtractor().extract_from_dataframe(frame)["salary_regularity_score"] == pytest.approx(
        3 / 12, abs=1e-3
    )


def test_single_month_statement_has_zero_credit_cv():
    frame = make_transactions(
        [
            ("2025-01-01", 50000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY"),
            ("2025-01-02", 50000, "CREDIT", "ACH CR SALARY", "ACH", "SALARY"),
        ]
    )
    assert FinancialFeatureExtractor().extract_from_dataframe(frame)["monthly_credit_cv"] == 0.0


def test_extractor_does_not_mutate_input_frame():
    frame = make_transactions([("2025-01-01", 10, "DEBIT", "SWIGGY", "UPI", "FOOD")])
    before = frame.copy()
    FinancialFeatureExtractor().extract_from_dataframe(frame)
    pd.testing.assert_frame_equal(frame, before)


def test_business_breakdown_separates_capex_and_opex():
    rows = [
        ("2025-01-01", 500000, "CREDIT", "PAYTM MERCHANT SETTLEMENT", "UPI", "BUSINESS_MERCHANT_RECEIPT"),
        ("2025-01-05", 40000, "DEBIT", "OFFICE RENT LANDLORD", "NEFT", "RENT"),
        ("2025-01-06", 120000, "DEBIT", "TREADMILL GYM EQUIPMENT", "NEFT", "CAPEX_EQUIPMENT"),
    ]
    frame = make_transactions(rows)
    metrics = FinancialFeatureExtractor().extract_business_breakdown(frame)
    assert metrics["detected_capex"] == pytest.approx(120000, abs=1)
    assert metrics["detected_opex"] == pytest.approx(40000, abs=1)
    assert metrics["digital_receipts_ratio"] == pytest.approx(1.0, abs=1e-6)


# ---------------------------------------------------------------------------
# normalize_csv_statement: the column layouts Indian banks actually emit
# ---------------------------------------------------------------------------
def test_normalize_credit_debit_columns():
    csv = (
        "Date,Narration,Chq/Ref No,Withdrawal Amt.,Deposit Amt.\n"
        "01/04/2025,ACH CR SALARY,1,0,100000\n"
        "05/04/2025,UPI SWIGGY,2,500,0\n"
    )
    frame, _ = StatementParser.normalize_csv_statement(csv.encode("utf-8"))
    assert list(frame["type"]) == ["CREDIT", "DEBIT"]
    assert list(frame["amount"]) == [100000.0, 500.0]
    assert list(frame["category"]) == ["SALARY", "FOOD"]


def test_normalize_signed_amount_column():
    csv = "date,description,amount\n2025-01-01,SALARY CREDIT,50000\n2025-01-02,UBER TRIP,-450\n"
    frame, _ = StatementParser.normalize_csv_statement(csv.encode("utf-8"))
    assert list(frame["amount"]) == [50000.0, 450.0]
    # Sign is discarded here; direction is inferred from narration keywords.
    assert frame["type"].iloc[0] == "CREDIT"


def test_normalize_amount_with_explicit_type_column():
    csv = "date,particulars,txn_amount,cr_dr\n2025-01-01,GROWW SIP,5000,D\n2025-01-02,REFUND,900,C\n"
    frame, _ = StatementParser.normalize_csv_statement(csv.encode("utf-8"))
    assert list(frame["type"]) == ["DEBIT", "CREDIT"]
    assert list(frame["category"]) == ["INVESTMENT", "REFUND"]


def test_normalize_preserves_existing_mode_and_category_columns():
    csv = "date,narration,amount,type,payment_mode,category\n2025-01-01,X,100,DEBIT,UPI,FOOD\n"
    frame, _ = StatementParser.normalize_csv_statement(csv.encode("utf-8"))
    assert frame["payment_mode"].iloc[0] == "UPI"
    assert frame["category"].iloc[0] == "FOOD"


def test_normalize_handles_missing_optional_columns():
    csv = "date,amount\n2025-01-01,100\n"
    frame, meta = StatementParser.normalize_csv_statement(csv.encode("utf-8"))
    assert len(frame) == 1
    assert frame["category"].iloc[0] == "GENERAL_DEBIT"
    assert frame["type"].iloc[0] == "DEBIT"
    assert meta["suggested_entity_type"] == "salaried_individual"


def test_normalize_handles_comma_grouped_amounts():
    """Indian exports group thousands; those must not silently become zero-value rows."""
    csv = (
        "Date,Particulars,Withdrawal Amt.,Deposit Amt.\n"
        "01/04/2025,SALARY CREDIT,0,\"1,50,000.00\"\n"
        "05/04/2025,AMAZON INDIA,\"2,499.00\",0\n"
    )
    frame, _ = StatementParser.normalize_csv_statement(csv.encode("utf-8"))
    assert list(frame["amount"]) == [150000.0, 2499.0]
    assert list(frame["type"]) == ["CREDIT", "DEBIT"]


# ---------------------------------------------------------------------------
# parse_amount
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "raw,expected",
    [
        (1500.0, 1500.0),
        (1500, 1500.0),
        ("1500.50", 1500.5),
        ("1,500.00", 1500.0),
        ("₹2,499.00", 2499.0),
        ("(3,000.00)", 3000.0),
        ("-450.25", 450.25),
        ("  ", 0.0),
        ("", 0.0),
        (None, 0.0),
        (float("nan"), 0.0),
        ("NOT AN AMOUNT", 0.0),
    ],
)
def test_parse_amount(raw, expected):
    assert parse_amount(raw) == pytest.approx(expected)


# ---------------------------------------------------------------------------
# Category / monthly / transaction aggregations
# ---------------------------------------------------------------------------
def _sample_csv_bytes():
    return open("data/sample_statements/balanced_pro.csv", "rb").read()


def test_category_breakdown_shares_sum_to_100():
    frame, _ = StatementParser.normalize_csv_statement(_sample_csv_bytes())
    breakdown = StatementParser.build_category_breakdown(frame)
    assert breakdown, "expected at least one categorised debit"
    assert sum(row["percentage_of_total"] for row in breakdown) == pytest.approx(100.0, abs=0.2)
    assert breakdown == sorted(breakdown, key=lambda row: row["amount"], reverse=True)
    assert all(row["transaction_count"] > 0 for row in breakdown)


def test_category_breakdown_counts_only_debits():
    frame, _ = StatementParser.normalize_csv_statement(_sample_csv_bytes())
    debits = frame[frame["type"] == "DEBIT"]
    breakdown = StatementParser.build_category_breakdown(frame)
    assert sum(row["amount"] for row in breakdown) == pytest.approx(float(debits["amount"].sum()), abs=1.0)


def test_category_breakdown_empty_for_credits_only():
    frame = make_transactions([("2025-01-01", 1000, "CREDIT", "SALARY", "ACH", "SALARY")])
    assert StatementParser.build_category_breakdown(frame) == []


def test_monthly_breakdown_is_grouped_by_month_and_category():
    frame, _ = StatementParser.normalize_csv_statement(_sample_csv_bytes())
    monthly = StatementParser.build_monthly_category_breakdown(frame)
    assert monthly
    assert all(len(row["month"]) == 7 and row["month"][4] == "-" for row in monthly)
    months = [row["month"] for row in monthly]
    assert months == sorted(months), "months must be chronological for a time-series chart"
    # Per-category monthly totals must reconcile with the overall category total.
    totals = {}
    for row in monthly:
        totals[row["category"]] = totals.get(row["category"], 0) + row["amount"]
    for row in StatementParser.build_category_breakdown(frame):
        assert totals[row["category"]] == pytest.approx(row["amount"], abs=1.0)


def test_transaction_records_are_newest_first_and_normalised():
    frame = make_transactions(
        [
            ("2025-01-05", 100, "DEBIT", "SWIGGY", "UPI", "FOOD"),
            ("2025-03-09", 200, "DEBIT", "ZOMATO", "UPI", "FOOD"),
            ("2025-02-11", 300, "CREDIT", "SALARY", "ACH", "SALARY"),
        ]
    )
    records = StatementParser.build_transaction_records(frame)
    assert [row["date"] for row in records] == ["2025-03-09", "2025-02-11", "2025-01-05"]
    assert records[0]["payment_mode"] == "UPI"


def test_transaction_records_are_capped():
    frame = make_transactions(
        [(f"2025-{month:02d}-01", 10, "DEBIT", "SWIGGY", "UPI", "FOOD") for month in range(1, 13)]
        * (MAX_TRANSACTION_RECORDS // 12 + 2)
    )
    assert len(StatementParser.build_transaction_records(frame)) == MAX_TRANSACTION_RECORDS


def test_statement_month_span_counts_distinct_months():
    frame = make_transactions(
        [
            ("2025-01-05", 100, "DEBIT", "SWIGGY", "UPI", "FOOD"),
            ("2025-01-28", 100, "DEBIT", "SWIGGY", "UPI", "FOOD"),
            ("2025-03-02", 100, "DEBIT", "SWIGGY", "UPI", "FOOD"),
        ]
    )
    assert StatementParser.statement_month_span(frame) == 2.0


def test_iso_dates_are_not_dayfirst_shuffled():
    """A YYYY-MM-DD string must never be re-read as YYYY-DD-MM."""
    frame = make_transactions(
        [
            ("2025-02-11", 100, "DEBIT", "SWIGGY", "UPI", "FOOD"),
            ("2025-11-02", 100, "DEBIT", "ZOMATO", "UPI", "FOOD"),
        ]
    )
    monthly = StatementParser.build_monthly_category_breakdown(frame)
    assert {row["month"] for row in monthly} == {"2025-02", "2025-11"}

    # The same statement written with Indian dd/mm/yyyy dates resolves to the same two buckets.
    slash_frame = make_transactions(
        [
            ("11/02/2025", 100, "DEBIT", "SWIGGY", "UPI", "FOOD"),
            ("02/11/2025", 100, "DEBIT", "ZOMATO", "UPI", "FOOD"),
        ]
    )
    assert {row["month"] for row in StatementParser.build_monthly_category_breakdown(slash_frame)} == {
        "2025-02",
        "2025-11",
    }


def test_short_acronyms_do_not_match_inside_longer_words():
    """"EMI" inside PREMIUM and "SAL" inside REVERSAL used to mislabel both."""
    assert detect_category("LIC PREMIUM", "DEBIT") == "TAX_SHIELD"
    assert detect_category("REVERSAL RTGS REFUND", "CREDIT") == "REFUND"
    assert detect_category("SAL CREDIT FEB", "CREDIT") == "SALARY"
    assert detect_category("EMI - BAJAJ FINSERV", "DEBIT") == "EMI"


def test_statement_month_span_defaults_to_one_when_undated():
    frame = make_transactions([("not-a-date", 100, "DEBIT", "SWIGGY", "UPI", "FOOD")])
    # Undated rows collapse to a single "unknown" bucket rather than dividing by zero.
    assert StatementParser.statement_month_span(frame) >= 1.0


def test_standardize_frame_coerces_dirty_values():
    frame = pd.DataFrame(
        {
            "date": ["05/04/2025", None],
            "amount": ["1,500.00", None],
            "type": ["debit", None],
            "narration": [None, "x"],
            "payment_mode": [None, None],
            "category": [None, None],
        }
    )
    work = StatementParser.standardize_frame(frame)
    assert work["amount"].iloc[0] == 1500.0
    assert work["amount"].iloc[1] == 0.0
    assert work["type"].iloc[0] == "DEBIT"
    assert set(work["category"]) == {"GENERAL_DEBIT"}
    assert set(work["payment_mode"]) == {"OTHER"}
    assert work["month"].iloc[0] == "2025-04"
    assert pd.notna(work["parsed_date"].iloc[0])
    assert pd.isna(work["parsed_date"].iloc[1])
    assert work["date_str"].iloc[1] == ""
