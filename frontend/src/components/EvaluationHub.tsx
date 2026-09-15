import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  AlertCircle,
  BarChart3,
  Boxes,
  Crosshair,
  Layers,
  Star,
  Trophy
} from 'lucide-react';
import { api } from '../services/api';
import { ModelEvaluationResponse, PCAPoint } from '../types';
import { formatINR } from '../lib/theme';

// Plotly is ~1MB minified and only used by the 3D scatter, so keep it out of the
// entry chunk and load it lazily with the Evaluation tab.
const PcaScatter3D = React.lazy(() => import('./PcaScatter3D'));

interface EvaluationHubProps {
  userCoord?: number[] | null;
  userLabel?: string;
}

const tooltipStyle = {
  backgroundColor: '#11161f',
  border: '1px solid #232f42',
  borderRadius: '10px',
  fontSize: '11px',
  color: '#e5e5e5'
};

const MATRIX_PALETTE = ['#34d399', '#fbbf24', '#fb7185', '#818cf8', '#14b8a6', '#f97316', '#a855f7'];

/** Heat intensity for a confusion-matrix cell, relative to the row's own total. */
function cellOpacity(value: number, rowTotal: number, isDiagonal: boolean): number {
  const share = rowTotal > 0 ? value / rowTotal : 0;
  if (isDiagonal) return 0.25 + 0.7 * Math.min(1, share);
  return Math.min(0.85, 0.12 + 1.8 * share);
}

export const EvaluationHub: React.FC<EvaluationHubProps> = ({ userCoord = null, userLabel }) => {
  const [evalData, setEvalData] = useState<ModelEvaluationResponse | null>(null);
  const [points, setPoints] = useState<PCAPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api.getEvaluation()
      .then((res) => {
        if (!cancelled) setEvalData(res);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Model evaluation metrics are unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    api.getPCAPoints()
      .then((res) => {
        if (!cancelled) setPoints(res.points ?? []);
      })
      .catch(() => {
        /* the scatter renders its own empty state; leaderboards stay usable */
      })
      .finally(() => {
        if (!cancelled) setPointsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const regressionModels = useMemo(() => {
    const rows = [...(evalData?.regression_comparison ?? [])].sort((a, b) => b.r2_score - a.r2_score);
    return rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      isBest: evalData?.best_models?.regression === row.model_name
    }));
  }, [evalData]);

  const classificationModels = useMemo(() => {
    const rows = [...(evalData?.classification_comparison ?? [])].sort((a, b) => b.macro_f1 - a.macro_f1);
    return rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      isBest: evalData?.best_models?.classification === row.model_name
    }));
  }, [evalData]);

  const featureImportance = useMemo(() => {
    const rows = [...(evalData?.feature_importance ?? [])].sort((a, b) => b.importance - a.importance);
    const peak = rows[0]?.importance ?? 1;
    return rows.map((row) => ({ ...row, share: peak > 0 ? (row.importance / peak) * 100 : 0 }));
  }, [evalData]);

  const matrix = evalData?.confusion_matrix ?? [];
  const matrixLabels = evalData?.confusion_matrix_labels ?? [];

  if (loading) {
    return (
      <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-12 text-center">
        <motion.div
          className="w-8 h-8 mx-auto rounded-full border-2 border-[#232f42] border-t-emerald-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        <p className="text-xs font-mono text-neutral-400 mt-4">Loading ML cross-validation benchmarks…</p>
      </div>
    );
  }

  if (error || !evalData) {
    return (
      <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-12 text-center space-y-3">
        <AlertCircle className="w-6 h-6 mx-auto text-amber-400/70" />
        <p className="text-xs text-neutral-300 max-w-md mx-auto">
          {error ?? 'No evaluation metrics were returned by the API.'}
        </p>
        <p className="text-[11px] font-mono text-neutral-500">
          Run <span className="text-neutral-300">PYTHONPATH=scripts python scripts/train_models.py</span> to produce
          models/evaluation_metrics.json, then reload.
        </p>
      </div>
    );
  }

  const evaluatedModels = regressionModels.length + classificationModels.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Model Evaluation Hub</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Cross-validation benchmarks served live from{' '}
            <span className="font-mono text-neutral-300">/api/models/evaluation</span> — {evalData.feature_count} features,{' '}
            {evalData.clustering.n_clusters} persona clusters.
          </p>
        </div>
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#161d28] border border-[#232f42] text-xs font-mono text-neutral-300 self-start sm:self-auto">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>{evalData.tax_regime_year}</span>
        </div>
      </div>

      {/* KPI summary, all derived from the API payload */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-neutral-100">{evaluatedModels}</div>
            <div className="text-xs text-neutral-400">Models Benchmarked</div>
          </div>
        </div>

        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-neutral-100">{evalData.feature_count}</div>
            <div className="text-xs text-neutral-400">Behavioral Dimensions</div>
          </div>
        </div>

        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-neutral-100">
              {evalData.clustering.silhouette_score.toFixed(3)}
            </div>
            <div className="text-xs text-neutral-400">K-Means Silhouette</div>
          </div>
        </div>

        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Star className="w-5 h-5 fill-amber-400/20" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">PCA retains</div>
            <div className="text-2xl font-bold font-mono text-neutral-100">
              {(evalData.pca_variance.total_explained_variance * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-400">variance in 3 components</div>
          </div>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Task 1: Income Regression Leaderboard
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">Target: Annual Income (₹)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#18202d] text-neutral-400 text-[11px]">
                  <th className="pb-3 w-8">#</th>
                  <th className="pb-3">Algorithm</th>
                  <th className="pb-3 text-right">R² Score</th>
                  <th className="pb-3 text-right">RMSE (₹)</th>
                  <th className="pb-3 text-right">MAPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18202d]">
                {regressionModels.map((row) => (
                  <tr key={row.model_name} className={row.isBest ? 'text-emerald-300' : 'text-neutral-300'}>
                    <td className="py-3">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                        row.isBest
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#161d28] text-neutral-500'
                      }`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      {row.model_name}
                      {row.isBest && <Trophy className="w-3 h-3 inline ml-1.5 text-emerald-400" />}
                    </td>
                    <td className="py-3 text-right font-bold">{row.r2_score.toFixed(4)}</td>
                    <td className="py-3 text-right text-neutral-400">{formatINR(row.rmse)}</td>
                    <td className="py-3 text-right text-neutral-400">{row.mape_percent.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Task 2: Classification Leaderboard
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">
              {matrixLabels.length === 4 ? '4 Spending Archetypes' : `${matrixLabels.length} Tax Slabs`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#18202d] text-neutral-400 text-[11px]">
                  <th className="pb-3 w-8">#</th>
                  <th className="pb-3">Algorithm</th>
                  <th className="pb-3 text-right">Accuracy</th>
                  <th className="pb-3 text-right">Macro F1</th>
                  <th className="pb-3 text-right">Weighted F1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18202d]">
                {classificationModels.map((row) => (
                  <tr key={row.model_name} className={row.isBest ? 'text-emerald-300' : 'text-neutral-300'}>
                    <td className="py-3">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                        row.isBest
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#161d28] text-neutral-500'
                      }`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      {row.model_name}
                      {row.isBest && <Trophy className="w-3 h-3 inline ml-1.5 text-emerald-400" />}
                    </td>
                    <td className="py-3 text-right font-bold">{(row.accuracy * 100).toFixed(2)}%</td>
                    <td className="py-3 text-right text-neutral-400">{row.macro_f1.toFixed(4)}</td>
                    <td className="py-3 text-right text-neutral-400">{row.weighted_f1.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3D latent space */}
      <Suspense
        fallback={
          <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-12 text-center text-xs font-mono text-neutral-500">
            Loading 3D projection engine…
          </div>
        }
      >
        <PcaScatter3D
          points={points}
          clusterNames={evalData.clustering.personas as Record<string, string>}
          userCoord={userCoord}
          userLabel={userLabel}
          loading={pointsLoading}
          error={points.length === 0 && !pointsLoading ? 'No PCA projection points available yet.' : null}
        />
      </Suspense>

      {/* Confusion matrix + explained variance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              {matrixLabels.length} × {matrixLabels.length} Confusion Matrix
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">best model: {evalData.best_models.classification}</span>
          </div>

          {matrix.length === 0 ? (
            <p className="text-xs text-neutral-500 py-8 text-center">No confusion matrix returned.</p>
          ) : (
            <div className="flex">
              <div className="flex items-center justify-center mr-2">
                <span className="transform -rotate-90 text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">
                  Actual
                </span>
              </div>
              <div className="flex-1 overflow-x-auto">
                <div
                  className="grid gap-1.5 text-[9px] font-mono text-center mb-1.5"
                  style={{ gridTemplateColumns: `minmax(64px, 84px) repeat(${matrixLabels.length}, minmax(0, 1fr))` }}
                >
                  <div />
                  {matrixLabels.map((label) => (
                    <div key={label} className="p-1 text-neutral-400 font-semibold truncate" title={label}>
                      {label}
                    </div>
                  ))}
                </div>

                {matrix.map((row, rowIdx) => {
                  const rowTotal = row.reduce((sum, value) => sum + value, 0);
                  return (
                    <div
                      key={rowIdx}
                      className="grid gap-1.5 text-[11px] font-mono text-center mb-1.5"
                      style={{ gridTemplateColumns: `minmax(64px, 84px) repeat(${matrixLabels.length}, minmax(0, 1fr))` }}
                    >
                      <div
                        className="flex items-center justify-end pr-2 text-neutral-400 font-semibold text-[9px] truncate"
                        title={matrixLabels[rowIdx]}
                      >
                        {matrixLabels[rowIdx]}
                      </div>
                      {row.map((value, colIdx) => {
                        const isDiagonal = rowIdx === colIdx;
                        const opacity = cellOpacity(value, rowTotal, isDiagonal);
                        return (
                          <div
                            key={colIdx}
                            className="p-2 rounded-lg font-bold flex items-center justify-center border"
                            title={`${matrixLabels[rowIdx]} actual → ${matrixLabels[colIdx]} predicted: ${value}`}
                            style={{
                              backgroundColor: isDiagonal
                                ? `rgba(16, 185, 129, ${opacity * 0.55})`
                                : `rgba(244, 63, 94, ${opacity * 0.5})`,
                              borderColor: isDiagonal ? 'rgba(6,95,70,0.6)' : 'rgba(127,29,29,0.45)',
                              color: isDiagonal ? '#a7f3d0' : '#fecdd3',
                              visibility: value === 0 && !isDiagonal ? 'hidden' : 'visible'
                            }}
                          >
                            {value}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                <div className="text-center text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase mt-3">
                  Predicted
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#18202d]">
            {Object.entries(evalData.clustering.personas).map(([id, name]) => (
              <div key={id} className="flex items-center space-x-2 text-[11px] font-mono">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MATRIX_PALETTE[Number(id) % MATRIX_PALETTE.length] }} />
                <span className="text-neutral-500">Cluster {id}</span>
                <span className="text-neutral-300 truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature importance, all dimensions from the API */}
        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Feature Importance ({featureImportance.length} dimensions)
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">Random Forest gain</span>
          </div>

          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportance} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#18202d" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} stroke="#232f42" tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={150}
                  tick={{ fontSize: 10, fill: '#a1a1aa', fontFamily: 'ui-monospace, monospace' }}
                  stroke="#232f42"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  formatter={(value: number | string) => [Number(value).toFixed(4), 'importance']}
                />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {featureImportance.map((row, index) => (
                    <Cell key={row.feature} fill={index < 4 ? '#14b8a6' : '#1d3b45'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-neutral-500 mt-2">
            Top driver: <span className="text-neutral-300 font-mono">{featureImportance[0]?.feature}</span> at{' '}
            <span className="text-neutral-300 font-mono">{featureImportance[0]?.importance.toFixed(4)}</span>, the
            strongest single signal in the {featureImportance.length}-dimensional vector.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EvaluationHub;
