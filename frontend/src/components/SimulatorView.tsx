import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Building2,
  PiggyBank,
  TrendingUp,
  Home,
  Coffee,
  Calendar,
  Repeat,
  Smartphone,
  Crown,
  Sparkles,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { ExtractedFeatures, UploadStatementResponse } from '../types';

export const SimulatorView: React.FC = () => {
  const defaultValues = {
    annualCreditRupees: 1450000,
    savingsRatio: 0.32,
    investmentRatio: 0.18,
    fixedRatio: 0.30,
    discretionaryRatio: 0.20,
    salaryRatio: 0.90,
    subscriptionsRatio: 0.08,
    upiVelocity: 0.75
  };

  const [annualCreditRupees, setAnnualCreditRupees] = useState<number>(defaultValues.annualCreditRupees);
  const [savingsRatio, setSavingsRatio] = useState<number>(defaultValues.savingsRatio);
  const [investmentRatio, setInvestmentRatio] = useState<number>(defaultValues.investmentRatio);
  const [fixedRatio, setFixedRatio] = useState<number>(defaultValues.fixedRatio);
  const [discretionaryRatio, setDiscretionaryRatio] = useState<number>(defaultValues.discretionaryRatio);
  const [salaryRatio, setSalaryRatio] = useState<number>(defaultValues.salaryRatio);
  const [subscriptionsRatio, setSubscriptionsRatio] = useState<number>(defaultValues.subscriptionsRatio);
  const [upiVelocity, setUpiVelocity] = useState<number>(defaultValues.upiVelocity);

  const [simResult, setSimResult] = useState<UploadStatementResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setAnnualCreditRupees(defaultValues.annualCreditRupees);
    setSavingsRatio(defaultValues.savingsRatio);
    setInvestmentRatio(defaultValues.investmentRatio);
    setFixedRatio(defaultValues.fixedRatio);
    setDiscretionaryRatio(defaultValues.discretionaryRatio);
    setSalaryRatio(defaultValues.salaryRatio);
    setSubscriptionsRatio(defaultValues.subscriptionsRatio);
    setUpiVelocity(defaultValues.upiVelocity);
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const logCredit = Math.log1p(annualCreditRupees);
      const debitRupees = annualCreditRupees * (1.0 - savingsRatio);
      const logDebit = Math.log1p(debitRupees);

      const features: ExtractedFeatures = {
        log_annual_credit: logCredit,
        log_annual_debit: logDebit,
        net_savings_ratio: savingsRatio,
        monthly_burn_rate: Math.max(0.1, 1.0 - savingsRatio),
        salary_inflow_ratio: salaryRatio,
        monthly_credit_cv: 0.08,
        salary_regularity_score: salaryRatio,
        bonus_lump_sum_ratio: 0.10,
        investment_ratio: investmentRatio,
        fixed_obligation_ratio: fixedRatio,
        discretionary_ratio: discretionaryRatio,
        tax_shield_ratio: subscriptionsRatio,
        upi_velocity_index: upiVelocity,
        micro_spend_density: 0.06,
        log_avg_ticket_size: Math.log1p((annualCreditRupees + debitRupees) / 450),
        capital_gains_flux: 0.0
      };

      const res = await api.predictFeatures(features);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 200);
    return () => clearTimeout(timer);
  }, [annualCreditRupees, savingsRatio, investmentRatio, fixedRatio, discretionaryRatio, salaryRatio, subscriptionsRatio, upiVelocity]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const pred = simResult?.predictions;
  const archetype = pred?.lifestyle_archetype;
  const diagnostics = pred?.lifestyle_diagnostics;

  const healthScore = diagnostics?.financial_health_score ?? 87;
  const runwayMonths = diagnostics?.cash_runway_months ?? 5.6;
  const needsPct = Math.round(fixedRatio * 100);
  const wantsPct = Math.round(discretionaryRatio * 100);
  const savingsPct = Math.round((savingsRatio + investmentRatio) * 100);

  // SVG circular gauge math
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 tracking-tight">
            What-If Simulator
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Adjust your lifestyle choices and see the impact on your financial future.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#161d28] border border-[#232f42] text-neutral-300 hover:text-white hover:border-neutral-600 transition self-start sm:self-auto"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <RotateCcw className="w-3.5 h-3.5" />}
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Adjust Your Parameters (Col span 7) */}
        <div className="lg:col-span-7 border border-[#1d2634] bg-[#11161f] rounded-2xl p-6 space-y-4">
          <div className="text-sm font-semibold text-neutral-200 mb-2">
            Adjust Your Parameters
          </div>

          {/* Parameter 1: Annual Inflow */}
          <div className="p-3.5 rounded-xl bg-[#0a0d13] border border-[#18202d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#161f2c] border border-[#233144] flex items-center justify-center text-neutral-300">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-neutral-200">
                  Annual Inflow / Credit Magnitude
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {formatINR(annualCreditRupees)}
              </span>
            </div>
            <input
              type="range"
              min="200000"
              max="5000000"
              step="50000"
              value={annualCreditRupees}
              onChange={(e) => setAnnualCreditRupees(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-[#1a2332] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>₹2.0 Lakhs</span>
              <span>₹25.0 Lakhs</span>
              <span>₹50.0 Lakhs</span>
            </div>
          </div>

          {/* Parameter 2: Net Savings Ratio */}
          <div className="p-3.5 rounded-xl bg-[#0a0d13] border border-[#18202d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#161f2c] border border-[#233144] flex items-center justify-center text-neutral-300">
                  <PiggyBank className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-neutral-200">
                  Net Savings Ratio (Retained Cash)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {(savingsRatio * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.65"
              step="0.01"
              value={savingsRatio}
              onChange={(e) => setSavingsRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-[#1a2332] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Parameter 3: Wealth Building */}
          <div className="p-3.5 rounded-xl bg-[#0a0d13] border border-[#18202d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#161f2c] border border-[#233144] flex items-center justify-center text-neutral-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-neutral-200">
                  Wealth Building Commitment (SIPs / MF)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {(investmentRatio * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.45"
              step="0.01"
              value={investmentRatio}
              onChange={(e) => setInvestmentRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-[#1a2332] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Parameter 4: Fixed Living Costs */}
          <div className="p-3.5 rounded-xl bg-[#0a0d13] border border-[#18202d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#161f2c] border border-[#233144] flex items-center justify-center text-neutral-300">
                  <Home className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-neutral-200">
                  Fixed Living Costs (Rent / EMIs / Utilities)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-300 px-2 py-0.5 rounded bg-[#161f2c] border border-[#233144]">
                {(fixedRatio * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.60"
              step="0.01"
              value={fixedRatio}
              onChange={(e) => setFixedRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-[#1a2332] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Parameter 5: Discretionary Spend */}
          <div className="p-3.5 rounded-xl bg-[#0a0d13] border border-[#18202d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#161f2c] border border-[#233144] flex items-center justify-center text-neutral-300">
                  <Coffee className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-neutral-200">
                  Discretionary Lifestyle Spend (Dining / Travel / Shopping)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-300 px-2 py-0.5 rounded bg-[#161f2c] border border-[#233144]">
                {(discretionaryRatio * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.55"
              step="0.01"
              value={discretionaryRatio}
              onChange={(e) => setDiscretionaryRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-[#1a2332] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Parameter 6: Salary Regularity */}
          <div className="p-3.5 rounded-xl bg-[#0a0d13] border border-[#18202d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#161f2c] border border-[#233144] flex items-center justify-center text-neutral-300">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-neutral-200">
                  Salary Regularity Share
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-300 px-2 py-0.5 rounded bg-[#161f2c] border border-[#233144]">
                {(salaryRatio * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.02"
              value={salaryRatio}
              onChange={(e) => setSalaryRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-[#1a2332] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Parameter 7: Subscriptions */}
          <div className="p-3.5 rounded-xl bg-[#0a0d13] border border-[#18202d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#161f2c] border border-[#233144] flex items-center justify-center text-neutral-300">
                  <Repeat className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-neutral-200">
                  Recurring Subscriptions & Micro-Spend
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-300 px-2 py-0.5 rounded bg-[#161f2c] border border-[#233144]">
                {(subscriptionsRatio * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.20"
              step="0.01"
              value={subscriptionsRatio}
              onChange={(e) => setSubscriptionsRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-[#1a2332] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Parameter 8: UPI Velocity */}
          <div className="p-3.5 rounded-xl bg-[#0a0d13] border border-[#18202d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#161f2c] border border-[#233144] flex items-center justify-center text-neutral-300">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-neutral-200">
                  Instant UPI Channel Velocity
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-300 px-2 py-0.5 rounded bg-[#161f2c] border border-[#233144]">
                {(upiVelocity * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.95"
              step="0.01"
              value={upiVelocity}
              onChange={(e) => setUpiVelocity(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-[#1a2332] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Live Preview (Col span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-sm font-semibold text-neutral-200">
            Live Preview
          </div>

          {/* Predicted Annual Inflow Card */}
          <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold font-mono text-neutral-100 tracking-tight">
                {pred ? formatINR(pred.estimated_annual_income) : '₹14,29,569'}
              </div>
              <span className="inline-flex items-center text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +12% vs base
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Predicted Annual Inflow
            </div>
          </div>

          {/* Lifestyle Archetype Card */}
          <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2">
              Lifestyle Archetype
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crown className="w-4 h-4 fill-amber-400/20" />
              </div>
              <h3 className="text-base font-bold text-neutral-100">
                {archetype?.archetype_name || 'Strategic Wealth Builder'}
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-2.5 leading-relaxed">
              {archetype?.summary || 'Disciplined capital allocator systematically converting recurring income into compounding investments.'}
            </p>
          </div>

          {/* Financial Health & Budget Health Split Card */}
          <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Financial Health Radial Meter */}
              <div className="pr-4 border-r border-[#18202d]">
                <div className="text-xs font-medium text-neutral-300 mb-3">
                  Financial Health
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="#1a2332"
                        strokeWidth="6"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="#10b981"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-bold font-mono text-neutral-100">{healthScore}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-[11px] font-mono text-neutral-400">{healthScore} / 100</div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                      {runwayMonths} Months
                    </div>
                    <div className="text-[10px] text-neutral-500">Reserve Runway</div>
                  </div>
                </div>
              </div>

              {/* Budget Health Dot Breakdown */}
              <div className="pl-2 flex flex-col justify-center">
                <div className="text-xs font-medium text-neutral-300 mb-3">
                  Budget Health
                </div>
                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-neutral-400">Needs</span>
                    </div>
                    <span className="text-neutral-200 font-bold">{needsPct}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-neutral-400">Wants</span>
                    </div>
                    <span className="text-neutral-200 font-bold">{wantsPct}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-neutral-400">Savings</span>
                    </div>
                    <span className="text-emerald-400 font-bold">{savingsPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspirational Quote Banner */}
          <div className="border border-[#1d2634] bg-[#11161f] rounded-xl px-4 py-3 flex items-center space-x-2 text-xs text-neutral-300">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="italic text-neutral-400">
              "Small changes today, a wealthier tomorrow."
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
