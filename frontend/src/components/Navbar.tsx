import React from 'react';
import { Activity, Layers, Cpu, Zap, Award } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  apiHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, apiHealthy }) => {
  const tabs = [
    { id: 'diagnostic', label: 'Statement Diagnostic', icon: Activity },
    { id: 'simulator', label: 'What-If Simulator', icon: Zap },
    { id: 'evaluation', label: 'Model Evaluation Hub', icon: Cpu },
    { id: 'pca', label: '3D Latent Space (PCA)', icon: Layers },
    { id: 'viva', label: 'Viva Defense Presets', icon: Award },
  ];

  return (
    <header className="border-b border-neutral-800 bg-[#0f1012] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-base">
              ₹
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-neutral-100 tracking-tight">FinSight</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  FY 2025–26 (Sec 115BAC)
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Machine Learning Financial Diagnostics & Indian Tax Estimator
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Health Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                apiHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-neutral-400">
              {apiHealthy ? 'API Online' : 'API Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
