import { useMemo, useState, useRef, useCallback } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getLastNDays, getTodayString } from '../utils/dateUtils.js';
import { getLevelColor, getLevelTitle, getLevelIcon, ACHIEVEMENTS, RARITY_COLORS } from '../utils/gamification.js';
import XPBar from './XPBar.jsx';
import WeeklyReview from './WeeklyReview.jsx';
import GrowthChart, { RANGES, PAD, cW, cH, buildSmoothPath, xAxisStep, formatXLabel, RangeSelector, ChartGrid } from './GrowthChart.jsx';

const W = 600, H = 200;

// ─── Health Chart ─────────────────────────────────────────────────────────────

const HEALTH_SERIES = [
  { key: 'water',    label: 'Water',    emoji: '💧', color: '#3b82f6', unitLabel: 'L avg/day' },
  { key: 'sleep',    label: 'Sleep',    emoji: '😴', color: '#8b5cf6', unitLabel: 'hrs avg/night' },
  { key: 'meals',    label: 'Meals',    emoji: '🍽️', color: '#22c55e', unitLabel: 'meals/day' },
  { key: 'exercise', label: 'Exercise', emoji: '💪', color: '#f97316', unitLabel: 'sessions' },
];

const MEAL_IDS = ['habit_breakfast', 'habit_lunch', 'habit_dinner', 'habit_fruits', 'habit_vitamins'];

const HEALTH_ACHIEVEMENT_IDS = [
  'hydration_week', 'hydration_master',
  'sleep_week', 'sleep_master',
  'meals_week',
  'double_training',
  'wellness_warrior',
  'bjj_white_1', 'bjj_white_2', 'bjj_white_3', 'bjj_white_4', 'bjj_blue_belt',
];

function HealthChart({ habits, achievements }) {
  const [rangeIdx, setRangeIdx] = useState(0);
  const [active, setActive] = useState({ water: true, sleep: true, meals: true, exercise: true });
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const range = RANGES[rangeIdx];

  const waterHabit = habits.find(h => h.id === 'habit_water');
  const sleepHabit = habits.find(h => h.id === 'habit_sleep');
  const gymHabit   = habits.find(h => h.id === 'habit_gym');
  const bjjHabit   = habits.find(h => h.id === 'habit_jiujitsu');
  const mealHabits = MEAL_IDS.map(id => habits.find(h => h.id === id)).filter(Boolean);

  // Find the earliest date any health habit has data (to avoid showing flat 0 before tracking started)
  const healthStartDate = useMemo(() => {
    const allHabits = [waterHabit, sleepHabit, gymHabit, bjjHabit, ...mealHabits].filter(Boolean);
    let earliest = null;
    allHabits.forEach(h => {
      // Check completions
      if (h.completions && h.completions.length > 0) {
        const d = [...h.completions].sort()[0];
        if (!earliest || d < earliest) earliest = d;
      }
      // Check numericValues
      const numDates = Object.keys(h.numericValues || {});
      if (numDates.length > 0) {
        const d = [...numDates].sort()[0];
        if (!earliest || d < earliest) earliest = d;
      }
    });
    return earliest;
  }, [waterHabit, sleepHabit, gymHabit, bjjHabit, mealHabits]);

  const data = useMemo(() => {
    return getLastNDays(range.days).map(date => {
      // Before tracking started → all null (like growth chart)
      if (healthStartDate && date < healthStartDate) {
        return { date, water: null, sleep: null, meals: null, exercise: null, waterRaw: null, sleepRaw: null, mealsRaw: 0, exerciseRaw: 0 };
      }
      const wRaw = waterHabit ? ((waterHabit.numericValues || {})[date] ?? null) : null;
      const sRaw = sleepHabit ? ((sleepHabit.numericValues || {})[date] ?? null) : null;
      const mCount = mealHabits.reduce((n, h) => n + (h.completions.includes(date) ? 1 : 0), 0);
      const eCount = (gymHabit?.completions.includes(date) ? 1 : 0) + (bjjHabit?.completions.includes(date) ? 1 : 0);
      return {
        date,
        water:    wRaw != null ? Math.min(wRaw / 2 * 100, 115) : null,
        sleep:    sRaw != null ? Math.min(sRaw / (sleepHabit?.goal || 8) * 100, 115) : null,
        meals:    mealHabits.length > 0 ? (mCount / 5 * 100) : null,
        exercise: (gymHabit || bjjHabit) ? (eCount / 2 * 100) : null,
        waterRaw: wRaw, sleepRaw: sRaw, mealsRaw: mCount, exerciseRaw: eCount,
      };
    });
  }, [habits, range.days, waterHabit, sleepHabit, gymHabit, bjjHabit, mealHabits, healthStartDate]);

  const toPoint = (d, i, key) => ({
    x: PAD.l + (i / Math.max(data.length - 1, 1)) * cW,
    y: d[key] != null ? PAD.t + (1 - Math.min(d[key], 100) / 100) * cH : null,
    ...d,
  });

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = null, minDist = Infinity;
    data.forEach((d, i) => {
      const x = PAD.l + (i / Math.max(data.length - 1, 1)) * cW;
      const dist = Math.abs(x - svgX);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setHover(closest !== null ? { x: PAD.l + (closest / Math.max(data.length - 1, 1)) * cW, ...data[closest] } : null);
  }, [data]);

  // Summary stats
  const nonNull = (key) => data.filter(d => d[key + 'Raw'] != null);
  const avgWater   = nonNull('water').length   ? (nonNull('water').reduce((s, d) => s + d.waterRaw, 0) / nonNull('water').length).toFixed(1) : '—';
  const avgSleep   = nonNull('sleep').length   ? (nonNull('sleep').reduce((s, d) => s + d.sleepRaw, 0) / nonNull('sleep').length).toFixed(1) : '—';
  const totalEx    = data.reduce((s, d) => s + (d.exerciseRaw || 0), 0);
  const mealPct    = nonNull('meals').length   ? Math.round(nonNull('meals').reduce((s, d) => s + d.mealsRaw, 0) / nonNull('meals').length * 10) / 10 : '—';

  const step = xAxisStep(range.days);
  const labelIdxs = useMemo(() => {
    const idxs = [];
    for (let i = 0; i < data.length; i += step) idxs.push(i);
    if (idxs[idxs.length - 1] !== data.length - 1) idxs.push(data.length - 1);
    return idxs;
  }, [data.length, step]);

  // Health medals
  const unlockedIds = new Set((achievements || []).map(a => a.id));
  const healthMedals = ACHIEVEMENTS.filter(a => HEALTH_ACHIEVEMENT_IDS.includes(a.id));

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--bg-inner)', borderColor: 'var(--bg-inner-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-white font-semibold text-sm">Health Overview</p>
            <p className="text-[#4b5563] text-xs mt-0.5">Water · Sleep · Meals · Exercise</p>
          </div>
          <RangeSelector ranges={RANGES} activeIdx={rangeIdx} onSelect={(i) => { setRangeIdx(i); setHover(null); }} accent="#3b82f6" />
        </div>

        {/* Mini stats — same layout as CompletionChart */}
        <div className="flex items-center gap-4 px-5 pb-3 flex-wrap">
          <div>
            <p className="text-[#3b82f6] font-bold text-lg leading-none">💧 {avgWater}<span className="text-xs font-normal text-[#4b5563] ml-0.5">L</span></p>
            <p className="text-[#4b5563] text-[10px] mt-0.5">Avg water/day</p>
          </div>
          <div className="w-px h-6 bg-[#1a1a1a]" />
          <div>
            <p className="text-[#8b5cf6] font-bold text-lg leading-none">😴 {avgSleep}<span className="text-xs font-normal text-[#4b5563] ml-0.5">h</span></p>
            <p className="text-[#4b5563] text-[10px] mt-0.5">Avg sleep/night</p>
          </div>
          <div className="w-px h-6 bg-[#1a1a1a]" />
          <div>
            <p className="text-[#22c55e] font-bold text-lg leading-none">🍽️ {mealPct}<span className="text-xs font-normal text-[#4b5563] ml-0.5">/5</span></p>
            <p className="text-[#4b5563] text-[10px] mt-0.5">Avg meals/day</p>
          </div>
          <div className="w-px h-6 bg-[#1a1a1a]" />
          <div>
            <p className="text-[#f97316] font-bold text-lg leading-none">💪 {totalEx}</p>
            <p className="text-[#4b5563] text-[10px] mt-0.5">Workouts</p>
          </div>
          {hover && (
            <>
              <div className="flex-1" />
              <div className="text-right">
                <p className="text-white text-[10px] font-semibold">
                  {new Date(hover.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="flex gap-2 justify-end mt-0.5">
                  {HEALTH_SERIES.filter(s => active[s.key]).map(s => {
                    const raw = hover[s.key + 'Raw'];
                    if (raw == null) return null;
                    const fmt = typeof raw === 'number' && !Number.isInteger(raw) ? raw.toFixed(1) : raw;
                    return <span key={s.key} className="text-[10px] font-semibold" style={{ color: s.color }}>{s.emoji}{fmt}</span>;
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Series toggles */}
        <div className="flex gap-1.5 px-5 pb-3 flex-wrap">
          {HEALTH_SERIES.map(s => (
            <button
              key={s.key}
              onClick={() => setActive(a => ({ ...a, [s.key]: !a[s.key] }))}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={{
                background: active[s.key] ? `${s.color}18` : 'transparent',
                border: `1px solid ${active[s.key] ? s.color + '50' : '#1f1f1f'}`,
                color: active[s.key] ? s.color : '#4b5563',
              }}
            >
              <span>{s.emoji}</span><span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* SVG Chart */}
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full"
          style={{ height: 200, display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)}>
          <defs>
            {HEALTH_SERIES.map(s => (
              <linearGradient key={s.key} id={`hg-${s.key}`} x1="0" y1={PAD.t} x2="0" y2={PAD.t + cH} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>
          <ChartGrid />
          {HEALTH_SERIES.filter(s => active[s.key]).map(s => {
            const allPts = data.map((d, i) => toPoint(d, i, s.key));
            // Split into segments at null gaps (same approach as CompletionChart)
            const segs = []; let cur = [];
            allPts.forEach(p => { if (p.y !== null) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } });
            if (cur.length) segs.push(cur);
            if (segs.length === 0) return null;
            return (
              <g key={s.key}>
                {segs.map((seg, i) => <path key={`f${i}`} d={buildSmoothPath(seg, true)} fill={`url(#hg-${s.key})`} />)}
                {segs.map((seg, i) => <path key={`l${i}`} d={buildSmoothPath(seg)} fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" />)}
              </g>
            );
          })}
          {labelIdxs.map(i => (
            <text key={i} x={PAD.l + (i / Math.max(data.length - 1, 1)) * cW} y={H - 6}
              textAnchor="middle" fontSize="8.5" fill="var(--text-dim)" fontFamily="Inter, system-ui, sans-serif">
              {formatXLabel(data[i].date, range.days)}
            </text>
          ))}
          {hover && (
            <g>
              <line x1={hover.x} y1={PAD.t} x2={hover.x} y2={PAD.t + cH} stroke="#555" strokeWidth="1" strokeDasharray="3 2" />
              {HEALTH_SERIES.filter(s => active[s.key]).map(s => {
                const pct = hover[s.key];
                if (pct == null) return null;
                const y = PAD.t + (1 - Math.min(pct, 100) / 100) * cH;
                return <circle key={s.key} cx={hover.x} cy={y} r="3.5" fill={s.color} stroke="#0a0a0a" strokeWidth="1.5" />;
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Health Medals */}
      <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--bg-inner)', borderColor: 'var(--bg-inner-border)' }}>
        <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--bg-inner-border)' }}>
          <p className="text-white font-semibold text-sm">Health Medals</p>
          <p className="text-[#4b5563] text-xs mt-0.5">
            {healthMedals.filter(a => unlockedIds.has(a.id)).length} / {healthMedals.length} unlocked
          </p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          {healthMedals.map(achievement => {
            const unlocked = unlockedIds.has(achievement.id);
            const rarity = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;
            return (
              <div
                key={achievement.id}
                className="flex items-center gap-2.5 p-3 rounded-2xl border transition-all"
                style={{
                  background: unlocked ? `${rarity.bg}` : 'var(--bg-card)',
                  borderColor: unlocked ? rarity.border : 'var(--bg-inner-border)',
                  boxShadow: unlocked ? rarity.glow : 'none',
                  opacity: unlocked ? 1 : 0.45,
                  filter: unlocked ? 'none' : 'grayscale(0.6)',
                }}
              >
                <span className="text-xl flex-shrink-0">{unlocked ? achievement.icon : '🔒'}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight truncate"
                    style={{ color: unlocked ? rarity.text : '#4b5563' }}>
                    {achievement.name}
                  </p>
                  <p className="text-[9px] mt-0.5 leading-tight" style={{ color: unlocked ? rarity.text + 'aa' : '#3b3b3b' }}>
                    {achievement.description}
                  </p>
                  {unlocked && (
                    <p className="text-[9px] mt-0.5 font-bold" style={{ color: rarity.text }}>+{achievement.xpReward} XP</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color = '#7C3AED' }) {
  return (
    <div className="rounded-2xl p-4 border flex flex-col gap-2"
      style={{ background: `${color}0d`, borderColor: `${color}20` }}>
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

const MOODS_META = [
  { key: 'crushing', emoji: '🚀', label: 'Crushing it', score: 5, color: '#22c55e' },
  { key: 'great',    emoji: '😄', label: 'Great',       score: 4, color: '#3b82f6' },
  { key: 'good',     emoji: '🙂', label: 'Good',        score: 3, color: '#8b5cf6' },
  { key: 'meh',      emoji: '😐', label: 'Meh',         score: 2, color: '#f59e0b' },
  { key: 'rough',    emoji: '😩', label: 'Rough',       score: 1, color: '#ef4444' },
];

function MoodHistory({ moods }) {
  const days = useMemo(() => {
    const arr = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      arr.push({ date: ds, mood: moods[ds] || null });
    }
    return arr;
  }, [moods]);

  const logged = days.filter(d => d.mood);
  const avgScore = logged.length
    ? (logged.reduce((s, d) => s + (MOODS_META.find(m => m.key === d.mood?.key)?.score || 0), 0) / logged.length).toFixed(1)
    : null;
  const dominantMood = logged.length
    ? MOODS_META.reduce((best, m) => {
        const cnt = logged.filter(d => d.mood?.key === m.key).length;
        return cnt > (best.cnt || 0) ? { ...m, cnt } : best;
      }, {})
    : null;

  return (
    <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--bg-inner)', borderColor: 'var(--bg-inner-border)' }}>
      <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--bg-inner-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Mood History</p>
            <p className="text-[#4b5563] text-xs mt-0.5">Last 30 days · {logged.length} entries</p>
          </div>
          {dominantMood?.emoji && (
            <div className="text-right">
              <p className="text-2xl leading-none">{dominantMood.emoji}</p>
              <p className="text-[10px] mt-0.5" style={{ color: dominantMood.color }}>{dominantMood.label}</p>
            </div>
          )}
        </div>
        {avgScore && (
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-white font-bold text-lg leading-none">{avgScore}<span className="text-xs font-normal text-[#4b5563]">/5</span></p>
              <p className="text-[#4b5563] text-[10px] mt-0.5">Avg mood</p>
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(avgScore / 5) * 100}%`,
                  background: avgScore >= 4 ? '#22c55e' : avgScore >= 3 ? '#8b5cf6' : avgScore >= 2 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 30-day grid */}
      <div className="p-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
          {days.map(({ date, mood }) => {
            const m = mood ? MOODS_META.find(x => x.key === mood.key) : null;
            return (
              <div
                key={date}
                title={`${date}${mood ? ` · ${mood.emoji} ${mood.label}` : ' · no entry'}`}
                className="aspect-square rounded-md flex items-center justify-center text-[10px]"
                style={{
                  background: m ? `${m.color}20` : 'var(--bg-subtle)',
                  border: `1px solid ${m ? m.color + '40' : 'transparent'}`,
                }}
              >
                {mood ? mood.emoji : ''}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {MOODS_META.map(m => (
            <div key={m.key} className="flex items-center gap-1">
              <span className="text-xs">{m.emoji}</span>
              <span className="text-[10px]" style={{ color: m.color }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StatsPanel() {
  const { habits, profile, stats, currentLevel, freezeShields, accentColor, achievements, moods } = useHabits();
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const last7 = getLastNDays(7);

  const habitStats = useMemo(() => habits.map(h => ({
    ...h,
    totalCompletions: h.completions.length,
    last7Count: last7.filter(d => h.completions.includes(d)).length,
    currentStreak: h.streak || 0,
  })).sort((a, b) => b.totalCompletions - a.totalCompletions), [habits, last7]);

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
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border"
          style={{ background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}>
          <span className="text-2xl">🛡️</span>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">{freezeShields} Freeze Shield{freezeShields > 1 ? 's' : ''}</p>
            <p className="text-[#6b7280] text-xs">Use in Habits tab when a streak is at risk</p>
          </div>
          <span className="text-[#A78BFA] font-bold text-lg">{freezeShields}×</span>
        </div>
      )}

      {/* Level / XP */}
      <div className="rounded-3xl p-5 border"
        style={{ background: `linear-gradient(135deg, ${levelColor}15, ${levelColor}05)`, borderColor: `${levelColor}30`, boxShadow: `0 0 30px ${levelColor}10` }}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0"
            style={{ background: `${levelColor}25`, border: `2px solid ${levelColor}60`, boxShadow: `0 0 20px ${levelColor}40` }}>
            {levelIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-2xl">Level {currentLevel}</span>
              <span className="text-sm font-semibold px-3 py-1 rounded-full"
                style={{ background: `${levelColor}25`, color: levelColor, border: `1px solid ${levelColor}50` }}>{levelTitle}</span>
            </div>
            <p className="text-[#6b7280] text-sm mt-1">{totalXP.toLocaleString()} total XP earned</p>
          </div>
        </div>
        <XPBar totalXP={totalXP} />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Completions" value={stats.totalCompletions.toLocaleString()} icon="✅" color={accentColor} />
        <StatCard label="Best Streak Ever" value={`${stats.bestStreakEver}d`} icon="🏆" color="#F59E0B" sub="all time" />
        <StatCard label="Active Streak" value={`${stats.currentLongestStreak}d`} icon="🔥" color="#F97316" sub="current" />
        <StatCard label="7-Day Rate" value={`${stats.completionRateLast7}%`} icon="📈" color="#8B5CF6" sub="completion" />
      </div>

      {/* Overall chart */}
      {habits.length > 0 && <GrowthChart habits={habits} accentColor={accentColor} />}

      {/* Health chart + medals */}
      {habits.length > 0 && <HealthChart habits={habits} achievements={achievements} />}

      {/* Mood history */}
      <MoodHistory moods={moods} />

      {/* Habit breakdown */}
      {habitStats.length > 0 && (
        <div className="rounded-3xl p-5 border border-white/5" style={{ background: 'var(--bg-card)' }}>
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
                        {habit.currentStreak > 0 && <span className="text-orange-400 text-xs font-medium">🔥{habit.currentStreak}</span>}
                        <span className="text-[#4b5563] text-xs">{habit.totalCompletions}×</span>
                      </div>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: habit.color || accentColor, boxShadow: `0 0 6px ${habit.color || accentColor}60` }} />
                    </div>
                    <span className="text-[#4b5563] text-[10px] mt-0.5 block">{pct}% this week</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
