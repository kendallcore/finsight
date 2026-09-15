import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { SampleProfileItem, UploadStatementResponse } from '../types';

interface VivaPresetsViewProps {
  onSelectSample: (data: UploadStatementResponse) => void;
  onGoToSimulator?: () => void;
}

const FALLBACK_SAMPLES: SampleProfileItem[] = [
  {
    profile_id: 'student_entry',
    title: 'Aarav Sharma',
    subtitle: 'Tier-1 Tech Fresher, Bengaluru',
    category: 'STUDENTS & INTERNS',
    description: 'Recent graduate with high discretionary spending on dining, quick-commerce, and tech gadgets. High UPI transaction velocity, low liquid buffer.',
    annual_income_approx: 850000,
    monthly_inflow: '₹70,833',
    discretionary_ratio: '42.1%',
    savings_buffer: '1.8 mos',
    primary_channel: 'UPI (78%)',
    archetype_expected: 'High-Burn Consumer',
    tax_slab_expected: 'Class 1: ₹4,00,001 - ₹8,00,000 (5%)',
    persona_expected: 'High-Burn Tech Fresher',
    transaction_count: 145,
    download_url: '/api/samples/student_entry/csv'
  },
  {
    profile_id: 'balanced_pro',
    title: 'Priya Nair',
    subtitle: 'Mid-Level Product Designer, Mumbai',
    category: 'SALARIED PROFESSIONALS',
    description: 'Balanced spender with systematic mutual fund SIPs, moderate rent, and controlled credit card utilization.',
    annual_income_approx: 1420000,
    monthly_inflow: '₹1,18,333',
    discretionary_ratio: '28.4%',
    savings_buffer: '4.5 mos',
    primary_channel: 'NetBanking (54%)',
    archetype_expected: 'Strategic Wealth Builder',
    tax_slab_expected: 'Class 3: ₹12,00,001 - ₹16,00,000 (15%)',
    persona_expected: 'Balanced Design Professional',
    transaction_count: 267,
    download_url: '/api/samples/balanced_pro/csv'
  },
  {
    profile_id: 'wealth_builder',
    title: 'Vikram Malhotra',
    subtitle: 'Senior Engineering Manager, Delhi-NCR',
    category: 'EXECUTIVES & CXO',
    description: 'High net-worth profile with multiple income streams, high tax liability, real estate investments, and aggressive portfolio rebalancing.',
    annual_income_approx: 3850000,
    monthly_inflow: '₹3,20,833',
    discretionary_ratio: '22.8%',
    savings_buffer: '8.2 mos',
    primary_channel: 'Credit Card (62%)',
    archetype_expected: 'Strategic Wealth Builder',
    tax_slab_expected: 'Class 6: Above ₹24,00,000 (30%)',
    persona_expected: 'High-Growth Wealth Builder',
    transaction_count: 110,
    download_url: '/api/samples/wealth_builder/csv'
  },
  {
    profile_id: 'lifestyle_spender',
    title: 'Rohan Mehta',
    subtitle: 'Freelance Full-Stack Developer, Pune',
    category: 'FREELANCERS & GIG WORKERS',
    description: 'Irregular cash flows, international client remittances, seasonal dry spells, and conservative liquid emergency reserves.',
    annual_income_approx: 1140000,
    monthly_inflow: '₹95,000 (avg)',
    discretionary_ratio: '18.5%',
    savings_buffer: '6.0 mos',
    primary_channel: 'UPI / Wire (71%)',
    archetype_expected: 'Frugal Minimalist',
    tax_slab_expected: 'Class 2: ₹8,00,001 - ₹12,00,000 (10%)',
    persona_expected: 'Conservative Freelance Developer',
    transaction_count: 81,
    download_url: '/api/samples/lifestyle_spender/csv'
  },
  {
    profile_id: 'real_agami_account',
    title: 'Real Banking Statement',
    subtitle: 'HDFC Bank Sample, Verified Pipeline',
    category: 'REAL BANKING STATEMENT',
    description: 'Directly exported anonymized CSV bank statement processed end-to-end through regex parser, OCR fallback, and multi-model classifier.',
    annual_income_approx: 984000,
    monthly_inflow: '₹82,000',
    discretionary_ratio: '34.2%',
    savings_buffer: '3.2 mos',
    primary_channel: 'NetBanking / UPI',
    archetype_expected: 'Experiential Spender',
    tax_slab_expected: 'Class 2: ₹8,00,001 - ₹12,00,000 (10%)',
    persona_expected: 'Real Banking Account Sample',
    transaction_count: 142,
    download_url: '/api/samples/real_agami_account/csv'
  }
];

export const VivaPresetsView: React.FC<VivaPresetsViewProps> = ({
  onSelectSample,
  onGoToSimulator
}) => {
  const [samples, setSamples] = useState<SampleProfileItem[]>(FALLBACK_SAMPLES);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filterTabs = ['All', 'Students', 'Salaried', 'Freelancers', 'Executives', 'Customized'];

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const res = await api.getSamples();
        if (res && res.length > 0) {
          // Merge API data with rich fallback fields if any are missing
          const merged = res.map((item) => {
            const fallback = FALLBACK_SAMPLES.find((f) => f.profile_id === item.profile_id);
            return {
              ...fallback,
              ...item,
              subtitle: item.subtitle || fallback?.subtitle,
              monthly_inflow: item.monthly_inflow || fallback?.monthly_inflow,
              discretionary_ratio: item.discretionary_ratio || fallback?.discretionary_ratio,
              savings_buffer: item.savings_buffer || fallback?.savings_buffer,
              primary_channel: item.primary_channel || fallback?.primary_channel,
              archetype_expected: item.archetype_expected || fallback?.archetype_expected
            };
          });
          setSamples(merged);
        }
      } catch (err: any) {
        console.warn('Using pre-calibrated sample profiles:', err);
      }
    };
    fetchSamples();
  }, []);

  const handleAnalyze = async (profileId: string) => {
    setAnalyzingId(profileId);
    setError(null);
    try {
      const res = await api.analyzeSample(profileId);
      onSelectSample(res);
    } catch (err: any) {
      console.error('Failed to run preset analysis:', err);
      setError(err.message || `Failed to analyze preset '${profileId}'. Please check backend connection.`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getInitials = (title: string) => {
    const parts = title.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return title.slice(0, 2).toUpperCase();
  };

  const getArchetypeColor = (archetype?: string) => {
    switch (archetype) {
      case 'High-Burn Consumer':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Strategic Wealth Builder':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Frugal Minimalist':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Experiential Spender':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-300 border-neutral-700';
    }
  };

  // Filtering
  const filteredSamples = samples.filter((sample) => {
    // Filter pill condition
    if (activeFilter === 'Students' && !sample.category.includes('STUDENT')) return false;
    if (activeFilter === 'Salaried' && !sample.category.includes('SALARIED')) return false;
    if (activeFilter === 'Freelancers' && !sample.category.includes('FREELANCER')) return false;
    if (activeFilter === 'Executives' && !sample.category.includes('EXECUTIVE')) return false;
    if (activeFilter === 'Customized') return false; // Handled by promo card

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sample.title.toLowerCase().includes(q);
      const matchDesc = sample.description.toLowerCase().includes(q);
      const matchCat = sample.category.toLowerCase().includes(q);
      const matchSub = sample.subtitle?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchDesc && !matchCat && !matchSub) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <h2 className="text-xl font-bold text-neutral-100 tracking-tight">
          Profile-Based Financial Simulations
        </h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-4xl leading-relaxed">
          Pre-loaded profiles designed for your academic defense and live evaluation. Click any profile to inspect raw telemetry, simulate behavioral shocks, or run full diagnostics.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles..."
            className="w-full bg-[#10141d] border border-[#1c2433] rounded-lg pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 font-semibold shadow'
                    : 'bg-[#10141d] text-neutral-400 border border-[#1b2332] hover:text-neutral-200 hover:bg-[#151b27]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Profile Cards + 6th Promo Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSamples.map((sample) => {
          const isReal = sample.profile_id === 'real_agami_account';
          return (
            <div
              key={sample.profile_id}
              className="border border-[#1a2230] bg-[#0f1219] rounded-xl p-5 flex flex-col justify-between hover:border-[#26354b] transition shadow-sm"
            >
              <div>
                {/* Category Pill & Inflow */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wider">
                    {sample.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatINR(sample.annual_income_approx)} / yr
                  </span>
                </div>

                {/* Profile Identity */}
                <div className="flex items-center space-x-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-[#16202e] border border-[#23334a] flex items-center justify-center text-xs font-bold text-neutral-200 flex-shrink-0">
                    {isReal ? <Building2 className="w-4 h-4 text-emerald-400" /> : getInitials(sample.title)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-100 truncate">
                      {sample.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {sample.subtitle || sample.persona_expected}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-400 mt-3 leading-relaxed min-h-[3rem]">
                  {sample.description}
                </p>

                {/* 4 Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-lg bg-[#0b0e14] border border-[#161f2d] font-mono text-[11px]">
                  <div>
                    <div className="text-[10px] text-neutral-500 font-sans">Monthly Inflow</div>
                    <div className="font-semibold text-neutral-200 mt-0.5">
                      {sample.monthly_inflow || formatINR(sample.annual_income_approx / 12)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-sans">Discretionary Ratio</div>
                    <div className="font-semibold text-neutral-200 mt-0.5">
                      {sample.discretionary_ratio || '28.4%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-sans">Savings Buffer</div>
                    <div className="font-semibold text-neutral-200 mt-0.5">
                      {sample.savings_buffer || '3.5 mos'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-sans">Primary Channel</div>
                    <div className="font-semibold text-neutral-200 mt-0.5">
                      {sample.primary_channel || 'UPI (65%)'}
                    </div>
                  </div>
                </div>

                {/* Archetype Tag */}
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 text-[10px]">Archetype:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${getArchetypeColor(sample.archetype_expected)}`}>
                    {sample.archetype_expected || 'Balanced Saver'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-[#18202d] flex items-center space-x-2">
                <button
                  onClick={() => handleAnalyze(sample.profile_id)}
                  disabled={analyzingId === sample.profile_id}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#10b981] hover:bg-[#059669] text-neutral-950 transition disabled:opacity-50"
                >
                  {analyzingId === sample.profile_id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-950" />
                  ) : (
                    <>
                      <span>Run Diagnostics</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleAnalyze(sample.profile_id)}
                  className="p-2 rounded-lg bg-[#141b25] border border-[#1f293b] text-neutral-400 hover:text-neutral-100 hover:bg-[#1a2332] transition"
                  title="View Telemetry"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* 6th Promo Card: "Different lives. Smarter insights." */}
        {(activeFilter === 'All' || activeFilter === 'Customized') && (
          <div className="border border-dashed border-emerald-500/30 bg-gradient-to-b from-[#10241e]/25 to-[#0b1219]/60 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-500/50 transition">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  CUSTOM RUN
                </span>
              </div>

              <h3 className="text-base font-bold text-neutral-100 mt-4 leading-snug">
                Different lives.<br />Smarter insights.
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Simulate any custom spending behavior by tweaking income, liabilities, rent, and risk appetite in real time.
              </p>

              <div className="mt-5 space-y-2.5 text-xs text-neutral-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>4 distinct lifestyle spending archetypes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Dynamic cashflow stress-testing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>0–100 financial resilience score</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#182326]">
              <button
                onClick={() => onGoToSimulator?.()}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <span>Simulate Custom Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
