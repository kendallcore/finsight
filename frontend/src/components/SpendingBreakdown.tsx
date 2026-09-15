import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Treemap,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { ArrowLeft, Layers, PieChart as PieIcon, TrendingDown } from 'lucide-react';
import {
  CategorySpendItem,
  ExtractedFeatures,
  MonthlyCategorySpend,
  TransactionRecord
} from '../types';
import { formatCompactINR, formatINR } from '../lib/theme';

interface SpendingBreakdownProps {
  features: ExtractedFeatures;
  categoryBreakdown: CategorySpendItem[];
  monthlyBreakdown?: MonthlyCategorySpend[];
  transactions?: TransactionRecord[];
}

const ALLOCATION_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
const CATEGORY_PALETTE = [
  '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
  '#f97316', '#a855f7', '#22c55e', '#eab308', '#06b6d4', '#f43f5e'
];

const tooltipStyle = {
  backgroundColor: '#11161f',
  border: '1px solid #232f42',
  borderRadius: '10px',
  fontSize: '11px',
  color: '#e5e5e5'
};

type TreemapCellProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  fillColor?: string;
  index?: number;
};

const TreemapCell = (props: TreemapCellProps) => {
  const { x = 0, y = 0, width = 0, height = 0, name, value = 0, fillColor, index = 0 } = props;
  const isLeaf = width < 42 || height < 34;
  const color = fillColor ?? CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        rx={6}
        fill={color}
        fillOpacity={isLeaf ? 0.35 : 0.62}
        stroke="#0a0c10"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
      />
      {!isLeaf && (
        <>
          <text x={x + 10} y={y + 20} fill="#f5f5f5" fontSize={11} fontWeight={600}>
            {(name ?? '').length > 16 ? `${name?.slice(0, 15)}…` : name}
          </text>
          <text x={x + 10} y={y + 36} fill="rgba(245,245,245,0.72)" fontSize={10} fontFamily="ui-monospace, monospace">
            {formatCompactINR(value)}
          </text>
        </>
      )}
    </g>
  );
};

export const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({
  features,
  categoryBreakdown,
  monthlyBreakdown = [],
  transactions = []
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allocationData = useMemo(() => {
    const needs = Math.max(0, features.fixed_obligation_ratio * 100);
    const wants = Math.max(0, features.discretionary_ratio * 100);
    const savings = Math.max(0, (features.net_savings_ratio + features.investment_ratio) * 100);
    // Whatever the three behavioural ratios do not account for is shown as unallocated rather
    // than silently dropped, so the donut always sums to the whole outflow picture.
    const other = Math.max(0, 100 - (needs + wants + savings));
    return [
      { name: 'Needs (rent, EMI, utilities)', value: Number(needs.toFixed(1)), fill: ALLOCATION_COLORS[0] },
      { name: 'Wants (dining, travel, shopping)', value: Number(wants.toFixed(1)), fill: ALLOCATION_COLORS[1] },
      { name: 'Savings & investments', value: Number(savings.toFixed(1)), fill: ALLOCATION_COLORS[2] },
      { name: 'Unallocated', value: Number(other.toFixed(1)), fill: ALLOCATION_COLORS[3] }
    ].filter((slice) => slice.value > 0.05);
  }, [features]);

  const treemapData = useMemo(
    () =>
      categoryBreakdown.map((entry, index) => ({
        name: entry.category,
        size: entry.amount,
        percentage_of_total: entry.percentage_of_total,
        transaction_count: entry.transaction_count,
        fillColor: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
      })),
    [categoryBreakdown]
  );

  /** Months on the x-axis, top categories stacked, everything else folded into "Other". */
  const monthlySeries = useMemo(() => {
    if (!monthlyBreakdown.length) return { rows: [] as Record<string, number | string>[], keys: [] as string[] };

    const totals = new Map<string, number>();
    monthlyBreakdown.forEach((row) => totals.set(row.category, (totals.get(row.category) ?? 0) + row.amount));
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const keys = ranked.slice(0, 6).map(([category]) => category);
    const keySet = new Set(keys);

    const byMonth = new Map<string, Record<string, number>>();
    monthlyBreakdown.forEach((row) => {
      const bucket = byMonth.get(row.month) ?? {};
      const label = keySet.has(row.category) ? row.category : 'Other';
      bucket[label] = (bucket[label] ?? 0) + row.amount;
      byMonth.set(row.month, bucket);
    });

    const rows = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, bucket]) => {
        const row: Record<string, number | string> = { month };
        [...keys, 'Other'].forEach((key) => {
          if (bucket[key]) row[key] = Number(bucket[key].toFixed(0));
        });
        return row;
      });

    return { rows, keys: [...keys, 'Other'] };
  }, [monthlyBreakdown]);

  const selectedEntry = categoryBreakdown.find((entry) => entry.category === selectedCategory) ?? null;

  const topMerchants = useMemo(() => {
    if (!selectedCategory) return [];
    const hits = transactions.filter(
      (txn) => txn.type === 'DEBIT' && txn.category.toUpperCase() === selectedCategory.toUpperCase()
    );
    const byMerchant = new Map<string, { total: number; count: number }>();
    hits.forEach((txn) => {
      const key = txn.narration.replace(/\s+/g, ' ').trim().slice(0, 34) || 'UNNAMED';
      const current = byMerchant.get(key) ?? { total: 0, count: 0 };
      byMerchant.set(key, { total: current.total + txn.amount, count: current.count + 1 });
    });
    return [...byMerchant.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([narration, stats]) => ({ narration, ...stats }));
  }, [selectedCategory, transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs / Wants / Savings donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6"
        >
          <div className="flex items-center space-x-2 mb-2">
            <PieIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Needs / Wants / Savings</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
                  {allocationData.map((slice) => (
                    <Cell key={slice.name} fill={slice.fill} stroke="#0a0c10" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | string, name: string) => [`${Number(value).toFixed(1)}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {allocationData.map((slice) => (
              <div key={slice.name} className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center space-x-2 text-neutral-400 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: slice.fill }} />
                  <span className="truncate">{slice.name}</span>
                </span>
                <span className="text-neutral-200 font-semibold ml-2">{slice.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category treemap with drill-down */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="lg:col-span-2 border border-[#1d2634] bg-[#11161f] rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Where The Money Went — {selectedCategory ? 'Drill-down' : 'By category'}
              </h3>
            </div>
            <AnimatePresence initial={false}>
              {selectedCategory ? (
                <motion.button
                  key="back"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#161d28] border border-[#232f42] text-[11px] text-neutral-300 hover:text-white hover:border-neutral-600 transition"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>All categories</span>
                </motion.button>
              ) : (
                <motion.span
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-mono text-neutral-500"
                >
                  click a tile to drill down
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Keyboard/SR-reachable alternative to the SVG-only treemap tiles. */}
          {categoryBreakdown.length === 0 && (
            <p className="text-xs text-neutral-500 py-8 text-center">
              Category tagging returned no rows for this statement.
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {categoryBreakdown.slice(0, 8).map((entry, index) => {
              const isActive = selectedCategory === entry.category;
              const color = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
              return (
                <button
                  key={entry.category}
                  type="button"
                  aria-label={`Drill down: ${entry.category}`}
                  aria-pressed={isActive}
                  onClick={() => setSelectedCategory(isActive ? null : entry.category)}
                  className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg text-[10px] font-mono border transition"
                  style={{
                    borderColor: isActive ? color : '#232f42',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : '#0f141c',
                    color: isActive ? '#f5f5f5' : '#a1a1aa'
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span>{entry.category}</span>
                  <span className="text-neutral-500">{entry.percentage_of_total.toFixed(0)}%</span>
                </button>
              );
            })}
          </div>

          {!selectedCategory && categoryBreakdown.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  nameKey="name"
                  aspectRatio={4 / 3}
                  isAnimationActive={false}
                  onClick={(node: { name?: string }) => {
                    if (node?.name) setSelectedCategory(node.name);
                  }}
                  content={<TreemapCell />}
                />
              </ResponsiveContainer>
            </div>
          )}

          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 space-y-3"
            >
              {selectedEntry && (
                <div className="flex flex-wrap items-baseline justify-between gap-2 p-4 rounded-xl bg-[#0a0d13] border border-[#18202d]">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Category</div>
                    <div className="text-lg font-bold text-neutral-100 font-mono">{selectedEntry.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400 font-mono">{formatINR(selectedEntry.amount)}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {selectedEntry.percentage_of_total.toFixed(1)}% of outflow · {selectedEntry.transaction_count} transactions
                    </div>
                  </div>
                </div>
              )}

              {topMerchants.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    Largest payments in this category
                  </div>
                  {topMerchants.map((merchant) => (
                    <div
                      key={merchant.narration}
                      className="flex items-center justify-between text-[11px] font-mono px-3 py-2 rounded-lg bg-[#161d28]/60 border border-[#232f42]"
                    >
                      <span className="text-neutral-300 truncate pr-3">{merchant.narration}</span>
                      <span className="text-neutral-400 flex-shrink-0">
                        {formatINR(merchant.total)}{' '}
                        <span className="text-neutral-600">× {merchant.count}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500">
                  Transaction-level detail for this category was not included in the response.
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Monthly stacked trend */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <TrendingDown className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Monthly Outflow By Category</h3>
        </div>

        {monthlySeries.rows.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-xs font-mono text-neutral-500">
            No monthly time series returned for this statement.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries.rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18202d" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#71717a' }} stroke="#232f42" tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  stroke="#232f42"
                  tickLine={false}
                  tickFormatter={(value: number) => formatCompactINR(value)}
                  width={62}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  formatter={(value: number | string, name: string) => [formatINR(Number(value)), name]}
                />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'ui-monospace, monospace' }} />
                {monthlySeries.keys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="spend"
                    fill={CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]}
                    radius={index === monthlySeries.keys.length - 1 ? [4, 4, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SpendingBreakdown;
