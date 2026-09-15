import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DiagnosticView } from './components/DiagnosticView';
import { InsightsView } from './components/InsightsView';
import { SimulatorView } from './components/SimulatorView';
import { EvaluationHub } from './components/EvaluationHub';
import { VivaPresetsView } from './components/VivaPresetsView';
import { ApiIntegrationsView } from './components/ApiIntegrationsView';
import { UploadStatementResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('diagnostic');
  const [analysisResult, setAnalysisResult] = useState<UploadStatementResponse | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const handleSelectSample = (data: UploadStatementResponse) => {
    setAnalysisResult(data);
    setActiveTab('diagnostic');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0c10] text-neutral-200">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-neutral-800">
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
