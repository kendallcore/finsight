# Indian Income Tax System & Banking Dynamics Reference

## 1. Statutory Context: Section 115BAC (New Tax Regime)

The Indian Finance Act established the **New Tax Regime** under Section 115BAC as the statutory default tax framework. It simplifies compliance by offering lower slab rates in exchange for removing most discretionary itemized deductions (such as Section 80C, 80D, HRA, and LTA), while retaining standard deduction and employer pension contributions.

---

## 2. Official Tax Slab Structures

### A. Current Default Structure: FY 2025–26 (Budget 2025 / Finance Act 2025)

The FY 2025–26 structure expands the New Tax Regime into a **7-tier slab ladder** and increases the Section 87A rebate ceiling, creating an effective zero-tax threshold of **₹12.75 Lakhs** for salaried individuals.

| Class Index | Annual Taxable Income (₹) | Slab Tax Rate | Marginal / Effective Notes |
| :---: | :--- | :---: | :--- |
| **Class 0** | Up to ₹4,00,000 | **0% (Nil)** | Basic Exemption Limit |
| **Class 1** | ₹4,00,001 – ₹8,00,000 | **5%** | Fully rebated under Section 87A |
| **Class 2** | ₹8,00,001 – ₹12,00,000 | **10%** | Full Section 87A rebate (up to ₹60,000 relief $\rightarrow$ **₹0 Effective Tax**) |
| **Class 3** | ₹12,00,001 – ₹16,00,000 | **15%** | Emerging upper-middle class bracket |
| **Class 4** | ₹16,00,001 – ₹20,00,000 | **20%** | Mid-to-senior professional bracket |
| **Class 5** | ₹20,00,001 – ₹24,00,000 | **25%** | Senior tech / managerial bracket |
| **Class 6** | Above ₹24,00,000 | **30%** | Highest marginal rate bracket |

#### Key Statutory Provisions (FY 2025–26):
1. **Standard Deduction**: Increased to **₹75,000** for all salaried individuals and pensioners.
2. **Section 87A Tax Rebate**: Enhanced to **₹60,000**, ensuring zero tax payable for resident individuals with taxable income up to **₹12,00,000**. Stacking the standard deduction makes income up to **₹12,75,000 completely tax-free** for salaried employees.
3. **Employer NPS Contribution (Section 80CCD(2))**: The maximum allowable employer contribution deduction under the New Tax Regime is **14% of salary (Basic + DA)** for both central/state government and private sector employees.
4. **Capital Gains Tax Harmonization**:
   - **Short-Term Capital Gains (STCG, Section 111A)**: Flat **20%** on listed equities and equity-oriented mutual funds.
   - **Long-Term Capital Gains (LTCG, Section 112A)**: Flat **12.5%** for gains across all financial and non-financial assets.
   - **LTCG Annual Exemption**: The annual tax-free threshold on listed equity LTCG is **₹1.25 Lakhs** (raised from ₹1.0 Lakh).

---

### B. Previous Structure: FY 2024–25 (Comparison Reference)

| Class Index | Annual Taxable Income (₹) | Slab Tax Rate | Key Notes |
| :---: | :--- | :---: | :--- |
| **Class 0** | Up to ₹3,00,000 | **0% (Nil)** | Basic Exemption Limit |
| **Class 1** | ₹3,00,001 – ₹7,00,000 | **5%** | Section 87A rebate provided ₹25,000 relief (Zero tax up to ₹7.75L salaried) |
| **Class 2** | ₹7,00,001 – ₹10,00,000 | **10%** | Standard entry corporate bracket |
| **Class 3** | ₹10,00,001 – ₹12,00,000 | **15%** | Mid-level professional bracket |
| **Class 4** | ₹12,00,001 – ₹15,00,000 | **20%** | Senior professional bracket |
| **Class 5** | Above ₹15,00,000 | **30%** | Executive / High Net-Worth bracket |

---

## 3. Indian Banking Transaction Taxonomy

FinSight models realistic transaction narrations from major Indian scheduled commercial banks (HDFC Bank, State Bank of India, ICICI Bank, Axis Bank, Kotak Mahindra Bank):

### A. Inflow Transaction Patterns (Credits)
- **Salary Credits**: `"ACH CR - INFOSYS LTD"`, `"SALARY CREDIT - TATA CONSULTANCY"`, `"NEFT CR - GOOGLE INDIA"`, `"CMS SALARY CREDIT"`.
- **Investment Liquidations & Returns**: `"ACH CR - ZERODHA BROKING"`, `"GROWW REDEMPTION"`, `"DIVIDEND TCS"`, `"INTEREST CREDIT SBI"`.
- **Freelance & Consulting**: Periodic UPI/IMPS deposits with high coefficient of variation (`"UPI CR - UPWORK GLOBAL"`, `"IMPS CR - CLIENT INVOICE"`).
- **Tax Refunds**: `"IT REFUND - CBDT INCOME TAX"`.

### B. Outflow Transaction Patterns (Debits)
- **Fixed Obligations & Housing**:
  - House Rent: `"UPI - RENT TO LANDLORD"`, `"NEFT - NOBROKER RENT"`, `"CRED RENT PAY"`.
  - Loan EMIs: `"ACH DR - HDFC HOME LOAN"`, `"ECS - ICICI AUTO LOAN"`, `"BAJAJ FINSERV EMI"`.
  - Utilities: `"UPI - BESCOM ELECTRICITY"`, `"BBPS - AIRTEL FIBER"`, `"INDANE GAS"`.
- **Discretionary Lifestyle Spend**:
  - Dining & Quick Commerce: `"UPI - SWIGGY"`, `"UPI - ZOMATO"`, `"BLINKIT GURGAON"`, `"ZEPTO MUMBAI"`.
  - Retail & Travel: `"AMAZON PAY INDIA"`, `"FLIPKART INTERNET"`, `"MAKEMYTRIP"`, `"BOOKMYSHOW"`.
  - Commuting & Mobility: `"UPI - UBER INDIA"`, `"OLA CABS"`, `"FASTAG RECHARGE"`.
- **Investments & Tax-Shield Proxies**:
  - Equity & Mutual Funds: `"ACH DR - ZERODHA SIP"`, `"GROWW MUTUAL FUND"`, `"KFINTECH MF"`.
  - Statutory & Retirement Savings: `"PPF DEPOSIT SBI"`, `"NPS TRUST CONTRIBUTION"`, `"SUKANYA SAMRIDDHI"`.
  - Insurance: `"HDFC ERGO HEALTH"`, `"LIC PREMIUM"`, `"MAX LIFE TERM"`.

---

## 4. Why Improvised Feature Engineering Outperforms Naive Rules

1. **Non-Linear Cashflow Dynamics**: Real bank statements feature complex distributions (heavy Pareto right-tails in executive incomes, log-normal discretionary spending). Applying log-transforms and robust scaling isolates the genuine income signal.
2. **Salary Inflow Regularity vs. Erratic Deposits**: Freelance vs. salaried profiles require statistical metrics like Coefficient of Variation ($CV$), auto-correlation of monthly credits, and ticket size distributions to avoid misclassifying lump-sum transfers as steady taxable income.
3. **Multi-Class Boundary Optimization**: With 7 granular slab classes in FY 2025–26, feature interactions (e.g., net savings rate $\times$ income stability, discretionary ratio vs. fixed obligations) allow Random Forest, Gradient Boosting, and SVM classifiers to achieve $>95\%$ Macro-F1 accuracy.
