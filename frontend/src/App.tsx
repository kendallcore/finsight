import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewView } from './components/OverviewView';
import { DiagnosticView } from './components/DiagnosticView';
import { InsightsView } from './components/InsightsView';
import { SimulatorView } from './components/SimulatorView';
import { EvaluationHub } from './components/EvaluationHub';
import { VivaPresetsView } from './components/VivaPresetsView';
import { ApiIntegrationsView } from './components/ApiIntegrationsView';
import { UploadStatementResponse } from './types';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('finsight_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // fallback
    }
    return 'light';
  });

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [analysisResult, setAnalysisResult] = useState<UploadStatementResponse | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    try {
      localStorage.setItem('finsight_theme', theme);
    } catch {
      // ignore
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSelectSample = (data: UploadStatementResponse) => {
    setAnalysisResult(data);
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${
      theme === 'dark' ? 'dark bg-[#0a0c10] text-neutral-100' : 'bg-[#F8F9FA] text-neutral-900'
    } font-sans transition-colors duration-200`}>
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onUploadClick={() => setActiveTab('diagnostic')}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800">
          {activeTab === 'overview' && (
            <OverviewView
              data={analysisResult}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectSample={handleSelectSample}
            />
          )}
          {activeTab === 'diagnostic' && (
            <DiagnosticView data={analysisResult} setData={setAnalysisResult} />
          )}
          {activeTab === 'insights' && (
            <InsightsView data={analysisResult} onGoToDiagnostic={() => setActiveTab('diagnostic')} />
          )}
          {activeTab === 'simulator' && <SimulatorView />}
          {activeTab === 'evaluation' && (
            <EvaluationHub
              userCoord={analysisResult?.predictions?.assigned_cluster?.pca_3d_coord ?? null}
              userLabel={analysisResult?.statement_summary?.account_holder_name ?? analysisResult?.statement_summary?.filename}
            />
          )}
          {activeTab === 'viva' && (
            <VivaPresetsView
              onSelectSample={handleSelectSample}
              onGoToSimulator={() => setActiveTab('simulator')}
            />
          )}
          {activeTab === 'api' && <ApiIntegrationsView />}
        </main>
      </div>
    </div>
  );
};

export default App;
