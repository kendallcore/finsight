import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BrainCircuit, Download, RefreshCw, Sparkles } from 'lucide-react';
import { InsightResponse, UploadStatementResponse } from '../types';
import { api } from '../services/api';
import { InsightTimeline } from './InsightTimeline';
import { PersonaComparison } from './PersonaComparison';
import { GoalTracker, GoalInputs } from './GoalTracker';
import { ConfidenceBadge } from './ConfidenceBadge';
import { formatINR, personaTheme } from '../lib/theme';

interface InsightsViewProps {
  data: UploadStatementResponse | null;
  onGoToDiagnostic: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ data, onGoToDiagnostic }) => {
  const [fresh, setFresh] = useState<InsightResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = data?.statement_summary;
  const statementsLabel = summary?.filename ?? 'uploaded statement';

  // The upload response already carries insights; refetching lets the user re-run the engine
  // after tweaking thresholds without re-uploading.
  const insights = data?.insights ?? fresh;

  useEffect(() => {
    setFresh(null);
  }, [data]);

  const refresh = async () => {
    if (!data) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await api.createInsights({
        features: data.extracted_features as unknown as Record<string, number>,
        category_breakdown: data.category_breakdown ?? [],
        monthly_category_breakdown: data.monthly_category_breakdown ?? [],
        transactions: data.transactions ?? [],
        archetype_id: data.predictions.lifestyle_archetype?.archetype_id,
        archetype_name: data.predictions.lifestyle_archetype?.archetype_name,
        archetype_confidence: data.predictions.lifestyle_archetype?.confidence,
        total_credits: summary?.total_credits,
        total_debits: summary?.total_debits
      });
      setFresh(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the insights engine');
    } finally {
      setRefreshing(false);
    }
  };

  const theme = personaTheme(insights?.archetype_id ?? data?.predictions?.lifestyle_archetype?.archetype_id);

  const goalInputs = useMemo<GoalInputs | null>(() => {
    if (!data || !summary || !data.predictions.lifestyle_diagnostics) return null;
    const months = Math.max(
      new Set((data.monthly_category_breakdown ?? []).map((row) => row.month)).size || 1,
      1
    );
    const features = data.extracted_features;
    return {
      monthlyIncome: summary.total_credits / months,
      monthlySpend: summary.total_debits / months,
      fixedRatio: features.fixed_obligation_ratio,
      discretionaryRatio: features.discretionary_ratio,
      savingsRatio: Math.max(features.net_savings_ratio, 0),
      investmentRatio: features.investment_ratio,
      runwayMonths: data.predictions.lifestyle_diagnostics.cash_runway_months
    };
  }, [data, summary]);

  if (!data) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pt-12">
        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: theme.wash, color: theme.accent }}>
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-100">No statement analysed yet</h2>
            <p className="text-xs text-neutral-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              The coaching timeline ranks every threshold your own transactions cross, with the monthly
              rupee impact and effort for each. Upload a statement or load a preset to populate it.
            </p>
          </div>
          <button
            onClick={onGoToDiagnostic}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#10b981] hover:bg-[#059669] text-white transition"
          >
            <Download className="w-4 h-4" />
            <span>Go to Statement Diagnostic</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Coaching Insights</h1>
          <p className="text-xs text-neutral-400 mt-1 truncate">
            Ranked recommendations from{' '}
            <span className="font-mono text-neutral-300">{statementsLabel}</span>
            {insights && (
              <>
                {' '}· {insights.insights.length} triggered rules · {insights.anomalies.length} anomalies
              </>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {insights && (
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Addressable</div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                {formatINR(insights.tracked_savings_potential)}/mo
              </div>
            </div>
          )}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#161d28] border border-[#232f42] text-neutral-300 hover:text-white hover:border-neutral-600 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Re-run engine</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Persona banner — themed by the detected archetype */}
      {insights && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-5 flex flex-col md:flex-row md:items-center gap-4"
          style={{ borderColor: theme.border, backgroundColor: theme.wash }}
        >
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: theme.accent }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-100">{insights.user_archetype}</h3>
                <ConfidenceBadge confidence={insights.archetype_confidence} label="persona" />
              </div>
              <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">{insights.persona_critique}</p>
              <p className="text-[10px] font-mono text-neutral-500 mt-2">
                {formatINR(insights.monthly_income)}/mo inflow · {formatINR(insights.monthly_spend)}/mo outflow
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {insights ? (
            <InsightTimeline
              insights={insights.insights}
              anomalies={insights.anomalies}
              storageKey={summary?.filename ?? 'statement'}
              archetypeId={insights.archetype_id}
              archetypeName={insights.user_archetype}
            />
          ) : (
            <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-12 text-center text-xs font-mono text-neutral-500">
              This statement was analysed before the insights engine was attached. Re-run the engine or
              re-upload to build the timeline.
            </div>
          )}
        </div>

        <div className="space-y-6">
          {insights?.persona_comparison && (
            <PersonaComparison
              comparison={insights.persona_comparison}
              archetypeId={insights.archetype_id}
            />
          )}
          {goalInputs && (
            <GoalTracker current={goalInputs} archetypeId={insights?.archetype_id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
