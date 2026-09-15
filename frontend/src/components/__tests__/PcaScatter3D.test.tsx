import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PCAPoint } from '../../types';

// Plotly's 3D scene needs WebGL, which jsdom does not provide. Stub the factory so the test
// exercises the data wiring (trace construction, grouping, overlay) rather than the renderer.
const captured = vi.hoisted(() => ({ current: null as unknown as Record<string, unknown> | null }));

vi.mock('plotly.js-dist-min', () => ({ default: {} }));
vi.mock('react-plotly.js/factory', () => ({
  default: () => {
    const PlotStub = (props: Record<string, unknown>) => {
      captured.current = props;
      return <div data-testid="plotly-stub" />;
    };
    return PlotStub;
  }
}));

const { PcaScatter3D } = await import('../PcaScatter3D');

const point = (overrides: Partial<PCAPoint>): PCAPoint => ({
  user_id: 1,
  pca_x: 0,
  pca_y: 0,
  pca_z: 0,
  cluster_id: 0,
  tax_slab_class: 0,
  annual_income: 100000,
  ...overrides
});

const points: PCAPoint[] = [
  point({ user_id: 1, pca_x: 1.1, pca_y: -0.4, pca_z: 0.2, cluster_id: 0, annual_income: 850000, tax_slab_class: 1 }),
  point({ user_id: 2, pca_x: 0.7, pca_y: 0.9, pca_z: -1.2, cluster_id: 0, annual_income: 1200000 }),
  point({ user_id: 3, pca_x: -2.2, pca_y: 1.4, pca_z: 0.5, cluster_id: 2, annual_income: 3800000, tax_slab_class: 6 })
];

const traces = () => captured.current?.data as Record<string, never>[] | undefined;

describe('PcaScatter3D', () => {
  it('builds one scatter3d trace per cluster with real coordinates', () => {
    render(<PcaScatter3D points={points} clusterNames={{ '0': 'Frugal Minimalist', '2': 'High-Burn Consumer' }} />);

    const built = traces() ?? [];
    expect(built).toHaveLength(2);
    expect(built[0].type).toBe('scatter3d');
    expect([...(built[0].x as number[])].sort()).toEqual([0.7, 1.1]);
    expect(built[0].name).toBe('Frugal Minimalist');
    expect(built[1].name).toBe('High-Burn Consumer');
    expect([...(built[1].z as number[])]).toEqual([0.5]);
  });

  it('labels clusters from the evaluation API and falls back to their index', () => {
    render(<PcaScatter3D points={points} clusterNames={{ '0': 'Frugal Minimalist' }} />);

    const legendEntries = screen.getAllByText(/Cluster 2|Frugal Minimalist/);
    expect(legendEntries.length).toBeGreaterThan(0);
    expect(traces()?.map((trace) => trace.name)).toEqual(['Frugal Minimalist', 'Cluster 2']);
  });

  it('overlays the uploaded statement as two extra traces when a coordinate is supplied', () => {
    render(
      <PcaScatter3D
        points={points}
        userCoord={[0.5, -1.5, 2.5]}
        userLabel="Priya Nair"
      />
    );

    const built = traces() ?? [];
    expect(built).toHaveLength(4); // 2 clusters + halo + core marker
    const overlay = built.filter((trace) => trace.name === 'Priya Nair');
    expect(overlay).toHaveLength(2);
    expect(overlay[1].x).toEqual([0.5]);
    expect(overlay[1].y).toEqual([-1.5]);
    expect(overlay[1].z).toEqual([2.5]);

    expect(screen.getByText(/You are here — Priya Nair/)).toBeInTheDocument();
  });

  it('omits the overlay entirely without a coordinate', () => {
    render(<PcaScatter3D points={points} />);
    expect(traces() ?? []).toHaveLength(2);
    expect(screen.queryByText(/You are here/)).not.toBeInTheDocument();
  });

  it('renders a friendly empty state instead of an empty canvas', () => {
    render(<PcaScatter3D points={[]} loading={false} />);
    expect(screen.getByText(/No cluster points returned by the API/)).toBeInTheDocument();
    expect(screen.queryByTestId('plotly-stub')).not.toBeInTheDocument();
  });

  it('surfaces an API error without throwing', () => {
    render(<PcaScatter3D points={[]} loading={false} error="Models are not trained yet." />);
    expect(screen.getByText('Models are not trained yet.')).toBeInTheDocument();
  });

  it('shows a spinner while the projection loads', () => {
    render(<PcaScatter3D points={[]} loading />);
    expect(screen.getByText(/Projecting cluster coordinates/)).toBeInTheDocument();
    expect(screen.queryByTestId('plotly-stub')).not.toBeInTheDocument();
  });

  it('quotes the real profile count from the API payload', () => {
    render(<PcaScatter3D points={points} />);
    expect(screen.getByText(/3 real training profiles projected from 16 dimensions to 3/)).toBeInTheDocument();
  });
});
