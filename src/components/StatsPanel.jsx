import { useMemo, useState, useRef, useCallback } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getLastNDays, getShortWeekday, getTodayString } from '../utils/dateUtils.js';
import { getLevelColor, getLevelTitle, getLevelIcon, getLevelFromXP, getLevelProgress, getXPForCurrentLevel, getXPNeededForNextLevel } from '../utils/gamification.js';
import XPBar from './XPBar.jsx';
import WeeklyReview from './WeeklyReview.jsx';

// ─── Chart ────────────────────────────────────────────────────────────────────

const RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

const W = 600, H = 200;
const PAD = { l: 42, r: 12, t: 16, b: 32 };
const cW = W - PAD.l - PAD.r;
const cH = H - PAD.t - PAD.b;

function buildSmoothPath(pts, close = false) {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const cpx = (p0.x + p1.x) / 2;
    d += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  if (close && pts.length > 1) {
    d += ` L ${pts[pts.length - 1].x} ${PAD.t + cH} L ${pts[0].x} ${PAD.t + cH} Z`;
  }
  return d;
}

function xAxisLabels(n) {
  const maxLabels = { 7: 7, 30: 6, 90: 6, 180: 6, 365: 7 }[n] || 6;
  const step = Math.max(1, Math.floor(n / maxLabels));
  return step;
}

function formatXLabel(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  if (n <= 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  if (n <= 90) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function CompletionChart({ habits, accentColor }) {
  const [rangeIdx, setRangeIdx] = useState(1); // default 1M
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  const range = RANGES[rangeIdx];

  const data = useMemo(() => {
    const days = getLastNDays(range.days);
    return days.map(date => {
      const dow = new Date(date + 'T00:00:00').getDay();
      const applicable = habits.filter(h => {
        const freq = h.frequency || 'daily';
        if (freq === 'weekdays' && (dow === 0 || dow === 6)) return false;
        if (freq === 'weekends' && dow >= 1 && dow <= 5) return false;
        return true;
      });
      const completed = applicable.filter(h => h.completions.includes(date)).length;
      const total = applicable.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : null;
      return { date, pct, completed, total };
    });
  }, [habits, range.days]);

  // Map to SVG coordinates
  const points = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      x: PAD.l + (i / Math.max(data.length - 1, 1)) * cW,
      y: d.pct !== null ? PAD.t + (1 - d.pct / 100) * cH : null,
    }));
  }, [data]);

  // Split into segments (skip null days)
  const segments = useMemo(() => {
    const segs = [];
    let cur = [];
    points.forEach(p => {
      if (p.y !== null) { cur.push(p); }
      else if (cur.length) { segs.push(cur); cur = []; }
    });
    if (cur.length) segs.push(cur);
    return segs;
  }, [points]);

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = null, minDist = Infinity;
    points.forEach((p, i) => {
      if (p.y === null) return;
      const dist = Math.abs(p.x - svgX);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setHover(closest !== null ? points[closest] : null);
  }, [points]);

  const accent = accentColor || '#22c55e';
  const gradId = 'chart-grad';
  const step = xAxisLabels(range.days);

  // X-axis label indices
  const labelIndices = useMemo(() => {
    const idxs = [];
    for (let i = 0; i < data.length; i += step) idxs.push(i);
    // Always include last
    if (idxs[idxs.length - 1] !== data.length - 1) idxs.push(data.length - 1);
    return idxs;
  }, [data.length, step]);

  // Stats from data
  const nonNull = data.filter(d => d.pct !== null);
  const avg = nonNull.length ? Math.round(nonNull.reduce((s, d) => s + d.pct, 0) / nonNull.length) : 0;
  const peak = nonNull.length ? Math.max(...nonNull.map(d => d.pct)) : 0;
  const perfect = nonNull.filter(d => d.pct === 100).length;

  return (
    <div className="rounded-3xl border overflow-hidden" style={{ background: '#0a0a0a', borderColor: '#1a1a1a' }}>
      {/* Header row */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-white font-semibold text-sm">Completion Rate</p>
          <p className="text-[#4b5563] text-xs mt-0.5">Daily habit completion %</p>
        </div>
        {/* Range tabs */}
        <div className="flex items-center gap-1 bg-[#111111] rounded-xl p-1 border border-[#1a1a1a]">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => { setRangeIdx(i); setHover(null); }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={rangeIdx === i
                ? { background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }
                : { color: '#4b5563', border: '1px solid transparent' }
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini stats */}
      <div className="flex gap-4 px-5 pb-3">
        <div>
          <p className="text-white font-bold text-lg leading-none">{avg}%</p>
          <p className="text-[#4b5563] text-[10px] mt-0.5">Avg</p>
        </div>
        <div className="w-px bg-[#1a1a1a]" />
        <div>
          <p className="text-white font-bold text-lg leading-none">{peak}%</p>
          <p className="text-[#4b5563] text-[10px] mt-0.5">Peak</p>
        </div>
        <div className="w-px bg-[#1a1a1a]" />
        <div>
          <p className="font-bold text-lg leading-none" style={{ color: accent }}>{perfect}</p>
          <p className="text-[#4b5563] text-[10px] mt-0.5">Perfect days</p>
        </div>
        {hover && (
          <>
            <div className="flex-1" />
            <div className="text-right">
              <p className="font-bold text-lg leading-none" style={{ color: accent }}>
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

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: 200, display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1={PAD.t} x2="0" y2={PAD.t + cH} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = PAD.t + (1 - pct / 100) * cH;
          return (
            <g key={pct}>
              <line
                x1={PAD.l} y1={y} x2={PAD.l + cW} y2={y}
                stroke={pct === 0 || pct === 100 ? '#222' : '#161616'}
                strokeWidth="1"
              />
              <text
                x={PAD.l - 4} y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill="#3b3b3b"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {segments.map((seg, si) => (
          <path
            key={`fill-${si}`}
            d={buildSmoothPath(seg, true)}
            fill={`url(#${gradId})`}
          />
        ))}

        {/* Line */}
        {segments.map((seg, si) => (
          <path
            key={`line-${si}`}
            d={buildSmoothPath(seg, false)}
            fill="none"
            stroke={accent}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* X-axis labels */}
        {labelIndices.map(i => {
          const p = points[i];
          return (
            <text
              key={i}
              x={p.x}
              y={H - 6}
              textAnchor="middle"
              fontSize="8.5"
              fill="#3b3b3b"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {formatXLabel(p.date, range.days)}
            </text>
          );
        })}

        {/* Hover crosshair */}
        {hover && hover.y !== null && (
          <g>
            <line
              x1={hover.x} y1={PAD.t} x2={hover.x} y2={PAD.t + cH}
              stroke={accent} strokeWidth="1" strokeDasharray="3 2" opacity="0.5"
            />
            <line
              x1={PAD.l} y1={hover.y} x2={PAD.l + cW} y2={hover.y}
              stroke={accent} strokeWidth="1" strokeDasharray="3 2" opacity="0.25"
            />
            <circle
              cx={hover.x} cy={hover.y} r="4"
              fill={accent}
              stroke="#0a0a0a"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color = '#7C3AED' }) {
  return (
    <div
      className="rounded-2xl p-4 border flex flex-col gap-2"
      style={{ background: `${color}0d`, borderColor: `${color}20` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        {sub && <span className="text-[10px] text-[#4b5563] bg-white/5 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <div>
        <p className="font-bold text-2xl leading-none" style={{ color }}>{value}</p>
        <p className="text-[#6b7280] text-xs mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function StatsPanel() {
  const { habits, profile, stats, currentLevel, freezeShields, accentColor } = useHabits();
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const today = getTodayString();
  const last7 = getLastNDays(7);

  const habitStats = useMemo(() => {
    return habits.map(h => ({
      ...h,
      totalCompletions: h.completions.length,
      last7Count: last7.filter(d => h.completions.includes(d)).length,
      currentStreak: h.streak || 0,
    })).sort((a, b) => b.totalCompletions - a.totalCompletions);
  }, [habits, last7]);

  const levelColor = getLevelColor(currentLevel);
  const levelTitle = getLevelTitle(currentLevel);
  const levelIcon = getLevelIcon(currentLevel);
  const totalXP = profile.totalXP || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Statistics</h2>
          <p className="text-[#6b7280] text-sm mt-1">Your performance at a glance</p>
        </div>
        <button
          onClick={() => setShowWeeklyReview(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30`, color: accentColor }}
        >
          <span>📋</span>
          <span className="hidden sm:inline">Weekly Review</span>
        </button>
      </div>

      {/* Freeze Shields */}
      {freezeShields > 0 && (
        <div
          className="flex items-center gap-3 p-3.5 rounded-2xl border"
          style={{ background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}
        >
          <span className="text-2xl">🛡️</span>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">{freezeShields} Freeze Shield{freezeShields > 1 ? 's' : ''}</p>
            <p className="text-[#6b7280] text-xs">Use in Habits tab when a streak is at risk</p>
          </div>
          <span className="text-[#A78BFA] font-bold text-lg">{freezeShields}×</span>
        </div>
      )}

      {/* Level / XP card */}
      <div
        className="rounded-3xl p-5 border"
        style={{
          background: `linear-gradient(135deg, ${levelColor}15, ${levelColor}05)`,
          borderColor: `${levelColor}30`,
          boxShadow: `0 0 30px ${levelColor}10`,
        }}
      >
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0"
            style={{ background: `${levelColor}25`, border: `2px solid ${levelColor}60`, boxShadow: `0 0 20px ${levelColor}40` }}
          >
            {levelIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-2xl">Level {currentLevel}</span>
              <span
                className="text-sm font-semibold px-3 py-1 rounded-full"
                style={{ background: `${levelColor}25`, color: levelColor, border: `1px solid ${levelColor}50` }}
              >
                {levelTitle}
              </span>
            </div>
            <p className="text-[#6b7280] text-sm mt-1">{totalXP.toLocaleString()} total XP earned</p>
          </div>
        </div>
        <XPBar totalXP={totalXP} />
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Completions" value={stats.totalCompletions.toLocaleString()} icon="✅" color={accentColor} />
        <StatCard label="Best Streak Ever" value={`${stats.bestStreakEver}d`} icon="🏆" color="#F59E0B" sub="all time" />
        <StatCard label="Active Streak" value={`${stats.currentLongestStreak}d`} icon="🔥" color="#F97316" sub="current" />
        <StatCard label="7-Day Rate" value={`${stats.completionRateLast7}%`} icon="📈" color="#8B5CF6" sub="completion" />
      </div>

      {/* TradingView-style chart */}
      {habits.length > 0 && (
        <CompletionChart habits={habits} accentColor={accentColor} />
      )}

      {/* Per-habit breakdown */}
      {habitStats.length > 0 && (
        <div className="rounded-3xl p-5 border border-white/5" style={{ background: '#0d0d0d' }}>
          <h3 className="text-white font-semibold text-sm mb-4">Habit Breakdown</h3>
          <div className="space-y-3">
            {habitStats.map(habit => {
              const pct = Math.round((habit.last7Count / 7) * 100);
              return (
                <div key={habit.id} className="flex items-center gap-3">
                  <span className="text-lg flex-shrink-0">{habit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-white text-sm font-medium truncate">{habit.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {habit.currentStreak > 0 && (
                          <span className="text-orange-400 text-xs font-medium">🔥{habit.currentStreak}</span>
                        )}
                        <span className="text-[#4b5563] text-xs">{habit.totalCompletions}×</span>
                      </div>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: habit.color, boxShadow: `0 0 6px ${habit.color}60` }}
                      />
                    </div>
                    <span className="text-[#4b5563] text-[10px] mt-0.5 block">{pct}% this week</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📊</div>
          <h3 className="text-white font-semibold">No data yet</h3>
          <p className="text-[#6b7280] text-sm mt-1">Add some habits to see your stats here!</p>
        </div>
      )}

      {showWeeklyReview && <WeeklyReview onClose={() => setShowWeeklyReview(false)} />}
    </div>
  );
}
