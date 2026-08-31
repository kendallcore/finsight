import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { ModelEvaluationResponse } from '../types';

export const EvaluationHub: React.FC = () => {
  const [evalData, setEvalData] = useState<ModelEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEval = async () => {
      try {
        const res = await api.getEvaluation();
        setEvalData(res);
      } catch (err) {
        console.error('Failed to load evaluation metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEval();
  }, []);

  if (loading) {
    return (
      <div className="border border-neutral-800 bg-[#121316] rounded-lg p-12 text-center text-xs font-mono text-neutral-400">
        Loading ML cross-validation benchmarks...
      </div>
    );
  }

  if (!evalData) {
    return (
      <div className="border border-neutral-800 bg-[#121316] rounded-lg p-12 text-center text-xs font-mono text-rose-400">
        No evaluation benchmarks found. Ensure models have been trained.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-neutral-800 bg-[#121316] rounded-lg p-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-neutral-100">
              Machine Learning Model Evaluation & Benchmark Lab
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {evalData.tax_regime_year}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Comparative performance metrics across multiple linear, kernel, and ensemble algorithms trained on 10,000 multi-source Indian banking profiles.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-2 rounded text-right">
            <div className="text-[10px] text-neutral-500">Top Regressor</div>
            <div className="font-bold text-emerald-400">{evalData.best_models.regression}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-2 rounded text-right">
            <div className="text-[10px] text-neutral-500">Top Classifier</div>
            <div className="font-bold text-emerald-400">{evalData.best_models.classification}</div>
          </div>
        </div>
      </div>

      {/* Regression & Classification Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regression Leaderboard */}
        <div className="border border-neutral-800 bg-[#121316] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase text-neutral-300 tracking-wider">
              Task 1: Income Regression Leaderboard
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">Target: Annual Income (₹)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                  <th className="pb-2">Algorithm</th>
                  <th className="pb-2 text-right">R² Score</th>
                  <th className="pb-2 text-right">RMSE (₹)</th>
                  <th className="pb-2 text-right">MAPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {evalData.regression_comparison.map((item, idx) => {
                  const isBest = item.model_name === evalData.best_models.regression;
                  return (
                    <tr key={idx} className={isBest ? 'bg-emerald-950/20 text-emerald-300' : 'text-neutral-300'}>
                      <td className="py-2.5 flex items-center space-x-1.5 font-medium">
                        {isBest && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                        <span className="truncate">{item.model_name}</span>
                      </td>
                      <td className="py-2.5 text-right font-bold">{item.r2_score.toFixed(4)}</td>
                      <td className="py-2.5 text-right text-neutral-400">₹{item.rmse.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-right text-neutral-400">{item.mape_percent.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classification Leaderboard */}
        <div className="border border-neutral-800 bg-[#121316] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase text-neutral-300 tracking-wider">
              Task 2: 7-Slab Classification Leaderboard
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">Target: Classes 0 to 6</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                  <th className="pb-2">Algorithm</th>
                  <th className="pb-2 text-right">Accuracy</th>
                  <th className="pb-2 text-right">Macro F1</th>
                  <th className="pb-2 text-right">Weighted F1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {evalData.classification_comparison.map((item, idx) => {
                  const isBest = item.model_name === evalData.best_models.classification;
                  return (
                    <tr key={idx} className={isBest ? 'bg-emerald-950/20 text-emerald-300' : 'text-neutral-300'}>
                      <td className="py-2.5 flex items-center space-x-1.5 font-medium">
                        {isBest && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                        <span className="truncate">{item.model_name}</span>
                      </td>
                      <td className="py-2.5 text-right font-bold">{(item.accuracy * 100).toFixed(2)}%</td>
                      <td className="py-2.5 text-right text-neutral-400">{item.macro_f1.toFixed(4)}</td>
                      <td className="py-2.5 text-right text-neutral-400">{item.weighted_f1.toFixed(4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7x7 Confusion Matrix Heatmap */}
        <div className="border border-neutral-800 bg-[#121316] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase text-neutral-300 tracking-wider">
              7 × 7 Tax Slab Confusion Matrix
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">Predicted vs Actual</span>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-8 gap-1 text-[10px] font-mono text-center">
                <div className="text-neutral-500 font-bold p-1">Act\Pred</div>
                {evalData.confusion_matrix_labels.map((_, idx) => (
                  <div key={idx} className="p-1 bg-neutral-900 text-neutral-400 font-bold rounded">
                    C{idx}
                  </div>
                ))}

                {evalData.confusion_matrix.map((row, rIdx) => (
                  <React.Fragment key={rIdx}>
                    <div className="p-1 bg-neutral-900 text-neutral-400 font-bold rounded flex items-center justify-center">
                      C{rIdx}
                    </div>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      return (
                        <div
                          key={cIdx}
                          className={`p-2 rounded font-bold transition-all ${
                            isDiagonal
                              ? val > 0 ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' : 'bg-neutral-900 text-neutral-600'
                              : val > 0 ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50' : 'bg-neutral-900/40 text-neutral-600'
                          }`}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="border border-neutral-800 bg-[#121316] rounded-lg p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono uppercase text-neutral-300 tracking-wider">
              16D Feature Importance (Ensemble Gini Gain)
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">Normalized Weight</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={evalData.feature_importance.slice(0, 8)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
              >
                <XAxis type="number" stroke="#525252" tick={{ fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" stroke="#737373" tick={{ fontSize: 9 }} width={90} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Importance']}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px' }}
                />
                <Bar dataKey="importance" fill="#10b981" radius={[0, 4, 4, 0]}>
                  {evalData.feature_importance.slice(0, 8).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#34d399' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
