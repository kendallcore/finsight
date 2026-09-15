import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  Building2,
  PiggyBank,
  TrendingUp,
  Home,
  Coffee,
  Calendar,
  Repeat,
  Smartphone,
  Crown,
  Sparkles,
  Loader2,
  Compass,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { ExtractedFeatures, SimulationPath } from '../types';
import { ComparisonView, ComparisonMetrics } from './ComparisonView';
import { GoalTracker, GoalInputs } from './GoalTracker';
import { ConfidenceBadge, confidenceOpacity } from './ConfidenceBadge';
import { formatINR, personaTheme } from '../lib/theme';

type SliderKey =
  | 'annualCreditRupees'
  | 'savingsRatio'
  | 'investmentRatio'
  | 'fixedRatio'
  | 'discretionaryRatio'
  | 'salaryRatio'
  | 'subscriptionsRatio'
  | 'upiVelocity';

type SliderState = Record<SliderKey, number>;

const DEFAULTS: SliderState = {
  annualCreditRupees: 1450000,
  savingsRatio: 0.32,
  investmentRatio: 0.18,
  fixedRatio: 0.3,
  discretionaryRatio: 0.2,
  salaryRatio: 0.9,
  subscriptionsRatio: 0.08,
  upiVelocity: 0.75
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Invert the backend's projected 16D vector back onto the eight sliders. */
function slidersFromFeatures(features: Record<string, number>, fallbackAnnual: number): SliderState {
  const annual = Math.expm1(features.log_annual_credit ?? 0);
  return {
    annualCreditRupees: clamp(Number.isFinite(annual) ? annual : fallbackAnnual, 200000, 5000000),
    savingsRatio: clamp(features.net_savings_ratio ?? DEFAULTS.savingsRatio, 0, 0.65),
    investmentRatio: clamp(features.investment_ratio ?? DEFAULTS.investmentRatio, 0, 0.45),
    fixedRatio: clamp(features.fixed_obligation_ratio ?? DEFAULTS.fixedRatio, 0.1, 0.6),
    discretionaryRatio: clamp(features.discretionary_ratio ?? DEFAULTS.discretionaryRatio, 0.05, 0.55),
    salaryRatio: clamp(features.salary_regularity_score ?? DEFAULTS.salaryRatio, 0, 1),
    subscriptionsRatio: clamp(features.tax_shield_ratio ?? DEFAULTS.subscriptionsRatio, 0, 0.2),
    upiVelocity: clamp(features.upi_velocity_index ?? DEFAULTS.upiVelocity, 0.1, 0.95)
  };
}

interface Snapshot {
  metrics: ComparisonMetrics;
  goals: GoalInputs;
  archetypeId: number;
}

function toSnapshot(values: SliderState, diagnostics: { financial_health_score: number; cash_runway_months: number; needs_ratio_percent: number; wants_ratio_percent: number; savings_ratio_percent: number } | undefined, annualIncome: number, archetypeId: number): Snapshot | null {
  if (!diagnostics) return null;
  const monthlyIncome = values.annualCreditRupees / 12;
  const monthlySpend = (values.annualCreditRupees * (1 - values.savingsRatio)) / 12;
  return {
    archetypeId,
    metrics: {
      healthScore: diagnostics.financial_health_score,
      runwayMonths: diagnostics.cash_runway_months,
      needsPercent: diagnostics.needs_ratio_percent,
      wantsPercent: diagnostics.wants_ratio_percent,
      savingsPercent: diagnostics.savings_ratio_percent,
      annualIncome
    },
    goals: {
      monthlyIncome,
      monthlySpend,
      fixedRatio: values.fixedRatio,
      discretionaryRatio: values.discretionaryRatio,
      savingsRatio: values.savingsRatio,
      investmentRatio: values.investmentRatio,
      runwayMonths: diagnostics.cash_runway_months
    }
  };
}

const SLIDER_DEFS: {
  key: SliderKey;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  display: (value: number) => string;
  accent: 'emerald' | 'neutral';
}[] = [
  {
    key: 'annualCreditRupees',
    label: 'Annual Inflow / Credit Magnitude',
    icon: <Building2 className="w-3.5 h-3.5" />,
    min: 200000,
    max: 5000000,
    step: 50000,
    display: formatINR,
    accent: 'emerald'
  },
  {
    key: 'savingsRatio',
    label: 'Net Savings Ratio (Retained Cash)',
    icon: <PiggyBank className="w-3.5 h-3.5" />,
    min: 0,
    max: 0.65,
    step: 0.01,
    display: (v) => `${(v * 100).toFixed(0)}%`,
    accent: 'emerald'
  },
  {
    key: 'investmentRatio',
    label: 'Wealth Building Commitment (SIPs / MF)',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    min: 0,
    max: 0.45,
    step: 0.01,
    display: (v) => `${(v * 100).toFixed(0)}%`,
    accent: 'emerald'
  },
  {
    key: 'fixedRatio',
    label: 'Fixed Living Costs (Rent / EMIs / Utilities)',
    icon: <Home className="w-3.5 h-3.5" />,
    min: 0.1,
    max: 0.6,
    step: 0.01,
    display: (v) => `${(v * 100).toFixed(0)}%`,
    accent: 'neutral'
  },
  {
    key: 'discretionaryRatio',
    label: 'Discretionary Lifestyle Spend (Dining / Travel / Shopping)',
    icon: <Coffee className="w-3.5 h-3.5" />,
    min: 0.05,
    max: 0.55,
    step: 0.01,
    display: (v) => `${(v * 100).toFixed(0)}%`,
    accent: 'neutral'
  },
  {
    key: 'salaryRatio',
    label: 'Salary Regularity Share',
    icon: <Calendar className="w-3.5 h-3.5" />,
    min: 0,
    max: 1,
    step: 0.02,
    display: (v) => `${(v * 100).toFixed(0)}%`,
    accent: 'neutral'
  },
  {
    key: 'subscriptionsRatio',
    label: 'Recurring Subscriptions & Micro-Spend',
    icon: <Repeat className="w-3.5 h-3.5" />,
    min: 0,
    max: 0.2,
    step: 0.01,
    display: (v) => `${(v * 100).toFixed(0)}%`,
    accent: 'neutral'
  },
  {
    key: 'upiVelocity',
    label: 'Instant UPI Channel Velocity',
    icon: <Smartphone className="w-3.5 h-3.5" />,
    min: 0.1,
    max: 0.95,
    step: 0.01,
    display: (v) => `${(v * 100).toFixed(0)}%`,
    accent: 'neutral'
  }
];

export const SimulatorView: React.FC = () => {
  const [values, setValues] = useState<SliderState>(DEFAULTS);
  const [simResult, setSimResult] = useState<Awaited<ReturnType<typeof api.predictFeatures>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<string>('');
  const [baseline, setBaseline] = useState<Snapshot | null>(null);

  const latestRef = useRef({ values, simResult });
  latestRef.current = { values, simResult };

  const updateSlider = (key: SliderKey, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setActiveScenario('');
  };

  const handleReset = () => {
    setValues(DEFAULTS);
    setActiveScenario('');
    setBaseline(null);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const debitRupees = values.annualCreditRupees * (1 - values.savingsRatio);
        const features: ExtractedFeatures = {
          log_annual_credit: Math.log1p(values.annualCreditRupees),
          log_annual_debit: Math.log1p(debitRupees),
          net_savings_ratio: values.savingsRatio,
          monthly_burn_rate: Math.max(0.1, 1 - values.savingsRatio),
          salary_inflow_ratio: values.salaryRatio,
          monthly_credit_cv: 0.08,
          salary_regularity_score: values.salaryRatio,
          bonus_lump_sum_ratio: 0.1,
          investment_ratio: values.investmentRatio,
          fixed_obligation_ratio: values.fixedRatio,
          discretionary_ratio: values.discretionaryRatio,
          tax_shield_ratio: values.subscriptionsRatio,
          upi_velocity_index: values.upiVelocity,
          micro_spend_density: 0.06,
          log_avg_ticket_size: Math.log1p((values.annualCreditRupees + debitRupees) / 450),
          capital_gains_flux: 0
        };

        const res = await api.predictFeatures(features);
        setSimResult(res);
        setError(null);
        setBaseline((prev) => {
          if (prev) return prev;
          const diagnostics = res.predictions.lifestyle_diagnostics;
          return toSnapshot(
            latestRef.current.values,
            diagnostics,
            res.predictions.estimated_annual_income,
            res.predictions.lifestyle_archetype?.archetype_id ?? 3
          );
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Simulation failed');
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [values]);

  const pred = simResult?.predictions;
  const diagnostics = pred?.lifestyle_diagnostics;
  const archetype = pred?.lifestyle_archetype;
  const insights = simResult?.insights;
  const paths = useMemo<SimulationPath[]>(() => insights?.simulation_paths ?? [], [insights]);

  const theme = personaTheme(archetype?.archetype_id);

  const activePath = paths.find((path) => path.path_id === activeScenario) ?? null;

  const applyScenario = (path: SimulationPath) => {
    const { values: currentValues, simResult: currentResult } = latestRef.current;
    if (currentResult?.predictions.lifestyle_diagnostics) {
      setBaseline(
        toSnapshot(
          currentValues,
          currentResult.predictions.lifestyle_diagnostics,
          currentResult.predictions.estimated_annual_income,
          currentResult.predictions.lifestyle_archetype?.archetype_id ?? 3
        )
      );
    }
    setValues(slidersFromFeatures(path.projected_features, currentValues.annualCreditRupees));
    setActiveScenario(path.path_id);
  };

  const liveSnapshot = useMemo(
    () =>
      diagnostics
        ? toSnapshot(
            values,
            diagnostics,
            pred?.estimated_annual_income ?? 0,
            archetype?.archetype_id ?? 3
          )
        : null,
    [values, diagnostics, pred?.estimated_annual_income, archetype?.archetype_id]
  );

  // SVG circular gauge geometry
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const healthScore = diagnostics?.financial_health_score ?? 0;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  const monthlyIncome = values.annualCreditRupees / 12;
  const monthlySpend = (values.annualCreditRupees * (1 - values.savingsRatio)) / 12;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 tracking-tight">What-If Simulator</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Adjust your lifestyle choices and see the impact on your financial future.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#161d28] border border-[#232f42] text-neutral-300 hover:text-white hover:border-neutral-600 transition self-start sm:self-auto"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <RotateCcw className="w-3.5 h-3.5" />}
          <span>Reset &amp; rebaseline</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Improvement path picker */}
      <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-neutral-200">Improvement path</span>
        </div>

        <select
          value={activeScenario}
          onChange={(event) => {
            const path = paths.find((candidate) => candidate.path_id === event.target.value);
            if (path) applyScenario(path);
            else setActiveScenario('');
          }}
          className="flex-1 px-3 py-2 text-xs rounded-lg bg-[#0a0d13] border border-[#232f42] text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
        >
          <option value="">
            {paths.length ? 'Manual — no path applied' : 'Loading improvement paths…'}
          </option>
          {paths.map((path) => (
            <option key={path.path_id} value={path.path_id}>
              {path.name} (+{path.projected_health_delta} health, {path.projected_runway_delta >= 0 ? '+' : ''}
              {path.projected_runway_delta} mo runway)
            </option>
          ))}
        </select>

        {activePath && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[11px] font-mono text-neutral-400 lg:max-w-md lg:text-right"
          >
            {activePath.description}
          </motion.div>
        )}
      </div>

      {activePath && activePath.required_changes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {activePath.required_changes.map((change, index) => (
            <div
              key={change}
              className="flex items-start space-x-2 p-3 rounded-xl bg-[#0f141c] border border-[#1d2634]"
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: theme.wash, color: theme.accent }}
              >
                {index + 1}
              </span>
              <span className="text-[11px] text-neutral-300 leading-snug">{change}</span>
            </div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders */}
        <div className="lg:col-span-7 border border-[#1d2634] bg-[#11161f] rounded-2xl p-6 space-y-4">
          <div className="text-sm font-semibold text-neutral-200 mb-2">Adjust Your Parameters</div>

          {SLIDER_DEFS.map((slider) => (
            <div key={slider.key} className="p-3.5 rounded-xl bg-[#0a0d13] border border-[#18202d] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#161f2c] border border-[#233144] flex items-center justify-center text-neutral-300">
                    {slider.icon}
                  </div>
                  <span className="text-xs font-medium text-neutral-200">{slider.label}</span>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    slider.accent === 'emerald'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-neutral-300 bg-[#161f2c] border-[#233144]'
                  }`}
                >
                  {slider.display(values[slider.key])}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={values[slider.key]}
                onChange={(event) => updateSlider(slider.key, Number(event.target.value))}
                className="w-full accent-emerald-500 bg-[#1a2332] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              {slider.key === 'annualCreditRupees' && (
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>₹2.0 Lakhs</span>
                  <span>{formatINR(monthlyIncome)}/mo inflow</span>
                  <span>₹50.0 Lakhs</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-sm font-semibold text-neutral-200 flex items-center space-x-2">
            <span>Live Preview</span>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
          </div>

          <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold font-mono text-neutral-100 tracking-tight">
                {pred ? formatINR(pred.estimated_annual_income) : '—'}
              </div>
              {pred && baseline && (
                <motion.span
                  key={`${pred.estimated_annual_income}`}
                  initial={{ opacity: 0.4, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`inline-flex items-center text-xs font-mono font-semibold px-2 py-0.5 rounded-md border ${
                    pred.estimated_annual_income >= baseline.metrics.annualIncome
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  }`}
                >
                  {pred.estimated_annual_income >= baseline.metrics.annualIncome ? '↑' : '↓'}
                  {formatINR(Math.abs(pred.estimated_annual_income - baseline.metrics.annualIncome))} vs baseline
                </motion.span>
              )}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Predicted Annual Inflow (regression)</div>
            {pred && (
              <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                95% CI: {formatINR(pred.income_confidence_interval[0])} –{' '}
                {formatINR(pred.income_confidence_interval[1])}
              </div>
            )}
          </div>

          {/* Archetype with confidence */}
          <div
            className="border rounded-2xl p-6 transition-colors"
            style={{ borderColor: theme.border, backgroundColor: theme.wash }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Lifestyle Archetype</div>
              {archetype && <ConfidenceBadge confidence={archetype.confidence} label="persona" />}
            </div>
            <div className="flex items-center space-x-2.5" style={{ opacity: confidenceOpacity(archetype?.confidence) }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(250,204,21,0.12)', color: theme.accent }}
              >
                <Crown className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-neutral-100">{archetype?.archetype_name ?? '—'}</h3>
            </div>
            <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed">{archetype?.summary}</p>
            {archetype && archetype.confidence < 0.7 && (
              <p className="text-[10px] font-mono text-neutral-500 mt-2">
                Borderline read — the next two archetypes are within a few points of each other.
              </p>
            )}
          </div>

          {/* Health gauge + budget split */}
          <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="pr-4 border-r border-[#18202d]">
                <div className="text-xs font-medium text-neutral-300 mb-3">Financial Health</div>
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r={radius} stroke="#1a2332" strokeWidth="6" fill="transparent" />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke={theme.accent}
                        strokeWidth="6"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={false}
                        animate={{ strokeDashoffset }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <motion.span
                        key={healthScore}
                        initial={{ opacity: 0.3, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-bold font-mono text-neutral-100"
                      >
                        {diagnostics ? healthScore : '—'}
                      </motion.span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-[11px] font-mono text-neutral-400">{healthScore} / 100</div>
                    <div className="text-[11px] font-medium mt-0.5" style={{ color: theme.accent }}>
                      {diagnostics ? `${diagnostics.cash_runway_months} Months` : '—'}
                    </div>
                    <div className="text-[10px] text-neutral-500">Reserve Runway</div>
                  </div>
                </div>
              </div>

              <div className="pl-2 flex flex-col justify-center">
                <div className="text-xs font-medium text-neutral-300 mb-3">Budget Health</div>
                <div className="space-y-2.5 text-xs font-mono">
                  {[
                    { label: 'Needs', value: diagnostics?.needs_ratio_percent, dot: '#3b82f6' },
                    { label: 'Wants', value: diagnostics?.wants_ratio_percent, dot: '#f59e0b' },
                    { label: 'Savings', value: diagnostics?.savings_ratio_percent, dot: '#10b981' }
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.dot }} />
                        <span className="text-neutral-400">{row.label}</span>
                      </div>
                      <motion.span
                        key={row.value}
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: 1 }}
                        className="text-neutral-200 font-bold"
                      >
                        {row.value === undefined ? '—' : `${row.value.toFixed(0)}%`}
                      </motion.span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[#18202d] text-[10px] font-mono text-neutral-500">
                  {formatINR(monthlySpend)}/mo outflow
                </div>
              </div>
            </div>
          </div>

          {pred?.predicted_tax_slab && (
            <div
              className="border border-[#1d2634] bg-[#11161f] rounded-xl px-4 py-3 flex items-center justify-between text-xs"
              style={{ opacity: confidenceOpacity(pred.predicted_tax_slab.confidence) }}
            >
              <span className="text-neutral-300">
                Tax slab: <span className="font-mono text-neutral-100">{pred.predicted_tax_slab.bracket_name}</span>
              </span>
              <ConfidenceBadge confidence={pred.predicted_tax_slab.confidence} label="slab" compact />
            </div>
          )}

          <div className="border border-[#1d2634] bg-[#11161f] rounded-xl px-4 py-3 flex items-center space-x-2 text-xs text-neutral-300">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="italic text-neutral-400">
              {insights?.persona_critique
                ? insights.persona_critique
                : 'Pick an improvement path to project the outcome.'}
            </span>
          </div>
        </div>
      </div>

      {/* Before / after + goals */}
      {baseline && liveSnapshot && (
        <ComparisonView
          baseline={baseline.metrics}
          adjusted={liveSnapshot.metrics}
          baselineLabel="Baseline plan"
          adjustedLabel={activePath ? `${activePath.name} applied` : 'Adjusted plan'}
          archetypeId={archetype?.archetype_id}
        />
      )}

      {baseline && liveSnapshot && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GoalTracker
            current={baseline.goals}
            projected={liveSnapshot.goals}
            projectionLabel={activePath ? activePath.name : 'Adjusted plan'}
            archetypeId={archetype?.archetype_id}
          />

          {insights?.persona_comparison && (
            <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider mb-4">
                Ranked actions at these settings
              </h3>
              <div className="space-y-2">
                {insights.insights.slice(0, 5).map((item) => (
                  <div
                    key={item.rule_id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#0f141c] border border-[#1d2634]"
                    style={{ opacity: confidenceOpacity(item.confidence) }}
                  >
                    <span className="text-[11px] text-neutral-300 leading-snug min-w-0">{item.insight}</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 flex-shrink-0">
                      +{formatINR(item.impact_rupees)}
                    </span>
                  </div>
                ))}
                {!insights.insights.length && (
                  <p className="text-[11px] text-neutral-500">
                    Nothing crosses a threshold at these settings — the allocation is inside every healthy band.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulatorView;
