import {
  UploadStatementResponse,
  ModelEvaluationResponse,
  PCAPointsResponse,
  SampleProfileItem,
  ExtractedFeatures
} from '../types';

const API_BASE = '/api';

export const api = {
  async checkHealth(): Promise<{ status: string; tax_regime_year: string; models_loaded: boolean }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('API is unreachable');
    return res.json();
  },

  async uploadStatement(file: File): Promise<UploadStatementResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload-statement`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload statement' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async predictFeatures(features: ExtractedFeatures): Promise<UploadStatementResponse> {
    const res = await fetch(`${API_BASE}/predict-features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(err.detail || 'Prediction failed');
    }
    return res.json();
  },

  async getEvaluation(): Promise<ModelEvaluationResponse> {
    const res = await fetch(`${API_BASE}/models/evaluation`);
    if (!res.ok) throw new Error('Failed to fetch model evaluations');
    return res.json();
  },

  async getPCAPoints(): Promise<PCAPointsResponse> {
    const res = await fetch(`${API_BASE}/clusters/pca-points`);
    if (!res.ok) throw new Error('Failed to fetch PCA points');
    return res.json();
  },

  async getSamples(): Promise<SampleProfileItem[]> {
    const res = await fetch(`${API_BASE}/samples`);
    if (!res.ok) throw new Error('Failed to fetch sample profiles');
    return res.json();
  },

  async analyzeSample(profileId: string): Promise<UploadStatementResponse> {
    const res = await fetch(`${API_BASE}/samples/${profileId}/analyze`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to analyze sample ${profileId}`);
    return res.json();
  }
};
