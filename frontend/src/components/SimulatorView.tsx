import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { ExtractedFeatures, UploadStatementResponse } from '../types';

export const SimulatorView: React.FC = () => {
  const [annualCreditRupees, setAnnualCreditRupees] = useState<number>(1450000);
  const [savingsRatio, setSavingsRatio] = useState<number>(0.32);
  const [salaryRatio, setSalaryRatio] = useState<number>(0.90);
  const [investmentRatio, setInvestmentRatio] = useState<number>(0.18);
  const [fixedRatio, setFixedRatio] = useState<number>(0.30);
  const [discretionaryRatio, setDiscretionaryRatio] = useState<number>(0.20);
  const [taxShieldRatio, setTaxShieldRatio] = useState<number>(0.08);
  const [upiVelocity, setUpiVelocity] = useState<number>(0.75);

  const [simResult, setSimResult] = useState<UploadStatementResponse | null>(null);
  const [loading, setLoading] = useState(false);

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
        monthly_burn_rate: 1.0 - savingsRatio,
        salary_inflow_ratio: salaryRatio,
        monthly_credit_cv: 0.08,
        salary_regularity_score: 1.0,
        bonus_lump_sum_ratio: 0.10,
        investment_ratio: investmentRatio,
        fixed_obligation_ratio: fixedRatio,
        discretionary_ratio: discretionaryRatio,
        tax_shield_ratio: taxShieldRatio,
        upi_velocity_index: upiVelocity,
        micro_spend_density: 0.08,
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
    }, 250);
    return () => clearTimeout(timer);
  }, [annualCreditRupees, savingsRatio, salaryRatio, investmentRatio, fixedRatio, discretionaryRatio, taxShieldRatio, upiVelocity]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const pred = simResult?.predictions;
  const tax = pred?.tax_breakdown;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-100">
            Real-Time What-If Financial Simulator
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Adjust behavioral cashflow sliders to simulate ML tax slab transitions and Section 115BAC liabilities.
          </p>
        </div>
        <button
          onClick={runSimulation}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Recalculate</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Control Panel */}
        <div className="lg:col-span-2 border border-neutral-800 bg-[#121316] rounded-lg p-6 space-y-5">
          {/* Slider 1: Annual Credits */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-neutral-300">Annual Deposit Magnitude (₹)</span>
              <span className="text-emerald-400 font-bold">{formatINR(annualCreditRupees)}</span>
            </div>
            <input
              type="range"
              min="200000"
              max="5000000"
              step="50000"
              value={annualCreditRupees}
              onChange={(e) => setAnnualCreditRupees(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
              <span>₹2.0 Lakhs</span>
              <span>₹25.0 Lakhs</span>
              <span>₹50.0 Lakhs</span>
            </div>
          </div>

          {/* Slider 2: Net Savings Ratio */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-neutral-300">Net Savings Ratio (Retained Cash)</span>
              <span className="text-neutral-100 font-bold">{(savingsRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="-0.10"
              max="0.65"
              step="0.01"
              value={savingsRatio}
              onChange={(e) => setSavingsRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider 3: Investment Ratio */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-neutral-300">Wealth Building Commitment (SIPs / MF)</span>
              <span className="text-neutral-100 font-bold">{(investmentRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.45"
              step="0.01"
              value={investmentRatio}
              onChange={(e) => setInvestmentRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider 4: Fixed Obligations */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-neutral-300">Fixed Living Costs (Rent / EMIs)</span>
              <span className="text-neutral-100 font-bold">{(fixedRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.60"
              step="0.01"
              value={fixedRatio}
              onChange={(e) => setFixedRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider 5: Discretionary Spend */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-neutral-300">Discretionary Spend (Dining / Travel)</span>
              <span className="text-neutral-100 font-bold">{(discretionaryRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.55"
              step="0.01"
              value={discretionaryRatio}
              onChange={(e) => setDiscretionaryRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider 6: Salary Regularity */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-neutral-300">Salary Payroll Share (vs Freelance/Gig)</span>
              <span className="text-neutral-100 font-bold">{(salaryRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.02"
              value={salaryRatio}
              onChange={(e) => setSalaryRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider 7: NPS / Tax Shield */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-neutral-300">Tax Shield (NPS 14% / PPF)</span>
              <span className="text-neutral-100 font-bold">{(taxShieldRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.18"
              step="0.01"
              value={taxShieldRatio}
              onChange={(e) => setTaxShieldRatio(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider 8: UPI Velocity */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-neutral-300">Instant UPI Channel Velocity</span>
              <span className="text-neutral-100 font-bold">{(upiVelocity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.95"
              step="0.01"
              value={upiVelocity}
              onChange={(e) => setUpiVelocity(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Live Inferred Cards */}
        <div className="space-y-4">
          {/* Estimated Income */}
          <div className="border border-neutral-800 bg-[#121316] rounded-lg p-5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Live Model Prediction</span>
            <div className="mt-1 text-2xl font-bold font-mono text-neutral-100">
              {pred ? formatINR(pred.estimated_annual_income) : '---'}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              Target Gross Income
            </div>
          </div>

          {/* Tax Slab */}
          <div className="border border-neutral-800 bg-[#121316] rounded-lg p-5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">FY 2025–26 Tax Slab</span>
            <div className="mt-1 text-lg font-bold font-mono text-emerald-400">
              {pred ? `Class ${pred.predicted_tax_slab.class_id} (${pred.predicted_tax_slab.base_rate_percent}%)` : '---'}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {pred?.predicted_tax_slab.bracket_name}
            </div>
          </div>

          {/* Net Tax Liability */}
          <div className="border border-neutral-800 bg-[#121316] rounded-lg p-5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Net Tax Payable (After 87A)</span>
            <div className={`mt-1 text-2xl font-bold font-mono ${tax?.net_tax_payable === 0 ? 'text-emerald-400' : 'text-neutral-100'}`}>
              {tax ? formatINR(tax.net_tax_payable) : '₹0'}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              Effective Rate: {tax ? `${tax.effective_tax_rate_percent.toFixed(1)}%` : '0%'}
            </div>
          </div>

          {/* Behavioral Persona */}
          <div className="border border-neutral-800 bg-[#121316] rounded-lg p-5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Predicted Persona</span>
            <div className="mt-1 text-sm font-semibold text-neutral-200">
              {pred?.assigned_cluster.persona_name || '---'}
            </div>
            <div className="mt-1 text-xs text-neutral-500 font-mono">
              PCA: [{pred?.assigned_cluster.pca_2d_coord.join(', ')}]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
