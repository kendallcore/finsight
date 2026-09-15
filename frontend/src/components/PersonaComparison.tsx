import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { ArrowRight, GitCompareArrows, Route } from 'lucide-react';
import { PersonaComparison as PersonaComparisonData, PersonaAxis } from '../types';
import { ARCHETYPE_NAMES, personaTheme } from '../lib/theme';

interface PersonaComparisonProps {
  comparison: PersonaComparisonData;
  archetypeId?: number;
  /** Optional slider preview so the simulator can show a hypothetical position. */
  overrideScores?: Partial<Record<PersonaAxis, number>>;
  overrideLabel?: string;
}

const AXES: PersonaAxis[] = ['Essentials', 'Lifestyle', 'Savings', 'Investing', 'Digital Velocity'];

const TARGET_LABEL = ARCHETYPE_NAMES[3];

const tooltipStyle = {
  backgroundColor: '#11161f',
  border: '1px solid #232f42',
  borderRadius: '10px',
  fontSize: '11px',
  color: '#e5e5e5'
};

export const PersonaComparison: React.FC<PersonaComparisonProps> = ({
  comparison,
  archetypeId,
  overrideScores,
  overrideLabel
}) => {
  const [showBars, setShowBars] = useState(false);

  const theme = personaTheme(archetypeId);

  const userScores = useMemo<Record<PersonaAxis, number>>(
    () => ({ ...comparison.user_scores, ...(overrideScores ?? {}) }),
    [comparison.user_scores, overrideScores]
  );

  const radarData = useMemo(
    () =>
      AXES.map((axis) => {
        const point: Record<string, number | string> = { axis, You: userScores[axis] ?? 0 };
        Object.entries(comparison.benchmark_scores).forEach(([name, scores]) => {
          point[name] = scores[axis] ?? 0;
        });
        return point;
      }),
    [comparison.benchmark_scores, userScores]
  );

  /** Biggest single lever toward the strategic profile, by absolute gap on an axis. */
  const pathToTarget = useMemo(() => {
    const target = comparison.benchmark_scores[TARGET_LABEL];
    if (!target) return [];
    return AXES.map((axis) => {
      const from = userScores[axis] ?? 0;
      const to = target[axis] ?? 0;
      return { axis, from, to, delta: to - from, gap: Math.abs(to - from) };
    })
      .filter((move) => move.gap >= 4)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3);
  }, [comparison.benchmark_scores, userScores]);

  const visibleBenchmarks = Object.keys(comparison.benchmark_scores);

  return (
    <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <GitCompareArrows className="w-4 h-4" style={{ color: theme.accent }} />
          <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
            You vs. the Four Archetypes
          </h3>
        </div>
        <button
          onClick={() => setShowBars((prev) => !prev)}
          className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#161d28] border border-[#232f42] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition"
        >
          {showBars ? 'Show radar' : 'Show bars'}
        </button>
      </div>

      <p className="text-[11px] text-neutral-400">
        Your position (solid) against the behavioural prototype for each archetype. Sitting inside a
        polygon means the classifier reads you that way.
      </p>

      {!showBars ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="#1d2634" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#a1a1aa', fontFamily: 'ui-monospace, monospace' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#52525b' }} stroke="#232f42" />
              {visibleBenchmarks.map((name) => {
                const index = ARCHETYPE_NAMES.indexOf(name as (typeof ARCHETYPE_NAMES)[number]);
                const color = index >= 0 ? personaTheme(index).accent : '#71717a';
                return (
                  <Radar
                    key={name}
                    name={name}
                    dataKey={name}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.06}
                    strokeOpacity={0.5}
                    strokeDasharray="3 3"
                    isAnimationActive={false}
                  />
                );
              })}
              <Radar
                name={overrideLabel ?? 'You'}
                dataKey="You"
                stroke={theme.accent}
                fill={theme.accent}
                fillOpacity={0.24}
                strokeWidth={2}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number | string) => [`${Number(value).toFixed(1)}%`]} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'ui-monospace, monospace' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={radarData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#18202d" vertical={false} />
              <XAxis dataKey="axis" tick={{ fontSize: 9, fill: '#a1a1aa' }} stroke="#232f42" tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 9, fill: '#71717a' }} stroke="#232f42" tickLine={false} unit="%" width={44} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number | string) => [`${Number(value).toFixed(1)}%`]} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'ui-monospace, monospace' }} />
              {visibleBenchmarks.map((name) => {
                const index = ARCHETYPE_NAMES.indexOf(name as (typeof ARCHETYPE_NAMES)[number]);
                const color = index >= 0 ? personaTheme(index).accent : '#71717a';
                return <Bar key={name} dataKey={name} fill={color} fillOpacity={0.35} isAnimationActive={false} />;
              })}
              <Bar dataKey="You" fill={theme.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Path to the strategic profile */}
      <div className="pt-4 border-t border-[#18202d]">
        <div className="flex items-center space-x-2 mb-3">
          <Route className="w-4 h-4 text-amber-400" />
          <h4 className="text-[11px] font-bold text-neutral-200 uppercase tracking-wider">
            Shortest path to {TARGET_LABEL}
          </h4>
        </div>

        {pathToTarget.length === 0 ? (
          <p className="text-[11px] text-neutral-500">
            You are already within 4 points of the {TARGET_LABEL} prototype on every axis.
          </p>
        ) : (
          <div className="space-y-2">
            {pathToTarget.map((move, index) => (
              <motion.div
                key={move.axis}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
                className="flex items-center justify-between text-[11px] font-mono px-3 py-2 rounded-lg bg-[#0a0d13] border border-[#18202d]"
              >
                <span className="flex items-center space-x-2 min-w-0">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: theme.wash, color: theme.accent }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-neutral-300 truncate">{move.axis}</span>
                </span>
                <span className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-neutral-500">{move.from.toFixed(0)}%</span>
                  <ArrowRight className="w-3 h-3 text-neutral-600" />
                  <span className="font-bold" style={{ color: move.delta > 0 ? '#34d399' : '#fb7185' }}>
                    {move.to.toFixed(0)}%
                  </span>
                  <span className="text-neutral-600 w-12 text-right">
                    {move.delta > 0 ? '+' : ''}
                    {move.delta.toFixed(0)}pp
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaComparison;
