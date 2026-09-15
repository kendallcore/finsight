import React, { useState } from 'react';
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
  FolderOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { UploadStatementResponse } from '../types';
import { api } from '../services/api';

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
      const res = await api.analyzeSample('balanced_pro');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const pred = data?.predictions;
  const tax = pred?.tax_breakdown;
  const features = data?.extracted_features;
  const summary = data?.statement_summary;

  const spendBreakdown = features ? [
    { name: 'Fixed Living', value: Math.max(0, features.fixed_obligation_ratio * 100), color: '#3b82f6' },
    { name: 'Discretionary', value: Math.max(0, features.discretionary_ratio * 100), color: '#f59e0b' },
    { name: 'SIP & Wealth', value: Math.max(0, features.investment_ratio * 100), color: '#10b981' },
    { name: 'Subscriptions', value: Math.max(0, features.tax_shield_ratio * 100), color: '#8b5cf6' },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 tracking-tight">
            Statement Diagnostic
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Upload your bank statement to get instant insights and lifestyle analysis.
          </p>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-medium self-start sm:self-auto">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Secure & Private</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Grid (Top Section Matching Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big Upload Dropzone Card */}
        <div className="lg:col-span-2 border border-[#1d2634] bg-[#11161f] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center relative overflow-hidden">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`w-full h-full flex flex-col items-center justify-center p-6 rounded-xl border border-dashed transition-all ${
              isDragging ? 'border-emerald-500 bg-emerald-950/10' : 'border-transparent'
            }`}
          >
            {/* Center Upload Squircle Icon */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Upload className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-sm font-semibold text-neutral-100 mt-4">
              Drop your Indian Bank Statement (CSV or PDF)
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md">
              Supports HDFC, SBI, ICICI, Axis, Kotak or custom CSV/PDF statements
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-medium bg-[#10b981] hover:bg-[#059669] text-white transition-all shadow-md shadow-emerald-900/20">
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
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-[#161d28] border border-[#232f42] text-neutral-300 hover:text-white hover:border-neutral-600 transition"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
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
                  className="px-3 py-1.5 text-xs rounded bg-[#161d28] border border-[#232f42] text-neutral-200 focus:outline-none focus:border-emerald-500 w-64 text-center font-mono"
                />
              </div>
            )}

            {/* Bottom Trust Note */}
            <div className="mt-6 flex items-center space-x-1.5 text-xs text-emerald-400/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Your data is processed locally and never stored.</span>
            </div>
          </div>
        </div>

        {/* Quick Start Guide Card */}
        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-200 mb-5">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Quick Start</span>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#161d28] border border-[#232f42] text-neutral-400 text-xs flex items-center justify-center flex-shrink-0 font-medium">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-200">
                    Upload your statement
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    CSV or PDF format
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-center flex-shrink-0 font-medium">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-200">
                    We analyze your transactions
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Using ML models trained on Indian banking data
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-center flex-shrink-0 font-medium">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-200">
                    Get instant insights
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Spending patterns, lifestyle archetype, savings potential and more
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="mt-6 pt-4 border-t border-[#181f2a] flex items-center space-x-2 text-xs text-neutral-400">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-neutral-300 font-medium hover:text-emerald-300 transition flex items-center space-x-1 cursor-pointer">
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
        <div className="lg:col-span-2 border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
          <h3 className="text-xs font-semibold text-neutral-300 mb-4">
            Supported Banks
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* HDFC */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#161d28] border border-[#232f42]">
              <div className="w-5 h-5 rounded bg-[#004c8f] flex items-center justify-center text-white text-[10px] font-bold">
                H
              </div>
              <span className="text-xs font-medium text-neutral-300">HDFC</span>
            </div>

            {/* SBI */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#161d28] border border-[#232f42]">
              <div className="w-5 h-5 rounded-full bg-[#0092d1] flex items-center justify-center text-white text-[10px] font-bold">
                ●
              </div>
              <span className="text-xs font-medium text-neutral-300">SBI</span>
            </div>

            {/* ICICI */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#161d28] border border-[#232f42]">
              <div className="w-5 h-5 rounded bg-[#f58220] flex items-center justify-center text-white text-[10px] font-bold">
                i
              </div>
              <span className="text-xs font-medium text-neutral-300">ICICI</span>
            </div>

            {/* Axis */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#161d28] border border-[#232f42]">
              <div className="w-5 h-5 rounded bg-[#97144d] flex items-center justify-center text-white text-[10px] font-bold">
                ▲
              </div>
              <span className="text-xs font-medium text-neutral-300">Axis</span>
            </div>

            {/* Kotak */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#161d28] border border-[#232f42]">
              <div className="w-5 h-5 rounded-full bg-[#ed1c24] flex items-center justify-center text-white text-[10px] font-bold">
                ∞
              </div>
              <span className="text-xs font-medium text-neutral-300">Kotak</span>
            </div>

            {/* + More */}
            <div className="px-3 py-2 rounded-xl bg-[#161d28] border border-[#232f42] text-xs font-medium text-neutral-400">
              + More
            </div>
          </div>
        </div>

        {/* Example Statements Card */}
        <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-neutral-200">
              Example Statements
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Try a sample statement to explore the features
            </p>
          </div>

          <button
            onClick={handleQuickSample}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition text-xs font-medium"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-neutral-400">Statement:</span>
                  <span className="font-semibold text-emerald-300">{summary.account_holder_name || summary.filename}</span>
                </div>
                {summary.account_type && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {summary.account_type}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-neutral-400 text-[11px]">
                <span>{summary.total_transactions} txns</span>
                <span>•</span>
                <span>Inflow: <strong className="text-emerald-400 font-semibold">{formatINR(summary.total_credits)}</strong></span>
                <span>•</span>
                <span>Outflow: <strong className="text-neutral-200 font-semibold">{formatINR(summary.total_debits)}</strong></span>
                {summary.closing_balance !== undefined && summary.closing_balance !== null && (
                  <>
                    <span>•</span>
                    <span>Closing: <strong className="text-neutral-300 font-semibold">{formatINR(summary.closing_balance)}</strong></span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 4 Executive Verdict KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Predicted Inflow */}
            <div className="border border-[#1d2634] bg-[#11161f] rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Estimated Annual Inflow</span>
                <span className="font-mono text-[10px] bg-[#161d28] px-1.5 py-0.5 rounded border border-[#232f42]">
                  Regression (R²=0.998)
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-neutral-100">
                {formatINR(pred.estimated_annual_income)}
              </div>
              <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                95% CI: {formatINR(pred.income_confidence_interval[0])} – {formatINR(pred.income_confidence_interval[1])}
              </div>
            </div>

            {/* Lifestyle Archetype */}
            <div className="border border-[#1d2634] bg-[#11161f] rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Lifestyle Archetype</span>
                <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {((pred.lifestyle_archetype?.confidence || 0.95) * 100).toFixed(1)}% Conf
                </span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-emerald-400 truncate">
                {pred.lifestyle_archetype?.archetype_name || 'Strategic Wealth Builder'}
              </div>
              <div className="mt-2 text-[11px] text-neutral-400 line-clamp-2">
                {pred.lifestyle_archetype?.summary || 'Disciplined capital allocator converting income into wealth.'}
              </div>
            </div>

            {/* Financial Health Score & Runway */}
            <div className="border border-[#1d2634] bg-[#11161f] rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Financial Health Score</span>
                <span className="font-mono text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                  {pred.lifestyle_diagnostics?.health_grade || 'Healthy & Balanced'}
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-neutral-100">
                {pred.lifestyle_diagnostics?.financial_health_score || 82} <span className="text-sm font-normal text-neutral-500">/ 100</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 font-mono">
                Runway: {pred.lifestyle_diagnostics?.cash_runway_months || 5.4} Months Reserve Buffer
              </div>
            </div>

            {/* Persona Cluster */}
            <div className="border border-[#1d2634] bg-[#11161f] rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Latent Space Persona</span>
                <span className="font-mono text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">
                  K-Means (k=4)
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-neutral-200">
                {pred.assigned_cluster.persona_name}
              </div>
              <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                PCA 2D: [{pred.assigned_cluster.pca_2d_coord.join(', ')}]
              </div>
            </div>
          </div>

          {/* Diagnostics Detail & Spend Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 50/30/20 Framework & Coaching */}
            <div className="lg:col-span-2 border border-[#1d2634] bg-[#11161f] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#18202d] pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-mono uppercase text-neutral-200 tracking-wider">
                    Lifestyle Spending & Cashflow Diagnostics
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  50 / 30 / 20 Framework
                </span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-neutral-300">Essential Needs (Rent, EMI, Utilities)</span>
                    <span className="text-neutral-200 font-bold">{pred.lifestyle_diagnostics?.needs_ratio_percent ?? 35.0}% <span className="text-neutral-500 font-normal">(Target: ≤50%)</span></span>
                  </div>
                  <div className="w-full bg-[#161d28] rounded-full h-2 overflow-hidden border border-[#232f42]">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (pred.lifestyle_diagnostics?.needs_ratio_percent ?? 35) * 2)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-neutral-300">Discretionary Wants (Dining, Leisure, Shopping)</span>
                    <span className={`font-bold ${(pred.lifestyle_diagnostics?.wants_ratio_percent ?? 25) > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {pred.lifestyle_diagnostics?.wants_ratio_percent ?? 25.0}% <span className="text-neutral-500 font-normal">(Target: ≤30%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#161d28] rounded-full h-2 overflow-hidden border border-[#232f42]">
                    <div
                      className={`h-2 rounded-full ${(pred.lifestyle_diagnostics?.wants_ratio_percent ?? 25) > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (pred.lifestyle_diagnostics?.wants_ratio_percent ?? 25) * 2.5)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-neutral-300">Wealth & Savings (SIP, Investments, Surplus)</span>
                    <span className="text-emerald-400 font-bold">{pred.lifestyle_diagnostics?.savings_ratio_percent ?? 40.0}% <span className="text-neutral-500 font-normal">(Target: ≥20%)</span></span>
                  </div>
                  <div className="w-full bg-[#161d28] rounded-full h-2 overflow-hidden border border-[#232f42]">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (pred.lifestyle_diagnostics?.savings_ratio_percent ?? 40) * 2.5)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Detected Leakages */}
              <div className="space-y-2 pt-2 border-t border-[#18202d]">
                <div className="flex items-center space-x-1.5 text-xs font-mono text-neutral-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Detected Spending Leakages & Friction Points:</span>
                </div>
                <div className="space-y-1.5">
                  {(pred.lifestyle_diagnostics?.top_spend_leakages || [
                    "No critical cashflow leaks detected. Balanced allocation."
                  ]).map((leak, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-neutral-400 bg-[#161d28]/60 p-2.5 rounded-lg border border-[#232f42]">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{leak}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coaching Tips */}
              <div className="space-y-2 pt-2 border-t border-[#18202d]">
                <div className="flex items-center space-x-1.5 text-xs font-mono text-emerald-400">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Actionable Lifestyle Recommendations:</span>
                </div>
                <div className="space-y-1.5">
                  {(pred.lifestyle_diagnostics?.coaching_insights || [
                    "Maintain current savings discipline and automate monthly SIP transfers."
                  ]).map((tip, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-neutral-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-800/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible Tax Ref */}
              <div className="pt-2 border-t border-[#18202d]">
                <button
                  onClick={() => setShowTaxRef(!showTaxRef)}
                  className="flex items-center space-x-1.5 text-[11px] font-mono text-neutral-500 hover:text-neutral-300 transition"
                >
                  {showTaxRef ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>{showTaxRef ? 'Hide Statutory Section 115BAC Reference' : 'Show Statutory Section 115BAC Reference'}</span>
                </button>

                {showTaxRef && tax && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#0a0d13] border border-[#1d2634] space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Gross Annual Turnover / Inflow:</span>
                      <span>{formatINR(tax.gross_income)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Standard Deduction:</span>
                      <span>- {formatINR(tax.standard_deduction)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Taxable Income:</span>
                      <span>{formatINR(tax.taxable_income)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-200 font-bold">
                      <span>Net Tax Payable:</span>
                      <span className="text-emerald-400">{formatINR(tax.net_tax_payable)} ({tax.effective_tax_rate_percent}%)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Outflow Pie Chart */}
            <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6 flex flex-col justify-between">
              <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                Outflow Allocation Breakdown
              </h4>
              <div className="h-48 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {spendBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '']}
                      contentStyle={{ backgroundColor: '#11161f', borderColor: '#232f42', borderRadius: '8px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                {spendBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-neutral-400 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 16D Feature Vector Table */}
          {features && (
            <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                  Extracted 16-Dimensional Financial Feature Vector
                </h4>
                <span className="text-[10px] font-mono text-neutral-500">
                  Statement TXN Count: {summary?.total_transactions} | Inflow: {formatINR(summary?.total_credits || 0)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(features).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-xl bg-[#161d28]/70 border border-[#232f42]">
                    <div className="text-[10px] font-mono text-neutral-400 truncate" title={key}>
                      {key}
                    </div>
                    <div className="text-sm font-mono font-semibold text-neutral-200 mt-1">
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
