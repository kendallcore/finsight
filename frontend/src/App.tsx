import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DiagnosticView } from './components/DiagnosticView';
import { SimulatorView } from './components/SimulatorView';
import { EvaluationHub } from './components/EvaluationHub';
import { PCAScatterView } from './components/PCAScatterView';
import { VivaPresetsView } from './components/VivaPresetsView';
import { api } from './services/api';
import { UploadStatementResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('diagnostic');
  const [analysisResult, setAnalysisResult] = useState<UploadStatementResponse | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean>(false);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await api.checkHealth();
        setApiHealthy(res.models_loaded);
      } catch {
        setApiHealthy(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectSample = (data: UploadStatementResponse) => {
    setAnalysisResult(data);
    setActiveTab('diagnostic');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d0e] text-neutral-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiHealthy={apiHealthy}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'diagnostic' && (
          <DiagnosticView data={analysisResult} setData={setAnalysisResult} />
        )}
        {activeTab === 'simulator' && <SimulatorView />}
        {activeTab === 'evaluation' && <EvaluationHub />}
        {activeTab === 'pca' && <PCAScatterView currentResult={analysisResult} />}
        {activeTab === 'viva' && <VivaPresetsView onSelectSample={handleSelectSample} />}
      </main>

      <footer className="border-t border-neutral-900 bg-[#0f1012] py-6 text-center text-xs font-mono text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FinSight — Introduction to Machine Learning (PBL Mini-Project)</span>
          <span>Section 115BAC (FY 2025–26) • 16D Feature Vector • Random Forest & GBR</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
