import React from 'react';
import {
  FileSpreadsheet,
  SlidersHorizontal,
  BarChart3,
  Users,
  Code2,
  Sprout
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen = true }) => {
  const navItems = [
    { id: 'diagnostic', label: 'Statement Diagnostic', icon: FileSpreadsheet },
    { id: 'simulator', label: 'What-If Simulator', icon: SlidersHorizontal },
    { id: 'evaluation', label: 'Model Evaluation', icon: BarChart3 },
    { id: 'viva', label: 'Profile Simulations', icon: Users },
    { id: 'api', label: 'API & Integrations', icon: Code2 },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-[#0b0e14] border-r border-[#181f2a] flex flex-col justify-between flex-shrink-0 h-screen select-none transition-all">
      <div>
        {/* Logo Section */}
        <div className="p-6 pb-5">
          <div className="flex items-center space-x-3">
            {/* Custom FinSight Emblem */}
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-neutral-100 tracking-tight text-base leading-tight">
                FinSight
              </div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold mt-0.5">
                LIFESTYLE EDITION
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#122421] text-[#34d399] border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#111621] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#34d399]' : 'text-neutral-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Mission Card */}
      <div className="p-6 border-t border-[#181f2a]/60">
        <div className="flex flex-col space-y-1">
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
            <Sprout className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-neutral-300">Smarter</span>
          <span className="text-xs font-semibold text-neutral-100">Financial Decisions</span>
          <span className="text-[11px] text-neutral-500">for Every Lifestyle</span>
        </div>
      </div>
    </aside>
  );
};
