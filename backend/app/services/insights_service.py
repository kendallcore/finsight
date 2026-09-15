"""
FinSight Insights Engine
Converts the 16D behavioral feature vector plus the categorized transaction stream into
ROI-ranked spending recommendations, persona-based critique, human-readable anomaly
narratives and simulation-driven improvement paths.
"""

import re
from typing import Any, Dict, List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd

from app.schemas import (
    AnomalyItem,
    InsightItem,
    InsightRequest,
    InsightResponse,
    PersonaComparison,
    SimulationPath,
)
from app.services.ml_service import ml_service

# --- Healthy-living thresholds that drive every rule -------------------------
HEALTHY_DISCRETIONARY_CEILING = 0.30
DISCRETIONARY_TARGET = 0.20
UPI_VELOCITY_CEILING = 0.75
MICRO_SPEND_CEILING = 0.15
FIXED_OBLIGATION_CEILING = 0.50
SAVINGS_FLOOR = 0.20
SALARY_REGULARITY_FLOOR = 0.60
CONCENTRATION_CEILING = 0.25
CATEGORY_SHARE_CEILINGS = {"FOOD": 0.12, "SHOPPING": 0.12, "TRAVEL": 0.10}
CATEGORY_TRIM_FACTORS = {"FOOD": 0.30, "SHOPPING": 0.25, "TRAVEL": 0.20}
CATEGORY_LABELS = {
    "FOOD": "dining and quick-commerce",
    "SHOPPING": "shopping and retail",
    "TRAVEL": "travel and commuting",
    "ENTERTAINMENT": "entertainment",
}

# Anomaly detection
ANOMALY_Z_THRESHOLD = 2.0
ANOMALY_MIN_CATEGORY_SAMPLES = 4
ANOMALY_MIN_AMOUNT = 100.0
ANOMALY_MAX_ITEMS = 8

# Recurring-charge hunting
SUBSCRIPTION_KEYWORDS = (
    "NETFLIX", "SPOTIFY", "PRIME", "HOTSTAR", "SONY LIV", "DISNEY", "YOUTUBE",
    "APPLE.COM", "GOOGLE ONE", "AMAZON INSIGHT", "ZOMATO GOLD", "SWIGGY ONE",
    "REDDIT", "CHATGPT", "OPENAI", "NOTION", "ADOBE", "CANVA", "COPYAI",
)
SUBSCRIPTION_MAX_TICKET = 2000.0

RETIREMENT_SHORTFALL_PERCENT = 40
LONG_HORIZON_YEARS = 5
ASSUMED_SIP_RETURN = 0.12
MONTHS_IN_YEAR = 12.0
EMERGENCY_BUFFER_MONTHS = 6.0
BUFFER_BUILD_MONTHS = 24.0

# Radar axes shared by the user and every archetype benchmark.
COMPARISON_AXES = ["Essentials", "Lifestyle", "Savings", "Investing", "Digital Velocity"]

# Prototype ratio vectors, kept consistent with the softmax scoring in
# ml_service.evaluate_lifestyle_diagnostics() so the radar reflects the real classifier.
ARCHETYPE_PROTOTYPES = {
    0: {
        "name": "Frugal Minimalist",
        "scores": {"Essentials": 42.0, "Lifestyle": 12.0, "Savings": 34.0, "Investing": 12.0, "Digital Velocity": 30.0},
        "critique": (
            "Your safety-first stance is genuinely strong — retained cash is doing the heavy lifting. "
            "The risk now is inertial: idle balances lose to inflation. Deploy the surplus into index SIPs "
            "and target a 6-7% real return instead of a savings-account 3%."
        ),
    },
    1: {
        "name": "Experiential Spender",
        "scores": {"Essentials": 36.0, "Lifestyle": 32.0, "Savings": 14.0, "Investing": 8.0, "Digital Velocity": 78.0},
        "critique": (
            "Experience-led spending is healthy at moderate levels — you are buying utility, not clutter. "
            "Keep lifestyle capped near 20% of outflow so the runway survives a slow month; every rupee you "
            "trim here converts directly into optionality later."
        ),
    },
    2: {
        "name": "High-Burn Consumer",
        "scores": {"Essentials": 46.0, "Lifestyle": 38.0, "Savings": 6.0, "Investing": 3.0, "Digital Velocity": 70.0},
        "critique": (
            "Burn rate is running ahead of income, and the emergency reserve is thin enough that one shock "
            "forces a credit-card pivot. Put a 48-hour cooling-off rule on non-essential checkouts and pay a "
            "fixed allowance to yourself on salary day before the spending window opens."
        ),
    },
    3: {
        "name": "Strategic Wealth Builder",
        "scores": {"Essentials": 32.0, "Lifestyle": 18.0, "Savings": 26.0, "Investing": 28.0, "Digital Velocity": 40.0},
        "critique": (
            "Capital allocation is disciplined and the compounding engine is already running. The next lever "
            "is structural: rebalance equity and debt sleeves annually, and confirm term plus health cover so "
            "a medical event never forces an early SIP break."
        ),
    },
}

IMPROVEMENT_TARGET_ARCHETYPE = 3  # "Strategic Wealth Builder"


def _rupees(value: float) -> str:
    return f"₹{value:,.0f}"


def _pct(fraction: float) -> str:
    return f"{fraction * 100.0:.1f}%"


def _clean_merchant(narration: str, limit: int = 32) -> str:
    """Squashes a raw bank narration into something a human can read on a card."""
    text = " ".join(str(narration).upper().split())
    text = re.sub(r"\b(UPI|SBI\w*|HDFC\w*|ICICI\w*|AXIC\w*|AXISB\w*|DR|CR|ACH|NEFT|IMPS|CMS|NACH|BY|TO)\b", " ", text)
    # Long digit runs are settlement/reference numbers, not part of the merchant name.
    text = re.sub(r"\b\d{4,}\b", " ", text)
    text = re.sub(r"[^A-Z0-9 .&/-]", " ", text)
    text = " ".join(text.replace("/", " ").replace("-", " ").split())
    if len(text) > limit:
        text = text[: limit - 1].rstrip() + "…"
    return text or "TRANSACTION"


class InsightsService:
    """Stateless rule engine: features + transactions in, coaching payload out."""

    # ---- scale helpers ----------------------------------------------------
    @staticmethod
    def monthly_scale(
        features: Dict[str, float],
        months: Optional[float] = None,
        total_credits: Optional[float] = None,
        total_debits: Optional[float] = None,
    ) -> Tuple[float, float, float]:
        """
        Returns (monthly_income, monthly_spend, months).
        Prefers the real statement totals; falls back to the logged magnitudes
        embedded in the feature vector when only sliders are available.
        """
        period = float(months) if months and months > 0 else MONTHS_IN_YEAR
        if total_credits and total_credits > 0:
            monthly_income = float(total_credits) / period
        else:
            monthly_income = float(np.expm1(features.get("log_annual_credit", 0.0))) / MONTHS_IN_YEAR
        if total_debits and total_debits > 0:
            monthly_spend = float(total_debits) / period
        else:
            monthly_spend = float(np.expm1(features.get("log_annual_debit", 0.0))) / MONTHS_IN_YEAR
        return round(monthly_income, 2), round(monthly_spend, 2), period

    @staticmethod
    def data_volume_confidence(transaction_count: int, months: float) -> float:
        """Damps every rule's confidence when the statement is short or thin."""
        factor = 1.0
        if transaction_count < 30:
            factor = 0.75
        elif transaction_count < 60:
            factor = 0.88
        if months < 3:
            factor *= 0.85
        return max(0.55, min(1.0, factor))

    @staticmethod
    def rule_confidence(value: float, threshold: float, volume_factor: float) -> float:
        """
        Confidence rises with how far a metric has travelled past its threshold:
        just over the line is suggestive, 2x past it is near-certain.
        """
        gap = (value - threshold) / max(abs(threshold), 1e-6)
        base = 0.58 + 0.34 * min(max(gap, 0.0), 1.0)
        return round(min(0.97, max(0.40, base * volume_factor)), 3)

    # ---- ratio-threshold rules -------------------------------------------
    def build_ratio_rules(
        self,
        features: Dict[str, float],
        monthly_income: float,
        monthly_spend: float,
        volume_factor: float,
        txns: Optional[pd.DataFrame] = None,
        months: float = MONTHS_IN_YEAR,
    ) -> List[InsightItem]:
        items: List[InsightItem] = []

        discretionary = float(features.get("discretionary_ratio", 0.0))
        if discretionary > HEALTHY_DISCRETIONARY_CEILING:
            impact = monthly_spend * (discretionary - DISCRETIONARY_TARGET)
            items.append(InsightItem(
                rule_id="discretionary_ceiling",
                category="Lifestyle",
                insight=(
                    f"Discretionary spend is {_pct(discretionary)} of outflow, past the "
                    f"{int(HEALTHY_DISCRETIONARY_CEILING * 100)}% healthy ceiling. Trimming to "
                    f"{int(DISCRETIONARY_TARGET * 100)}% frees {_rupees(impact)}/month."
                ),
                impact_rupees=round(impact, 2),
                confidence=self.rule_confidence(discretionary, HEALTHY_DISCRETIONARY_CEILING, volume_factor),
                effort=2,
            ))

        upi_velocity = float(features.get("upi_velocity_index", 0.0))
        if upi_velocity > UPI_VELOCITY_CEILING:
            micro_spend = monthly_spend * float(features.get("micro_spend_density", 0.0))
            impact = micro_spend * 0.12
            cadence = ""
            if txns is not None and not txns.empty and months > 0:
                upi_count = int(len(txns[(txns["type"] == "DEBIT") & (txns["payment_mode"] == "UPI")]))
                if upi_count:
                    cadence = f" That is about {upi_count / months:.0f} separate taps a month. "
            items.append(InsightItem(
                rule_id="upi_velocity",
                category="Digital Discipline",
                insight=(
                    f"High UPI velocity ({upi_velocity:.2f}): micro-spend leaks hide in "
                    f"{_pct(float(features.get('micro_spend_density', 0.0)))} of outflow paid under ₹500."
                    f"{cadence}Consolidating to one bulk payment a day recovers ~{_rupees(impact)}/month."
                ),
                impact_rupees=round(impact, 2),
                confidence=self.rule_confidence(upi_velocity, UPI_VELOCITY_CEILING, volume_factor),
                effort=1,
            ))

        micro_density = float(features.get("micro_spend_density", 0.0))
        if micro_density > MICRO_SPEND_CEILING:
            impact = monthly_spend * micro_density * 0.10
            sub_text = ""
            if txns is not None and not txns.empty:
                small = txns[(txns["type"] == "DEBIT") & (txns["amount"] < 500.0)]
                if not small.empty:
                    sub_text = f" {len(small) / max(months, 1.0):.0f} of them clear ₹500 every month. "
            items.append(InsightItem(
                rule_id="micro_spend_density",
                category="Digital Discipline",
                insight=(
                    f"Micro-transaction density is {_pct(micro_density)} of outflow.{sub_text}"
                    f"Each is individually trivial and collectively invisible — bundling them "
                    f"into planned purchases saves ~{_rupees(impact)}/month."
                ),
                impact_rupees=round(impact, 2),
                confidence=self.rule_confidence(micro_density, MICRO_SPEND_CEILING, volume_factor),
                effort=2,
            ))

        fixed = float(features.get("fixed_obligation_ratio", 0.0))
        if fixed > FIXED_OBLIGATION_CEILING:
            excess = monthly_spend * (fixed - FIXED_OBLIGATION_CEILING)
            impact = excess * 0.5
            items.append(InsightItem(
                rule_id="fixed_obligation_ceiling",
                category="Commitments",
                insight=(
                    f"Fixed obligations claim {_pct(fixed)} of outflow ({_rupees(monthly_spend * fixed)}/month), "
                    f"above the {int(FIXED_OBLIGATION_CEILING * 100)}% comfort line. Refinancing one EMI or "
                    f"renegotiating rent by 10% returns ~{_rupees(impact)}/month."
                ),
                impact_rupees=round(impact, 2),
                confidence=self.rule_confidence(fixed, FIXED_OBLIGATION_CEILING, volume_factor),
                effort=3,
            ))

        savings = float(features.get("net_savings_ratio", 0.0))
        if savings < SAVINGS_FLOOR:
            impact = max(0.0, monthly_income * (SAVINGS_FLOOR - savings))
            corpus = impact * 12 * LONG_HORIZON_YEARS
            items.append(InsightItem(
                rule_id="savings_floor",
                category="Resilience",
                insight=(
                    f"Savings rate is {_pct(savings)}, below the {int(SAVINGS_FLOOR * 100)}% floor. "
                    f"At this pace your long-horizon corpus lands ~{RETIREMENT_SHORTFALL_PERCENT}% short of target. "
                    f"Closing the gap adds {_rupees(impact)}/month (~{_rupees(corpus)} over {LONG_HORIZON_YEARS} years)."
                ),
                impact_rupees=round(impact, 2),
                confidence=round(min(0.95, 0.58 + 0.30 * min(max((SAVINGS_FLOOR - savings) / SAVINGS_FLOOR, 0.0), 1.0)
                                    * volume_factor), 3),
                effort=2,
            ))

        regularity = float(features.get("salary_regularity_score", 1.0))
        if regularity < SALARY_REGULARITY_FLOOR:
            essential_monthly = monthly_spend * max(fixed, 0.35)
            buffer_target = essential_monthly * EMERGENCY_BUFFER_MONTHS
            impact = buffer_target / BUFFER_BUILD_MONTHS
            items.append(InsightItem(
                rule_id="salary_regularity",
                category="Resilience",
                insight=(
                    f"Income lands in only {regularity * MONTHS_IN_YEAR:.0f} of 12 months, so the cashflow is "
                    f"lumpy. Build a {EMERGENCY_BUFFER_MONTHS:.0f}-month buffer ({_rupees(buffer_target)}) before "
                    f"raising discretionary spend — routing {_rupees(impact)}/month gets there in "
                    f"{BUFFER_BUILD_MONTHS:.0f} months."
                ),
                impact_rupees=round(impact, 2),
                confidence=round(min(0.92, 0.55 + 0.30 * min(max((SALARY_REGULARITY_FLOOR - regularity) / SALARY_REGULARITY_FLOOR, 0.0), 1.0)
                                    * volume_factor), 3),
                effort=2,
            ))

        return items

    # ---- category and subscription rules ---------------------------------
    def build_category_rules(
        self,
        category_breakdown: Sequence[Dict[str, Any]],
        months: float,
        volume_factor: float,
    ) -> List[InsightItem]:
        items: List[InsightItem] = []
        period = max(months, 1.0)

        for raw_entry in category_breakdown:
            entry = raw_entry.model_dump() if hasattr(raw_entry, "model_dump") else dict(raw_entry)
            category = str(entry.get("category", "")).upper()
            share = float(entry.get("percentage_of_total", 0.0)) / 100.0
            monthly_amount = float(entry.get("amount", 0.0)) / period
            label = CATEGORY_LABELS.get(category, category.lower().replace("_", " "))

            ceiling = CATEGORY_SHARE_CEILINGS.get(category)
            if ceiling is not None and share > ceiling:
                trim = CATEGORY_TRIM_FACTORS.get(category, 0.20)
                impact = monthly_amount * trim
                items.append(InsightItem(
                    rule_id=f"category_{category.lower()}",
                    category=label.title(),
                    insight=(
                        f"{label} runs {_rupees(monthly_amount)}/month — {_pct(share)} of outflow, above the "
                        f"{int(ceiling * 100)}% guideline. A {int(trim * 100)}% trim is the least painful cut: "
                        f"~{_rupees(impact)}/month."
                    ),
                    impact_rupees=round(impact, 2),
                    confidence=self.rule_confidence(share, ceiling, volume_factor),
                    effort=1 if category == "FOOD" else 2,
                ))
            elif share > CONCENTRATION_CEILING and category not in ("RENT", "EMI", "SALARY"):
                items.append(InsightItem(
                    rule_id=f"concentration_{category.lower()}",
                    category=label.title(),
                    insight=(
                        f"{label.title()} is {int(entry.get('percentage_of_total', 0.0))}% of everything you "
                        f"spent ({_rupees(monthly_amount)}/month across "
                        f"{int(entry.get('transaction_count', 0))} transactions) — one unusually heavy month here "
                        f"moves your whole budget."
                    ),
                    impact_rupees=round(monthly_amount * 0.15, 2),
                    confidence=round(0.62 * volume_factor, 3),
                    effort=3,
                ))

        return items

    def detect_subscriptions(
        self,
        txns: Optional[pd.DataFrame],
        months: float,
        volume_factor: float,
    ) -> Optional[InsightItem]:
        """Finds recurring low-ticket merchant charges worth cancelling outright."""
        if txns is None or txns.empty:
            return None

        debits = txns[txns["type"] == "DEBIT"]
        if debits.empty:
            return None

        blob = debits["narration"].astype(str).str.upper()
        matched = debits[blob.apply(lambda s: any(k in s for k in SUBSCRIPTION_KEYWORDS))]
        matched = matched[matched["amount"] <= SUBSCRIPTION_MAX_TICKET]
        if matched.empty:
            return None

        period = max(months, 1.0)
        monthly_cost = float(matched["amount"].sum()) / period
        merchant_hits: Dict[str, int] = {}
        for key in SUBSCRIPTION_KEYWORDS:
            count = int(blob.apply(lambda s, k=key: k in s).sum())
            if count:
                merchant_hits[key] = count

        top_merchants = sorted(merchant_hits.items(), key=lambda kv: kv[1], reverse=True)[:3]
        named = ", ".join(name.title() for name, _ in top_merchants)
        occurrences = sum(merchant_hits.values())

        return InsightItem(
            rule_id="subscription_stack",
            category="Subscriptions",
            insight=(
                f"{len(top_merchants)} recurring consumer charges detected ({named}) across {occurrences} "
                f"payments. Cancelling the unused ones saves ~{_rupees(monthly_cost)}/month, "
                f"{_rupees(monthly_cost * 12)}/year. ROI: immediate, no lifestyle change."
            ),
            impact_rupees=round(monthly_cost, 2),
            confidence=round(min(0.9, 0.66 * volume_factor + 0.02 * min(occurrences, 6)), 3),
            effort=1,
        )

    # ---- anomaly detection ------------------------------------------------
    @staticmethod
    def transactions_frame(records: Sequence[Any]) -> pd.DataFrame:
        """Normalizes TransactionRecord dicts (or raw dicts) into an analysis frame."""
        rows = []
        for rec in records or []:
            if hasattr(rec, "model_dump"):
                rows.append(rec.model_dump())
            elif isinstance(rec, dict):
                rows.append(dict(rec))
        if not rows:
            return pd.DataFrame(columns=["date", "narration", "amount", "type", "category", "payment_mode"])

        frame = pd.DataFrame(rows)
        for column, fallback in (
            ("type", "DEBIT"), ("narration", "TRANSACTION"),
            ("category", "GENERAL_DEBIT"), ("payment_mode", "OTHER"),
        ):
            if column not in frame.columns:
                frame[column] = fallback

        frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce").fillna(0.0).abs()
        frame["type"] = frame["type"].astype(str).str.upper()
        frame["category"] = frame["category"].astype(str).str.upper()
        frame["payment_mode"] = frame["payment_mode"].astype(str).str.upper()
        frame["narration"] = frame["narration"].astype(str)
        frame["parsed_date"] = pd.to_datetime(frame["date"], dayfirst=True, format="mixed", errors="coerce")
        return frame

    def detect_anomalies(self, txns: pd.DataFrame, months: float) -> List[AnomalyItem]:
        """
        Flags debit transactions whose amount is a >2-sigma outlier against the user's own
        behaviour in that category, then renders each as a sentence rather than a raw flag.
        """
        if txns is None or txns.empty:
            return []

        debits = txns[txns["type"] == "DEBIT"]
        if debits.empty:
            return []

        period = max(months, 1.0)
        anomalies: List[AnomalyItem] = []

        for category, group in debits.groupby("category"):
            if len(group) < ANOMALY_MIN_CATEGORY_SAMPLES:
                continue
            mean = float(group["amount"].mean())
            std = float(group["amount"].std(ddof=0))
            if std <= 1.0:
                continue

            monthly_average = mean * len(group) / period
            months_seen = {str(m) for m in group["parsed_date"].dt.strftime("%Y-%m").dropna()}
            candidates = group[group["amount"] >= ANOMALY_MIN_AMOUNT].copy()
            candidates["z_score"] = (candidates["amount"] - mean) / std
            outliers = candidates[candidates["z_score"].abs() > ANOMALY_Z_THRESHOLD]

            for row in outliers.to_dict("records"):
                z = float(row["z_score"])
                amount = float(row["amount"])
                label = CATEGORY_LABELS.get(category, str(category).lower().replace("_", " "))
                stamp = row["parsed_date"]
                when = stamp.strftime("%d %b").lstrip("0") if pd.notna(stamp) else str(row["date"])
                merchant = _clean_merchant(row["narration"])

                # The behavioural baseline is the user's own typical payment in this category;
                # monthly totals are only quoted when the single payment really dwarfs them.
                sentences = [f"{amount / max(mean, 1.0):.1f}x your typical {label} payment of {_rupees(mean)}"]
                if amount >= float(group["amount"].max()) - 0.01:
                    sentences.append(f"your largest {label} payment on record")
                if len(months_seen) == 1:
                    sentences.append(f"only month this {label} category appears")
                elif monthly_average > 0 and amount > 2.0 * monthly_average:
                    sentences.append(f"more than double a whole average month of {label} ({_rupees(monthly_average)})")

                volume_confidence = min(1.0, 0.5 + len(group) / 40.0)
                confidence = round(min(0.96, (0.55 + 0.09 * (abs(z) - ANOMALY_Z_THRESHOLD)) * volume_confidence), 3)

                anomalies.append(AnomalyItem(
                    transaction_date=str(row["date"]),
                    narration=merchant,
                    amount=round(amount, 2),
                    category=label.title(),
                    z_score=round(z, 2),
                    narrative=(
                        f"{when}: {_rupees(amount)} on '{merchant}' — "
                        + "; ".join(sentences)
                        + f". That is {abs(z):.1f} standard deviations from how you normally spend on {label}."
                    ),
                    confidence=confidence,
                ))

        deduped: Dict[Tuple[str, str, float], AnomalyItem] = {}
        for item in sorted(anomalies, key=lambda a: abs(a.z_score), reverse=True):
            deduped.setdefault((item.transaction_date, item.narration, item.amount), item)

        ordered = sorted(deduped.values(), key=lambda a: abs(a.z_score), reverse=True)
        return ordered[:ANOMALY_MAX_ITEMS]

    # ---- improvement paths ------------------------------------------------
    def _project(self, features: Dict[str, float]) -> Tuple[int, float]:
        _, diagnostics = ml_service.evaluate_lifestyle_diagnostics(features)
        return int(diagnostics.financial_health_score), float(diagnostics.cash_runway_months)

    def build_simulation_paths(
        self,
        features: Dict[str, float],
        monthly_income: float,
        monthly_spend: float,
        months: float,
    ) -> List[SimulationPath]:
        """
        Each path mutates the behavioral vector, then re-runs the real diagnostics scorer so the
        projected health/runway deltas come from the same maths the live prediction uses.

        Two invariants from the feature extractor are preserved so every projected vector stays on
        the training manifold: burn_rate == 1 - net_savings_ratio, and a ratio expressed against
        outflow only converts to a share-of-income (`savings`) via spend/income.
        """
        base_health, base_runway = self._project(features)
        discretionary = float(features.get("discretionary_ratio", 0.0))
        investment = float(features.get("investment_ratio", 0.0))
        savings = float(features.get("net_savings_ratio", 0.0))
        fixed = float(features.get("fixed_obligation_ratio", 0.0))

        # Fraction-of-outflow -> fraction-of-inflow conversion.
        spend_share_of_income = (monthly_spend / monthly_income) if monthly_income > 0 else 0.0
        essential_monthly = monthly_spend * max(fixed, 0.35)
        buffer_target = essential_monthly * EMERGENCY_BUFFER_MONTHS

        def as_path(mutate: Dict[str, float]) -> Tuple[float, float, Dict[str, float]]:
            projected = dict(features)
            projected.update(mutate)
            if "net_savings_ratio" in mutate:
                projected["monthly_burn_rate"] = round(max(0.05, 1.0 - projected["net_savings_ratio"]), 4)
            health, runway = self._project(projected)
            return health, runway, projected

        def path(path_id: str, name: str, description: str, changes: List[str],
                 mutate: Dict[str, float]) -> SimulationPath:
            health, runway, projected = as_path(mutate)
            return SimulationPath(
                path_id=path_id,
                name=name,
                description=description,
                required_changes=changes,
                projected_health_delta=round(float(health - base_health), 1),
                projected_runway_delta=round(float(runway - base_runway), 1),
                projected_features={key: float(value) for key, value in projected.items()},
                baseline_health_score=base_health,
                baseline_runway_months=base_runway,
            )

        def savings_from_freed_wants(new_discretionary: float) -> float:
            freed = max(0.0, discretionary - new_discretionary) * spend_share_of_income
            return round(min(0.60, savings + freed), 4)

        emergency_impact = buffer_target / BUFFER_BUILD_MONTHS
        # Never *raise* wants to hit a target: the cap only ever tightens discretionary spend.
        emergency_disc = min(discretionary, max(discretionary * 0.85, DISCRETIONARY_TARGET))
        # A buffer is funded by routing cash to it, so the set-aside itself counts even when there
        # is no discretionary fat left to cut (e.g. a high-burn account that is already frugal).
        set_aside_share = (emergency_impact / monthly_income) if monthly_income > 0 else 0.0
        frugal_target = min(discretionary, DISCRETIONARY_TARGET)
        invest_ramp = max(investment, 0.25)
        # Always an actionable cut: down to the 40% guideline, or 15% off current commitments
        # if the profile is already inside it (refinance/renegotiate is never a no-op).
        debt_free_fixed = min(fixed * 0.85, FIXED_OBLIGATION_CEILING)

        # Investment ramp is funded by redirecting wants, not by saving more.
        extra_investment = max(0.0, invest_ramp - investment)
        ramp_disc = max(0.05, discretionary - (extra_investment / spend_share_of_income if spend_share_of_income else 0.0))

        return [
            path(
                "emergency_fund",
                "Emergency Fund Path",
                f"Reach a {EMERGENCY_BUFFER_MONTHS:.0f}-month buffer ({_rupees(buffer_target)}) without "
                f"giving up the lifestyle you actually use.",
                [
                    f"Auto-transfer {_rupees(emergency_impact)} to a liquid fund on salary day for "
                    f"{BUFFER_BUILD_MONTHS:.0f} months",
                    f"Discretionary {_pct(discretionary)} → {_pct(emergency_disc)} of outflow",
                    "Park the buffer in an instant-redeem liquid fund, not the savings account",
                ],
                {"discretionary_ratio": round(emergency_disc, 4),
                 "net_savings_ratio": round(min(0.60, savings + max(
                     max(0.0, discretionary - emergency_disc) * spend_share_of_income, set_aside_share)), 4)},
            ),
            path(
                "frugal_transition",
                "Frugal Transition",
                "Move toward the Frugal Minimalist profile by capping wants at the 20% guideline.",
                [
                    f"Discretionary {_pct(discretionary)} → {_pct(frugal_target)}",
                    f"Redirects {_rupees(monthly_spend * max(discretionary - frugal_target, 0.0))}/month into retained cash",
                    "Fixed obligations stay put — the entire cut comes from wants",
                ],
                {"discretionary_ratio": round(frugal_target, 4), "net_savings_ratio": savings_from_freed_wants(frugal_target)},
            ),
            path(
                "investment_ramp",
                "Investment Ramp",
                f"Lift systematic investing to {int(invest_ramp * 100)}% of inflow, funded by redirecting "
                f"wants rather than by spending less overall.",
                [
                    f"Investment ratio {_pct(investment)} → {_pct(invest_ramp)}",
                    f"Funded by trimming discretionary {_pct(discretionary)} → {_pct(ramp_disc)}",
                    f"Adds roughly {_rupees(monthly_income * invest_ramp)}/month into the market at "
                    f"{ASSUMED_SIP_RETURN * 100:.0f}% assumed returns",
                ],
                {"investment_ratio": round(invest_ramp, 4), "discretionary_ratio": round(ramp_disc, 4)},
            ),
            path(
                "debt_free",
                "Debt-Free Path",
                f"Bring fixed commitments from {_pct(fixed)} down to {_pct(debt_free_fixed)} through "
                f"refinancing or renegotiation.",
                [
                    f"Fixed obligations {_pct(fixed)} → {_pct(debt_free_fixed)}",
                    f"Frees {_rupees(monthly_spend * max(fixed - debt_free_fixed, 0.0))}/month of recurring capacity",
                    "Roll the freed EMI straight into a SIP so the burn does not refill itself",
                ],
                {
                    "fixed_obligation_ratio": round(debt_free_fixed, 4),
                    "net_savings_ratio": round(min(0.60, savings + max(fixed - debt_free_fixed, 0.0) * spend_share_of_income), 4),
                },
            ),
        ]

    # ---- persona comparison ----------------------------------------------
    @staticmethod
    def user_axis_scores(features: Dict[str, float]) -> Dict[str, float]:
        return {
            "Essentials": round(float(features.get("fixed_obligation_ratio", 0.0)) * 100.0, 1),
            "Lifestyle": round(float(features.get("discretionary_ratio", 0.0)) * 100.0, 1),
            "Savings": round(max(0.0, float(features.get("net_savings_ratio", 0.0))) * 100.0, 1),
            "Investing": round(float(features.get("investment_ratio", 0.0)) * 100.0, 1),
            "Digital Velocity": round(float(features.get("upi_velocity_index", 0.0)) * 100.0, 1),
        }

    @staticmethod
    def persona_comparison(archetype_id: int, features: Dict[str, float]) -> PersonaComparison:
        archetype_id = int(archetype_id) if archetype_id in ARCHETYPE_PROTOTYPES else 0
        return PersonaComparison(
            user_archetype=ARCHETYPE_PROTOTYPES[archetype_id]["name"],
            user_scores=InsightsService.user_axis_scores(features),
            benchmark_scores={
                info["name"]: dict(info["scores"]) for info in ARCHETYPE_PROTOTYPES.values()
            },
        )

    # ---- orchestration ----------------------------------------------------
    def resolve_archetype(
        self,
        features: Dict[str, float],
        archetype_id: Optional[int] = None,
        archetype_name: Optional[str] = None,
        archetype_confidence: Optional[float] = None,
    ) -> Tuple[int, str, float]:
        if archetype_id is not None and int(archetype_id) in ARCHETYPE_PROTOTYPES:
            resolved_id = int(archetype_id)
            name = archetype_name or ARCHETYPE_PROTOTYPES[resolved_id]["name"]
            confidence = float(archetype_confidence) if archetype_confidence is not None else 0.0
            return resolved_id, name, round(confidence, 4)

        predicted, diagnostics = ml_service.evaluate_lifestyle_diagnostics(features)
        return predicted.archetype_id, archetype_name or predicted.archetype_name, float(archetype_confidence or predicted.confidence)

    def request_from_statement(
        self,
        features: Dict[str, float],
        transactions_df: pd.DataFrame,
        summary: Any,
        archetype_prediction: Optional[Any] = None,
    ) -> InsightRequest:
        """
        Assembles an InsightRequest straight from a parsed statement so the upload path and a
        direct POST /api/insights call reason over exactly the transaction window they publish.
        """
        from app.services.statement_parser import StatementParser

        records = StatementParser.build_transaction_records(transactions_df)
        months = StatementParser.statement_month_span(transactions_df)
        return InsightRequest(
            features=features,
            category_breakdown=list(getattr(summary, "category_breakdown", []) or []),
            monthly_category_breakdown=list(getattr(summary, "monthly_category_breakdown", []) or []),
            transactions=records,
            archetype_id=getattr(archetype_prediction, "archetype_id", None),
            archetype_name=getattr(archetype_prediction, "archetype_name", None),
            archetype_confidence=getattr(archetype_prediction, "confidence", None),
            statement_months=months,
            total_credits=float(getattr(summary, "total_credits", 0.0) or 0.0),
            total_debits=float(getattr(summary, "total_debits", 0.0) or 0.0),
        )

    def generate(self, request: InsightRequest) -> InsightResponse:
        features = dict(request.features or {})
        txns = self.transactions_frame(request.transactions)

        months = request.statement_months
        if not months and not txns.empty:
            seen = sorted({str(m) for m in txns["parsed_date"].dt.strftime("%Y-%m").dropna()})
            if seen:
                months = float(len(seen))
        if not months:
            months = MONTHS_IN_YEAR

        monthly_income, monthly_spend, months = self.monthly_scale(
            features, months, request.total_credits, request.total_debits
        )
        archetype_id, archetype_name, archetype_confidence = self.resolve_archetype(
            features, request.archetype_id, request.archetype_name, request.archetype_confidence
        )
        volume_factor = self.data_volume_confidence(int(len(txns)), months)

        insights = self.build_ratio_rules(features, monthly_income, monthly_spend, volume_factor, txns, months)
        insights += self.build_category_rules(request.category_breakdown, months, volume_factor)

        subscription = self.detect_subscriptions(txns, months, volume_factor)
        if subscription:
            insights.append(subscription)

        insights.sort(key=lambda item: (item.impact_rupees, item.confidence), reverse=True)

        return InsightResponse(
            status="success",
            persona_critique=ARCHETYPE_PROTOTYPES[archetype_id]["critique"],
            user_archetype=archetype_name,
            archetype_id=archetype_id,
            archetype_confidence=archetype_confidence,
            monthly_income=monthly_income,
            monthly_spend=monthly_spend,
            insights=insights,
            anomalies=self.detect_anomalies(txns, months),
            simulation_paths=self.build_simulation_paths(features, monthly_income, monthly_spend, months),
            persona_comparison=self.persona_comparison(archetype_id, features),
            tracked_savings_potential=round(float(sum(i.impact_rupees for i in insights)), 2),
        )


insights_service = InsightsService()
