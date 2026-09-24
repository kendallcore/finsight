import React from 'react';
import { Search, Sun, Moon, Bell, Upload, PanelLeft } from 'lucide-react';

interface TopHeaderProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onToggleSidebar?: () => void;
  onUploadClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  theme = 'light',
  onToggleTheme,
  onToggleSidebar,
  onUploadClick
}) => {
  return (
    <header className="h-16 border-b border-[#E5E7EB] dark:border-[#1d2634] bg-[#FBFBFB] dark:bg-[#0b0e14] px-6 flex items-center justify-between flex-shrink-0 transition-colors">
      {/* Search Input Bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 md:hidden"
          title="Toggle Navigation"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="w-full relative flex items-center">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder='Search statements, insights, or try "Show my subscriptions"...'
            className="w-full bg-[#F8F9FA] dark:bg-[#11161f] border border-[#E5E7EB] dark:border-[#1d2634] rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#151b26] transition shadow-2xs"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 ml-4">
        {/* Sun / Moon Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-full border border-[#E5E7EB] dark:border-[#232f42] bg-white dark:bg-[#161d28] text-neutral-600 dark:text-amber-400 hover:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-[#1f2937] transition shadow-2xs flex items-center justify-center cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-neutral-600" />
          )}
        </button>

        {/* Bell / Notification toggle */}
        <button
          className="p-2 rounded-full border border-[#E5E7EB] dark:border-[#232f42] bg-white dark:bg-[#161d28] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-[#1f2937] transition shadow-2xs"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Upload Statement Primary Button */}
        <button
          onClick={onUploadClick}
          className="bg-[#0C4A34] hover:bg-[#083626] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 shadow-xs transition"
        >
          <Upload className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Upload Statement</span>
        </button>
      </div>
    </header>
  );
};
