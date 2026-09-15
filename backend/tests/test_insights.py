"""
Unit tests for the insights engine: threshold rules, ROI/effort/confidence, anomaly narratives,
simulation paths and the persona benchmark — plus the /api/insights transport layer.
"""

import pytest

from app.schemas import InsightRequest
from app.services.insights_service import (
    ANOMALY_MAX_ITEMS,
    ARCHETYPE_PROTOTYPES,
    COMPARISON_AXES,
    InsightsService,
    _clean_merchant,
)


def feature_vector(**overrides):
    """A mid-range, healthy vector; individual tests override the dimension under scrutiny."""
    base = {
        "log_annual_credit": 14.2,
        "log_annual_debit": 13.8,
        "net_savings_ratio": 0.32,
        "monthly_burn_rate": 0.68,
        "salary_inflow_ratio": 0.9,
        "monthly_credit_cv": 0.08,
        "salary_regularity_score": 1.0,
        "bonus_lump_sum_ratio": 0.1,
        "investment_ratio": 0.18,
        "fixed_obligation_ratio": 0.3,
        "discretionary_ratio": 0.2,
        "tax_shield_ratio": 0.05,
        "upi_velocity_index": 0.5,
        "micro_spend_density": 0.05,
        "log_avg_ticket_size": 7.5,
        "capital_gains_flux": 0.0,
    }
    base.update(overrides)
    return base


def txn(date, amount, narration="SWIGGY BANGALORE", txn_type="DEBIT", category="FOOD", mode="UPI"):
    return {
        "date": date,
        "narration": narration,
        "amount": amount,
        "type": txn_type,
        "category": category,
        "payment_mode": mode,
    }


@pytest.fixture
def service():
    return InsightsService()


# ---------------------------------------------------------------------------
# scale + confidence helpers
# ---------------------------------------------------------------------------
def test_monthly_scale_uses_statement_totals_when_supplied(service):
    income, spend, months = service.monthly_scale(feature_vector(), months=4, total_credits=400000, total_debits=300000)
    assert months == 4.0
    assert income == pytest.approx(100000.0)
    assert spend == pytest.approx(75000.0)


def test_monthly_scale_falls_back_to_log_magnitudes(service):
    import math

    features = feature_vector(log_annual_credit=math.log1p(1200000), log_annual_debit=math.log1p(900000))
    income, spend, months = service.monthly_scale(features)
    assert months == 12.0
    assert income == pytest.approx(100000.0, abs=1)
    assert spend == pytest.approx(75000.0, abs=1)


def test_monthly_scale_tolerates_zero_income(service):
    income, spend, months = service.monthly_scale(feature_vector(), months=0, total_credits=0, total_debits=0)
    assert months == 12.0
    assert income >= 0 and spend >= 0


def test_data_volume_confidence_penalises_thin_and_short_statements(service):
    assert service.data_volume_confidence(500, 12) == 1.0
    assert service.data_volume_confidence(40, 12) < 1.0
    assert service.data_volume_confidence(10, 1) < service.data_volume_confidence(10, 12)
    assert 0.5 <= service.data_volume_confidence(3, 1) <= 1.0


def test_rule_confidence_rises_with_overshoot_and_is_bounded(service):
    just_over = service.rule_confidence(0.301, 0.30, 1.0)
    way_over = service.rule_confidence(0.60, 0.30, 1.0)
    assert just_over < way_over
    assert 0.0 <= just_over <= 1.0
    assert way_over <= 0.97


# ---------------------------------------------------------------------------
# threshold rules
# ---------------------------------------------------------------------------
def test_healthy_vector_triggers_no_rules(service):
    response = service.generate(InsightRequest(features=feature_vector(), statement_months=12))
    assert response.insights == []
    assert response.tracked_savings_potential == 0.0


def test_threshold_is_exclusive_not_inclusive(service):
    at_ceiling = service.generate(InsightRequest(features=feature_vector(discretionary_ratio=0.30), statement_months=12))
    assert "discretionary_ceiling" not in {item.rule_id for item in at_ceiling.insights}

    over_ceiling = service.generate(InsightRequest(features=feature_vector(discretionary_ratio=0.31), statement_months=12))
    assert "discretionary_ceiling" in {item.rule_id for item in over_ceiling.insights}


def test_high_burn_profile_triggers_the_expected_rules(service):
    response = service.generate(
        InsightRequest(
            features=feature_vector(
                discretionary_ratio=0.45,
                net_savings_ratio=0.05,
                upi_velocity_index=0.85,
                micro_spend_density=0.22,
                fixed_obligation_ratio=0.55,
                salary_regularity_score=0.4,
            ),
            statement_months=12,
            total_credits=1200000,
            total_debits=1140000,
        )
    )
    rule_ids = {item.rule_id for item in response.insights}
    assert {
        "discretionary_ceiling",
        "upi_velocity",
        "micro_spend_density",
        "fixed_obligation_ceiling",
        "savings_floor",
        "salary_regularity",
    } <= rule_ids


def test_insights_are_roi_ranked_and_well_formed(service):
    response = service.generate(
        InsightRequest(
            features=feature_vector(discretionary_ratio=0.5, net_savings_ratio=0.02, fixed_obligation_ratio=0.6),
            statement_months=12,
            total_credits=1800000,
            total_debits=1764000,
        )
    )
    impacts = [item.impact_rupees for item in response.insights]
    assert impacts == sorted(impacts, reverse=True)
    for item in response.insights:
        assert item.effort in (1, 2, 3)
        assert 0.0 <= item.confidence <= 1.0
        assert item.impact_rupees >= 0.0
        assert len(item.insight) > 30


def test_category_rule_fires_from_breakdown_share(service):
    response = service.generate(
        InsightRequest(
            features=feature_vector(),
            statement_months=12,
            total_credits=1200000,
            total_debits=960000,
            category_breakdown=[
                {"category": "FOOD", "amount": 240000, "transaction_count": 90, "percentage_of_total": 25.0}
            ],
        )
    )
    food = next(item for item in response.insights if item.rule_id == "category_food")
    # 240k over 12 months = 20k/mo, a 30% trim is 6k.
    assert food.impact_rupees == pytest.approx(6000.0, abs=1)


def test_concentration_rule_catches_a_dominant_unlisted_category(service):
    response = service.generate(
        InsightRequest(
            features=feature_vector(),
            statement_months=12,
            total_credits=1200000,
            total_debits=1000000,
            category_breakdown=[
                {"category": "GENERAL_DEBIT", "amount": 400000, "transaction_count": 12, "percentage_of_total": 40.0}
            ],
        )
    )
    assert any(item.rule_id == "concentration_general_debit" for item in response.insights)


def test_rent_and_emi_are_not_flagged_as_concentration(service):
    response = service.generate(
        InsightRequest(
            features=feature_vector(),
            statement_months=12,
            total_credits=1200000,
            total_debits=1000000,
            category_breakdown=[
                {"category": "RENT", "amount": 600000, "transaction_count": 12, "percentage_of_total": 60.0}
            ],
        )
    )
    assert not any(item.rule_id.startswith("concentration_") for item in response.insights)


def test_subscription_stack_is_summed_monthly(service):
    transactions = [txn("2025-01-03", 149, "NETFLIX.COM"), txn("2025-02-03", 149, "NETFLIX.COM"),
                    txn("2025-01-05", 119, "SPOTIFY"), txn("2025-02-05", 119, "SPOTIFY"),
                    txn("2025-01-07", 79, "ZOMATO GOLD")]
    response = service.generate(
        InsightRequest(features=feature_vector(), statement_months=2, transactions=transactions)
    )
    subscription = next(item for item in response.insights if item.rule_id == "subscription_stack")
    assert subscription.impact_rupees == pytest.approx((149 * 2 + 119 * 2 + 79) / 2, abs=1)
    assert subscription.effort == 1


def test_no_subscription_rule_without_recurring_charges(service):
    response = service.generate(
        InsightRequest(features=feature_vector(), statement_months=2, transactions=[txn("2025-01-03", 900)])
    )
    assert "subscription_stack" not in {item.rule_id for item in response.insights}


# ---------------------------------------------------------------------------
# anomaly narratives
# ---------------------------------------------------------------------------
def test_anomaly_detected_and_rendered_as_a_sentence(service):
    transactions = [txn(f"2025-0{month}-05", 400 + month * 20) for month in range(1, 9)]
    transactions.append(txn("2025-06-15", 8450, "AMAZON INDIA RETAIL", category="SHOPPING"))
    # Same category, one wild outlier among ordinary payments.
    transactions += [txn(f"2025-0{m}-06", 500) for m in range(1, 9)] + [
        txn("2025-07-06", 9000, "AMAZON INDIA RETAIL", category="FOOD")
    ]

    response = service.generate(
        InsightRequest(features=feature_vector(), statement_months=8, transactions=transactions)
    )
    assert response.anomalies, "expected the 9k payment to register as an anomaly"

    top = response.anomalies[0]
    assert abs(top.z_score) > 2.0
    assert top.confidence > 0
    # Narrative must read as prose, not as a dumped record.
    assert "standard deviations" in top.narrative
    assert "your typical" in top.narrative
    assert "₹" in top.narrative


def test_duplicate_transactions_are_not_reported_twice(service):
    rows = [txn(f"2025-0{m}-02", 300, category="FOOD") for m in range(1, 9)]
    rows += [txn("2025-04-09", 12000, "BIG DRAWN", category="FOOD")] * 3
    response = service.generate(
        InsightRequest(features=feature_vector(), statement_months=8, transactions=rows)
    )
    keys = [(a.transaction_date, a.narration, a.amount) for a in response.anomalies]
    assert len(keys) == len(set(keys))


def test_anomalies_are_capped_and_sorted(service):
    rows = [txn(f"2025-0{m}-02", 250, category="FOOD") for m in range(1, 9)]
    rows += [txn(f"2025-0{m}-20", 9000 + m * 3000, "SPIKE", category="FOOD") for m in range(1, 9)]
    response = service.generate(
        InsightRequest(features=feature_vector(), statement_months=8, transactions=rows)
    )
    assert len(response.anomalies) <= ANOMALY_MAX_ITEMS
    magnitudes = [abs(a.z_score) for a in response.anomalies]
    assert magnitudes == sorted(magnitudes, reverse=True)


def test_categories_with_too_few_samples_are_ignored(service):
    response = service.generate(
        InsightRequest(
            features=feature_vector(),
            statement_months=8,
            transactions=[txn("2025-01-02", 500, category="FOOD"), txn("2025-02-02", 99000, category="FOOD")],
        )
    )
    assert response.anomalies == []


def test_credit_rows_are_never_anomalies(service):
    rows = [txn("2025-01-02", 500, "SALARY", "CREDIT", "SALARY", "ACH") for _ in range(6)]
    rows.append(txn("2025-03-02", 900000, "WINDFALL", "CREDIT", "SALARY", "ACH"))
    response = service.generate(
        InsightRequest(features=feature_vector(), statement_months=8, transactions=rows)
    )
    assert response.anomalies == []


@pytest.mark.parametrize(
    "raw,expected_prefix",
    [
        ("UPI/504723/SWIGGY FOOD BANGALORE", "SWIGGY FOOD"),
        ("ACH CR - INFOSYS LTD", "INFOSYS LTD"),
        ("   ", "TRANSACTION"),
    ],
)
def test_clean_merchant(raw, expected_prefix):
    assert _clean_merchant(raw).startswith(expected_prefix)


# ---------------------------------------------------------------------------
# simulation paths
# ---------------------------------------------------------------------------
def test_four_improvement_paths_are_returned(service):
    response = service.generate(InsightRequest(features=feature_vector(), statement_months=12))
    assert [p.path_id for p in response.simulation_paths] == [
        "emergency_fund", "frugal_transition", "investment_ramp", "debt_free"
    ]
    for path in response.simulation_paths:
        assert path.required_changes, "every path needs concrete steps"
        assert len(path.projected_features) == 16


def test_spendy_profile_gains_from_the_frugal_path(service):
    response = service.generate(
        InsightRequest(
            features=feature_vector(discretionary_ratio=0.5, net_savings_ratio=0.08, monthly_burn_rate=0.92),
            statement_months=12,
            total_credits=1200000,
            total_debits=1104000,
        )
    )
    frugal = next(p for p in response.simulation_paths if p.path_id == "frugal_transition")
    assert frugal.projected_health_delta > 0
    assert frugal.projected_runway_delta > 0
    assert frugal.projected_features["discretionary_ratio"] == pytest.approx(0.20, abs=1e-4)


def test_paths_never_increase_discretionary_spend(service):
    features = feature_vector(discretionary_ratio=0.09, net_savings_ratio=-0.3)
    response = service.generate(InsightRequest(features=features, statement_months=12))
    for path in response.simulation_paths:
        assert path.projected_features["discretionary_ratio"] <= features["discretionary_ratio"] + 1e-9


def test_paths_preserve_the_savings_burn_identity(service):
    """
    net_savings_ratio and monthly_burn_rate are exact complements in the extractor, so a path that
    moves savings has to move burn with it — otherwise the projected vector leaves the manifold the
    models were trained on and the health delta becomes meaningless.
    """
    base = feature_vector(discretionary_ratio=0.5)
    response = service.generate(InsightRequest(features=base, statement_months=12))
    moved = False
    for path in response.simulation_paths:
        projected = path.projected_features
        if projected["net_savings_ratio"] != base["net_savings_ratio"]:
            moved = True
            assert projected["monthly_burn_rate"] == pytest.approx(
                max(0.05, 1.0 - projected["net_savings_ratio"]), abs=1e-3
            )
    assert moved, "expected at least one path to change the savings ratio"


def test_baseline_scores_are_reported(service):
    response = service.generate(InsightRequest(features=feature_vector(), statement_months=12))
    from app.services.ml_service import ml_service  # noqa: PLC0415

    archetype, diagnostics = ml_service.evaluate_lifestyle_diagnostics(feature_vector())
    for path in response.simulation_paths:
        assert path.baseline_health_score == diagnostics.financial_health_score
        assert path.baseline_runway_months == diagnostics.cash_runway_months


# ---------------------------------------------------------------------------
# persona benchmark + critique
# ---------------------------------------------------------------------------
def test_persona_comparison_axes_and_benchmarks(service):
    response = service.generate(
        InsightRequest(features=feature_vector(fixed_obligation_ratio=0.33, upi_velocity_index=0.6), statement_months=12)
    )
    comparison = response.persona_comparison
    assert list(comparison.user_scores.keys()) == COMPARISON_AXES
    assert set(comparison.benchmark_scores.keys()) == {info["name"] for info in ARCHETYPE_PROTOTYPES.values()}
    assert comparison.user_scores["Essentials"] == pytest.approx(33.0)
    assert comparison.user_scores["Digital Velocity"] == pytest.approx(60.0)


@pytest.mark.parametrize("archetype_id", [0, 1, 2, 3])
def test_each_archetype_gets_its_own_critique(service, archetype_id):
    response = service.generate(
        InsightRequest(features=feature_vector(), archetype_id=archetype_id, statement_months=12)
    )
    assert response.user_archetype == ARCHETYPE_PROTOTYPES[archetype_id]["name"]
    assert response.persona_critique == ARCHETYPE_PROTOTYPES[archetype_id]["critique"]
    assert response.archetype_id == archetype_id


def test_archetype_is_derived_from_features_when_absent(service):
    high_burn = service.generate(
        InsightRequest(
            features=feature_vector(
                discretionary_ratio=0.5, net_savings_ratio=0.02, monthly_burn_rate=0.98,
                investment_ratio=0.01, micro_spend_density=0.3, upi_velocity_index=0.8
            ),
            statement_months=12,
        )
    )
    assert high_burn.archetype_id == 2
    assert high_burn.user_archetype == "High-Burn Consumer"


def test_unknown_archetype_id_falls_back_instead_of_crashing(service):
    response = service.generate(InsightRequest(features=feature_vector(), statement_months=12))
    assert response.archetype_id in ARCHETYPE_PROTOTYPES


# ---------------------------------------------------------------------------
# transport layer
# ---------------------------------------------------------------------------
def test_post_insights_endpoint(client):
    payload = {
        "features": feature_vector(discretionary_ratio=0.48, net_savings_ratio=0.05),
        "statement_months": 12,
        "total_credits": 1200000,
        "total_debits": 1140000,
        "archetype_id": 2,
    }
    response = client.post("/api/insights", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["user_archetype"] == "High-Burn Consumer"
    assert body["insights"]
    assert body["simulation_paths"]
    assert body["tracked_savings_potential"] > 0


def test_post_insights_rejects_empty_features(client):
    assert client.post("/api/insights", json={"features": {}}).status_code == 422


def test_get_insights_for_each_sample_profile(client):
    for profile_id in ["student_entry", "balanced_pro", "wealth_builder", "lifestyle_spender", "real_agami_account"]:
        response = client.get(f"/api/insights/{profile_id}")
        assert response.status_code == 200, profile_id
        body = response.json()
        assert body["persona_critique"]
        assert body["persona_comparison"]["user_scores"]
        assert body["monthly_income"] > 0
        assert body["monthly_spend"] > 0


def test_get_insights_unknown_profile(client):
    assert client.get("/api/insights/not_a_profile").status_code == 404


def test_upload_response_carries_transactions_and_insights(client):
    csv = (
        "date,narration,amount,type,payment_mode,category\n"
        "2025-01-01,ACH CR INFOSYS SALARY,120000,CREDIT,ACH,SALARY\n"
        "2025-01-04,UPI SWIGGY ORDER,420,DEBIT,UPI,FOOD\n"
        "2025-02-01,ACH CR INFOSYS SALARY,120000,CREDIT,ACH,SALARY\n"
        "2025-02-04,UPI SWIGGY ORDER,510,DEBIT,UPI,FOOD\n"
    )
    response = client.post(
        "/api/upload-statement",
        files={"file": ("demo.csv", csv.encode("utf-8"), "text/csv")},
        data={"entity_type": "salaried_individual"},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["transactions"]) == 4
    assert body["transactions"][0]["date"] == "2025-02-04"
    assert body["category_breakdown"]
    assert body["statement_summary"]["category_breakdown"] == body["category_breakdown"]
    assert {row["month"] for row in body["monthly_category_breakdown"]} == {"2025-01", "2025-02"}
    assert body["insights"]["persona_comparison"]["benchmark_scores"]


def test_predict_features_response_carries_insights(client):
    response = client.post(
        "/api/predict-features",
        json=feature_vector(discretionary_ratio=0.5, net_savings_ratio=0.02),
    )
    assert response.status_code == 200
    insights = response.json()["insights"]
    assert insights["simulation_paths"]
    # With no statement supplied, the engine still derives a monthly scale from the log magnitudes.
    assert insights["monthly_income"] > 0
