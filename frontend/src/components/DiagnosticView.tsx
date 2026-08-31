import React, { useState } from 'react';
import {
  Upload,
  FileText,
  AlertCircle
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
  const [entityType, setEntityType] = useState<string>('salaried_individual');
  const [pdfPassword, setPdfPassword] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadStatement(file, entityType, pdfPassword || undefined);
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

  // Chart Data Preparation
  const spendBreakdown = features ? [
    { name: 'Fixed (Rent/EMI)', value: Math.max(0, features.fixed_obligation_ratio * 100), color: '#3b82f6' },
    { name: 'Discretionary', value: Math.max(0, features.discretionary_ratio * 100), color: '#f59e0b' },
    { name: 'SIP / Wealth', value: Math.max(0, features.investment_ratio * 100), color: '#10b981' },
    { name: 'Tax-Shield (NPS/PPF)', value: Math.max(0, features.tax_shield_ratio * 100), color: '#8b5cf6' },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Entity Selector & Upload Zone */}
      <div className="border border-neutral-800 bg-[#121316] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Select Tax Entity & Profile Type</h3>
            <p className="text-xs text-neutral-400">Determines standard deduction, Section 44AD presumptive rules, or business OPEX & depreciation.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'salaried_individual', label: 'Salaried Individual (₹75k Std Ded)' },
              { id: 'presumptive_business_44ad', label: 'Small Business (Sec 44AD - 6% Deemed)' },
              { id: 'presumptive_professional_44ada', label: 'Professional (Sec 44ADA - 50%)' },
              { id: 'regular_business_pnl', label: 'Commercial P&L (OPEX + Sec 32 Deprec.)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEntityType(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                  entityType === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Zone & Quick Action */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-950/20'
                  : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <Upload className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-200">
                    Drag & Drop Indian Bank Statement (CSV or PDF)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Supports HDFC, SBI, ICICI, Axis, Kotak, or custom CSV/PDF statements
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
                  <input
                    type="password"
                    placeholder="PDF Password (if encrypted)"
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    className="px-3 py-2 text-xs rounded bg-neutral-900 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-emerald-500/60 w-48 text-center"
                  />
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 text-xs font-medium rounded bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700 transition">
                    <span>Browse CSV or PDF</span>
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
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Statement */}
          <div className="border border-neutral-800 bg-neutral-900/40 rounded-lg p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                1-Click Viva Presets
              </span>
              <h4 className="text-sm font-medium text-neutral-200 mt-3">
                Instant Statement Evaluation
              </h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                No statement file on hand? Run inference on a calibrated 340-transaction statement instantly.
              </p>
            </div>
            <button
              onClick={handleQuickSample}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing Pipeline...' : 'Load Balanced Pro Statement'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Dashboard */}
      {data && pred && (
        <div className="space-y-6">
          {/* Executive Verdict Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Predicted Income / Turnover */}
            <div className="border border-neutral-800 bg-[#121316] rounded-lg p-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>{tax?.entity_type === 'salaried_individual' ? 'Estimated Annual Gross' : 'Estimated Annual Turnover'}</span>
                <span className="font-mono text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
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

            {/* Predicted Tax Slab */}
            <div className="border border-neutral-800 bg-[#121316] rounded-lg p-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Indian Tax Slab (FY25-26)</span>
                <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {(pred.predicted_tax_slab.confidence * 100).toFixed(1)}% Conf
                </span>
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-emerald-400">
                Class {pred.predicted_tax_slab.class_id} ({pred.predicted_tax_slab.base_rate_percent}%)
              </div>
              <div className="mt-2 text-[11px] text-neutral-400">
                {pred.predicted_tax_slab.bracket_name}
              </div>
            </div>

            {/* Net Tax Payable */}
            <div className="border border-neutral-800 bg-[#121316] rounded-lg p-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Net Tax Payable</span>
                <span className="font-mono text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                  Sec 115BAC
                </span>
              </div>
              <div className={`mt-2 text-2xl font-bold font-mono tracking-tight ${tax?.net_tax_payable === 0 ? 'text-emerald-400' : 'text-neutral-100'}`}>
                {tax ? formatINR(tax.net_tax_payable) : '₹0'}
              </div>
              <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                Effective Rate: {tax?.effective_tax_rate_percent.toFixed(1)}% (Taxable: {tax ? formatINR(tax.taxable_income) : '₹0'})
              </div>
            </div>

            {/* Persona Cluster */}
            <div className="border border-neutral-800 bg-[#121316] rounded-lg p-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Behavioral Persona</span>
                <span className="font-mono text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
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

          {/* Statutory Tax Breakdown Waterfall & Spend Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Waterfall Breakdown */}
            <div className="lg:col-span-2 border border-neutral-800 bg-[#121316] rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                  Statutory Tax Calculation Waterfall ({tax?.entity_type?.replace(/_/g, ' ').toUpperCase()})
                </h4>
                {tax?.regime_notes && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Active Regime
                  </span>
                )}
              </div>

              {tax && (
                <div className="mt-4 space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-neutral-800/80">
                    <span className="text-neutral-400">1. Gross Annual Income / Turnover</span>
                    <span className="text-neutral-200 font-medium">{formatINR(tax.gross_income)}</span>
                  </div>

                  {tax.entity_type === 'salaried_individual' && (
                    <div className="flex justify-between py-2 border-b border-neutral-800/80 text-emerald-400">
                      <span>2. Less: Standard Deduction (Section 115BAC)</span>
                      <span>- {formatINR(tax.standard_deduction)}</span>
                    </div>
                  )}

                  {tax.entity_type === 'presumptive_business_44ad' && (
                    <div className="flex justify-between py-2 border-b border-neutral-800/80 text-emerald-400">
                      <span>2. Presumptive Deemed Profit Rate (Section 44AD)</span>
                      <span>{tax.deemed_profit_rate_percent?.toFixed(1)}% Deemed Profit</span>
                    </div>
                  )}

                  {tax.entity_type === 'presumptive_professional_44ada' && (
                    <div className="flex justify-between py-2 border-b border-neutral-800/80 text-emerald-400">
                      <span>2. Presumptive Deemed Profit Rate (Section 44ADA)</span>
                      <span>50.0% Deemed Profit</span>
                    </div>
                  )}

                  {tax.entity_type === 'regular_business_pnl' && (
                    <>
                      <div className="flex justify-between py-2 border-b border-neutral-800/80 text-emerald-400">
                        <span>2. Less: Deductible Operating Expenses (OPEX)</span>
                        <span>- {formatINR(tax.deductible_opex || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-800/80 text-emerald-400">
                        <span>3. Less: Section 32 Equipment Depreciation (15% WDV)</span>
                        <span>- {formatINR(tax.depreciation_allowance || 0)} (Capex: {formatINR(tax.capex_investment || 0)})</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-2 border-b border-neutral-800/80 font-bold">
                    <span className="text-neutral-300">Net Taxable Profit / Income</span>
                    <span className="text-neutral-100">{formatINR(tax.taxable_income)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800/80">
                    <span className="text-neutral-400">Base Slab Tax (Section 115BAC Tier Ladder)</span>
                    <span className="text-neutral-200">{formatINR(tax.base_tax_liability)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800/80 text-emerald-400">
                    <span>Less: Section 87A Tax Rebate (Max ₹60,000)</span>
                    <span>- {formatINR(tax.section_87a_rebate)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-neutral-900/60 px-3 rounded text-sm font-bold text-emerald-400">
                    <span>Final Net Tax Liability</span>
                    <span>{formatINR(tax.net_tax_payable)}</span>
                  </div>

                  {tax.regime_notes && (
                    <div className="p-2.5 rounded bg-neutral-900 text-[11px] text-neutral-400 border border-neutral-800">
                      💡 <span className="font-semibold text-neutral-300">Statutory Note:</span> {tax.regime_notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Outflow Allocation Donut */}
            <div className="border border-neutral-800 bg-[#121316] rounded-lg p-6 flex flex-col justify-between">
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
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '6px', fontSize: '11px' }}
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

          {/* 16-Dimensional Feature Vector Table */}
          {features && (
            <div className="border border-neutral-800 bg-[#121316] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                  Extracted 16-Dimensional Financial Feature Vector
                </h4>
                <span className="text-[10px] font-mono text-neutral-500">
                  Statement TXN Count: {summary?.total_transactions} | Total Inflow: {formatINR(summary?.total_credits || 0)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(features).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded bg-neutral-900/70 border border-neutral-800/80">
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

