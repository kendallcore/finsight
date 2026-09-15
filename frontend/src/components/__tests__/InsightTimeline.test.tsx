import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InsightTimeline } from '../InsightTimeline';
import { AnomalyItem, InsightItem } from '../../types';

const insights: InsightItem[] = [
  {
    rule_id: 'discretionary_ceiling',
    category: 'Lifestyle',
    insight: 'Discretionary spend is 45.0% of outflow, past the 30% healthy ceiling.',
    impact_rupees: 24500,
    confidence: 0.91,
    effort: 2
  },
  {
    rule_id: 'subscription_stack',
    category: 'Subscriptions',
    insight: '3 recurring consumer charges detected across 9 payments.',
    impact_rupees: 347,
    confidence: 0.62,
    effort: 1
  }
];

const anomalies: AnomalyItem[] = [
  {
    transaction_date: '2025-06-15',
    narration: 'AMAZON INDIA',
    amount: 8450,
    category: 'Shopping and retail',
    z_score: 4.2,
    narrative: "15 Jun: ₹8,450 on 'AMAZON INDIA' — 6.1x your typical shopping payment. 4.2 standard deviations.",
    confidence: 0.88
  }
];

const STORAGE_KEY = 'demo-statement';
const storageId = `finsight.insights.v1.${STORAGE_KEY}`;

const renderTimeline = () =>
  render(
    <InsightTimeline
      insights={insights}
      anomalies={anomalies}
      storageKey={STORAGE_KEY}
      archetypeId={2}
      archetypeName="High-Burn Consumer"
      personaCritique="Burn rate is running ahead of income."
    />
  );

describe('InsightTimeline', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders every insight card with its ROI, confidence and effort', () => {
    renderTimeline();

    expect(screen.getByText(/Coaching Timeline/)).toBeInTheDocument();
    expect(screen.getByText(insights[0].insight)).toBeInTheDocument();
    expect(screen.getByText(insights[1].insight)).toBeInTheDocument();
    expect(screen.getByText('₹24,500')).toBeInTheDocument();
    expect(screen.getByText('₹347')).toBeInTheDocument();
    expect(screen.getByText('91%')).toBeInTheDocument();
    expect(screen.getAllByText(/effort \d\/3/)).toHaveLength(2);
  });

  it('marks a sub-threshold reading as low confidence', () => {
    renderTimeline();
    // 0.62 is under the 0.70 floor, so the card is tagged rather than hidden.
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText(/Flagged low-confidence/)).toBeInTheDocument();
  });

  it('renders an anomaly card from its narrative, not raw fields', () => {
    renderTimeline();
    expect(screen.getByText(/Anomalous payment/)).toBeInTheDocument();
    expect(screen.getByText(anomalies[0].narrative)).toBeInTheDocument();
    expect(screen.getByText(/z-score 4\.20 on 2025-06-15/)).toBeInTheDocument();
  });

  it('dismisses a card and persists the saving to localStorage', async () => {
    renderTimeline();

    const dismissButtons = screen.getAllByRole('button', { name: /Mark as done/ });
    fireEvent.click(dismissButtons[0]);

    // Framer Motion runs an exit animation, so the node leaves the DOM on the next frame.
    await waitFor(() =>
      expect(screen.queryByText(insights[0].insight)).not.toBeInTheDocument()
    );
    expect(screen.getByText(insights[1].insight)).toBeInTheDocument();
    expect(screen.getByText('Banked from 1 action')).toBeInTheDocument();
    expect(screen.getByText(/Saved ₹24,500/)).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(storageId) ?? '{}');
    expect(stored).toHaveProperty('discretionary_ceiling', 24500);
  });

  it('restores the dismissed state from localStorage on the next mount', () => {
    localStorage.setItem(storageId, JSON.stringify({ subscription_stack: 347 }));
    renderTimeline();

    expect(screen.queryByText(insights[1].insight)).not.toBeInTheDocument();
    expect(screen.getByText(insights[0].insight)).toBeInTheDocument();
    expect(screen.getByText(/Saved ₹347/)).toBeInTheDocument();
  });

  it('resets every dismissal', async () => {
    renderTimeline();
    fireEvent.click(screen.getAllByRole('button', { name: /Mark as done/ })[0]);
    await waitFor(() => expect(screen.getByText(/Reset 1 dismissed card/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Reset 1 dismissed card/ }));

    expect(localStorage.getItem(storageId)).toBe('{}');
    await waitFor(() => expect(screen.getByText(insights[0].insight)).toBeInTheDocument());
  });

  it('shows an all-clear state when nothing crossed a threshold', () => {
    render(
      <InsightTimeline insights={[]} anomalies={[]} storageKey="empty" archetypeId={0} />
    );
    expect(screen.getByText(/No spending triggers fired/)).toBeInTheDocument();
  });
});
