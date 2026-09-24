import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Palmtree, PiggyBank, ShieldCheck, TrendingUp } from 'lucide-react';
import { formatINR, personaTheme } from '../lib/theme';

export interface GoalInputs {
  monthlyIncome: number;
  monthlySpend: number;
  /** Share of outflow (0-1). */
  fixedRatio: number;
  discretionaryRatio: number;
  /** Share of inflow (0-1). */
  savingsRatio: number;
  investmentRatio: number;
  runwayMonths: number;
}

interface GoalTrackerProps {
  current: GoalInputs;
  /** The what-if state, when the caller has one (simulator). */
  projected?: GoalInputs | null;
  projectionLabel?: string;
  archetypeId?: number;
}

const BUFFER_MONTHS = 6;
const HOLIDAY_MONTHS = 3;
const CORPUS_INCOME_YEARS = 1;

/** Whole months needed to close a gap at a fixed monthly contribution. Infinity if unreachable. */
function monthsTo(target: number, current: number, monthlyContribution: number): number {
  const remaining = target - current;
  if (remaining <= 0) return 0;
  if (monthlyContribution <= 0) return Infinity;
  return Math.ceil(remaining / monthlyContribution);
}

function describeMonths(months: number): string {
  if (!Number.isFinite(months)) return 'never';
  if (months === 0) return 'funded';
  if (months >= 12) return `${(months / 12).toFixed(1)} yrs`;
  return `${months} mo`;
}

interface Goal {
  id: string;
  label: string;
  caption: string;
  icon: React.ReactNode;
  target: number;
  current: number;
  months: number;
  projectedMonths?: number;
  accent: string;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  current,
  projected = null,
  projectionLabel = 'With these changes',
  archetypeId
}) => {
  const theme = personaTheme(archetypeId);

  const goals = useMemo<Goal[]>(() => {
    const essentialMonthly = current.monthlySpend * Math.max(current.fixedRatio, 0.35);
    const bufferTarget = essentialMonthly * BUFFER_MONTHS;
    const currentBuffer = essentialMonthly * Math.max(current.runwayMonths, 0);

    // Money genuinely leaving the spending stream each month.
    const retainedMonthly = current.monthlyIncome * Math.max(current.savingsRatio, 0);
    const investingMonthly = current.monthlyIncome * Math.max(current.investmentRatio, 0);

    const holidayTarget = current.monthlySpend * HOLIDAY_MONTHS * 0.25;

    const currentSet: GoalInputs = current;
    const projectedSet: GoalInputs = projected ?? current;

    const projectedRetained = projectedSet.monthlyIncome * Math.max(projectedSet.savingsRatio, 0);
    const projectedInvesting = projectedSet.monthlyIncome * Math.max(projectedSet.investmentRatio, 0);
    const projectedEssential = projectedSet.monthlySpend * Math.max(projectedSet.fixedRatio, 0.35);

    const corpusTarget = current.monthlyIncome * 12 * CORPUS_INCOME_YEARS;
    const corpusStart = investingMonthly * 12;

    return [
      {
        id: 'emergency',
        label: `Emergency Fund — ${BUFFER_MONTHS} months`,
        caption: `${formatINR(essentialMonthly)}/month of essentials covered`,
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        target: bufferTarget,
        current: currentBuffer,
        months: monthsTo(bufferTarget, currentBuffer, retainedMonthly),
        projectedMonths: projected ? monthsTo(bufferTarget, currentBuffer, Math.max(projectedRetained, retainedMonthly)) : undefined,
        accent: theme.accent
      },
      {
        id: 'holiday',
        label: 'Holiday Corpus',
        caption: `A ${HOLIDAY_MONTHS}-month-equivalent trip pot (${formatINR(holidayTarget)})`,
        icon: <Palmtree className="w-3.5 h-3.5" />,
        target: holidayTarget,
        current: 0,
        months: monthsTo(holidayTarget, 0, currentSet.discretionaryRatio > 0 ? currentSet.monthlySpend * currentSet.discretionaryRatio * 0.15 : 0),
        projectedMonths: projected
          ? monthsTo(holidayTarget, 0, projectedSet.discretionaryRatio > 0 ? projectedSet.monthlySpend * projectedSet.discretionaryRatio * 0.15 : 0)
          : undefined,
        accent: '#fbbf24'
      },
      {
        id: 'corpus',
        label: 'Investment Corpus',
        caption: `One year of inflow (${formatINR(corpusTarget)}) in the market`,
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        target: corpusTarget,
        current: corpusStart,
        months: monthsTo(corpusTarget, corpusStart, investingMonthly * 1.12),
        projectedMonths: projected ? monthsTo(corpusTarget, corpusStart, Math.max(projectedInvesting, investingMonthly) * 1.12) : undefined,
        accent: '#818cf8'
      }
    ].map((goal) => ({
      ...goal,
      // Keep the buffer target honest against the projected essentials too.
      ...(goal.id === 'emergency' && projected ? { caption: `${formatINR(Math.max(essentialMonthly, projectedEssential))}/month of essentials covered` } : {})
    }));
  }, [current, projected, theme.accent]);

  return (
    <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PiggyBank className="w-4 h-4" style={{ color: theme.accent }} />
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Goal Tracker</h3>
        </div>
        {projected && (
          <span className="text-[10px] font-mono text-neutral-500">
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">{projectionLabel}</span> shown in brackets
          </span>
        )}
      </div>

      <div className="space-y-4">
        {goals.map((goal, index) => {
          const progress = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
          const reachable = Number.isFinite(goal.months);
          const improved =
            goal.projectedMonths !== undefined && goal.projectedMonths < goal.months;
          const accelerated =
            improved ? Math.max(0, goal.months - (goal.projectedMonths as number)) : 0;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="space-y-1.5"
            >
              <div className="flex items-baseline justify-between text-xs">
                <span className="flex items-center space-x-2 text-neutral-800 dark:text-neutral-300">
                  <span style={{ color: goal.accent }}>{goal.icon}</span>
                  <span className="font-medium">{goal.label}</span>
                </span>
                <span className="font-mono text-[11px]">
                  <span className={reachable ? 'text-neutral-900 dark:text-neutral-200 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                    {describeMonths(goal.months)}
                  </span>
                  {goal.projectedMonths !== undefined && (
                    <span className={improved ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-neutral-500'}>
                      {' '}
                      [{describeMonths(goal.projectedMonths)}]
                    </span>
                  )}
                </span>
              </div>

              <div className="relative w-full h-2.5 rounded-full bg-neutral-100 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: goal.accent }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 55, damping: 15, delay: index * 0.06 }}
                />
                {goal.projectedMonths !== undefined && goal.projectedMonths < goal.months && (
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-neutral-400/30 dark:bg-white/25"
                    initial={{ width: `${progress}%` }}
                    animate={{
                      width: `${Math.min(
                        100,
                        progress + (goal.months > 0 ? ((goal.months - goal.projectedMonths) / goal.months) * (100 - progress) : 0)
                      )}%`
                    }}
                    transition={{ type: 'spring', stiffness: 55, damping: 15 }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                <span className="truncate pr-3">{goal.caption}</span>
                {improved ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 font-medium">
                    {accelerated} months sooner
                  </span>
                ) : (
                  !reachable && <span className="text-rose-600 dark:text-rose-400 flex-shrink-0">no monthly surplus to fund this</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalTracker;
