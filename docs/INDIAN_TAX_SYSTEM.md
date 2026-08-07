# Indian Income Tax System & Banking Dynamics Reference

## 1. Statutory Context: Section 115BAC (New Tax Regime)

The Indian Finance Act established the **New Tax Regime** under Section 115BAC as the default tax framework. It simplifies compliance by reducing slab rates in exchange for removing most discretionary exemptions (80C, 80D, HRA).

### Official Slab Structure (FY 2024–25 & FY 2025–26)

| Class Index | Annual Taxable Income (₹) | Slab Tax Rate | Key Notes |
| :---: | :--- | :---: | :--- |
| **0** | Up to ₹3,00,000 | **0% (Nil)** | Basic Exemption Limit |
| **1** | ₹3,00,001 – ₹7,00,000 | **5%** | Section 87A rebate provides full tax relief up to ₹7.0 Lakhs |
| **2** | ₹7,00,001 – ₹10,00,000 | **10%** | Standard entry corporate bracket |
| **3** | ₹10,00,001 – ₹12,00,000 | **15%** | Mid-level professional bracket |
| **4** | ₹12,00,001 – ₹15,00,000 | **20%** | Senior professional / Tech lead bracket |
| **5** | Above ₹15,00,000 | **30%** | Executive / High Net-Worth bracket |

---

## 2. Indian Banking Transaction Taxonomy

FinSight models realistic transaction descriptors commonly found in major Indian commercial banks (HDFC Bank, State Bank of India, ICICI Bank, Axis Bank, Kotak Mahindra):

### A. Inflow Transaction Patterns (Credits)
- **Salary Credits**: `"ACH CR - INFOSYS LTD"`, `"SALARY CREDIT - TATA CONSULTANCY"`, `"NEFT CR - GOOGLE INDIA"`, `"UPI CR - CLIENT PAYMENT"`.
- **Investment Returns**: `"ACH CR - ZERODHA BROKING"`, `"GROWW DIVIDEND"`, `"INTEREST CREDIT SBI"`.
- **Freelance / Consulting Inflows**: Periodic lump-sum UPI/IMPS deposits with high inter-month variance.

### B. Outflow Transaction Patterns (Debits)
- **Fixed Living Costs**:
  - House Rent: `"UPI - RENT TO LANDLORD"`, `"NEFT - NOBROKER RENT"`.
  - Loan EMIs: `"ACH DR - HDFC HOME LOAN"`, `"ECS - ICICI AUTO LOAN"`.
  - Utilities: `"UPI - BESCOM ELECTRICITY"`, `"BBPS - AIRTEL FIBER"`, `"INDANE GAS"`.
- **Discretionary Lifestyle**:
  - Food & Delivery: `"UPI - SWIGGY"`, `"UPI - ZOMATO"`, `"BLINKIT"`, `"ZEPTO"`.
  - Shopping & Entertainment: `"AMAZON PAY INDIA"`, `"FLIPKART INTERNET"`, `"BOOKMYSHOW"`, `"PVR CINEMAS"`.
  - Mobility: `"UPI - UBER INDIA"`, `"OLA CABS"`, `"FASTAG RECHARGE"`.
- **Investments & Tax-Saving Proxies**:
  - Systematic Investment Plans: `"ACH DR - ZERODHA SIP"`, `"GROWW MUTUAL FUND"`.
  - Voluntary Savings: `"PPF DEPOSIT SBI"`, `"NPS TRUST CONTRIBUTION"`.

---

## 3. Why Machine Learning is Needed Over a Rule Engine

1. **Unstructured Narration Parsing**: Real statements contain messy narrations where salary, reimbursements, client advances, and internal bank transfers are intermixed.
2. **Income Volatility & Estimation**: Freelancers and gig economy workers do not have a fixed monthly paycheck; regression models learn to predict annual baseline income from dynamic cashflow velocity.
3. **Behavioral Tax Profiling**: Identifies when a taxpayer's spending pattern suggests they should remain in the Old Regime due to high investments vs. switching to the New Regime.
