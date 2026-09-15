import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SpendingBreakdown } from '../SpendingBreakdown';
import { CategorySpendItem, ExtractedFeatures, MonthlyCategorySpend, TransactionRecord } from '../../types';

const features: ExtractedFeatures = {
  log_annual_credit: 14.2,
  log_annual_debit: 13.8,
  net_savings_ratio: 0.32,
  monthly_burn_rate: 0.68,
  salary_inflow_ratio: 0.9,
  monthly_credit_cv: 0.08,
  salary_regularity_score: 1,
  bonus_lump_sum_ratio: 0.1,
  investment_ratio: 0.18,
  fixed_obligation_ratio: 0.3,
  discretionary_ratio: 0.25,
  tax_shield_ratio: 0.05,
  upi_velocity_index: 0.6,
  micro_spend_density: 0.06,
  log_avg_ticket_size: 7.5,
  capital_gains_flux: 0
};

const breakdown: CategorySpendItem[] = [
  { category: 'RENT', amount: 360000, transaction_count: 12, percentage_of_total: 45 },
  { category: 'FOOD', amount: 240000, transaction_count: 90, percentage_of_total: 30 },
  { category: 'SHOPPING', amount: 200000, transaction_count: 40, percentage_of_total: 25 }
];

const monthly: MonthlyCategorySpend[] = [
  { month: '2025-01', category: 'FOOD', amount: 20000 },
  { month: '2025-01', category: 'RENT', amount: 30000 },
  { month: '2025-02', category: 'FOOD', amount: 21000 }
];

const transactions: TransactionRecord[] = [
  { date: '2025-01-05', narration: 'SWIGGY BANGALORE', amount: 450, type: 'DEBIT', category: 'FOOD', payment_mode: 'UPI' },
  { date: '2025-01-18', narration: 'SWIGGY BANGALORE', amount: 300, type: 'DEBIT', category: 'FOOD', payment_mode: 'UPI' },
  { date: '2025-01-06', narration: 'ZOMATO ORDER', amount: 120, type: 'DEBIT', category: 'FOOD', payment_mode: 'UPI' },
  { date: '2025-02-01', narration: 'HDFC RENT', amount: 30000, type: 'DEBIT', category: 'RENT', payment_mode: 'NEFT' },
  { date: '2025-02-03', narration: 'ACH CR SALARY', amount: 100000, type: 'CREDIT', category: 'SALARY', payment_mode: 'ACH' }
];

describe('SpendingBreakdown', () => {
  it('derives the needs/wants/savings split from the feature vector', () => {
    render(<SpendingBreakdown features={features} categoryBreakdown={breakdown} monthlyBreakdown={monthly} />);

    expect(screen.getByText('Needs / Wants / Savings')).toBeInTheDocument();
    // The legend is real DOM, so it proves the split was computed rather than drawn blind.
    expect(screen.getByText('Needs (rent, EMI, utilities)')).toBeInTheDocument();
    expect(screen.getByText('Wants (dining, travel, shopping)')).toBeInTheDocument();
    expect(screen.getByText('Savings & investments')).toBeInTheDocument();
    // fixed 0.30 -> 30.0%, discretionary 0.25 -> 25.0%, savings 0.32 + investment 0.18 -> 50.0%
    expect(screen.getByText('30.0%')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('renders the category and monthly-trend sections from API data', () => {
    render(
      <SpendingBreakdown
        features={features}
        categoryBreakdown={breakdown}
        monthlyBreakdown={monthly}
        transactions={transactions}
      />
    );
    expect(screen.getByText(/Where The Money Went/)).toBeInTheDocument();
    expect(screen.getByText('Monthly Outflow By Category')).toBeInTheDocument();
    // One accessible chip per category, labelled with its published share.
    expect(screen.getByRole('button', { name: 'Drill down: FOOD' })).toHaveTextContent('30%');
    expect(screen.getAllByRole('button', { name: /Drill down:/ })).toHaveLength(3);
  });

  it('drills into a category and lists its largest payments', () => {
    render(
      <SpendingBreakdown
        features={features}
        categoryBreakdown={breakdown}
        monthlyBreakdown={monthly}
        transactions={transactions}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Drill down: FOOD' }));

    expect(screen.getByText('₹2,40,000')).toBeInTheDocument();
    expect(screen.getByText(/30\.0% of outflow/)).toBeInTheDocument();
    expect(screen.getByText(/Largest payments in this category/)).toBeInTheDocument();
    // Two separate Swiggy payments aggregate to one merchant row.
    expect(screen.getByText('SWIGGY BANGALORE')).toBeInTheDocument();
    expect(screen.getByText('₹750')).toBeInTheDocument();
    expect(screen.getByText('× 2')).toBeInTheDocument();
    // Rent and salary are not part of this category, so they must not leak in.
    expect(screen.queryByText('HDFC RENT')).not.toBeInTheDocument();
    expect(screen.queryByText('ACH CR SALARY')).not.toBeInTheDocument();
  });

  it('comes back out of drill-down', () => {
    render(
      <SpendingBreakdown
        features={features}
        categoryBreakdown={breakdown}
        monthlyBreakdown={monthly}
        transactions={transactions}
      />
    );

    const food = screen.getByRole('button', { name: 'Drill down: FOOD' });
    fireEvent.click(food);
    expect(screen.getByText(/Largest payments in this category/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /All categories/ }));
    expect(screen.queryByText(/Largest payments in this category/)).not.toBeInTheDocument();
    expect(screen.getByText(/Where The Money Went/)).toBeInTheDocument();
  });

  it('accounts for unallocated outflow instead of dropping it', () => {
    const zeroFeatures: ExtractedFeatures = {
      ...features,
      fixed_obligation_ratio: 0,
      discretionary_ratio: 0,
      net_savings_ratio: 0,
      investment_ratio: 0
    };
    render(<SpendingBreakdown features={zeroFeatures} categoryBreakdown={[]} monthlyBreakdown={[]} />);
    expect(screen.getByText('Unallocated')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('still shows the derived split but flags missing category tagging', () => {
    render(<SpendingBreakdown features={features} categoryBreakdown={[]} monthlyBreakdown={[]} />);
    expect(screen.getByText(/Category tagging returned no rows/)).toBeInTheDocument();
    expect(screen.getByText('Needs / Wants / Savings')).toBeInTheDocument();
    expect(screen.getByText(/No monthly time series returned/)).toBeInTheDocument();
  });

  it('says so when the monthly series is missing', () => {
    render(<SpendingBreakdown features={features} categoryBreakdown={breakdown} monthlyBreakdown={[]} />);
    expect(screen.getByText(/No monthly time series returned/)).toBeInTheDocument();
  });
});
