import { useMemo, useState, useRef, useCallback } from 'react';
import { getLastNDays } from '../utils/dateUtils.js';

// ─── Shared constants ──────────────────────────────────────────────────────────

export const RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

const W = 600, H = 200;
export const PAD = { l: 42, r: 12, t: 16, b: 32 };
export const cW = W - PAD.l - PAD.r;
export const cH = H - PAD.t - PAD.b;

export function buildSmoothPath(pts, close = false) {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cpx} ${pts[i - 1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  if (close && pts.length > 1) {
    d += ` L ${pts[pts.length - 1].x} ${PAD.t + cH} L ${pts[0].x} ${PAD.t + cH} Z`;
  }
  return d;
}

export function xAxisStep(n) {
  return Math.max(1, Math.floor(n / ({ 7: 7, 30: 6, 90: 6, 180: 6, 365: 7 }[n] || 6)));
}

export function formatXLabel(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  if (n <= 7)  return d.toLocaleDateString('en-US', { weekday: 'short' });
  if (n <= 90) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function RangeSelector({ ranges, activeIdx, onSelect, accent }) {
  return (
    <div className="flex items-center gap-1 rounded-xl p-1 border"
      style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-inner-border, #1a1a1a)' }}>
      {ranges.map((r, i) => (
        <button
          key={r.label}
          onClick={() => onSelect(i)}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
          style={activeIdx === i
            ? { background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }
            : { color: 'var(--text-subtle, #4b5563)', border: '1px solid transparent' }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function ChartGrid() {
  return (
    <>
      {[0, 25, 50, 75, 100].map(pct => {
        const y = PAD.t + (1 - pct / 100) * cH;
        return (
          <g key={pct}>
            <line x1={PAD.l} y1={y} x2={PAD.l + cW} y2={y}
              stroke={pct === 0 || pct === 100 ? '#222' : '#161616'} strokeWidth="1" />
            <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#3b3b3b"
              fontFamily="Inter, system-ui, sans-serif">{pct}%</text>
          </g>
        );
      })}
    </>
  );
}

// ─── GrowthChart (reusable) ────────────────────────────────────────────────────

export default function GrowthChart({ habits, accentColor, compact = false }) {
  const [rangeIdx, setRangeIdx] = useState(1);
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const accent = accentColor || '#22c55e';
  const range = RANGES[rangeIdx];

  const data = useMemo(() => {
    return getLastNDays(range.days).map(date => {
      const dow = new Date(date + 'T00:00:00').getDay();
      const applicable = habits.filter(h => {
        const f = h.frequency || 'daily';
        if (f === 'weekdays' && (dow === 0 || dow === 6)) return false;
        if (f === 'weekends' && dow >= 1 && dow <= 5) return false;
        return true;
      });
      const completed = applicable.filter(h => h.completions.includes(date)).length;
      const total = applicable.length;
      return { date, pct: total > 0 ? Math.round((completed / total) * 100) : null, completed, total };
    });
  }, [habits, range.days]);

  const points = useMemo(() => data.map((d, i) => ({
    ...d,
    x: PAD.l + (i / Math.max(data.length - 1, 1)) * cW,
    y: d.pct !== null ? PAD.t + (1 - d.pct / 100) * cH : null,
  })), [data]);

  const segments = useMemo(() => {
    const segs = []; let cur = [];
    points.forEach(p => { if (p.y !== null) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } });
    if (cur.length) segs.push(cur);
    return segs;
  }, [points]);

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = null, minDist = Infinity;
    points.forEach((p) => {
      if (p.y === null) return;
      const dist = Math.abs(p.x - svgX);
      if (dist < minDist) { minDist = dist; closest = p; }
    });
    setHover(closest || null);
  }, [points]);

  const nonNull = data.filter(d => d.pct !== null);
  const avg = nonNull.length ? Math.round(nonNull.reduce((s, d) => s + d.pct, 0) / nonNull.length) : 0;
  const peak = nonNull.length ? Math.max(...nonNull.map(d => d.pct)) : 0;
  const perfect = nonNull.filter(d => d.pct === 100).length;

  const step = xAxisStep(range.days);
  const labelIdxs = useMemo(() => {
    const idxs = [];
    for (let i = 0; i < data.length; i += step) idxs.push(i);
    if (idxs[idxs.length - 1] !== data.length - 1) idxs.push(data.length - 1);
    return idxs;
  }, [data.length, step]);

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--bg-inner, #0a0a0a)', borderColor: 'var(--bg-inner-border, #1a1a1a)' }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-white font-semibold text-sm">Overall Progress</p>
          {!compact && <p className="text-[#4b5563] text-xs mt-0.5">Daily habit completion rate</p>}
        </div>
        <RangeSelector ranges={RANGES} activeIdx={rangeIdx} onSelect={(i) => { setRangeIdx(i); setHover(null); }} accent={accent} />
      </div>

      <div className="flex items-center gap-4 px-4 pb-2">
        <div><p className="text-white font-bold text-base leading-none">{avg}%</p><p className="text-[#4b5563] text-[10px] mt-0.5">Avg</p></div>
        <div className="w-px h-5 bg-[#1a1a1a]" />
        <div><p className="text-white font-bold text-base leading-none">{peak}%</p><p className="text-[#4b5563] text-[10px] mt-0.5">Peak</p></div>
        <div className="w-px h-5 bg-[#1a1a1a]" />
        <div><p className="font-bold text-base leading-none" style={{ color: accent }}>{perfect}</p><p className="text-[#4b5563] text-[10px] mt-0.5">Perfect</p></div>
        {hover && (
          <>
            <div className="flex-1" />
            <div className="text-right">
              <p className="font-bold text-base leading-none" style={{ color: accent }}>
                {hover.pct !== null ? `${hover.pct}%` : '—'}
              </p>
              <p className="text-[#4b5563] text-[10px] mt-0.5">
                {new Date(hover.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {hover.total > 0 ? ` · ${hover.completed}/${hover.total}` : ''}
              </p>
            </div>
          </>
        )}
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full"
        style={{ height: compact ? 160 : 200, display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={`cgrad_${accent.slice(1)}`} x1="0" y1={PAD.t} x2="0" y2={PAD.t + cH} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <ChartGrid />
        {segments.map((seg, i) => <path key={`f${i}`} d={buildSmoothPath(seg, true)} fill={`url(#cgrad_${accent.slice(1)})`} />)}
        {segments.map((seg, i) => <path key={`l${i}`} d={buildSmoothPath(seg)} fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />)}
        {labelIdxs.map(i => (
          <text key={i} x={points[i].x} y={H - 6} textAnchor="middle" fontSize="8.5" fill="#3b3b3b" fontFamily="Inter, system-ui, sans-serif">
            {formatXLabel(points[i].date, range.days)}
          </text>
        ))}
        {hover && hover.y !== null && (
          <g>
            <line x1={hover.x} y1={PAD.t} x2={hover.x} y2={PAD.t + cH} stroke={accent} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
            <line x1={PAD.l} y1={hover.y} x2={PAD.l + cW} y2={hover.y} stroke={accent} strokeWidth="1" strokeDasharray="3 2" opacity="0.25" />
            <circle cx={hover.x} cy={hover.y} r="4" fill={accent} stroke="var(--bg-inner, #0a0a0a)" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
}
