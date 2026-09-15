import React, { useEffect, useMemo, useState } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import { motion } from 'framer-motion';
import { Box, Rotate3d, Users } from 'lucide-react';
import { PCAPoint } from '../types';
import { ARCHETYPE_COLORS, formatCompactINR } from '../lib/theme';

// Use the factory entry point with the minified partial bundle so the full
// plotly.js build is never pulled into the graph.
const Plot = createPlotlyComponent(Plotly);

interface PcaScatter3DProps {
  points: PCAPoint[];
  /** cluster_id -> display name, sourced from the evaluation API. */
  clusterNames?: Record<string, string>;
  /** The uploaded user's own projected coordinate, highlighted in gold. */
  userCoord?: number[] | null;
  userLabel?: string;
  loading?: boolean;
  error?: string | null;
}

const TAX_SLAB_RATES = ['0%', '5%', '10%', '15%', '20%', '25%', '30%'];

export const PcaScatter3D: React.FC<PcaScatter3DProps> = ({
  points,
  clusterNames,
  userCoord,
  userLabel,
  loading = false,
  error = null
}) => {
  const [pulse, setPulse] = useState(false);

  // Real 3D pulse on the user's own marker (the scene is WebGL, so this is cheap).
  useEffect(() => {
    if (!userCoord || userCoord.length < 3) return;
    const timer = setInterval(() => setPulse((prev) => !prev), 900);
    return () => clearInterval(timer);
  }, [userCoord]);

  const grouped = useMemo(() => {
    const buckets = new Map<number, PCAPoint[]>();
    points.forEach((pt) => {
      const list = buckets.get(pt.cluster_id) ?? [];
      list.push(pt);
      buckets.set(pt.cluster_id, list);
    });
    return buckets;
  }, [points]);

  const data = useMemo(() => {
    const traces: unknown[] = [];

    grouped.forEach((members, clusterId) => {
      const color = ARCHETYPE_COLORS[clusterId % ARCHETYPE_COLORS.length];
      traces.push({
        type: 'scatter3d',
        mode: 'markers',
        name: clusterNames?.[String(clusterId)] ?? `Cluster ${clusterId}`,
        x: members.map((m) => m.pca_x),
        y: members.map((m) => m.pca_y),
        z: members.map((m) => m.pca_z),
        customdata: members.map((m) => [
          formatCompactINR(m.annual_income),
          TAX_SLAB_RATES[m.tax_slab_class] ?? `${m.tax_slab_class}`,
          m.user_id
        ]),
        hovertemplate:
          '<b>%{customdata[0]}</b> annual income<br>' +
          'Tax slab: %{customdata[1]}<br>' +
          'Persona cluster: ' + clusterId + '<br>' +
          'Profile #%{customdata[2]}<extra></extra>',
        marker: { size: 2.6, color, opacity: 0.72 }
      });
    });

    if (userCoord && userCoord.length >= 3) {
      const [x, y, z] = userCoord;
      traces.push({
        type: 'scatter3d',
        mode: 'markers',
        name: userLabel ?? 'Your statement',
        x: [x], y: [y], z: [z],
        hovertemplate: `<b>${userLabel ?? 'Your statement'}</b><extra></extra>`,
        marker: { size: pulse ? 20 : 12, color: 'rgba(250, 204, 21, 0.35)', line: { width: 0 } }
      });
      traces.push({
        type: 'scatter3d',
        mode: 'markers',
        name: userLabel ?? 'Your statement',
        showlegend: false,
        x: [x], y: [y], z: [z],
        hoverinfo: 'skip',
        marker: { size: 7, color: '#facc15', line: { color: '#0a0c10', width: 1 } }
      });
    }

    return traces;
  }, [grouped, clusterNames, userCoord, userLabel, pulse]);

  const layout = useMemo(() => ({
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'ui-monospace, monospace', size: 10, color: '#a1a1aa' },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    showlegend: false,
    scene: {
      bgcolor: 'rgba(0,0,0,0)',
      xaxis: { title: 'PC 1', gridcolor: '#1d2634', zerolinecolor: '#232f42', color: '#71717a' },
      yaxis: { title: 'PC 2', gridcolor: '#1d2634', zerolinecolor: '#232f42', color: '#71717a' },
      zaxis: { title: 'PC 3', gridcolor: '#1d2634', zerolinecolor: '#232f42', color: '#71717a' },
      camera: { eye: { x: 1.6, y: 1.1, z: 0.7 } }
    }
  }), []);

  const config = useMemo(() => ({
    displayModeBar: false,
    responsive: true,
    scrollZoom: true
  }), []);

  const empty = !loading && !error && points.length === 0;

  return (
    <div className="border border-[#1d2634] bg-[#11161f] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <Box className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
            3D Latent Space &mdash; PCA Projection
          </h3>
        </div>
        <span className="text-[10px] font-mono text-neutral-500 flex items-center space-x-1">
          <Rotate3d className="w-3 h-3" />
          <span>drag to rotate &middot; scroll to zoom</span>
        </span>
      </div>
      <p className="text-[11px] text-neutral-400 mb-4">
        {points.length > 0
          ? `${points.length.toLocaleString('en-IN')} real training profiles projected from 16 dimensions to 3.`
          : 'Projected cluster cloud.'}
      </p>

      {loading && (
        <div className="h-[380px] flex flex-col items-center justify-center text-xs font-mono text-neutral-500 space-y-3">
          <motion.div
            className="w-8 h-8 rounded-full border-2 border-[#232f42] border-t-emerald-400"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
          <span>Projecting cluster coordinates…</span>
        </div>
      )}

      {error && !loading && (
        <div className="h-[380px] flex flex-col items-center justify-center text-center px-6">
          <Users className="w-6 h-6 text-neutral-600 mb-3" />
          <p className="text-xs text-neutral-400 max-w-sm">{error}</p>
        </div>
      )}

      {empty && (
        <div className="h-[380px] flex items-center justify-center">
          <p className="text-xs text-neutral-500">No cluster points returned by the API.</p>
        </div>
      )}

      {!loading && !error && points.length > 0 && (
        <>
          <div className="h-[380px]">
            <Plot data={data as never} layout={layout as never} config={config as never} style={{ width: '100%', height: '100%' }} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-[#18202d]">
            {Array.from(grouped.entries()).map(([clusterId, members]) => (
              <div key={clusterId} className="flex items-center space-x-1.5 text-[11px] font-mono">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ARCHETYPE_COLORS[clusterId % ARCHETYPE_COLORS.length] }}
                />
                <span className="text-neutral-300">
                  {clusterNames?.[String(clusterId)] ?? `Cluster ${clusterId}`}
                </span>
                <span className="text-neutral-600">({members.length})</span>
              </div>
            ))}

            {userCoord && userCoord.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="ml-auto flex items-center space-x-2"
              >
                <motion.span
                  className="w-2.5 h-2.5 rounded-full bg-yellow-400"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.55, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                />
                <span className="text-[11px] font-mono text-yellow-300">
                  You are here — {userLabel ?? 'your statement'}
                </span>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PcaScatter3D;
