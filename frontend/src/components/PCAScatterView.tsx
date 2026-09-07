import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Monitor, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { PCAPoint, UploadStatementResponse } from '../types';

interface PCAScatterViewProps {
  currentResult?: UploadStatementResponse | null;
}

const checkWebGLSupport = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

export const PCAScatterView: React.FC<PCAScatterViewProps> = ({ currentResult }) => {
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<PCAPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasWebGL] = useState<boolean>(() => checkWebGLSupport());
  const [viewMode, setViewMode] = useState<'3d' | '2d'>(() => (checkWebGLSupport() ? '3d' : '2d'));
  const [colorMode, setColorMode] = useState<'persona' | 'slab'>('persona');

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await api.getPCAPoints();
        setPoints(res.points);
      } catch (err) {
        console.error('Failed to load PCA points:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  useEffect(() => {
    if (!plotContainerRef.current || points.length === 0) return;

    const personaColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
    const slabColors = ['#10b981', '#34d399', '#60a5fa', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

    const personaNames = [
      'High-Growth Wealth Builder',
      'Balanced Corporate Professional',
      'Discretionary Lifestyle Spender',
      'Entry-Level / Student Saver'
    ];

    const traces: any[] = [];

    if (colorMode === 'persona') {
      for (let c = 0; c < 4; c++) {
        const clusterPts = points.filter((p) => p.cluster_id === c);
        if (clusterPts.length === 0) continue;

        if (viewMode === '3d') {
          traces.push({
            type: 'scatter3d',
            mode: 'markers',
            name: personaNames[c],
            x: clusterPts.map((p) => p.pca_x),
            y: clusterPts.map((p) => p.pca_y),
            z: clusterPts.map((p) => p.pca_z),
            text: clusterPts.map((p) => `User #${p.user_id}<br>Income: ₹${p.annual_income.toLocaleString('en-IN')}<br>Slab: Class ${p.tax_slab_class}`),
            marker: {
              size: 4,
              color: personaColors[c],
              opacity: 0.75
            }
          });
        } else {
          traces.push({
            type: 'scatter',
            mode: 'markers',
            name: personaNames[c],
            x: clusterPts.map((p) => p.pca_x),
            y: clusterPts.map((p) => p.pca_y),
            text: clusterPts.map((p) => `User #${p.user_id}<br>Income: ₹${p.annual_income.toLocaleString('en-IN')}`),
            marker: {
              size: 6,
              color: personaColors[c],
              opacity: 0.75
            }
          });
        }
      }
    } else {
      for (let s = 0; s < 7; s++) {
        const slabPts = points.filter((p) => p.tax_slab_class === s);
        if (slabPts.length === 0) continue;

        if (viewMode === '3d') {
          traces.push({
            type: 'scatter3d',
            mode: 'markers',
            name: `Tax Class ${s}`,
            x: slabPts.map((p) => p.pca_x),
            y: slabPts.map((p) => p.pca_y),
            z: slabPts.map((p) => p.pca_z),
            text: slabPts.map((p) => `User #${p.user_id}<br>Income: ₹${p.annual_income.toLocaleString('en-IN')}`),
            marker: {
              size: 4,
              color: slabColors[s],
              opacity: 0.75
            }
          });
        } else {
          traces.push({
            type: 'scatter',
            mode: 'markers',
            name: `Tax Class ${s}`,
            x: slabPts.map((p) => p.pca_x),
            y: slabPts.map((p) => p.pca_y),
            text: slabPts.map((p) => `User #${p.user_id}<br>Income: ₹${p.annual_income.toLocaleString('en-IN')}`),
            marker: {
              size: 6,
              color: slabColors[s],
              opacity: 0.75
            }
          });
        }
      }
    }

    // Highlight current statement user position if available
    if (currentResult?.predictions?.assigned_cluster?.pca_3d_coord) {
      const uCoords = currentResult.predictions.assigned_cluster.pca_3d_coord;
      if (viewMode === '3d') {
        traces.push({
          type: 'scatter3d',
          mode: 'markers+text',
          name: 'Current User',
          x: [uCoords[0]],
          y: [uCoords[1]],
          z: [uCoords[2]],
          text: ['YOU ARE HERE'],
          textposition: 'top center',
          marker: {
            size: 10,
            color: '#ec4899',
            symbol: 'diamond',
            line: { color: '#ffffff', width: 2 }
          }
        });
      } else {
        traces.push({
          type: 'scatter',
          mode: 'markers+text',
          name: 'Current User',
          x: [uCoords[0]],
          y: [uCoords[1]],
          text: ['YOU ARE HERE'],
          textposition: 'top center',
          marker: {
            size: 12,
            color: '#ec4899',
            symbol: 'diamond',
            line: { color: '#ffffff', width: 2 }
          }
        });
      }
    }

    if (viewMode === '3d' && !hasWebGL) {
      if (plotContainerRef.current) {
        Plotly.purge(plotContainerRef.current);
      }
      return;
    }

    const layout: any = {
      paper_bgcolor: '#121316',
      plot_bgcolor: '#121316',
      margin: { l: 20, r: 20, t: 30, b: 20 },
      legend: { font: { color: '#a3a3a3', size: 11 } },
      scene: {
        xaxis: { title: 'Principal Component 1', color: '#737373', gridcolor: '#262626' },
        yaxis: { title: 'Principal Component 2', color: '#737373', gridcolor: '#262626' },
        zaxis: { title: 'Principal Component 3', color: '#737373', gridcolor: '#262626' },
        bgcolor: '#121316'
      },
      xaxis: { title: 'PC 1', color: '#737373', gridcolor: '#262626' },
      yaxis: { title: 'PC 2', color: '#737373', gridcolor: '#262626' }
    };

    Plotly.newPlot(plotContainerRef.current, traces, layout, { responsive: true, displayModeBar: false });
  }, [points, viewMode, colorMode, currentResult, hasWebGL]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-neutral-800 bg-[#121316] rounded-lg p-5">
        <div>
          <h2 className="text-base font-semibold text-neutral-100">
            Latent Feature Space Projection (PCA)
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Eigen-decomposition of 16-dimensional financial behaviors capturing 79.22% cumulative variance.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Dimension Toggle */}
          <div className="inline-flex rounded-md p-1 bg-neutral-900 border border-neutral-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 rounded transition ${viewMode === '3d' ? 'bg-neutral-800 text-emerald-400 font-bold' : 'text-neutral-400'}`}
            >
              3D Spatial
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 rounded transition ${viewMode === '2d' ? 'bg-neutral-800 text-emerald-400 font-bold' : 'text-neutral-400'}`}
            >
              2D Planar
            </button>
          </div>

          {/* Color Encoding Toggle */}
          <div className="inline-flex rounded-md p-1 bg-neutral-900 border border-neutral-800 text-xs font-mono">
            <button
              onClick={() => setColorMode('persona')}
              className={`px-3 py-1 rounded transition ${colorMode === 'persona' ? 'bg-neutral-800 text-emerald-400 font-bold' : 'text-neutral-400'}`}
            >
              By Persona
            </button>
            <button
              onClick={() => setColorMode('slab')}
              className={`px-3 py-1 rounded transition ${colorMode === 'slab' ? 'bg-neutral-800 text-emerald-400 font-bold' : 'text-neutral-400'}`}
            >
              By Tax Slab
            </button>
          </div>
        </div>
      </div>

      {/* Plot Container */}
      <div className="border border-neutral-800 bg-[#121316] rounded-lg p-4 h-[550px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-neutral-400 bg-[#121316]/80 z-10">
            Rendering Latent Point Cloud...
          </div>
        )}

        {viewMode === '3d' && !hasWebGL ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-neutral-950/60 rounded-lg border border-neutral-800/80">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Monitor className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-200">
              WebGL Hardware Acceleration Disabled
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mt-2 leading-relaxed">
              Your browser or Linux display currently has WebGL acceleration turned off. The 2D Planar view uses standard SVG/Canvas and works without WebGL.
            </p>

            <button
              onClick={() => setViewMode('2d')}
              className="mt-5 flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <span>Switch to 2D Planar Projection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="mt-6 pt-4 border-t border-neutral-800/80 text-left max-w-md w-full text-[11px] font-mono text-neutral-400 space-y-1">
              <div className="text-neutral-300 font-semibold mb-1">To enable 3D WebGL in your browser:</div>
              <div>• Chrome / Brave: Open <span className="text-emerald-400">chrome://settings/system</span> and toggle "Use graphics acceleration when available" ON.</div>
              <div>• Or enable <span className="text-emerald-400">chrome://flags/#ignore-gpu-blocklist</span> (Override software rendering list).</div>
              <div>• Firefox: Open <span className="text-emerald-400">about:config</span> and set <span className="text-emerald-400">webgl.force-enabled</span> to true.</div>
            </div>
          </div>
        ) : (
          <div ref={plotContainerRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
};
