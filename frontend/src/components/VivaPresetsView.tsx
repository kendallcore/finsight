import React, { useState, useEffect } from 'react';
import { Award, Download, Play } from 'lucide-react';
import { api } from '../services/api';
import { SampleProfileItem, UploadStatementResponse } from '../types';

interface VivaPresetsViewProps {
  onSelectSample: (data: UploadStatementResponse) => void;
}

export const VivaPresetsView: React.FC<VivaPresetsViewProps> = ({ onSelectSample }) => {
  const [samples, setSamples] = useState<SampleProfileItem[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const res = await api.getSamples();
        setSamples(res);
      } catch (err) {
        console.error('Failed to load sample presets:', err);
      }
    };
    fetchSamples();
  }, []);

  const handleAnalyze = async (profileId: string) => {
    setAnalyzingId(profileId);
    try {
      const res = await api.analyzeSample(profileId);
      onSelectSample(res);
    } catch (err) {
      console.error('Failed to run preset analysis:', err);
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

  return (
    <div className="space-y-6">
      <div className="border border-neutral-800 bg-[#121316] rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-neutral-100">
            Academic Viva & Examiner Demonstration Presets
          </h2>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Pre-calibrated Indian banking statements designed for live college PBL presentations. Tests boundary conditions across FY 2025–26 tax exemptions, Section 87A rebates, and high-frequency UPI velocity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {samples.map((sample) => (
          <div
            key={sample.profile_id}
            className="border border-neutral-800 bg-[#121316] rounded-lg p-5 flex flex-col justify-between hover:border-neutral-700 transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                  {sample.category}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ~{formatINR(sample.annual_income_approx)}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-neutral-200 mt-3">
                {sample.title}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {sample.description}
              </p>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-neutral-400">
                  <span>Expected Slab:</span>
                  <span className="text-neutral-200">{sample.tax_slab_expected}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Expected Persona:</span>
                  <span className="text-neutral-200">{sample.persona_expected}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Statement TXNs:</span>
                  <span className="text-neutral-200">{sample.transaction_count} items</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 flex items-center space-x-2">
              <button
                onClick={() => handleAnalyze(sample.profile_id)}
                disabled={analyzingId === sample.profile_id}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{analyzingId === sample.profile_id ? 'Analyzing...' : 'Run Diagnostics'}</span>
              </button>
              <a
                href={sample.download_url}
                download
                className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
