import React from 'react';
import {
  LayoutDashboard,
  FileText,
  SlidersHorizontal,
  BarChart3,
  Users,
  Code2,
  Settings,
  Sprout
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen = true }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'diagnostic', label: 'Statement Analysis', icon: FileText },
    { id: 'simulator', label: 'What-If Simulator', icon: SlidersHorizontal },
    { id: 'evaluation', label: 'Model Evaluation', icon: BarChart3 },
    { id: 'viva', label: 'Profile Simulations', icon: Users },
    { id: 'api', label: 'API & Integrations', icon: Code2 },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-[#FBFBFB] dark:bg-[#0b0e14] border-r border-[#E5E7EB] dark:border-[#181f2a] flex flex-col justify-between flex-shrink-0 h-screen select-none transition-colors">
      <div>
        {/* Logo Section */}
        <div className="p-6 pb-4">
          <div className="flex items-center space-x-3">
            {/* Custom FinSight Leaf Emblem */}
            <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] dark:bg-[#122421] border border-[#CEEAD6] dark:border-emerald-500/30 flex items-center justify-center text-[#137333] dark:text-emerald-400 flex-shrink-0 shadow-xs">
              <Sprout className="w-4 h-4 text-[#137333] dark:text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100 tracking-tight text-base leading-tight">
                FinSight
              </div>
              <div className="text-[10px] font-sans text-neutral-500 dark:text-neutral-400 font-medium tracking-wide mt-0.5">
                Live Brighter
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#E8F5E9] dark:bg-[#122421] text-[#166534] dark:text-[#34d399] font-semibold shadow-xs border border-transparent dark:border-emerald-500/30'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#166534] dark:text-[#34d399]' : 'text-neutral-500 dark:text-neutral-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 space-y-4">
        {/* Decorative Quote Card with Leaves */}
        <div className="bg-[#F0F5F1] dark:bg-[#121915] border border-[#E0EBE2] dark:border-[#1c2c22] rounded-2xl p-4 relative overflow-hidden shadow-2xs">
          <div className="text-[#2E7D32]/50 dark:text-emerald-400/40 text-4xl font-serif leading-none select-none">
            “
          </div>
          <p className="text-xs font-serif italic text-neutral-800 dark:text-neutral-200 leading-snug mt-1 max-w-[150px]">
            “Better money habits. A freer you.”
          </p>

          {/* Leaf plant illustration in bottom right */}
          <div className="absolute -bottom-2 -right-2 w-14 h-14 pointer-events-none opacity-40">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M70 95C70 50 30 30 10 20C40 30 75 45 85 95" stroke="#1B5E20" strokeWidth="6" strokeLinecap="round"/>
              <path d="M45 50C25 40 15 25 15 10C35 20 45 35 45 50Z" fill="#2E7D32"/>
              <path d="M60 65C45 55 35 40 35 25C55 35 60 50 60 65Z" fill="#388E3C"/>
              <path d="M75 80C65 70 55 55 55 40C75 50 75 65 75 80Z" fill="#4CAF50"/>
            </svg>
          </div>
        </div>

        {/* Settings & User footer */}
        <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#181f2a] space-y-3">
          <button className="w-full flex items-center space-x-3 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition">
            <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span>Settings</span>
          </button>

          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              U
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">User</span>
              <span className="text-[10px] text-neutral-400 font-medium">Free Plan</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
