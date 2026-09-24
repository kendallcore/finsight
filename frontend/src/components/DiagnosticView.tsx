import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Lock,
  Zap,
  BarChart2,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { UploadStatementResponse } from '../types';
import { api } from '../services/api';
import { SpendingBreakdown } from './SpendingBreakdown';
import { HeatCalendar } from './HeatCalendar';
import { ConfidenceBadge } from './ConfidenceBadge';
import { formatINR, personaTheme, confidenceOpacity } from '../lib/theme';

interface DiagnosticViewProps {
  data: UploadStatementResponse | null;
  setData: (data: UploadStatementResponse) => void;
}

export const DiagnosticView: React.FC<DiagnosticViewProps> = ({ data, setData }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);
  const [showTaxRef, setShowTaxRef] = useState<boolean>(false);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadStatement(file, 'salaried_individual', pdfPassword || undefined);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to process statement');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleQuickSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeSample('student_entry');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample statement');
    } finally {
      setLoading(false);
    }
  };

  const pred = data?.predictions;
  const tax = pred?.tax_breakdown;
  const features = data?.extracted_features;
  const summary = data?.statement_summary;
  const archetype = pred?.lifestyle_archetype;
  const diagnostics = pred?.lifestyle_diagnostics;

  const theme = personaTheme(archetype?.archetype_id);

  // Surface top insight
  const emphasisInsight = data?.persona_emphasis ?? data?.insights?.insights?.[0] ?? null;
  const isRunwayCritical = diagnostics && diagnostics.cash_runway_months < 1.5;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Statement Diagnostic
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Upload your bank statement to get instant insights and lifestyle analysis.
          </p>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium self-start sm:self-auto shadow-2xs">
          <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Secure & Private</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Grid (Top Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big Upload Dropzone Card */}
        <div className="lg:col-span-2 border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center relative overflow-hidden shadow-sm">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`w-full h-full flex flex-col items-center justify-center p-6 rounded-xl border border-dashed transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/10'
                : 'border-transparent'
            }`}
          >
            {/* Center Upload Squircle Icon */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-[#0D7A57] dark:text-emerald-400 shadow-xs">
              <Upload className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-4">
              Drop your Indian Bank Statement (CSV or PDF)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md">
              Supports HDFC, SBI, ICICI, Axis, Kotak or custom CSV/PDF statements
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#0C4A34] hover:bg-[#083626] text-white transition-all shadow-xs">
                <FolderOpen className="w-4 h-4" />
                <span>{loading ? 'Processing Pipeline...' : 'Browse File'}</span>
                <input
                  type="file"
                  accept=".csv,.txt,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowPasswordInput(!showPasswordInput)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-neutral-50 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1f2937] hover:border-neutral-300 transition"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>Enter PDF Password (if encrypted)</span>
              </button>
            </div>

            {showPasswordInput && (
              <div className="mt-3">
                <input
                  type="password"
                  placeholder="Enter PDF password..."
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42] text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-emerald-500 w-64 text-center font-mono shadow-2xs"
                />
              </div>
            )}

            {/* Bottom Trust Note */}
            <div className="mt-6 flex items-center space-x-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Your data is processed locally and never stored.</span>
            </div>
          </div>
        </div>

        {/* Quick Start Guide Card */}
        <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-900 dark:text-neutral-200 mb-5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Quick Start</span>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42] text-neutral-600 dark:text-neutral-400 text-xs flex items-center justify-center flex-shrink-0 font-medium">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-200">
                    Upload your statement
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    CSV or PDF format
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center flex-shrink-0 font-medium">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-200">
                    We analyze your transactions
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Using ML models trained on Indian banking data
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center flex-shrink-0 font-medium">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-200">
                    Get instant insights
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Spending patterns, lifestyle archetype, savings potential and more
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-[#181f2a] flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition flex items-center space-x-1 cursor-pointer">
                <span>Built for better financial well-being</span>
                <span>↗</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row (Supported Banks + Example Statements Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supported Banks Card */}
        <div className="lg:col-span-2 border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
            Supported Banks
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* HDFC */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42]">
              <div className="w-5 h-5 rounded bg-[#004c8f] flex items-center justify-center text-white text-[10px] font-bold">
                H
              </div>
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-300">HDFC</span>
            </div>

            {/* SBI */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42]">
              <div className="w-5 h-5 rounded-full bg-[#0092d1] flex items-center justify-center text-white text-[10px] font-bold">
                ●
              </div>
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-300">SBI</span>
            </div>

            {/* ICICI */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42]">
              <div className="w-5 h-5 rounded bg-[#f58220] flex items-center justify-center text-white text-[10px] font-bold">
                i
              </div>
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-300">ICICI</span>
            </div>

            {/* Axis */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42]">
              <div className="w-5 h-5 rounded bg-[#97144d] flex items-center justify-center text-white text-[10px] font-bold">
                ▲
              </div>
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-300">Axis</span>
            </div>

            {/* Kotak */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42]">
              <div className="w-5 h-5 rounded-full bg-[#ed1c24] flex items-center justify-center text-white text-[10px] font-bold">
                ∞
              </div>
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-300">Kotak</span>
            </div>

            {/* + More */}
            <div className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#161d28] border border-neutral-200 dark:border-[#232f42] text-xs font-medium text-neutral-500 dark:text-neutral-400">
              + More
            </div>
          </div>
        </div>

        {/* Example Statements Card */}
        <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-200">
              Example Statements
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Try a sample statement to explore the features
            </p>
          </div>

          <button
            onClick={handleQuickSample}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition text-xs font-semibold shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{loading ? 'Processing Pipeline...' : 'Load Sample Statement'}</span>
          </button>
        </div>
      </div>

      {/* Active Diagnostic Report Section (When Statement is Loaded) */}
      {data && pred && (
        <div className="space-y-6 pt-4">
          {/* Active Statement Profile Banner */}
          {summary?.filename && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#11161f] text-xs font-mono shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }} />
                  <span className="text-neutral-500 dark:text-neutral-400">Statement:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100" style={{ color: theme.accent }}>
                    {summary.account_holder_name || summary.filename}
                  </span>
                </div>
                {archetype && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded border font-semibold"
                    style={{ color: theme.accent, borderColor: theme.border, backgroundColor: theme.wash }}
                  >
                    {archetype.archetype_name}
                  </span>
                )}
              </div>
              <div className="text-neutral-500 dark:text-neutral-400">
                Processed: {summary.total_transactions} Transactions
              </div>
            </motion.div>
          )}

          {/* Persona-emphasis card */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`rounded-2xl border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] p-6 shadow-sm ${isRunwayCritical ? 'md:p-8' : ''}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  {isRunwayCritical ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {theme.emphasisTitle}
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">{theme.tagline}</p>

                {emphasisInsight ? (
                  <p className={`text-neutral-900 dark:text-neutral-200 mt-3 leading-relaxed ${isRunwayCritical ? 'text-base' : 'text-sm'}`}>
                    {emphasisInsight.insight}
                  </p>
                ) : (
                  diagnostics?.top_spend_leakages?.[0] && (
                    <p className="text-sm text-neutral-900 dark:text-neutral-200 mt-3 leading-relaxed">
                      {diagnostics.top_spend_leakages[0]}
                    </p>
                  )
                )}
              </div>

              <div className="flex-shrink-0 text-right">
                {emphasisInsight && (
                  <>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      Recoverable
                    </div>
                    <div className={`font-bold font-mono text-emerald-600 dark:text-emerald-400 ${isRunwayCritical ? 'text-3xl' : 'text-2xl'}`}>
                      {formatINR(emphasisInsight.impact_rupees)}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400">per month</div>
                  </>
                )}
                {diagnostics && (
                  <div className="mt-3 text-[11px] font-mono">
                    <span className="text-neutral-500">Runway </span>
                    <span className={isRunwayCritical ? 'text-rose-600 font-bold' : 'text-neutral-900 dark:text-neutral-200'}>
                      {diagnostics.cash_runway_months} mo
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 4 Executive Verdict KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Predicted Inflow */}
            <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Estimated Annual Inflow</span>
                <span className="font-mono text-[10px] bg-neutral-100 dark:bg-[#161d28] px-1.5 py-0.5 rounded border border-neutral-200 dark:border-[#232f42] text-neutral-600 dark:text-neutral-400">
                  Regression
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                {formatINR(pred.estimated_annual_income)}
              </div>
              <div className="mt-2 text-[11px] text-neutral-400 font-mono">
                95% CI: {formatINR(pred.income_confidence_interval[0])} – {formatINR(pred.income_confidence_interval[1])}
              </div>
            </div>

            {/* Lifestyle Archetype */}
            <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Lifestyle Archetype</span>
                {archetype && <ConfidenceBadge confidence={archetype.confidence} />}
              </div>
              <div
                className="mt-2 text-lg font-bold font-mono truncate"
                style={{ color: theme.accent, opacity: confidenceOpacity(archetype?.confidence) }}
              >
                {archetype?.archetype_name ?? 'Not classified'}
              </div>
              <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                {archetype?.summary ?? 'The archetype classifier did not return a summary.'}
              </div>
            </div>

            {/* Financial Health Score & Runway */}
            <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Financial Health Score</span>
                {diagnostics && (
                  <span className="font-mono text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                    {diagnostics.health_grade}
                  </span>
                )}
              </div>
              {diagnostics ? (
                <>
                  <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                    {diagnostics.financial_health_score}{' '}
                    <span className="text-sm font-normal text-neutral-400">/ 100</span>
                  </div>
                  <div className="mt-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    Runway: {diagnostics.cash_runway_months} Months Reserve Buffer
                  </div>
                </>
              ) : (
                <div className="mt-2 text-[11px] font-mono text-neutral-400">Diagnostics unavailable</div>
              )}
            </div>

            {/* Persona Cluster */}
            <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Latent Space Cluster</span>
                <span className="font-mono text-[10px] bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-500/20">
                  K-Means (k=4)
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-neutral-900 dark:text-neutral-200">
                {pred.assigned_cluster.persona_name}
              </div>
              <div className="mt-2 text-[11px] text-neutral-400 font-mono">
                PCA 3D: [{pred.assigned_cluster.pca_3d_coord.join(', ')}]
              </div>
            </div>
          </div>

          {/* Category / time-series breakdown */}
          {features && (
            <SpendingBreakdown
              features={features}
              categoryBreakdown={data.category_breakdown ?? summary?.category_breakdown ?? []}
              monthlyBreakdown={data.monthly_category_breakdown ?? summary?.monthly_category_breakdown ?? []}
              transactions={data.transactions ?? []}
            />
          )}

          {/* Diagnostics Detail & Coaching */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-[#18202d] pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-mono uppercase text-neutral-900 dark:text-neutral-200 tracking-wider">
                    Lifestyle Spending & Cashflow Diagnostics
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  50 / 30 / 20 Framework
                </span>
              </div>

              {diagnostics ? (
                <div className="space-y-4">
                  {[
                    { label: 'Essential Needs (Rent, EMI, Utilities)', value: diagnostics.needs_ratio_percent, target: 'Target: ≤50%', ceiling: 50, color: '#3b82f6' },
                    { label: 'Discretionary Wants (Dining, Leisure, Shopping)', value: diagnostics.wants_ratio_percent, target: 'Target: ≤30%', ceiling: 30, color: '#f59e0b' },
                    { label: 'Wealth & Savings (SIP, Investments, Surplus)', value: diagnostics.savings_ratio_percent, target: 'Target: ≥20%', ceiling: 20, color: '#10b981' }
                  ].map((bar) => {
                    const breached = bar.label.startsWith('Wealth')
                      ? bar.value < bar.ceiling
                      : bar.value > bar.ceiling;
                    return (
                      <div key={bar.label}>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-neutral-700 dark:text-neutral-300">{bar.label}</span>
                          <span className={breached ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                            {bar.value.toFixed(1)}%{' '}
                            <span className="text-neutral-400 font-normal">({bar.target})</span>
                          </span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-[#161d28] rounded-full h-2 overflow-hidden border border-neutral-200 dark:border-[#232f42]">
                          <motion.div
                            className="h-2 rounded-full"
                            style={{ backgroundColor: breached ? '#f59e0b' : bar.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, bar.value * 1.6)}%` }}
                            transition={{ type: 'spring', stiffness: 55, damping: 15 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  Diagnostics were not returned for this statement.
                </p>
              )}

              {/* Detected Leakages */}
              {diagnostics && (
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-[#18202d]">
                  <div className="flex items-center space-x-1.5 text-xs font-mono text-neutral-800 dark:text-neutral-300 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Detected Spending Leakages & Friction Points:</span>
                  </div>
                  <div className="space-y-1.5">
                    {diagnostics.top_spend_leakages.map((leak, idx) => (
                      <div key={`${leak}-${idx}`} className="flex items-start space-x-2 text-xs text-neutral-700 dark:text-neutral-400 bg-neutral-50 dark:bg-[#161d28]/60 p-2.5 rounded-xl border border-neutral-200 dark:border-[#232f42]">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{leak}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching Tips */}
              {diagnostics && (
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-[#18202d]">
                  <div className="flex items-center space-x-1.5 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Persona Coaching Notes:</span>
                  </div>
                  <div className="space-y-1.5">
                    {diagnostics.coaching_insights.map((tip, idx) => (
                      <div key={`${tip}-${idx}`} className="flex items-start space-x-2 text-xs text-neutral-800 dark:text-neutral-300 bg-emerald-50/50 dark:bg-[#0f141c] p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsible Tax Ref */}
              {tax && (
                <div className="pt-2 border-t border-neutral-100 dark:border-[#18202d]">
                  <button
                    onClick={() => setShowTaxRef(!showTaxRef)}
                    className="flex items-center space-x-1.5 text-[11px] font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition"
                  >
                    {showTaxRef ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>{showTaxRef ? 'Hide Statutory Section 115BAC Reference' : 'Show Statutory Section 115BAC Reference'}</span>
                  </button>

                  {showTaxRef && (
                    <div className="mt-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-[#0a0d13] border border-neutral-200 dark:border-[#1d2634] space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Gross Annual Turnover / Inflow:</span>
                        <span>{formatINR(tax.gross_income)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Standard Deduction:</span>
                        <span>- {formatINR(tax.standard_deduction)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Taxable Income:</span>
                        <span>{formatINR(tax.taxable_income)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-900 dark:text-neutral-200 font-bold">
                        <span>Net Tax Payable:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{formatINR(tax.net_tax_payable)} ({tax.effective_tax_rate_percent}%)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <HeatCalendar transactions={data.transactions ?? []} archetypeId={archetype?.archetype_id} />
          </div>

          {/* 16D Feature Vector Table */}
          {features && (
            <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-mono uppercase text-neutral-700 dark:text-neutral-400 tracking-wider font-semibold">
                  Extracted 16-Dimensional Financial Feature Vector
                </h4>
                <span className="text-[10px] font-mono text-neutral-500">
                  Statement TXN Count: {summary?.total_transactions} | Inflow: {formatINR(summary?.total_credits || 0)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(features).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161d28]/70 border border-neutral-200 dark:border-[#232f42]">
                    <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate" title={key}>
                      {key}
                    </div>
                    <div className="text-sm font-mono font-semibold text-neutral-900 dark:text-neutral-200 mt-1">
                      {typeof val === 'number' ? val.toFixed(4) : val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosticView;
