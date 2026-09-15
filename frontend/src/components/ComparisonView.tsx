import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Columns2 } from 'lucide-react';
import { formatINR, personaTheme } from '../lib/theme';

export interface ComparisonMetrics {
  healthScore: number;
  runwayMonths: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  annualIncome: number;
}

interface ComparisonViewProps {
  baseline: ComparisonMetrics;
  adjusted: ComparisonMetrics;
  baselineLabel?: string;
  adjustedLabel?: string;
  archetypeId?: number;
}

interface MetricSpec {
  key: keyof ComparisonMetrics;
  label: string;
  format: (value: number) => string;
  /** Whether a higher value is the desirable direction. */
  higherIsBetter: boolean;
  /** Largest plausible value, used to scale the mini bars. */
  scaleMax: number;
  unit: string;
}

const METRICS: MetricSpec[] = [
  { key: 'healthScore', label: 'Financial Health Score', format: (v) => v.toFixed(0), higherIsBetter: true, scaleMax: 100, unit: '/100' },
  { key: 'runwayMonths', label: 'Cash Runway', format: (v) => v.toFixed(1), higherIsBetter: true, scaleMax: 18, unit: 'mo' },
  { key: 'needsPercent', label: 'Needs Share', format: (v) => v.toFixed(1), higherIsBetter: false, scaleMax: 100, unit: '%' },
  { key: 'wantsPercent', label: 'Wants Share', format: (v) => v.toFixed(1), higherIsBetter: false, scaleMax: 100, unit: '%' },
  { key: 'savingsPercent', label: 'Savings + Investing', format: (v) => v.toFixed(1), higherIsBetter: true, scaleMax: 100, unit: '%' },
  { key: 'annualIncome', label: 'Projected Annual Inflow', format: formatINR, higherIsBetter: true, scaleMax: 5000000, unit: '' }
];

/** Tween a number whenever its target changes, so deltas animate instead of snapping. */
const AnimatedNumber: React.FC<{ value: number; format: (v: number) => string; prefix?: string }> = ({
  value,
  format,
  prefix = ''
}) => {
  const motionValue = useMotionValue(value);
  const text = useTransform(motionValue, (latest) => `${prefix}${format(latest)}`);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.55, ease: 'easeOut' });
    return () => controls.stop();
  }, [motionValue, value]);

  return <motion.span>{text}</motion.span>;
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  baseline,
  adjusted,
  baselineLabel = 'Current statement',
  adjustedLabel = 'Adjusted plan',
  archetypeId
}) => {
  const theme = personaTheme(archetypeId);
  const [expanded, setExpanded] = useState(true);

  const verdict = METRICS.reduce(
    (acc, spec) => {
      const delta = adjusted[spec.key] - baseline[spec.key];
      if (Math.abs(delta) < 0.05) return acc;
      const improves = spec.higherIsBetter ? delta > 0 : delta < 0;
      return improves ? acc + 1 : acc - 1;
    },
    0
  );

  const netImprovement = verdict > 0;

  return (
    <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Columns2 className="w-4 h-4" style={{ color: theme.accent }} />
          <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Before / After</h3>
        </div>

        <div className="flex items-center gap-3">
          <motion.span
            key={`${netImprovement}-${verdict}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-[11px] font-mono px-2 py-1 rounded-lg border ${
              netImprovement
                ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25'
                : verdict === 0
                ? 'text-neutral-400 bg-neutral-800/40 border-neutral-700'
                : 'text-rose-300 bg-rose-500/10 border-rose-500/25'
            }`}
          >
            {verdict === 0
              ? 'no net change yet'
              : `${netImprovement ? '+' : ''}${verdict} metric${Math.abs(verdict) === 1 ? '' : 's'} ${netImprovement ? 'better' : 'worse'}`}
          </motion.span>
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[#161d28] border border-[#232f42] text-neutral-400 hover:text-neutral-200 transition"
          >
            {expanded ? 'collapse' : 'expand'}
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: baselineLabel, metrics: baseline, accent: '#71717a' },
          { label: adjustedLabel, metrics: adjusted, accent: theme.accent }
        ].map((column, columnIndex) => (
          <motion.div
            key={column.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: columnIndex * 0.08 }}
            className="rounded-xl border p-4 space-y-3"
            style={{
              borderColor: columnIndex === 1 ? theme.border : '#1d2634',
              backgroundColor: columnIndex === 1 ? theme.wash : '#0f141c'
            }}
          >
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: column.accent }} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">{column.label}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-100 leading-none">
              <AnimatedNumber value={column.metrics.healthScore} format={(v) => v.toFixed(0)} />
              <span className="text-sm text-neutral-500 font-normal"> /100 health</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              <AnimatedNumber value={column.metrics.runwayMonths} format={(v) => v.toFixed(1)} /> months runway ·{' '}
              <AnimatedNumber value={column.metrics.annualIncome} format={formatINR} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Per-metric delta rows */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        className="overflow-hidden space-y-2"
      >
        {METRICS.map((spec) => {
          const from = baseline[spec.key];
          const to = adjusted[spec.key];
          const delta = to - from;
          const meaningful = Math.abs(delta) >= (spec.key === 'annualIncome' ? 1 : 0.05);
          const improves = spec.higherIsBetter ? delta > 0 : delta < 0;
          const fromPosition = Math.min(100, (from / spec.scaleMax) * 100);
          const toPosition = Math.min(100, (to / spec.scaleMax) * 100);

          return (
            <div key={spec.key} className="px-1">
              <div className="flex items-baseline justify-between text-[11px] font-mono mb-1">
                <span className="text-neutral-400">{spec.label}</span>
                <span className="flex items-baseline space-x-2">
                  <span className="text-neutral-500">
                    <AnimatedNumber value={from} format={spec.format} />
                    {spec.unit}
                  </span>
                  <span className="text-neutral-700">→</span>
                  <span className="text-neutral-100 font-semibold">
                    <AnimatedNumber value={to} format={spec.format} />
                    {spec.unit}
                  </span>
                  <span
                    className={`inline-flex items-center w-16 justify-end ${
                      !meaningful ? 'text-neutral-600' : improves ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {meaningful &&
                      (improves ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                    {meaningful && (
                      <AnimatedNumber
                        value={Math.abs(delta)}
                        format={(v) => (spec.key === 'annualIncome' ? formatINR(v) : v.toFixed(1))}
                        prefix={improves ? '+' : '-'}
                      />
                    )}
                    {!meaningful && <span>0.0</span>}
                  </span>
                </span>
              </div>

              <div className="relative h-1.5 rounded-full bg-[#161d28] border border-[#232f42] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-neutral-700"
                  animate={{ width: `${fromPosition}%` }}
                  transition={{ duration: 0.4 }}
                />
                <motion.div
                  className="absolute inset-y-0 rounded-full"
                  style={{ backgroundColor: improves ? theme.accent : '#fb7185', left: `${Math.min(fromPosition, toPosition)}%` }}
                  animate={{ width: `${Math.max(0, Math.abs(toPosition - fromPosition))}%` }}
                  transition={{ duration: 0.45 }}
                />
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default ComparisonView;
