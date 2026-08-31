# Synthetic Financial Dataset Schema & Generation Protocol

Because real banking transaction histories contain sensitive Personally Identifiable Information (PII) protected by privacy regulations, FinSight generates a realistic, statistically grounded synthetic dataset of 5,000 Indian banking profiles.

---

## 1. Raw Transaction Record Schema (`synthetic_transactions.csv`)

| Column Name | Data Type | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `transaction_id` | String (UUID) | `"TXN_98471A2B"` | Unique identifier for each transaction |
| `user_id` | Integer | `1042` | Foreign key referencing user profile |
| `date` | Date (YYYY-MM-DD) | `"2025-06-15"` | Timestamp of the transaction over 12 months |
| `amount` | Float | `4250.00` | Transaction magnitude in Indian Rupees (₹) |
| `type` | Categorical | `"CREDIT"` or `"DEBIT"` | Direction of fund movement |
| `category` | Categorical | `"SALARY"`, `"FOOD"`, `"INVESTMENT"`, `"NPS"`, `"REDEMPTION"` | Domain category |
| `narration` | String | `"UPI - SWIGGY BANGALORE"` | Realistic Indian bank description string |
| `payment_mode` | Categorical | `"UPI"`, `"NEFT"`, `"IMPS"`, `"ACH"` | Underlying banking rail |

---

## 2. Engineered User Feature Vector Schema (`user_profiles.csv`)

The raw transaction records are aggregated per `user_id` to form the training feature matrix $X \in \mathbb{R}^{5000 \times 16}$:

| Column Name | Type | Range / Distribution | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | Integer | `1` to `5000` | Primary profile identifier |
| `log_annual_credit` | Float | `11.8` to `15.8` | Log-transformed total annual inflow |
| `log_annual_debit` | Float | `11.2` to `15.4` | Log-transformed total annual outflow |
| `net_savings_ratio` | Float | `-0.15` to `0.70` | Saved fraction of total inflows |
| `monthly_burn_rate` | Float | `0.30` to `1.15` | Outflow-to-inflow ratio |
| `salary_inflow_ratio` | Float | `0.00` to `0.98` | Fraction of credits from regular payroll |
| `monthly_credit_cv` | Float | `0.02` to `1.85` | Inflow volatility (Std / Mean) |
| `salary_regularity_score`| Float | `0.00` to `1.00` | Fraction of months with payroll deposits |
| `bonus_lump_sum_ratio` | Float | `0.00` to `0.45` | Outsized bonus / equity vesting credits |
| `investment_ratio` | Float | `0.00` to `0.50` | Outflows directed to Mutual Funds/SIPs |
| `fixed_obligation_ratio`| Float | `0.05` to `0.60` | Outflows spent on rent and loan EMIs |
| `discretionary_ratio` | Float | `0.05` to `0.55` | Outflows spent on dining, shopping, travel |
| `tax_shield_ratio` | Float | `0.00` to `0.20` | Outflows directed to NPS (14%), PPF, Health |
| `upi_velocity_index` | Float | `0.10` to `0.95` | Fraction of transactions on UPI rails |
| `micro_spend_density` | Float | `0.01` to `0.40` | Fraction of debits under ₹500 |
| `log_avg_ticket_size` | Float | `4.5` to `10.2` | Log mean transaction magnitude |
| `capital_gains_flux` | Float | `0.00` to `0.35` | Inflows from equity redemptions / dividends |
| **`true_annual_income`** | Float | ₹2,40,000 to ₹45,00,000 | **Target 1: Regression Ground Truth (₹)** |
| **`tax_slab_class`** | Integer | `0` to `6` | **Target 2: Classification Ground Truth (FY25-26)** |
| **`behavior_cluster`** | Integer | `0` to `3` | **Target 3: Cluster Ground Truth** |

---

## 3. Statistical Generation Logic

To ensure realistic correlations matching Indian demographics and FY 2025–26 tax structures:
1. **Salary Archetypes**:
   - *Entry/Student*: Log-normal distribution centered at ₹3.5 Lakhs.
   - *Junior-to-Mid Professional*: Normal distribution centered at ₹7.5 Lakhs ($\sigma = 1.5\text{L}$).
   - *Mid-Level Engineer / Specialist*: Normal distribution centered at ₹14.0 Lakhs ($\sigma = 2.5\text{L}$).
   - *Senior Lead / Tech Manager*: Log-normal distribution centered at ₹22.0 Lakhs.
   - *Executive / High Net-Worth*: Pareto distribution with scale ₹28.0 Lakhs up to ₹45.0 Lakhs.
2. **Expense & Tax Shield Modeling**:
   - Fixed expenses (Rent + EMIs) follow Engel's Law (sub-linear scaling with total income).
   - NPS contributions generated up to 14% of salary for formal corporate profiles.
   - Micro-UPI velocity inversely correlates with income bracket and age.
   - Discretionary lifestyle spending dynamically shifts based on persona cluster.
3. **Target Label Assignment**:
   - `tax_slab_class` calculated using official FY 2025–26 Section 115BAC slabs after ₹75,000 standard deduction.

