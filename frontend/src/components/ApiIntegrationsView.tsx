import React, { useState } from 'react';
import { Terminal, Code2, Check, Copy, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

export const ApiIntegrationsView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const curlCode = `curl -X POST "http://localhost:8000/api/predict-features" \\
  -H "Content-Type: application/json" \\
  -d '{
    "log_annual_credit": 14.18,
    "log_annual_debit": 13.79,
    "net_savings_ratio": 0.32,
    "monthly_burn_rate": 0.68,
    "salary_inflow_ratio": 0.88,
    "monthly_credit_cv": 0.08,
    "salary_regularity_score": 1.0,
    "bonus_lump_sum_ratio": 0.10,
    "investment_ratio": 0.18,
    "fixed_obligation_ratio": 0.31,
    "discretionary_ratio": 0.21,
    "tax_shield_ratio": 0.08,
    "upi_velocity_index": 0.72,
    "micro_spend_density": 0.06,
    "log_avg_ticket_size": 7.62,
    "capital_gains_flux": 0.0
  }'`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              API & Integrations
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-semibold">
              REST v2.0
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Programmatic access to 16D financial vectorization, lifestyle archetype classification, and cashflow health scoring.
          </p>
        </div>

        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition flex-shrink-0 shadow-2xs"
        >
          <span>Open Interactive Swagger Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Inference Latency</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            &lt;45 ms
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            In-memory scikit-learn pipeline
          </div>
        </div>

        <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Local Privacy</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            100% Offline
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            No banking credentials or raw transactions leave server
          </div>
        </div>

        <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Schema Standard</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            16 Dimensions
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            Standardized banking behavior feature vector
          </div>
        </div>
      </div>

      {/* Code Snippet Box */}
      <div className="border border-neutral-200 dark:border-[#1d2634] bg-white dark:bg-[#11161f] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold">
            cURL Request Example
          </span>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded-xl bg-neutral-100 dark:bg-[#161f2c] border border-neutral-200 dark:border-[#233144] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="p-4 rounded-xl bg-neutral-900 text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed shadow-inner">
          {curlCode}
        </pre>
      </div>
    </div>
  );
};

export default ApiIntegrationsView;
