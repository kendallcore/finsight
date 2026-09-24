# Machine Learning Technical Specification

This document details the mathematical formulations, 16-dimensional feature engineering vector space, algorithm benchmarks, loss functions, and evaluation metrics for **FinSight**.

---

## 1. 16-Dimensional High-Fidelity Feature Vector Space

Let a user's transaction history over an observation window be a discrete sequence of $N$ transactions:
$$\mathcal{T} = \{(t_i, a_i, c_i, d_i, m_i)\}_{i=1}^N$$

where:
- $t_i$ is the transaction timestamp
- $a_i \in \mathbb{R}^+$ is the monetary amount in INR
- $c_i \in \{\text{Credit}, \text{Debit}\}$ represents cashflow direction
- $d_i$ is the categorized transaction tag (e.g., Salary, Rent, EMI, Dining, Grocery, Utilities, SIP, Stocks)
- $m_i \in \{\text{UPI}, \text{NEFT}, \text{IMPS}, \text{ACH}, \text{Card}, \text{ATM}\}$ is the banking channel

FinSight projects $\mathcal{T}$ into a normalized **16-dimensional feature vector** $\mathbf{x} \in \mathbb{R}^{16}$ structured across four functional quadrants:

### Quadrant 1: Cashflow Scale & Magnitude (Log-Normalized)
| Symbol | Feature Name | Mathematical Formulation | Domain Purpose |
| :--- | :--- | :--- | :--- |
| $x_1$ | `log_annual_credit` | $\ln(1 + \sum_{i : c_i = \text{Credit}} a_i)$ | Compresses Pareto right-tail variance in annual gross inflows |
| $x_2$ | `log_annual_debit` | $\ln(1 + \sum_{i : c_i = \text{Debit}} a_i)$ | Normalizes heavy expenditure magnitude |
| $x_3$ | `net_savings_ratio` | $\frac{\text{Credit}_{\text{sum}} - \text{Debit}_{\text{sum}}}{\text{Credit}_{\text{sum}} + \epsilon}$ | Quantifies preserved liquidity fraction ($\text{ratio} \in [-1, 1]$) |
| $x_4$ | `monthly_burn_rate` | $\frac{\text{Debit}_{\text{sum}}}{\text{Credit}_{\text{sum}} + \epsilon}$ | Cashflow depletion velocity relative to incoming liquidity |

### Quadrant 2: Inflow Stability & Regularity Dynamics
| Symbol | Feature Name | Mathematical Formulation | Domain Purpose |
| :--- | :--- | :--- | :--- |
| $x_5$ | `salary_inflow_ratio` | $\frac{\sum_{i : d_i = \text{Salary}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Separates predictable corporate salaried income from gig/business deposits |
| $x_6$ | `monthly_credit_cv` | $\frac{\sigma(\{\text{Credit}_m\}_{m=1}^{M})}{\mu(\{\text{Credit}_m\}_{m=1}^{M}) + \epsilon}$ | Coefficient of Variation across monthly inflows; measures cashflow volatility |
| $x_7$ | `salary_regularity_score`| $\frac{\sum_{m=1}^{M} \mathbb{I}(\text{Salary Credit in Month } m)}{M}$ | Temporal consistency of recurring payroll credits |
| $x_8$ | `bonus_lump_sum_ratio` | $\frac{\sum_{i : c_i = \text{Credit} \land a_i \ge 2\mu_{\text{credit}}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Captures irregular windfalls, annual performance bonuses, or dividends |

### Quadrant 3: Outflow Allocation Ratios
| Symbol | Feature Name | Mathematical Formulation | Domain Purpose |
| :--- | :--- | :--- | :--- |
| $x_9$ | `investment_ratio` | $\frac{\sum_{i : d_i \in \{\text{SIP, Mutual Fund, Equity, Gold}\}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Quantifies wealth accumulation commitment |
| $x_{10}$ | `fixed_obligation_ratio`| $\frac{\sum_{i : d_i \in \{\text{Rent, EMI, Utilities, Insurance}\}} a_i}{\text{Debit}_{\text{sum}} + \epsilon}$ | Evaluates non-negotiable living overhead (Engel's law baseline) |
| $x_{11}$ | `discretionary_ratio` | $\frac{\sum_{i : d_i \in \{\text{Dining, Shopping, Travel, Entertainment}\}} a_i}{\text{Debit}_{\text{sum}} + \epsilon}$ | Quantifies lifestyle spending elasticity and impulse potential |
| $x_{12}$ | `tax_shield_ratio` | $\frac{\sum_{i : d_i \in \{\text{PPF, NPS, ELSS, Insurance}\}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Tracks disciplined allocation into long-term defensive reserves |

### Quadrant 4: Digital Velocity & Micro-Spending
| Symbol | Feature Name | Mathematical Formulation | Domain Purpose |
| :--- | :--- | :--- | :--- |
| $x_{13}$ | `upi_velocity_index` | $\frac{\sum_{i : m_i = \text{UPI}} 1}{N_{\text{total}}}$ | Frequency share of instant digital micropayments |
| $x_{14}$ | `micro_spend_density` | $\frac{\sum_{i : a_i < 500 \land m_i = \text{UPI}} a_i}{\text{Debit}_{\text{sum}} + \epsilon}$ | Measures silent budget depletion from sub-₹500 micro-transactions |
| $x_{15}$ | `log_avg_ticket_size`| $\ln(1 + \frac{1}{N_{\text{total}}} \sum_{i=1}^N a_i)$ | Typical order-of-magnitude transaction size |
| $x_{16}$ | `capital_gains_flux` | $\frac{\sum_{i : d_i = \text{Redemption}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Inflow derived from portfolio liquidations or capital redeployment |

---

## 2. Preprocessing & Feature Transformation Pipeline

To stabilize gradient convergence and eliminate feature scale disparities across disparate units (ratios vs. logarithmic sums):
1. **Logarithmic Dampening**: Heavy-tailed positive variables ($x_1, x_2, x_{15}$) undergo monotonic dampening:
   $$x' = \ln(1 + x)$$
2. **StandardScaler Normalization**: All dimensions are standardized to zero mean and unit variance:
   $$\tilde{\mathbf{x}} = \frac{\mathbf{x} - \boldsymbol{\mu}}{\boldsymbol{\sigma}}$$
   where $\boldsymbol{\mu} \in \mathbb{R}^{16}$ and $\boldsymbol{\sigma} \in \mathbb{R}^{16}$ are precomputed on the training corpus and serialized in `scaler.joblib`.

---

## 3. Supervised Learning Tasks

### Task 1: Lifestyle Spending Archetype Classification (Multi-Class)
- **Target Variable**: $y_{\text{archetype}} \in \{0, 1, 2, 3\}$:
  - `Class 0 — Frugal Minimalist`: High savings ratio ($>35\%$), low discretionary spend ($<15\%$), emergency runway $>12$ months.
  - `Class 1 — Experiential Spender`: High discretionary and lifestyle outlay ($30\% - 45\%$), high UPI velocity, moderate savings.
  - `Class 2 — High-Burn Consumer`: Monthly burn rate $>80\%$, emergency runway $<2$ months, elevated micro-spend density.
  - `Class 3 — Strategic Wealth Builder`: Systematic investment allocation ($>25\%$), controlled overhead, runway $>8$ months.
- **Candidate Models & Benchmark Leaderboard**:
  | Algorithm | Accuracy | Macro F1 | Weighted F1 | Latency (p50) |
  | :--- | :---: | :---: | :---: | :---: |
  | **Gradient Boosting Classifier (Winner)** | **98.40%** | **0.9820** | **0.9841** | **< 3 ms** |
  | Random Forest Classifier | 97.80% | 0.9760 | 0.9782 | < 2 ms |
  | Support Vector Classifier (RBF Kernel) | 95.60% | 0.9510 | 0.9555 | < 4 ms |
  | Logistic Regression (Baseline) | 94.20% | 0.9380 | 0.9415 | < 1 ms |
- **Loss Function**: Multi-class multinomial deviance loss:
  $$\mathcal{L}_{\text{deviance}} = -\sum_{i=1}^M \sum_{k=0}^3 y_{i,k} \ln p_{i,k}(\tilde{\mathbf{x}})$$

### Task 2: Cashflow Turnover Estimation (Continuous Regression)
- **Target Variable**: Continuous annual cashflow turnover $y_{\text{turnover}} \in \mathbb{R}^+$ in INR.
- **Candidate Models & Benchmark Leaderboard**:
  | Algorithm | $R^2$ Score | Test RMSE | MAPE | Latency (p50) |
  | :--- | :---: | :---: | :---: | :---: |
  | **Random Forest Regressor (Winner)** | **0.9977** | **₹34,815** | **1.30%** | **< 2 ms** |
  | Gradient Boosting Regressor | 0.9969 | ₹40,841 | 1.44% | < 3 ms |
  | Ridge Regression (Baseline) | 0.5116 | ₹99,23,544 | 97.20% | < 1 ms |

---

## 4. Unsupervised Cohort Discovery & Manifold Projection

### Task 3: Unsupervised Cohort Discovery ($k$-Means)
- **Objective**: Discover natural clustering boundaries within the 16-dimensional behavioral manifold without supervisory labels.
- **Formulation**: Minimized Within-Cluster Sum of Squares (WCSS):
  $$\arg\min_{\mathbf{S}} \sum_{j=1}^k \sum_{\tilde{\mathbf{x}} \in S_j} \|\tilde{\mathbf{x}} - \boldsymbol{\mu}_j\|_2^2$$
- **Validation**:
  - Evaluated across $k \in [2, 8]$.
  - Optimal cluster separation confirmed at $k=4$ with a **Silhouette Coefficient of 0.3285**, mirroring the 4 supervised lifestyle archetypes.

### Task 4: 3D PCA Latent Space Projection
- **Objective**: Dimensionality reduction from $\mathbb{R}^{16} \to \mathbb{R}^3$ for real-time WebGL scatter space rendering.
- **Singular Value Decomposition (SVD)**:
  $$\mathbf{X} = \mathbf{U} \mathbf{\Sigma} \mathbf{V}^T$$
- **Cumulative Explained Variance Ratio**:
  $$\sum_{j=1}^3 \frac{\lambda_j}{\sum_{k=1}^{16} \lambda_k} = 79.22\%$$
  confirming that 3 principal components retain the dominant topological structure of the 16D financial space.

---

## 5. Deterministic Diagnostics & Counterfactual Simulator

### Dynamic Z-Score Outlier Detection
To detect abnormal category spikes without arbitrary absolute thresholds:
$$Z_{\text{cat}} = \frac{x_{\text{cat}} - \mu_{\text{cat}}}{\sigma_{\text{cat}} + \epsilon}$$
A spending anomaly is triggered when $Z_{\text{cat}} \ge 2.0$, damped by the historical statement duration (number of active calendar months).

### Counterfactual Sandbox Identity Preservation
During interactive 16-slider exploration in the What-If Simulator, slider updates strictly preserve identity constraints across interconnected features:
$$\text{net\_savings\_ratio} + \text{monthly\_burn\_rate} = 1.0$$
$$\sum (\text{investment\_ratio} + \text{fixed\_obligation\_ratio} + \text{discretionary\_ratio}) \le 1.0$$
This prevents out-of-manifold synthetic vectors from distorting model inference.
