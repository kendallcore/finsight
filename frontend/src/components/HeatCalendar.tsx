import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { TransactionRecord } from '../types';
import { formatINR, personaTheme } from '../lib/theme';

interface HeatCalendarProps {
  transactions: TransactionRecord[];
  archetypeId?: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL = 15;

interface DayBucket {
  iso: string;
  total: number;
  categories: Map<string, number>;
  topNarration: string;
  topAmount: number;
}

/** Ramp from dormant (near-black) through steady greens to heavy-spend red. Takes an intensity in 0-1. */
function heatColor(intensity: number): string {
  const clamped = Math.max(0, Math.min(1, intensity));
  const stops: [number, number, number][] = [
    [12, 20, 26],
    [14, 68, 63],
    [16, 132, 100],
    [202, 138, 24],
    [190, 44, 60]
  ];
  const scaled = clamped * (stops.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(stops.length - 1, lower + 1);
  const t = scaled - lower;
  const mix = stops.map((stop, index) => Math.round(stop[index] + (stops[upper][index] - stop[index]) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const HeatCalendar: React.FC<HeatCalendarProps> = ({ transactions, archetypeId }) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const theme = personaTheme(archetypeId);

  const { buckets, weeks, maxDaily, totalSpend, activeDays } = useMemo(() => {
    const map = new Map<string, DayBucket>();
    const parsed: { iso: string; bucket: DayBucket }[] = [];

    transactions
      .filter((txn) => txn.type === 'DEBIT' && txn.amount > 0)
      .forEach((txn) => {
        const date = new Date(`${txn.date}T00:00:00`);
        if (Number.isNaN(date.getTime())) return;
        const iso = toIso(date);
        let bucket = map.get(iso);
        if (!bucket) {
          bucket = { iso, total: 0, categories: new Map(), topNarration: txn.narration, topAmount: txn.amount };
          map.set(iso, bucket);
          parsed.push({ iso, bucket });
        }
        bucket.total += txn.amount;
        const category = txn.category || 'UNCATEGORISED';
        bucket.categories.set(category, (bucket.categories.get(category) ?? 0) + txn.amount);
        if (txn.amount > bucket.topAmount) {
          bucket.topAmount = txn.amount;
          bucket.topNarration = txn.narration;
        }
      });

    if (!map.size) {
      return { buckets: map, weeks: [] as (DayBucket | null)[][], maxDaily: 0, totalSpend: 0, activeDays: 0 };
    }

    const dates = [...map.keys()].sort();
    const first = new Date(`${dates[0]}T00:00:00`);
    const last = new Date(`${dates[dates.length - 1]}T00:00:00`);

    const grid: (DayBucket | null)[][] = [];
    let week: (DayBucket | null)[] = new Array(first.getDay()).fill(null);
    for (let cursor = new Date(first); cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
      const iso = toIso(cursor);
      week.push(map.get(iso) ?? { iso, total: 0, categories: new Map(), topNarration: '', topAmount: 0 });
      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      grid.push(week);
    }

    const values = [...map.values()].map((bucket) => bucket.total);
    return {
      buckets: map,
      weeks: grid,
      maxDaily: Math.max(...values, 1),
      totalSpend: values.reduce((sum, value) => sum + value, 0),
      activeDays: values.length
    };
  }, [transactions]);

  if (!weeks.length) {
    return (
      <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <CalendarDays className="w-4 h-4" style={{ color: theme.accent }} />
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Spending Heat Calendar</h3>
        </div>
        <p className="text-xs text-neutral-500 py-8 text-center">
          No dated debit transactions were returned for this statement.
        </p>
      </div>
    );
  }

  const selected = selectedDay ? buckets.get(selectedDay) : null;
  const selectedCategories = selected
    ? [...selected.categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];

  let lastMonthLabel = '';

  return (
    <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-4 h-4" style={{ color: theme.accent }} />
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Spending Heat Calendar</h3>
        </div>
        <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
          <span className="text-neutral-900 dark:text-neutral-200 font-semibold">{formatINR(totalSpend)}</span> across{' '}
          {activeDays} active day{activeDays === 1 ? '' : 's'}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          <div className="flex">
            <div className="flex flex-col gap-[3px] pr-2" style={{ width: 30 }}>
              <span style={{ height: CELL }} />
              {WEEKDAYS.map((day, index) => (
                <span key={day} className="text-[9px] font-mono text-neutral-600 leading-[15px]" style={{ height: CELL }}>
                  {index % 2 === 1 ? day : ''}
                </span>
              ))}
            </div>

            {weeks.map((week, weekIndex) => {
              const firstRealDay = week.find(Boolean) as DayBucket | undefined;
              const monthLabel = firstRealDay
                ? new Date(`${firstRealDay.iso}T00:00:00`).toLocaleString('en-US', { month: 'short' })
                : '';
              const showLabel = monthLabel && monthLabel !== lastMonthLabel;
              if (showLabel) lastMonthLabel = monthLabel;

              return (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  <span className="text-[9px] font-mono text-neutral-600 leading-[15px]" style={{ height: CELL }}>
                    {showLabel ? monthLabel : ''}
                  </span>
                  {week.map((day, dayIndex) => {
                    if (!day) return <span key={dayIndex} style={{ width: CELL, height: CELL }} />;
                    const intensity = day.total > 0 ? Math.sqrt(day.total / maxDaily) : 0;
                    const isSelected = selectedDay === day.iso;
                    return (
                      <motion.button
                        key={dayIndex}
                        type="button"
                        whileHover={{ scale: 1.35 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedDay(isSelected ? null : day.iso)}
                        aria-label={`${day.iso}: ${formatINR(day.total)} spent`}
                        className="rounded-[3px] border transition-colors"
                        style={{
                          width: CELL,
                          height: CELL,
                          backgroundColor: day.total > 0 ? heatColor(intensity) : '#0d1117',
                          borderColor: isSelected ? theme.accent : 'rgba(255,255,255,0.04)'
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-neutral-500">
          <span>less</span>
          {[0.05, 0.3, 0.55, 0.8, 1].map((step) => (
            <span key={step} className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: heatColor(step) }} />
          ))}
          <span>{formatINR(maxDaily)}</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-600">click a day to break it down</span>
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.iso}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-3 border-t border-neutral-100 dark:border-[#18202d]"
          >
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Day detail</div>
                <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  {new Date(`${selected.iso}T00:00:00`).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono" style={{ color: theme.accent }}>
                  {formatINR(selected.total)}
                </div>
                <div className="text-[10px] font-mono text-neutral-500">
                  {selected.categories.size} categor{selected.categories.size === 1 ? 'y' : 'ies'}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              {selectedCategories.map(([category, amount]) => (
                <div key={category} className="flex items-center space-x-2">
                  <span className="w-28 text-[10px] font-mono text-neutral-600 dark:text-neutral-400 truncate">{category}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-[#161d28] overflow-hidden">
                    <motion.div
                      className="h-1.5 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(amount / selected.total) * 100}%` }}
                      transition={{ duration: 0.35 }}
                    />
                  </div>
                  <span className="w-20 text-right text-[10px] font-mono text-neutral-800 dark:text-neutral-300 font-medium">{formatINR(amount)}</span>
                </div>
              ))}
            </div>

            {selected.topNarration && (
              <p className="text-[10px] font-mono text-neutral-500 mt-2">
                Largest payment: <span className="text-neutral-800 dark:text-neutral-300 font-medium">{selected.topNarration}</span>{' '}
                {formatINR(selected.topAmount)}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeatCalendar;
