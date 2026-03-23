import { useState, useMemo } from 'react';

// Chart dimensions (same as real GrowthChart)
const W = 600, H = 200;
const PAD = { l: 42, r: 12, t: 16, b: 32 };
const cW = W - PAD.l - PAD.r;
const cH = H - PAD.t - PAD.b;

// Smooth path builder
function buildSmoothPath(pts, close = false) {
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

// Sample data for demonstration
const SAMPLE_DATA_1W = [
  { day: 'Mon', pct: 85 },
  { day: 'Tue', pct: 92 },
  { day: 'Wed', pct: 78 },
  { day: 'Thu', pct: 95 },
  { day: 'Fri', pct: 88 },
  { day: 'Sat', pct: 100 },
  { day: 'Sun', pct: 82 },
];

const SAMPLE_DATA_1M = [
  { day: '1', pct: 75 }, { day: '3', pct: 82 }, { day: '5', pct: 88 }, { day: '7', pct: 85 },
  { day: '9', pct: 92 }, { day: '11', pct: 78 }, { day: '13', pct: 95 }, { day: '15', pct: 88 },
  { day: '17', pct: 82 }, { day: '19', pct: 90 }, { day: '21', pct: 100 }, { day: '23', pct: 85 },
  { day: '25', pct: 92 }, { day: '27', pct: 88 }, { day: '29', pct: 95 }, { day: '31', pct: 90 },
];

const RANGES = [
  { label: '1W', data: SAMPLE_DATA_1W },
  { label: '1M', data: SAMPLE_DATA_1M },
];

export default function LandingChart({ accent = '#22c55e' }) {
  const [rangeIdx, setRangeIdx] = useState(0);
  const [hover, setHover] = useState(null);
  
  const range = RANGES[rangeIdx];
  const data = range.data;
  
  const points = useMemo(() => data.map((d, i) => ({
    ...d,
    x: PAD.l + (i / Math.max(data.length - 1, 1)) * cW,
    y: PAD.t + (1 - d.pct / 100) * cH,
  })), [data]);

  const avg = Math.round(data.reduce((s, d) => s + d.pct, 0) / data.length);
  const peak = Math.max(...data.map(d => d.pct));
  const perfect = data.filter(d => d.pct === 100).length;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = null, minDist = Infinity;
    points.forEach((p) => {
      const dist = Math.abs(p.x - svgX);
      if (dist < minDist) { minDist = dist; closest = p; }
    });
    setHover(closest || null);
  };

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: '#0a0a0a', borderColor: '#1a1a1a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-white font-semibold text-sm">Overall Progress</p>
          <p className="text-[#4b5563] text-xs mt-0.5">Daily habit completion rate</p>
        </div>
        {/* Range selector */}
        <div className="flex items-center gap-1 rounded-xl p-1 border"
          style={{ background: '#111111', borderColor: '#1a1a1a' }}>
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => { setRangeIdx(i); setHover(null); }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={rangeIdx === i
                ? { background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }
                : { color: '#4b5563', border: '1px solid transparent' }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-4 pb-2">
        <div>
          <p className="text-white font-bold text-base leading-none">{avg}%</p>
          <p className="text-[#4b5563] text-[10px] mt-0.5">Avg</p>
        </div>
        <div className="w-px h-5 bg-[#1a1a1a]" />
        <div>
          <p className="text-white font-bold text-base leading-none">{peak}%</p>
          <p className="text-[#4b5563] text-[10px] mt-0.5">Peak</p>
        </div>
        <div className="w-px h-5 bg-[#1a1a1a]" />
        <div>
          <p className="font-bold text-base leading-none" style={{ color: accent }}>{perfect}</p>
          <p className="text-[#4b5563] text-[10px] mt-0.5">Perfect</p>
        </div>
        {hover && (
          <>
            <div className="flex-1" />
            <div className="text-right">
              <p className="font-bold text-base leading-none" style={{ color: accent }}>
                {hover.pct}%
              </p>
              <p className="text-[#4b5563] text-[10px] mt-0.5">{hover.day}</p>
            </div>
          </>
        )}
      </div>

      {/* SVG Chart */}
      <svg 
        viewBox={`0 0 ${W} ${H}`} 
        preserveAspectRatio="none" 
        className="w-full"
        style={{ height: 200, display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove} 
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="landingGrad" x1="0" y1={PAD.t} x2="0" y2={PAD.t + cH} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = PAD.t + (1 - pct / 100) * cH;
          return (
            <g key={pct}>
              <line x1={PAD.l} y1={y} x2={PAD.l + cW} y2={y} stroke="#1a1a1a" strokeWidth="1" />
              <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#4b5563"
                fontFamily="Inter, system-ui, sans-serif">{pct}%</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={buildSmoothPath(points, true)} fill="url(#landingGrad)" />
        
        {/* Line */}
        <path d={buildSmoothPath(points)} fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />

        {/* X-axis labels */}
        {points.filter((_, i) => rangeIdx === 0 || i % 4 === 0 || i === points.length - 1).map((p, i) => (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="8.5" fill="#4b5563" fontFamily="Inter, system-ui, sans-serif">
            {p.day}
          </text>
        ))}

        {/* Hover indicator */}
        {hover && (
          <g>
            <line x1={hover.x} y1={PAD.t} x2={hover.x} y2={PAD.t + cH} stroke={accent} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
            <line x1={PAD.l} y1={hover.y} x2={PAD.l + cW} y2={hover.y} stroke={accent} strokeWidth="1" strokeDasharray="3 2" opacity="0.25" />
            <circle cx={hover.x} cy={hover.y} r="4" fill={accent} stroke="#0a0a0a" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
}
