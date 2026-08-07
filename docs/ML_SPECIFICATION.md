# Machine Learning Technical Specification

This document details the mathematical formulations, feature definitions, algorithm selections, loss functions, and evaluation metrics for **FinSight**.

---

## 1. Feature Engineering & Vector Space

Let a user's 12-month transaction log be a sequence of transactions:
$$\mathcal{T} = \{(t_i, a_i, c_i, d_i)\}_{i=1}^N$$
where $t_i$ is timestamp, $a_i \in \mathbb{R}^+$ is transaction amount in ₹, $c_i \in \{\text{Credit}, \text{Debit}\}$, and $d_i \in \{\text{Salary}, \text{Rent}, \text{UPI\_Food}, \text{SIP}, \dots\}$.

We map $\mathcal{T}$ to an 8-dimensional feature vector $\mathbf{x} \in \mathbb{R}^8$:

| Feature Symbol | Feature Name | Mathematical Definition |
| :--- | :--- | :--- |
| $x_1$ | `annual_credit_sum` | $\sum_{i : c_i = \text{Credit}} a_i$ |
| $x_2$ | `annual_debit_sum` | $\sum_{i : c_i = \text{Debit}} a_i$ |
| $x_3$ | `net_savings_rate` | $\frac{x_1 - x_2}{x_1 + \epsilon}$ |
| $x_4$ | `investment_ratio` | $\frac{\sum_{i : d_i \in \{\text{SIP, Stocks, PPF}\}} a_i}{x_1 + \epsilon}$ |
| $x_5$ | `discretionary_spend_ratio` | $\frac{\sum_{i : d_i \in \{\text{Dining, Shopping, Travel}\}} a_i}{x_2 + \epsilon}$ |
| $x_6$ | `fixed_obligation_ratio` | $\frac{\sum_{i : d_i \in \{\text{Rent, EMI, Utilities}\}} a_i}{x_2 + \epsilon}$ |
| $x_7$ | `monthly_inflow_volatility` | $\sigma(\{\text{Monthly Credit Sum}_m\}_{m=1}^{12})$ |
| $x_8$ | `micro_upi_frequency` | $\sum_{i : a_i < 500 \land d_i = \text{UPI}} 1$ |

Feature normalization is performed via standard scaling:
$$\tilde{\mathbf{x}} = \frac{\mathbf{x} - \boldsymbol{\mu}}{\boldsymbol{\sigma}}$$

---

## 2. Machine Learning Tasks

### Task 1: Annual Income Estimation (Supervised Regression)
- **Target Variable**: Continuous Annual Gross Income in ₹ ($y_{\text{income}} \in \mathbb{R}^+$).
- **Candidate Models**:
  1. **Baseline**: Ridge Regression with $L_2$ Regularization:
     $$\min_{\mathbf{w}} \frac{1}{2n} \sum_{i=1}^n (y_i - \mathbf{w}^T \tilde{\mathbf{x}}_i)^2 + \alpha \|\mathbf{w}\|_2^2$$
  2. **Ensemble 1**: Random Forest Regressor ($M=100$ trees, bootstrap aggregation).
  3. **Ensemble 2**: Gradient Boosting Regressor (residual minimization).
- **Evaluation Metrics**:
  - **Root Mean Squared Error (RMSE)**: $\sqrt{\frac{1}{n} \sum (y_i - \hat{y}_i)^2}$
  - **Mean Absolute Error (MAE)**: $\frac{1}{n} \sum |y_i - \hat{y}_i|$
  - **Coefficient of Determination ($R^2$)**: $1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$

---

### Task 2: Indian Tax Slab Prediction (Multi-Class Classification)
- **Target Variable**: Categorical Tax Slab Class $y_{\text{slab}} \in \{0, 1, 2, 3, 4, 5\}$ corresponding to the Indian New Tax Regime (Section 115BAC).
- **Candidate Models**:
  1. **Multinomial Logistic Regression**:
     $$P(y = k \mid \tilde{\mathbf{x}}) = \frac{e^{\mathbf{w}_k^T \tilde{\mathbf{x}}}}{\sum_{j=0}^5 e^{\mathbf{w}_j^T \tilde{\mathbf{x}}}}$$
  2. **Random Forest Classifier**: Non-linear decision boundaries with Gini Impurity.
  3. **Support Vector Classifier (SVC)**: Radial Basis Function (RBF) kernel:
     $$K(\mathbf{x}_i, \mathbf{x}_j) = \exp(-\gamma \|\mathbf{x}_i - \mathbf{x}_j\|^2)$$
- **Evaluation Metrics**:
  - **Overall Accuracy**: $\frac{\text{TP} + \text{TN}}{\text{Total}}$
  - **Macro F1-Score**: $\frac{1}{K} \sum_{k=0}^5 \frac{2 \cdot \text{Precision}_k \cdot \text{Recall}_k}{\text{Precision}_k + \text{Recall}_k}$
  - **$6 \times 6$ Confusion Matrix Heatmap**

---

### Task 3: Spending Persona Discovery (Unsupervised Clustering)
- **Objective**: Discover natural groupings of financial behavior without labels.
- **Algorithm**: $k$-Means Clustering with Euclidean distance metric:
  $$\arg\min_{\mathbf{S}} \sum_{j=1}^k \sum_{\tilde{\mathbf{x}} \in S_j} \|\tilde{\mathbf{x}} - \boldsymbol{\mu}_j\|^2$$
- **Optimal $k$ Selection**:
  - **Elbow Method**: Within-Cluster Sum of Squares (WCSS) plot over $k \in [2, 8]$.
  - **Silhouette Coefficient**: $s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$; target $s > 0.45$.
- **Discovered Personas**:
  1. *Cluster 0: The High-Growth Investor* (High investment ratio, moderate discretionary).
  2. *Cluster 1: The Balanced Professional* (Steady salary, balanced fixed vs savings).
  3. *Cluster 2: The Discretionary Lifestyle Spender* (High dining/travel, low savings rate).
  4. *Cluster 3: The Entry-Level / Student Saver* (Low volume, high micro-UPI frequency, low fixed costs).

---

### Task 4: High-Dimensional Projection (PCA)
- **Objective**: Project 8-dimensional feature space to 2D and 3D visual coordinates.
- **Formulation**: Find eigenvectors $\mathbf{v}_1, \mathbf{v}_2, \mathbf{v}_3$ corresponding to the largest eigenvalues of the empirical covariance matrix $\mathbf{\Sigma} = \frac{1}{n} \tilde{\mathbf{X}}^T \tilde{\mathbf{X}}$:
  $$\mathbf{\Sigma} \mathbf{v}_j = \lambda_j \mathbf{v}_j$$
- **Explained Variance Ratio**:
  $$\text{EVR}_j = \frac{\lambda_j}{\sum_{k=1}^8 \lambda_k}$$
  The top 3 principal components capture $> 80\%$ of total dataset variance, enabling rich 2D/3D Plotly scatter plots.
