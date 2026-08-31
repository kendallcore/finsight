# Machine Learning Technical Specification

This document details the mathematical formulations, advanced feature engineering vector space, algorithm selections, loss functions, and evaluation metrics for **FinSight**.

---

## 1. Improvised Feature Engineering & High-Dimensional Vector Space

Let a user's 12-month transaction log be a sequence of $N$ transactions:
$$\mathcal{T} = \{(t_i, a_i, c_i, d_i, m_i)\}_{i=1}^N$$
where $t_i$ is timestamp, $a_i \in \mathbb{R}^+$ is transaction amount in ₹, $c_i \in \{\text{Credit}, \text{Debit}\}$, $d_i$ is categorical transaction type (e.g. Salary, Rent, UPI\_Food, SIP, Stocks, NPS, Utilities), and $m_i \in \{\text{UPI}, \text{NEFT}, \text{IMPS}, \text{ACH}, \text{POS}\}$ is the banking channel.

To maximize machine learning model accuracy and capture non-linearities and distribution skewness in financial behavior, FinSight maps $\mathcal{T}$ into a **16-dimensional high-fidelity feature vector** $\mathbf{x} \in \mathbb{R}^{16}$:

### A. Cashflow Scale & Magnitude Features (Log-Normalized)
| Symbol | Feature Name | Mathematical Definition | Rationale |
| :--- | :--- | :--- | :--- |
| $x_1$ | `log_annual_credit` | $\ln(1 + \sum_{i : c_i = \text{Credit}} a_i)$ | Compresses Pareto right-tail in high salaries |
| $x_2$ | `log_annual_debit` | $\ln(1 + \sum_{i : c_i = \text{Debit}} a_i)$ | Normalizes heavy expenditure variances |
| $x_3$ | `net_savings_ratio` | $\frac{\text{Credit}_{\text{sum}} - \text{Debit}_{\text{sum}}}{\text{Credit}_{\text{sum}} + \epsilon}$ | Preserved liquidity fraction |
| $x_4$ | `monthly_burn_rate` | $\frac{\text{Debit}_{\text{sum}}}{\text{Credit}_{\text{sum}} + \epsilon}$ | Cashflow depletion velocity |

### B. Income Regularity & Stability Dynamics
| Symbol | Feature Name | Mathematical Definition | Rationale |
| :--- | :--- | :--- | :--- |
| $x_5$ | `salary_inflow_ratio` | $\frac{\sum_{i : d_i = \text{Salary}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Distinguishes regular salaried from gig/business |
| $x_6$ | `monthly_credit_cv` | $\frac{\sigma(\{\text{Credit}_m\}_{m=1}^{12})}{\mu(\{\text{Credit}_m\}_{m=1}^{12}) + \epsilon}$ | Coefficient of Variation in monthly inflows |
| $x_7$ | `salary_regularity_score`| $\frac{\sum_{m=1}^{12} \mathbb{I}(\text{Salary Credit in Month } m)}{12}$ | Consistency of monthly payroll credits |
| $x_8$ | `bonus_lump_sum_ratio` | $\frac{\sum_{i : c_i = \text{Credit} \land a_i \ge 2\mu_{\text{credit}}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Captures annual corporate bonuses & stock vesting |

### C. Outflow Allocation & Tax-Shield Proxies
| Symbol | Feature Name | Mathematical Definition | Rationale |
| :--- | :--- | :--- | :--- |
| $x_9$ | `investment_ratio` | $\frac{\sum_{i : d_i \in \{\text{SIP, MF, Stocks, Gold}\}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Wealth building commitment |
| $x_{10}$ | `fixed_obligation_ratio`| $\frac{\sum_{i : d_i \in \{\text{Rent, EMI, Utilities}\}} a_i}{\text{Debit}_{\text{sum}} + \epsilon}$ | Engel's law: essential living commitments |
| $x_{11}$ | `discretionary_ratio` | $\frac{\sum_{i : d_i \in \{\text{Dining, Shopping, Travel}\}} a_i}{\text{Debit}_{\text{sum}} + \epsilon}$ | Lifestyle spend elasticity |
| $x_{12}$ | `tax_shield_ratio` | $\frac{\sum_{i : d_i \in \{\text{PPF, NPS, Insurance}\}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Tax-advantaged deduction allocation |

### D. Digital Velocity & Micro-Transaction Density
| Symbol | Feature Name | Mathematical Definition | Rationale |
| :--- | :--- | :--- | :--- |
| $x_{13}$ | `upi_velocity_index` | $\frac{\sum_{i : m_i = \text{UPI}} 1}{N_{\text{total}}}$ | Proportion of transactions via instant UPI |
| $x_{14}$ | `micro_spend_density` | $\frac{\sum_{i : a_i < 500 \land m_i = \text{UPI}} a_i}{\text{Debit}_{\text{sum}} + \epsilon}$ | Daily micro-expense drain index |
| $x_{15}$ | `log_avg_ticket_size`| $\ln(1 + \frac{1}{N_{\text{total}}} \sum_{i=1}^N a_i)$ | User's typical transaction magnitude scale |
| $x_{16}$ | `capital_gains_flux` | $\frac{\sum_{i : d_i = \text{Redemption}} a_i}{\text{Credit}_{\text{sum}} + \epsilon}$ | Inflows derived from asset liquidations |

---

## 2. Advanced Preprocessing Pipeline

To eliminate feature scale bias and stabilize gradient-based learners:
1. **Power Transformation**: Applies Yeo-Johnson transformation $\psi(\lambda, x)$ to non-negative skewed features ($x_6, x_8, x_{14}, x_{16}$).
2. **Robust Standardization**: Fits `StandardScaler` on the transformed feature space:
   $$\tilde{\mathbf{x}} = \frac{\mathbf{x} - \boldsymbol{\mu}}{\boldsymbol{\sigma}}$$

---

## 3. Machine Learning Tasks

### Task 1: Annual Income Estimation (Supervised Regression)
- **Target Variable**: Continuous Annual Gross Income in ₹ ($y_{\text{income}} \in \mathbb{R}^+$).
- **Candidate Models**:
  1. **Baseline**: Ridge & Lasso Regularized Linear Models.
  2. **Random Forest Regressor**: 100 estimators, max_depth=12.
  3. **Gradient Boosting Regressor (GBR)**: Learning rate $\eta = 0.05$, subsample = 0.85.
  4. **Stacking Regressor**: Meta-learner blending Ridge, Random Forest, and GBR.
- **Evaluation Metrics**:
  - **$R^2$ Score**: Target $> 0.96$
  - **Root Mean Squared Error (RMSE)**: Target $< ₹35,000$
  - **Mean Absolute Error (MAE)**: Target $< ₹22,000$
  - **Mean Absolute Percentage Error (MAPE)**: Target $< 2.5\%$

---

### Task 2: Indian Tax Slab Classification (Multi-Class Classification)
- **Target Variable**: Categorical Tax Slab Class $y_{\text{slab}} \in \{0, 1, 2, 3, 4, 5, 6\}$ corresponding to the official FY 2025–26 Section 115BAC structure:
  - `Class 0`: Up to ₹4,00,000 (0%)
  - `Class 1`: ₹4,00,001 – ₹8,00,000 (5%)
  - `Class 2`: ₹8,00,001 – ₹12,00,000 (10%)
  - `Class 3`: ₹12,00,001 – ₹16,00,000 (15%)
  - `Class 4`: ₹16,00,001 – ₹20,00,000 (20%)
  - `Class 5`: ₹20,00,001 – ₹24,00,000 (25%)
  - `Class 6`: Above ₹24,00,000 (30%)
- **Candidate Models**:
  1. **Multinomial Logistic Regression** with $L_2$ penalty:
     $$P(y = k \mid \tilde{\mathbf{x}}) = \frac{e^{\mathbf{w}_k^T \tilde{\mathbf{x}}}}{\sum_{j=0}^6 e^{\mathbf{w}_j^T \tilde{\mathbf{x}}}}$$
  2. **Random Forest Classifier**: Gini impurity, 150 trees.
  3. **Support Vector Classifier (SVC)**: RBF kernel with Platt scaling for well-calibrated class probabilities.
  4. **Gradient Boosting Classifier (GBC)**: Multi-class deviance loss.
- **Evaluation Metrics**:
  - **Overall Accuracy**: Target $> 95\%$
  - **Macro F1-Score**: Target $> 0.94$
  - **$7 \times 7$ Confusion Matrix Heatmap**

---

### Task 3: Spending Persona Discovery (Unsupervised Clustering)
- **Objective**: Unsupervised segmentation of taxpayers into actionable behavioral archetypes.
- **Algorithm**: $k$-Means Clustering ($k=4$) with Euclidean distance metric:
  $$\arg\min_{\mathbf{S}} \sum_{j=1}^k \sum_{\tilde{\mathbf{x}} \in S_j} \|\tilde{\mathbf{x}} - \boldsymbol{\mu}_j\|^2$$
- **Optimal $k$ Validation**:
  - Elbow curve (WCSS) & Silhouette Coefficient ($s > 0.48$).
- **Discovered Personas**:
  1. *Cluster 0: The High-Growth Wealth Builder* (High investment ratio $>25\%$, disciplined living costs).
  2. *Cluster 1: The Balanced Corporate Professional* (High salary stability, predictable fixed rent/EMI).
  3. *Cluster 2: The Discretionary Lifestyle Spender* (High dining/travel ratio $>35\%$, low savings rate).
  4. *Cluster 3: The Entry-Level / Student Saver* (Low total volume, high micro-UPI density, low fixed costs).

---

### Task 4: High-Dimensional Latent Space Projection (PCA)
- **Objective**: Dimensionality reduction from 16D feature space to 2D and 3D coordinates for interactive Plotly visualization.
- **Formulation**: Eigen-decomposition of the empirical covariance matrix:
  $$\mathbf{\Sigma} \mathbf{v}_j = \lambda_j \mathbf{v}_j, \quad j \in \{1, 2, 3\}$$
- **Explained Variance Ratio**:
  $$\text{EVR} = \frac{\sum_{j=1}^3 \lambda_j}{\sum_{k=1}^{16} \lambda_k} > 82\%$$

