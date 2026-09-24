import React from 'react';
import { motion } from 'framer-motion';
import { Gauge } from 'lucide-react';
import { CONFIDENCE_FLOOR } from '../lib/theme';

/**
 * Confidence presentation primitives shared by every prediction surface, so a 0.6 persona
 * reading looks the same in the diagnostic, the simulator and the coaching timeline.
 */

interface ConfidenceBadgeProps {
  confidence: number;
  label?: string;
  /** Compact hides the "low" word marker, leaving just the colour cue. */
  compact?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, label, compact = false }) => {
  const percent = Math.round(confidence * 100);
  const low = confidence < CONFIDENCE_FLOOR;

  return (
    <span
      className={`inline-flex items-center space-x-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
        low
          ? 'bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25'
      }`}
      title={
        low
          ? 'Low confidence — the evidence only just clears the threshold, so treat it as a hint'
          : 'High confidence — strongly supported by the data'
      }
    >
      <Gauge className="w-3 h-3" />
      {label && <span className="uppercase tracking-wider text-neutral-500">{label}</span>}
      <span>{percent}%</span>
      {low && !compact && <span className="uppercase tracking-wider">low</span>}
    </span>
  );
};

interface ConfidenceBarProps {
  confidence: number;
  label: string;
  color?: string;
}

/** Horizontal confidence meter with the 0.7 decision threshold marked. */
export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence, label, color = '#34d399' }) => {
  const percent = Math.max(0, Math.min(100, confidence * 100));
  const low = confidence < CONFIDENCE_FLOOR;

  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px] font-mono mb-1">
        <span className={low ? 'text-neutral-500' : 'text-neutral-700 dark:text-neutral-300'}>{label}</span>
        <span className={low ? 'text-neutral-500' : 'text-neutral-900 dark:text-neutral-100 font-semibold'}>{percent.toFixed(0)}%</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-neutral-100 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: low ? '#52525b' : color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        />
        <span
          className="absolute inset-y-0 w-px bg-neutral-500/70"
          style={{ left: `${CONFIDENCE_FLOOR * 100}%` }}
          title="Confidence floor"
        />
      </div>
    </div>
  );
};

export const EffortDots: React.FC<{ effort: number }> = ({ effort }) => (
  <span className="inline-flex items-center space-x-1" title={`Effort ${effort} of 3`}>
    {[1, 2, 3].map((step) => (
      <span
        key={step}
        className={`w-1.5 h-1.5 rounded-full ${step <= effort ? 'bg-current' : 'bg-neutral-700'}`}
      />
    ))}
  </span>
);

/** Wraps low-confidence predictions so they visually recede instead of disappearing. */
export const confidenceOpacity = (confidence?: number): number =>
  confidence !== undefined && confidence < CONFIDENCE_FLOOR ? 0.62 : 1;
