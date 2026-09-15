import {
  UploadStatementResponse,
  PredictFeaturesResponse,
  ModelEvaluationResponse,
  PCAPointsResponse,
  SampleProfileItem,
  ExtractedFeatures,
  InsightRequest,
  InsightResponse
} from '../types';

const API_BASE = '/api';

async function readError(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({ detail: fallback }));
  return err.detail || fallback;
}

export const api = {
  async checkHealth(): Promise<{ status: string; tax_regime_year: string; models_loaded: boolean }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('API is unreachable');
    return res.json();
  },

  async uploadStatement(file: File, entityType: string = 'salaried_individual', pdfPassword?: string): Promise<UploadStatementResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    if (pdfPassword) {
      formData.append('pdf_password', pdfPassword);
    }
    const res = await fetch(`${API_BASE}/upload-statement`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await readError(res, 'Upload failed'));
    }
    return res.json();
  },

  async predictFeatures(features: ExtractedFeatures): Promise<PredictFeaturesResponse> {
    const res = await fetch(`${API_BASE}/predict-features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
    });
    if (!res.ok) {
      throw new Error(await readError(res, 'Prediction failed'));
    }
    return res.json();
  },

  async getInsights(profileId: string): Promise<InsightResponse> {
    const res = await fetch(`${API_BASE}/insights/${encodeURIComponent(profileId)}`);
    if (!res.ok) {
      throw new Error(await readError(res, 'Failed to fetch insights'));
    }
    return res.json();
  },

  async createInsights(body: InsightRequest): Promise<InsightResponse> {
    const res = await fetch(`${API_BASE}/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(await readError(res, 'Failed to generate insights'));
    }
    return res.json();
  },

  async getEvaluation(): Promise<ModelEvaluationResponse> {
    const res = await fetch(`${API_BASE}/models/evaluation`);
    if (!res.ok) throw new Error(await readError(res, 'Failed to fetch model evaluations'));
    return res.json();
  },

  async getPCAPoints(): Promise<PCAPointsResponse> {
    const res = await fetch(`${API_BASE}/clusters/pca-points`);
    if (!res.ok) throw new Error(await readError(res, 'Failed to fetch PCA cluster points'));
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
    if (!res.ok) throw new Error(await readError(res, `Failed to analyze sample ${profileId}`));
    return res.json();
  }
};
