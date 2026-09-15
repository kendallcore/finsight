import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Lightbulb,
  PiggyBank,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { AnomalyItem, InsightItem } from '../types';
import { CONFIDENCE_FLOOR, formatINR, personaTheme } from '../lib/theme';
import { ConfidenceBadge, EffortDots } from './ConfidenceBadge';

interface InsightTimelineProps {
  insights: InsightItem[];
  anomalies?: AnomalyItem[];
  storageKey?: string;
  archetypeName?: string;
  archetypeId?: number;
  personaCritique?: string;
  accentLabel?: string;
}

type Dismissals = Record<string, number>;

const storageId = (key: string) => `finsight.insights.v1.${key}`;

function readDismissals(key: string): Dismissals {
  try {
    const raw = localStorage.getItem(storageId(key));
    return raw ? (JSON.parse(raw) as Dismissals) : {};
  } catch {
    return {};
  }
}

function writeDismissals(key: string, value: Dismissals): void {
  try {
    localStorage.setItem(storageId(key), JSON.stringify(value));
  } catch {
    /* private-mode / quota failures just mean dismissals are session-only */
  }
}

const anomalyKey = (anomaly: AnomalyItem) =>
  `anomaly:${anomaly.transaction_date}:${anomaly.narration}:${anomaly.amount}`;

export const InsightTimeline: React.FC<InsightTimelineProps> = ({
  insights,
  anomalies = [],
  storageKey = 'default',
  archetypeName,
  archetypeId,
  personaCritique,
  accentLabel
}) => {
  const [dismissed, setDismissed] = useState<Dismissals>(() => readDismissals(storageKey));

  const commit = useCallback(
    (next: Dismissals) => {
      setDismissed(next);
      writeDismissals(storageKey, next);
    },
    [storageKey]
  );

  const dismiss = useCallback(
    (id: string, impact: number) => commit({ ...dismissed, [id]: impact }),
    [commit, dismissed]
  );

  const restore = useCallback(
    (id: string) => {
      const next = { ...dismissed };
      delete next[id];
      commit(next);
    },
    [commit, dismissed]
  );

  const theme = personaTheme(archetypeId);

  const { totalPotential, bankedSavings } = useMemo(() => {
    const potential = [...insights, ...anomalies].reduce(
      (sum, item) => sum + ('impact_rupees' in item ? item.impact_rupees : item.amount * 0.05),
      0
    );
    const banked = Object.values(dismissed).reduce((sum, value) => sum + value, 0);
    return { totalPotential: potential, bankedSavings: banked };
  }, [insights, anomalies, dismissed]);

  const openInsights = insights.filter((item) => !(item.rule_id in dismissed));
  const openAnomalies = anomalies.filter((item) => !(anomalyKey(item) in dismissed));
  const hiddenCount = Object.keys(dismissed).length;
  const realizedShare = totalPotential > 0 ? Math.min(100, (bankedSavings / totalPotential) * 100) : 0;

  if (!insights.length && !anomalies.length) {
    return (
      <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-10 text-center space-y-2">
        <BadgeCheck className="w-6 h-6 mx-auto text-emerald-400/70" />
        <p className="text-xs text-neutral-300">No spending triggers fired on this statement.</p>
        <p className="text-[11px] text-neutral-500">
          Every ratio you track is inside its healthy band — the timeline populates as soon as a
          threshold is crossed.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6 space-y-5">
      {/* Header + trackable savings meter */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" style={{ color: theme.accent }} />
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Coaching Timeline</h3>
            {accentLabel && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ color: theme.accent, borderColor: theme.border, backgroundColor: theme.wash }}>
                {accentLabel}
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1.5 max-w-2xl leading-relaxed">
            {personaCritique ?? `Recommendations ranked by monthly rupee impact for ${archetypeName ?? 'your profile'}.`}
          </p>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Identified upside</div>
          <div className="text-xl font-bold font-mono text-neutral-100">{formatINR(totalPotential)}<span className="text-xs text-neutral-500 font-normal">/mo</span></div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-neutral-400">Savings you have banked</span>
          <span className="text-emerald-400 font-semibold">{formatINR(bankedSavings)}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#161d28] border border-[#232f42] overflow-hidden">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${realizedShare}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 16 }}
          />
        </div>
        {hiddenCount > 0 && (
          <button
            onClick={() => commit({})}
            className="mt-2 inline-flex items-center space-x-1 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset {hiddenCount} dismissed card{hiddenCount === 1 ? '' : 's'}</span>
          </button>
        )}
      </div>

      {/* Feed */}
      <div className="relative pl-5 space-y-3">
        <span className="absolute left-1 top-1 bottom-1 w-px bg-[#1d2634]" aria-hidden />

        <AnimatePresence initial={false}>
          {openInsights.map((item, index) => {
            const low = item.confidence < CONFIDENCE_FLOOR;
            return (
              <motion.div
                key={item.rule_id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: low ? 0.72 : 1, x: 0 }}
                exit={{ opacity: 0, x: 24, filter: 'blur(2px)' }}
                transition={{ duration: 0.24, delay: Math.min(index * 0.04, 0.3) }}
                className="relative"
              >
                <span
                  className="absolute -left-[19px] top-4 w-2 h-2 rounded-full ring-2 ring-[#11161f]"
                  style={{ backgroundColor: low ? '#52525b' : theme.accent }}
                  aria-hidden
                />
                <div
                  className="group rounded-xl border bg-[#0f141c] p-4 transition-colors"
                  style={{ borderColor: low ? '#232f42' : theme.border }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ color: theme.accent, backgroundColor: theme.wash }}
                        >
                          {item.category}
                        </span>
                        <ConfidenceBadge confidence={item.confidence} />
                        <span className="text-neutral-500" style={{ color: theme.accent }}>
                          <EffortDots effort={item.effort} />
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">effort {item.effort}/3</span>
                      </div>

                      <p className="text-xs text-neutral-200 leading-relaxed">{item.insight}</p>

                      {low && (
                        <p className="text-[10px] font-mono text-neutral-500 mt-2">
                          Flagged low-confidence: the signal is only just past its threshold.
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">ROI</div>
                      <div className="text-sm font-bold font-mono text-emerald-400">{formatINR(item.impact_rupees)}</div>
                      <div className="text-[10px] font-mono text-neutral-500">per month</div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => dismiss(item.rule_id, item.impact_rupees)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[#161d28] border border-[#232f42] text-neutral-400 hover:text-emerald-300 hover:border-emerald-700 transition"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark as done</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Anomaly narrative cards */}
        <AnimatePresence initial={false}>
          {openAnomalies.map((anomaly) => (
            <motion.div
              key={anomalyKey(anomaly)}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: anomaly.confidence < CONFIDENCE_FLOOR ? 0.75 : 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="relative"
            >
              <span className="absolute -left-[19px] top-4 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#11161f]" aria-hidden />
              <div className="rounded-xl border-l-2 border-l-amber-500 border border-[#3a2a12] bg-[#15100c] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                        Anomalous payment · {anomaly.category}
                      </span>
                      <ConfidenceBadge confidence={anomaly.confidence} />
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed">{anomaly.narrative}</p>
                    <p className="text-[10px] font-mono text-neutral-500 mt-2">
                      z-score {anomaly.z_score.toFixed(2)} on {anomaly.transaction_date}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-bold font-mono text-amber-300">{formatINR(anomaly.amount)}</div>
                    <div className="text-[10px] font-mono text-neutral-500">{anomaly.narration}</div>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => dismiss(anomalyKey(anomaly), anomaly.amount * 0.05)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[#1c1510] border border-[#3a2a12] text-neutral-400 hover:text-amber-300 hover:border-amber-800 transition"
                  >
                    <Check className="w-3 h-3" />
                    <span>Reviewed</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Banked cards */}
      {hiddenCount > 0 && (
        <div className="pt-4 border-t border-[#18202d] space-y-2">
          <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400">
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Banked from {hiddenCount} action{hiddenCount === 1 ? '' : 's'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(dismissed).map(([id, impact]) => (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between text-[11px] font-mono px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40"
              >
                <span className="flex items-center space-x-2 min-w-0">
                  <Sparkles className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <span className="text-neutral-500 truncate">
                    {id.startsWith('anomaly:') ? 'Anomaly reviewed' : id.replace(/_/g, ' ')}
                  </span>
                </span>
                <span className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-emerald-400 font-semibold">Saved {formatINR(impact)}</span>
                  <button
                    onClick={() => restore(id)}
                    className="text-neutral-600 hover:text-neutral-300 transition"
                    title="Undo"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightTimeline;
