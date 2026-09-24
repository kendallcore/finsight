"""
FinSight Sample Statement Profiles Generator
Generates realistic, distinct banking statement CSVs for 5 demonstration profiles:
1. student_entry: Aarav Sharma — Student Intern & Entry Saver (~₹3.2L, Class 0 Nil)
2. balanced_pro: Priya Nair — Software Engineer at TCS (~₹12.5L, Class 2, Sec 87A rebate)
3. wealth_builder: Vikram Malhotra — Senior Tech Lead at Google India (~₹26.0L, Class 6, 30%)
4. lifestyle_spender: Rohan Mehta — Freelance UI/UX Consultant (~₹14.5L, Class 3, irregular cashflow)
5. real_agami_account: Real Banking Benchmark (Metropolitan Bank Account #11447241261, ~₹16.3L)
"""

import os
import random
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "data" / "sample_statements"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

random.seed(42)

def generate_student():
    txns = []
    # Total credit = 320,000
    # Monthly stipend = 24,000 * 12 = 288,000
    # Scholarship in July = 32,000
    for m in range(1, 13):
        txns.append({
            'date': f'02/{m:02d}/2025',
            'amount': 24000.0,
            'type': 'CREDIT',
            'category': 'SALARY',
            'narration': 'ACH CR - INTERNSHIP STIPEND RESEARCH LAB',
            'payment_mode': 'ACH'
        })
        # PG Rent (UPI): 6,000
        txns.append({
            'date': f'04/{m:02d}/2025',
            'amount': 6000.0,
            'type': 'DEBIT',
            'category': 'RENT',
            'narration': 'UPI - PG HOSTEL RENT TO LANDLORD',
            'payment_mode': 'UPI'
        })
        # SIP (ACH): 3,500
        txns.append({
            'date': f'06/{m:02d}/2025',
            'amount': 3500.0,
            'type': 'DEBIT',
            'category': 'INVESTMENT',
            'narration': 'GROWW MUTUAL FUND SIP',
            'payment_mode': 'ACH'
        })
        # PPF (Netbanking): 1,500
        txns.append({
            'date': f'08/{m:02d}/2025',
            'amount': 1500.0,
            'type': 'DEBIT',
            'category': 'TAX_SHIELD',
            'narration': 'PPF DEPOSIT SBI ONLINE',
            'payment_mode': 'NETBANKING'
        })
        # Discretionary: 8 UPI transactions
        for i in range(8):
            amt = 250.0 if i < 3 else (450.0 if i < 6 else 1200.0)
            txns.append({
                'date': f'{10+i*2:02d}/{m:02d}/2025',
                'amount': amt,
                'type': 'DEBIT',
                'category': 'FOOD' if i < 5 else 'SHOPPING',
                'narration': 'UPI - SWIGGY BANGALORE' if i < 3 else ('ZEPTO MUMBAI' if i < 6 else 'AMAZON PAY CAMPUS'),
                'payment_mode': 'UPI'
            })
    txns.append({
        'date': '15/07/2025',
        'amount': 32000.0,
        'type': 'CREDIT',
        'category': 'GENERAL_CREDIT',
        'narration': 'NEFT CR - MERIT SCHOLARSHIP COLLEGE AWARD',
        'payment_mode': 'NEFT'
    })
    return pd.DataFrame(txns)


def generate_balanced_pro():
    txns = []
    # Total credit: 1,250,000
    # Monthly salary: 82,000 * 12 = 984,000
    # Consulting credits in March, July, November = 266,000
    for m in range(1, 13):
        txns.append({
            'date': f'01/{m:02d}/2025',
            'amount': 82000.0,
            'type': 'CREDIT',
            'category': 'SALARY',
            'narration': 'ACH CR - TCS CORP SALARY',
            'payment_mode': 'ACH'
        })
        # Rent: 31,000 (fixed)
        txns.append({
            'date': f'04/{m:02d}/2025',
            'amount': 31000.0,
            'type': 'DEBIT',
            'category': 'RENT',
            'narration': 'UPI - HDFC RENT TO LANDLORD',
            'payment_mode': 'UPI'
        })
        # SIP: 6,000 (investment)
        txns.append({
            'date': f'07/{m:02d}/2025',
            'amount': 6000.0,
            'type': 'DEBIT',
            'category': 'INVESTMENT',
            'narration': 'ACH DR - KFINTECH MUTUAL FUND SIP',
            'payment_mode': 'ACH'
        })
        # Tax shield: 2,500
        txns.append({
            'date': f'10/{m:02d}/2025',
            'amount': 2500.0,
            'type': 'DEBIT',
            'category': 'TAX_SHIELD',
            'narration': 'HDFC LIFE INSURANCE PREMIUM',
            'payment_mode': 'NETBANKING'
        })
        # Discretionary: 18 UPI txns (food, shopping, dining)
        for i in range(8):
            txns.append({
                'date': f'{11+i:02d}/{m:02d}/2025',
                'amount': 320.0,
                'type': 'DEBIT',
                'category': 'FOOD',
                'narration': 'UPI - SWIGGY BANGALORE',
                'payment_mode': 'UPI'
            })
        for i in range(10):
            txns.append({
                'date': f'{19+i:02d}/{m:02d}/2025',
                'amount': 3800.0,
                'type': 'DEBIT',
                'category': 'SHOPPING' if i % 2 == 0 else 'FOOD',
                'narration': 'AMAZON PAY INDIA' if i % 2 == 0 else 'UPI - ZOMATO HYDERABAD',
                'payment_mode': 'UPI'
            })
    for m in [3, 7, 11]:
        txns.append({
            'date': f'15/{m:02d}/2025',
            'amount': 88666.67,
            'type': 'CREDIT',
            'category': 'GENERAL_CREDIT',
            'narration': 'UPI - TECH ADVISORY CLIENT PAYMENT',
            'payment_mode': 'UPI'
        })
    return pd.DataFrame(txns)


def generate_wealth_builder():
    txns = []
    # Total credit: 2,600,000
    # Salary: 12 * 175,000 = 2,100,000
    # Bonus: 280,000 in March
    # Capital gains / redemptions: 220,000 in September
    for m in range(1, 13):
        txns.append({
            'date': f'01/{m:02d}/2025',
            'amount': 175000.0,
            'type': 'CREDIT',
            'category': 'SALARY',
            'narration': 'ACH CR - GOOGLE INDIA PAYROLL',
            'payment_mode': 'ACH'
        })
        # EMI: 28,000 (fixed)
        txns.append({
            'date': f'05/{m:02d}/2025',
            'amount': 28000.0,
            'type': 'DEBIT',
            'category': 'EMI',
            'narration': 'ACH DR - HDFC HOME LOAN EMI',
            'payment_mode': 'ACH'
        })
        # SIP: 75,000 (investment)
        txns.append({
            'date': f'08/{m:02d}/2025',
            'amount': 75000.0,
            'type': 'DEBIT',
            'category': 'INVESTMENT',
            'narration': 'ACH DR - ZERODHA MUTUAL FUND SIP',
            'payment_mode': 'ACH'
        })
        # Tax shield (NPS): 28,000
        txns.append({
            'date': f'10/{m:02d}/2025',
            'amount': 28000.0,
            'type': 'DEBIT',
            'category': 'TAX_SHIELD',
            'narration': 'NPS TRUST CONTRIBUTION PENSION',
            'payment_mode': 'NETBANKING'
        })
        # Discretionary: 5 txns per month
        for i in range(5):
            txns.append({
                'date': f'{12+i*3:02d}/{m:02d}/2025',
                'amount': 4000.0,
                'type': 'DEBIT',
                'category': 'FOOD',
                'narration': 'UPI - SWIGGY BANGALORE',
                'payment_mode': 'UPI'
            })
    txns.append({
        'date': '15/03/2025',
        'amount': 280000.0,
        'type': 'CREDIT',
        'category': 'GENERAL_CREDIT',
        'narration': 'NEFT CR - GOOGLE ANNUAL PERFORMANCE BONUS',
        'payment_mode': 'NEFT'
    })
    txns.append({
        'date': '20/09/2025',
        'amount': 220000.0,
        'type': 'CREDIT',
        'category': 'REDEMPTION',
        'narration': 'GROWW REDEMPTION MUTUAL FUND DIVIDEND',
        'payment_mode': 'ACH'
    })
    return pd.DataFrame(txns)


def generate_lifestyle_spender():
    txns = []
    # Total credit: 1,450,000 (irregular freelance milestone payouts)
    credits_schedule = [
        ('12/01/2025', 220000.0, 'NEFT CR - FINTECH CLIENT UI REDESIGN'),
        ('24/03/2025', 380000.0, 'IMPS CR - SAAS DASHBOARD DESIGN CONTRACT'),
        ('18/05/2025', 150000.0, 'NEFT CR - ECOMMERCE MOBILE APP WIREFRAMES'),
        ('05/07/2025', 320000.0, 'IMPS CR - CRYPTO WALLET DESIGN MILESTONE'),
        ('19/09/2025', 180000.0, 'NEFT CR - EDTECH CLIENT RETAINER'),
        ('28/11/2025', 200000.0, 'IMPS CR - BRANDING & DESIGN SYSTEM')
    ]
    for dt, amt, narr in credits_schedule:
        txns.append({
            'date': dt,
            'amount': amt,
            'type': 'CREDIT',
            'category': 'GENERAL_CREDIT',
            'narration': narr,
            'payment_mode': 'NEFT' if 'NEFT' in narr else 'IMPS'
        })
    
    # Debits: High burn rate (~1.01) with luxury travel, dining, equipment
    for m in range(1, 13):
        # WeWork Studio rent: 35,000
        txns.append({
            'date': f'05/{m:02d}/2025',
            'amount': 35000.0,
            'type': 'DEBIT',
            'category': 'RENT',
            'narration': 'NEFT - WEWORK COWORKING STUDIO',
            'payment_mode': 'NEFT'
        })
        # Flights / luxury hotels: 38,000
        txns.append({
            'date': f'14/{m:02d}/2025',
            'amount': 38000.0,
            'type': 'DEBIT',
            'category': 'TRAVEL',
            'narration': 'POS CARD - TAJ HOTELS RESORTS MUMBAI',
            'payment_mode': 'POS'
        })
        # Apple Store equipment in Feb, Jun, Oct
        if m in [2, 6, 10]:
            txns.append({
                'date': f'20/{m:02d}/2025',
                'amount': 85000.0,
                'type': 'DEBIT',
                'category': 'SHOPPING',
                'narration': 'POS CARD - APPLE STORE MUMBAI MACBOOK',
                'payment_mode': 'POS'
            })
        # Dining & nightlife
        for i in range(4):
            txns.append({
                'date': f'{15+i*3:02d}/{m:02d}/2025',
                'amount': 6500.0,
                'type': 'DEBIT',
                'category': 'FOOD',
                'narration': 'POS CARD - FINE DINING RESTAURANT BKC',
                'payment_mode': 'POS'
            })
    return pd.DataFrame(txns)


def get_real_agami_account():
    agami_clean_path = BASE_DIR / "data" / "parsed_statements" / "agami_indian_transactions_clean.csv"
    if not agami_clean_path.exists():
        raise FileNotFoundError(f"Missing {agami_clean_path}")
    df = pd.read_csv(agami_clean_path)
    sub = df[df['account_number'] == 11447241261].copy()
    sub = sub[['date', 'amount', 'type', 'narration', 'payment_mode', 'category']]
    return sub


def main():
    print("Generating FinSight Sample Profiles...")
    profiles = {
        "student_entry": generate_student(),
        "balanced_pro": generate_balanced_pro(),
        "wealth_builder": generate_wealth_builder(),
        "lifestyle_spender": generate_lifestyle_spender(),
        "real_agami_account": get_real_agami_account()
    }

    for pid, df in profiles.items():
        out_path = OUTPUT_DIR / f"{pid}.csv"
        df.to_csv(out_path, index=False)
        print(f"✓ Saved {out_path} ({len(df)} transactions)")

if __name__ == "__main__":
    main()
