import React from 'react';
import { PanelLeft } from 'lucide-react';

interface TopHeaderProps {
  onToggleSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="h-14 border-b border-[#181f2a] bg-[#0b0e14] px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg bg-[#11161f] border border-[#1d2634] text-neutral-400 hover:text-neutral-200 transition"
          title="Toggle Navigation"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#16202c] border border-[#233144] flex items-center justify-center text-xs font-semibold text-neutral-200">
          U
        </div>
      </div>
    </header>
  );
};
