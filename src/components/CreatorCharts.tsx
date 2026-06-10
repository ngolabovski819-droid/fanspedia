'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Snapshot } from '@/types/creator';

interface Point {
  t: number; // captured_at as epoch ms
  v: number; // metric value
}

interface MetricDef {
  key: keyof Omit<Snapshot, 'capturedAt'>;
  label: string;
  color: string;
}

// Each metric the user asked to track, in display order (one chart below another).
const METRICS: MetricDef[] = [
  { key: 'favoritedCount', label: 'Likes (Favorited)', color: '#00AFF0' },
  { key: 'finishedStreamsCount', label: 'Finished Streams', color: '#a855f7' },
  { key: 'postsCount', label: 'Posts', color: '#22c55e' },
  { key: 'videosCount', label: 'Videos', color: '#f59e0b' },
  { key: 'audiosCount', label: 'Audios', color: '#ec4899' },
  { key: 'mediasCount', label: 'Media', color: '#14b8a6' },
  { key: 'archivedPostsCount', label: 'Archived Posts', color: '#ef4444' },
];

const CHART_H = 240;
const PAD = { top: 24, right: 24, bottom: 36, left: 64 };
const DEFAULT_W = 800; // SSR fallback width before the container is measured

const numberFmt = new Intl.NumberFormat('en-US');
const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function toPoints(snapshots: Snapshot[], key: MetricDef['key']): Point[] {
  return snapshots
    .map((s) => ({ t: new Date(s.capturedAt).getTime(), v: s[key] }))
    .filter((p): p is Point => p.v != null && Number.isFinite(p.t));
}

function LineChart({ label, color, points }: { label: string; color: string; points: Point[] }) {
  const gradId = useId();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(DEFAULT_W);
  const [hover, setHover] = useState<number | null>(null);

  // Measure the container so the chart renders crisp at any width (no SVG
  // scaling distortion on stroke widths or data dots).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || DEFAULT_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (points.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">{label}</h3>
        <p className="chart-empty">No data captured yet.</p>
      </div>
    );
  }

  const tMin = points[0].t;
  const tMax = points[points.length - 1].t;
  const tSpan = tMax - tMin || 1;

  let vMin = Math.min(...points.map((p) => p.v));
  let vMax = Math.max(...points.map((p) => p.v));
  if (vMin === vMax) {
    // Flat line — pad so it sits in the middle instead of on an axis.
    vMin = vMin === 0 ? 0 : vMin * 0.95;
    vMax = vMax === 0 ? 1 : vMax * 1.05;
  }
  const vSpan = vMax - vMin || 1;

  const innerW = Math.max(width - PAD.left - PAD.right, 10);
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const sx = (t: number) => PAD.left + ((t - tMin) / tSpan) * innerW;
  const sy = (v: number) => PAD.top + innerH - ((v - vMin) / vSpan) * innerH;

  const coords = points.map((p) => ({ x: sx(p.t), y: sy(p.v), p }));
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath =
    `M${coords[0].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} ` +
    coords.map((c) => `L${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ') +
    ` L${coords[coords.length - 1].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;

  // Y gridlines (4 bands). Hide a label when it rounds to the same value as the
  // one below it (happens when the metric barely changes across snapshots).
  let prevLabel: string | null = null;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = vMin + f * vSpan;
    const text = numberFmt.format(Math.round(v));
    const showLabel = text !== prevLabel;
    prevLabel = text;
    return { y: sy(v), text, showLabel };
  });

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = wrapRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xUser = e.clientX - rect.left;
    // Nearest point by x.
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const d = Math.abs(coords[i].x - xUser);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setHover(best);
  }

  const last = points[points.length - 1].v;
  const first = points[0].v;
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / first) * 100 : null;
  const hovered = hover != null ? coords[hover] : null;

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3 className="chart-title">{label}</h3>
        <div className="chart-meta">
          <span className="chart-current">{numberFmt.format(last)}</span>
          {delta !== 0 && (
            <span className={`chart-delta${delta > 0 ? ' up' : ' down'}`}>
              {delta > 0 ? '▲' : '▼'} {numberFmt.format(Math.abs(delta))}
              {deltaPct != null ? ` (${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}%)` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="chart-canvas" ref={wrapRef}>
      <svg
        className="chart-svg"
        width={width}
        height={CHART_H}
        viewBox={`0 0 ${width} ${CHART_H}`}
        role="img"
        aria-label={`${label} over time`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gridlines + Y labels */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={tick.y}
              x2={width - PAD.right}
              y2={tick.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text x={PAD.left - 10} y={tick.y + 4} textAnchor="end" className="chart-axis-label">
              {tick.showLabel ? tick.text : ''}
            </text>
          </g>
        ))}

        {/* Area + line */}
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Data dots */}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={hover === i ? 5 : 3} fill={color} stroke="var(--surface)" strokeWidth="1.5" />
        ))}

        {/* X axis end labels */}
        <text x={PAD.left} y={CHART_H - 12} textAnchor="start" className="chart-axis-label">
          {dateFmt.format(new Date(tMin))}
        </text>
        <text x={width - PAD.right} y={CHART_H - 12} textAnchor="end" className="chart-axis-label">
          {dateFmt.format(new Date(tMax))}
        </text>

        {/* Hover crosshair */}
        {hovered && (
          <line
            x1={hovered.x}
            y1={PAD.top}
            x2={hovered.x}
            y2={PAD.top + innerH}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
        )}
      </svg>
      </div>

      {hovered && (
        <div className="chart-tooltip">
          <strong>{numberFmt.format(hovered.p.v)}</strong>
          <span>{dateFmt.format(new Date(hovered.p.t))}</span>
        </div>
      )}
    </div>
  );
}

export default function CreatorCharts({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length === 0) {
    return (
      <section className="charts-section">
        <h2 className="charts-heading">Growth Charts</h2>
        <p className="chart-empty">
          No snapshots recorded yet. Charts appear once this creator has been scraped at least once.
        </p>
      </section>
    );
  }

  return (
    <section className="charts-section">
      <h2 className="charts-heading">Growth Charts</h2>
      <p className="charts-subtitle">
        Tracked across {snapshots.length} snapshot{snapshots.length === 1 ? '' : 's'} over time.
      </p>
      <div className="charts-stack">
        {METRICS.map((m) => (
          <LineChart key={m.key} label={m.label} color={m.color} points={toPoints(snapshots, m.key)} />
        ))}
      </div>
    </section>
  );
}
