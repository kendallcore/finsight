import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { api } from '../services/api';
import { PCAPoint, UploadStatementResponse } from '../types';

interface PCAScatterViewProps {
  currentResult?: UploadStatementResponse | null;
}

export const PCAScatterView: React.FC<PCAScatterViewProps> = ({ currentResult }) => {
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<PCAPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
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
  }, [points, viewMode, colorMode, currentResult]);

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
            Rendering 3D Latent Point Cloud...
          </div>
        )}
        <div ref={plotContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
