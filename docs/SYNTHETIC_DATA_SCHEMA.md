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
| `category` | Categorical | `"SALARY"`, `"FOOD"`, `"INVESTMENT"` | Domain category |
| `narration` | String | `"UPI - SWIGGY BANGALORE"` | Realistic Indian bank description string |
| `payment_mode` | Categorical | `"UPI"`, `"NEFT"`, `"IMPS"`, `"ACH"` | Underlying banking rail |

---

## 2. Engineered User Feature Vector Schema (`user_profiles.csv`)

The raw transaction records are aggregated per `user_id` to form the training feature matrix $X \in \mathbb{R}^{5000 \times 8}$:

| Column Name | Type | Range / Distribution | Meaning in Indian Context |
| :--- | :--- | :--- | :--- |
| `user_id` | Integer | `1` to `5000` | Primary profile identifier |
| `annual_credit_sum` | Float | ₹1,80,000 to ₹45,00,000 | Total money deposited in the year |
| `annual_debit_sum` | Float | ₹1,20,000 to ₹38,00,000 | Total annual expenditure |
| `net_savings_rate` | Float | `-0.10` to `0.65` | Proportion of income preserved |
| `investment_ratio` | Float | `0.00` to `0.45` | Outflows directed to Mutual Funds/SIPs |
| `discretionary_ratio`| Float | `0.05` to `0.55` | Outflows spent on dining, shopping, travel |
| `rent_emi_ratio` | Float | `0.00` to `0.50` | Outflows spent on rent and loan EMIs |
| `monthly_credit_std`| Float | ₹2,000 to ₹1,50,000 | Volatility in monthly earnings |
| `upi_micro_count` | Integer | `20` to `800` | Number of sub-₹500 daily UPI transactions |
| **`true_annual_income`** | Float | ₹2,40,000 to ₹40,00,000 | **Target 1: Regression Ground Truth** |
| **`tax_slab_class`** | Integer | `0` to `5` | **Target 2: Classification Ground Truth** |
| **`behavior_cluster`** | Integer | `0` to `3` | **Target 3: Cluster Ground Truth** |

---

## 3. Statistical Generation Logic

To ensure realistic correlations:
1. **Salary Archetypes**:
   - *Entry/Student*: Log-normal distribution centered at ₹3.5 Lakhs.
   - *Mid-Level Engineer*: Normal distribution centered at ₹11.5 Lakhs ($\sigma = 2.0\text{L}$).
   - *Senior / Executive*: Log-normal distribution centered at ₹22.0 Lakhs.
2. **Expense Modeling**:
   - Fixed expenses (Rent + EMIs) follow Engel's Law (sub-linear scaling with total income).
   - Discretionary expenses scale proportionally with income volatility and persona.
   - Micro-UPI velocity is inversely correlated with age and strongly correlated with food/cab frequency.
3. **Controlled Stochastic Noise**:
   - $5\%$ random noise is injected into transaction amounts to mirror real-world unrecorded cash or irregular bonuses.
