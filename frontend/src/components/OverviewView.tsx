import React, { useState } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  Wallet,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Info,
  Home,
  ShoppingCart,
  Coins,
  ChevronDown,
  ArrowRight,
  Plus,
  Sliders,
  BarChart2,
  Target,
  Download,
  Lightbulb,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { UploadStatementResponse } from '../types';
import { api } from '../services/api';

interface OverviewViewProps {
  data: UploadStatementResponse | null;
  onNavigate: (tab: string) => void;
  onSelectSample?: (data: UploadStatementResponse) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  onNavigate,
  onSelectSample
}) => {
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Live or default data resolution
  const summary = data?.statement_summary;
  const diagnostics = data?.predictions?.lifestyle_diagnostics;

  const totalSpend = summary?.total_debits ?? 130515;
  const totalTxns = summary?.total_transactions ?? 533;
  const totalInflow = summary?.total_credits ?? 200175;
  const healthScore = diagnostics?.financial_health_score ?? 45;
  const healthGrade = diagnostics?.health_grade ?? 'Needs Attention';

  const needsRatio = diagnostics?.needs_ratio_percent !== undefined
    ? diagnostics.needs_ratio_percent
    : 0.8;
  const wantsRatio = diagnostics?.wants_ratio_percent !== undefined
    ? diagnostics.wants_ratio_percent
    : 0.7;
  const savingsRatio = diagnostics?.savings_ratio_percent !== undefined
    ? diagnostics.savings_ratio_percent
    : 6.5;

  const handleBankClick = async (bankId: string) => {
    setLoadingSample(bankId);
    try {
      let sampleId = 'student_entry';
      if (bankId === 'HDFC') sampleId = 'real_agami_account';
      else if (bankId === 'SBI') sampleId = 'student_entry';
      else if (bankId === 'ICICI') sampleId = 'balanced_pro';
      else if (bankId === 'Axis') sampleId = 'wealth_builder';
      else if (bankId === 'Kotak') sampleId = 'lifestyle_spender';

      const res = await api.analyzeSample(sampleId);
      if (onSelectSample) {
        onSelectSample(res);
      }
    } catch (e) {
      console.error('Failed to load bank sample', e);
    } finally {
      setLoadingSample(null);
    }
  };

  // 1. Spending Breakdown Donut Data
  const breakdownData = [
    { name: 'Rent & Housing', value: 42.8, color: '#10B981' },
    { name: 'Food & Dining', value: 18.2, color: '#F59E0B' },
    { name: 'Shopping', value: 12.4, color: '#8B5CF6' },
    { name: 'Travel', value: 7.9, color: '#06B6D4' },
    { name: 'Utilities', value: 6.1, color: '#3B82F6' },
    { name: 'Other', value: 12.6, color: '#94A3B8' }
  ];

  // 2. Monthly Outflow Stacked Bar Data
  const monthlyOutflowData = [
    { month: 'May 2025', housing: 4200, food: 2200, shopping: 1500, emi: 1200, other: 1100 },
    { month: 'Jun 2025', housing: 6500, food: 3100, shopping: 1800, emi: 1500, other: 1200 },
    { month: 'Jul 2025', housing: 7200, food: 4000, shopping: 3500, emi: 2100, other: 2200 },
    { month: 'Aug 2025', housing: 14000, food: 5500, shopping: 4200, emi: 2200, other: 3100 },
    { month: 'Sep 2025', housing: 7800, food: 3900, shopping: 3100, emi: 1800, other: 1900 },
    { month: 'Oct 2025', housing: 7900, food: 3800, shopping: 3300, emi: 1900, other: 1800 },
    { month: 'Nov 2025', housing: 8100, food: 3900, shopping: 3200, emi: 2000, other: 1900 },
    { month: 'Dec 2025', housing: 8200, food: 4100, shopping: 3400, emi: 2100, other: 2000 },
    { month: 'Jan 2026', housing: 28000, food: 14000, shopping: 9500, emi: 8000, other: 6500 },
    { month: 'Feb 2026', housing: 8500, food: 4200, shopping: 3500, emi: 2200, other: 2100 },
    { month: 'Mar 2026', housing: 16000, food: 11000, shopping: 7000, emi: 5500, other: 4500 }
  ];

  // 3. GitHub style heat map data (7 days x 28 columns)
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Seeded pattern to mirror screenshot contribution dots
  const getHeatColor = (r: number, c: number) => {
    const seed = (r * 13 + c * 7 + (c % 3) * 5) % 19;
    if (seed < 5) return '#F1F5F9'; // Level 0 (inactive / light)
    if (seed < 9) return '#BBF7D0'; // Level 1 (pale mint)
    if (seed < 14) return '#4ADE80'; // Level 2 (medium green)
    if (seed < 17) return '#16A34A'; // Level 3 (rich green)
    return '#14532D'; // Level 4 (dark forest green)
  };

  // SVG semi-circle gauge calculation
  // Circumference of semi-circle (radius 60) = PI * 60 = 188.5
  const semiCircumference = Math.PI * 60;
  const strokeOffset = semiCircumference - (healthScore / 100) * semiCircumference;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Hero Banner Card */}
      <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#1d2634] bg-[#FAF9F7] dark:bg-[#11161f] flex flex-col md:flex-row shadow-sm min-h-[230px]">
        {/* Left text column */}
        <div className="p-7 md:p-8 flex flex-col justify-between z-10 md:w-7/12 bg-gradient-to-r from-[#FAF9F7] via-[#FAF9F7]/95 to-transparent dark:from-[#11161f] dark:via-[#11161f]/95 dark:to-transparent">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
              YOUR FINANCIAL COMPANION
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-100 leading-tight tracking-tight mt-1.5 font-serif">
              Understand<br />
              your money.<br />
              <span className="text-[#0D7A57] dark:text-[#34d399] font-sans font-bold">Build a freer you.</span>
            </h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2.5 max-w-md leading-relaxed">
              Upload your bank statements and get instant insights, no jargon, just clarity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('diagnostic')}
              className="bg-[#0C4A34] hover:bg-[#083626] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm inline-flex items-center space-x-2 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Statement</span>
            </button>
            <button
              onClick={() => handleBankClick('HDFC')}
              className="bg-white/90 hover:bg-white dark:bg-[#161d28] dark:hover:bg-[#1d2634] border border-[#E5E7EB] dark:border-[#232f42] text-neutral-800 dark:text-neutral-200 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm inline-flex items-center space-x-2 transition"
            >
              <FileText className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span>Try a Demo</span>
            </button>
          </div>
        </div>

        {/* Right Mountain Landscape Column */}
        <div className="relative md:w-5/12 min-h-[200px] overflow-hidden bg-slate-200 dark:bg-neutral-800">
          <img
            src="/mountain_panorama.jpg"
            alt="Scenic mountain peaks"
            className="w-full h-full object-cover object-center"
          />

          {/* Top handwriting quote note */}
          <div className="absolute top-4 right-6 font-serif italic text-xs text-neutral-800/90 dark:text-neutral-200 drop-shadow-sm font-medium">
            “A clearer today for a calmer tomorrow..”
          </div>

          {/* Floating dark translucent quote card */}
          <div className="absolute bottom-5 right-6 left-6 sm:left-auto sm:max-w-sm bg-neutral-950/70 backdrop-blur-md border border-white/20 text-white rounded-xl p-3.5 shadow-xl">
            <p className="text-xs font-normal leading-relaxed text-neutral-100">
              “Discipline with money gives you freedom everywhere else.”
            </p>
            <div className="text-right text-xs text-neutral-400 mt-1">—</div>
          </div>
        </div>
      </div>

      {/* 2. Connect Your Bank Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Connect Your Bank</h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Support for major Indian banks and more.</span>
          </div>
          <button
            onClick={() => onNavigate('diagnostic')}
            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center space-x-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bank Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {/* HDFC Bank */}
          <button
            onClick={() => handleBankClick('HDFC')}
            disabled={loadingSample !== null}
            className="bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm hover:shadow transition group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-red-600 dark:text-red-400 tracking-tighter">HD</span>
            </div>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">HDFC</span>
          </button>

          {/* SBI */}
          <button
            onClick={() => handleBankClick('SBI')}
            disabled={loadingSample !== null}
            className="bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm hover:shadow transition group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/30 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 rounded-full border-2 border-sky-600 relative flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-sky-600 rounded-full" />
              </div>
            </div>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">SBI</span>
          </button>

          {/* ICICI */}
          <button
            onClick={() => handleBankClick('ICICI')}
            disabled={loadingSample !== null}
            className="bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm hover:shadow transition group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-serif font-black italic text-orange-600 dark:text-orange-400">i</span>
            </div>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">ICICI</span>
          </button>

          {/* Axis */}
          <button
            onClick={() => handleBankClick('Axis')}
            disabled={loadingSample !== null}
            className="bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm hover:shadow transition group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center flex-shrink-0">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-rose-700" />
            </div>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Axis</span>
          </button>

          {/* Kotak */}
          <button
            onClick={() => handleBankClick('Kotak')}
            disabled={loadingSample !== null}
            className="bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm hover:shadow transition group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-extrabold text-red-600 dark:text-red-400">∞</span>
            </div>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Kotak</span>
          </button>

          {/* More */}
          <button
            onClick={() => onNavigate('profiles')}
            className="bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm hover:shadow transition group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0 text-neutral-600 dark:text-neutral-300">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">More</span>
          </button>
        </div>
      </div>

      {/* 3. Key Metric Summary Cards (3 Cards Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Monthly Spend */}
        <div className="bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Monthly Spend</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {formatINR(totalSpend)}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>12%</span>
              <span className="text-neutral-400 dark:text-neutral-500 font-normal">vs. previous month</span>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {totalTxns}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>8%</span>
              <span className="text-neutral-400 dark:text-neutral-500 font-normal">vs. previous month</span>
            </div>
          </div>
        </div>

        {/* Estimated Monthly Inflow */}
        <div className="bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Estimated Monthly Inflow</span>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight mt-2">
              {formatINR(totalInflow)}
            </div>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">Based on last 3 months</span>
          </div>

          {/* Sparkline bars */}
          <div className="flex items-end space-x-1.5 h-12 pr-1">
            <div className="w-2 bg-emerald-200 dark:bg-emerald-900/60 rounded-t h-4" />
            <div className="w-2 bg-emerald-300 dark:bg-emerald-800/70 rounded-t h-6" />
            <div className="w-2 bg-emerald-300 dark:bg-emerald-700/70 rounded-t h-5" />
            <div className="w-2 bg-emerald-400 dark:bg-emerald-600 rounded-t h-8" />
            <div className="w-2 bg-emerald-400 dark:bg-emerald-500 rounded-t h-7" />
            <div className="w-2 bg-emerald-500 dark:bg-emerald-400 rounded-t h-10" />
            <div className="w-2 bg-[#0D7A57] dark:bg-emerald-300 rounded-t h-12" />
          </div>
        </div>
      </div>

      {/* 4. Alert Banner (Spending Warning) */}
      <div className="bg-[#FEF2F2] dark:bg-red-950/30 border border-[#FECACA] dark:border-red-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-900 dark:text-red-200">Spending higher than usual</h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 max-w-3xl leading-relaxed">
              Your general debit spending is 99% of everything you spent ({formatINR(totalSpend / 10)}/month across {totalTxns} transactions) — one unusually heavy month here is moving your whole budget.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('diagnostic')}
          className="bg-[#FEE2E2] dark:bg-red-900/40 hover:bg-[#FECACA] dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 flex-shrink-0 transition self-end sm:self-center"
        >
          <span>See details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. Spending Breakdown & Where the Money Went (2 Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Spending Breakdown (Donut) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Spending Breakdown</h3>
              <div className="inline-flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400 border border-[#E5E7EB] dark:border-[#1d2634] px-2.5 py-1 rounded-lg">
                <span>This Month</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-5 gap-6">
              {/* Donut Chart with Center Text */}
              <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{formatINR(totalSpend)}</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">Total</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 w-full space-y-2 text-xs">
                {breakdownData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-[#F3F4F6] dark:border-[#1d2634] text-center">
            <button
              onClick={() => onNavigate('diagnostic')}
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-400 inline-flex items-center space-x-1"
            >
              <span>View all categories</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Where the Money Went (Treemap Tiles) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Where the Money Went</h3>
              <div className="inline-flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400 border border-[#E5E7EB] dark:border-[#1d2634] px-2.5 py-1 rounded-lg">
                <span>This Month</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Treemap Mosaic */}
            <div className="grid grid-cols-12 gap-3 mt-5 min-h-[190px]">
              {/* Large Green Tile: General Debit */}
              <div className="col-span-6 bg-[#6EE7B7] dark:bg-emerald-600/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-xs font-bold text-emerald-950 dark:text-white">General Debit</span>
                <div className="text-lg font-extrabold text-emerald-950 dark:text-white">
                  {formatINR(totalSpend * 0.8)}
                </div>
              </div>

              {/* Right 2x2 Tiles */}
              <div className="col-span-6 grid grid-cols-2 gap-2.5">
                {/* Shopping */}
                <div className="bg-[#A7F3D0] dark:bg-emerald-700/60 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-100">Shopping</span>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 dark:text-white">{formatINR(totalSpend * 0.088)}</div>
                    <div className="text-[10px] text-emerald-800 dark:text-emerald-200 font-semibold">8.8%</div>
                  </div>
                </div>

                {/* Food */}
                <div className="bg-[#D1FAE5] dark:bg-emerald-800/60 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-100">Food</span>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 dark:text-white">{formatINR(totalSpend * 0.065)}</div>
                    <div className="text-[10px] text-emerald-800 dark:text-emerald-200 font-semibold">6.5%</div>
                  </div>
                </div>

                {/* EMI */}
                <div className="bg-[#E2E8F0] dark:bg-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">EMI</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">2.4%</div>
                </div>

                {/* Others */}
                <div className="bg-[#E2E8F0] dark:bg-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Others</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">2.2%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Monthly Outflow & Financial Health Score (2 Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Monthly Outflow (Stacked Bar Chart, ~65%) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Monthly Outflow</h3>
            <div className="inline-flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400 border border-[#E5E7EB] dark:border-[#1d2634] px-2.5 py-1 rounded-lg">
              <span>Last 12 months</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyOutflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(val) => `₹${val / 1000}K`}
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 80000]}
                />
                <Tooltip
                  formatter={(value: any) => formatINR(Number(value))}
                  contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', borderRadius: '8px', border: '1px solid #374151', fontSize: '11px' }}
                />
                <Bar dataKey="housing" stackId="a" fill="#0D7A57" radius={[0, 0, 0, 0]} />
                <Bar dataKey="food" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                <Bar dataKey="shopping" stackId="a" fill="#8B5CF6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="emi" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="other" stackId="a" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend row */}
          <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-neutral-600 dark:text-neutral-300">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0D7A57]" />
              <span>Housing</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
              <span>Food</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" />
              <span>Shopping</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
              <span>EMI</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#CBD5E1]" />
              <span>Other</span>
            </div>
          </div>
        </div>

        {/* Financial Health Score (Gauge, ~35%) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Financial Health Score</h3>

            {/* Radial Arc Gauge */}
            <div className="flex flex-col items-center justify-center mt-5">
              <div className="relative w-44 h-24 overflow-hidden flex items-end justify-center">
                <svg className="w-44 h-44 -rotate-90 origin-center" viewBox="0 0 160 160">
                  {/* Background Track Arc */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="currentColor"
                    className="text-neutral-100 dark:text-neutral-800"
                    strokeWidth="14"
                    strokeDasharray={`${semiCircumference} ${semiCircumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* Foreground Value Arc */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="14"
                    strokeDasharray={`${semiCircumference} ${semiCircumference}`}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Score value in center */}
                <div className="absolute bottom-1 text-center flex flex-col items-center">
                  <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {healthScore} <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">/ 100</span>
                  </div>
                  <div className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">
                    {healthGrade}
                  </div>
                </div>
              </div>
            </div>

            {/* Explanatory note */}
            <div className="mt-5 p-3 rounded-xl bg-neutral-50 dark:bg-[#161d28] border border-neutral-100 dark:border-[#232f42] flex items-start space-x-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <Info className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
              <span>High outflow relative to income. Focus on reducing discretionary spend and building a buffer.</span>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={() => onNavigate('simulator')}
              className="w-full bg-[#F3F4F6] dark:bg-[#161d28] hover:bg-[#E5E7EB] dark:hover:bg-[#1d2634] text-neutral-800 dark:text-neutral-200 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition"
            >
              <span>See Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Lifestyle Spending & Goals & Spending Heat Calendar (2 Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Lifestyle Spending & Goals (~40%) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Lifestyle Spending & Goals</h3>

            <div className="space-y-4 mt-6">
              {/* Essential Needs */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2 text-neutral-800 dark:text-neutral-200 font-semibold">
                    <Home className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span>Essential Needs</span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal">(Rent, EMI, Utilities)</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(8, needsRatio * 5))}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 w-10 text-right">{needsRatio.toFixed(1)}%</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 w-20 text-right">Target: ≤ 50%</span>
                </div>
              </div>

              {/* Discretionary Wants */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2 text-neutral-800 dark:text-neutral-200 font-semibold">
                    <ShoppingCart className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span>Discretionary Wants</span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal">(Dining, Leisure, Shopping)</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(8, wantsRatio * 5))}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 w-10 text-right">{wantsRatio.toFixed(1)}%</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 w-20 text-right">Target: ≤ 30%</span>
                </div>
              </div>

              {/* Wealth & Savings */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2 text-neutral-800 dark:text-neutral-200 font-semibold">
                    <Coins className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span>Wealth & Savings</span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal">(Investments, Surplus)</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(8, savingsRatio * 5))}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 w-10 text-right">{savingsRatio.toFixed(1)}%</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 w-20 text-right">Target: ≥ 20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spending Heat Calendar (~60%) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Spending Heat Calendar</h3>
            <div className="inline-flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400 border border-[#E5E7EB] dark:border-[#1d2634] px-2.5 py-1 rounded-lg">
              <span>Last 6 months</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Month labels */}
          <div className="grid grid-cols-12 text-[10px] text-neutral-400 dark:text-neutral-500 pl-8 pr-2 mt-4 text-center">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>

          {/* 7 rows for days of week */}
          <div className="space-y-1.5 mt-2">
            {weekdays.map((day, rIdx) => (
              <div key={day} className="flex items-center space-x-2 text-[10px] text-neutral-400 dark:text-neutral-500">
                <span className="w-6 text-neutral-500 dark:text-neutral-400 font-medium">{day}</span>
                <div className="flex-1 flex justify-between gap-1">
                  {Array.from({ length: 24 }).map((_, cIdx) => (
                    <div
                      key={cIdx}
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] flex-shrink-0"
                      style={{ backgroundColor: getHeatColor(rIdx, cIdx) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Less - More legend */}
          <div className="flex items-center justify-end space-x-1.5 text-[10px] text-neutral-500 dark:text-neutral-400 mt-4 pr-1">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-[#F1F5F9] dark:bg-neutral-800" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#BBF7D0] dark:bg-emerald-900/60" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#4ADE80] dark:bg-emerald-700/70" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#16A34A] dark:bg-emerald-500" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#14532D] dark:bg-emerald-300" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* 8. AI Insights & Quick Actions (2 Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* AI Insights (~60%) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">AI Insights</h3>
              </div>
              <button
                onClick={() => onNavigate('insights')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center space-x-1"
              >
                <span>View all insights</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {/* Insight 1 */}
              <div className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-[#161d28] transition">
                <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  High digital velocity (0.89): frequent micro-transactions create silent cashflow drain.
                </p>
              </div>

              {/* Insight 2 */}
              <div className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-[#161d28] transition">
                <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  Low emergency buffer: estimated runway covers only 0.8 months of living expenses.
                </p>
              </div>

              {/* Insight 3 */}
              <div className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-[#161d28] transition">
                <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  Consider automating savings transfer immediately after salary credit.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions (~40%) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Run What-If Simulator */}
            <button
              onClick={() => onNavigate('simulator')}
              className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#1d2634] bg-white dark:bg-[#161d28] hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 text-left transition flex flex-col justify-between min-h-[90px] group"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 text-neutral-700 dark:text-neutral-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 flex items-center justify-center">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                Run What-If<br />Simulator
              </span>
            </button>

            {/* Compare Spending */}
            <button
              onClick={() => onNavigate('diagnostic')}
              className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#1d2634] bg-white dark:bg-[#161d28] hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 text-left transition flex flex-col justify-between min-h-[90px] group"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 text-neutral-700 dark:text-neutral-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 flex items-center justify-center">
                <BarChart2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                Compare<br />Spending
              </span>
            </button>

            {/* Plan Savings Goal */}
            <button
              onClick={() => onNavigate('simulator')}
              className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#1d2634] bg-white dark:bg-[#161d28] hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 text-left transition flex flex-col justify-between min-h-[90px] group"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 text-neutral-700 dark:text-neutral-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                Plan Savings<br />Goal
              </span>
            </button>

            {/* Export Report */}
            <button
              onClick={() => window.print()}
              className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#1d2634] bg-white dark:bg-[#161d28] hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 text-left transition flex flex-col justify-between min-h-[90px] group"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 text-neutral-700 dark:text-neutral-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 flex items-center justify-center">
                <Download className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                Export<br />Report
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
