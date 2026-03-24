import { useState, useMemo, useRef, useCallback } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getGreeting, getFormattedDate, getTodayString, getDayLabel, isHabitApplicableOnDate, getLastNDays } from '../utils/dateUtils.js';
import { getLevelColor } from '../utils/gamification.js';
import ProgressRing from './ProgressRing.jsx';
import XPBar from './XPBar.jsx';
import HabitCard from './HabitCard.jsx';
import AddHabitModal from './AddHabitModal.jsx';
import SharedGrowthChart, { RANGES, PAD, cW, cH, buildSmoothPath, xAxisStep, formatXLabel, RangeSelector, ChartGrid } from './GrowthChart.jsx';

// ─── Category Config ──────────────────────────────────────────────────────────

export const CATEGORIES = [
  { name: 'Religion', icon: '🙏', color: '#8B5CF6' },
  { name: 'Exercise', icon: '💪', color: '#10B981' },
  { name: 'Meals',    icon: '🍽️', color: '#F59E0B' },
  { name: 'Work',     icon: '💼', color: '#3B82F6' },
  { name: 'Study',    icon: '📚', color: '#D97706' },
  { name: 'Family',   icon: '❤️',  color: '#EC4899' },
  { name: 'Health',   icon: '🌿', color: '#06B6D4' },
  { name: 'Other',    icon: '⭐', color: '#94A3B8' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDayCompletion(habits, dateStr, today) {
  if (dateStr > today) return null;
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  const applicable = habits.filter(h => {
    if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5;
    if (h.frequency === 'weekends') return dow === 0 || dow === 6;
    return true;
  });
  if (applicable.length === 0) return null;
  const completed = applicable.filter(h => h.completions.includes(dateStr)).length;
  return completed / applicable.length;
}

// ─── Category Summary Card ────────────────────────────────────────────────────

function CategoryCard({ category, dateHabits, selectedDate }) {
  const { t } = useLanguage();
  const catHabits = dateHabits.filter(h => h.category === category.name);
  const completed = catHabits.filter(h => h.completions.includes(selectedDate)).length;
  const total = catHabits.length;
  const pct = total > 0 ? (completed / total) : null;
  const allDone = total > 0 && completed === total;

  return (
    <div
      className="rounded-2xl p-3 border flex flex-col items-center gap-1.5 min-w-0"
      style={{
        background: allDone
          ? `linear-gradient(135deg, ${category.color}30, ${category.color}15)`
          : `${category.color}10`,
        borderColor: allDone ? `${category.color}60` : `${category.color}25`,
        boxShadow: allDone ? `0 0 14px ${category.color}30` : '',
      }}
    >
      <span className="text-xl leading-none">{category.icon}</span>
      <span className="text-[10px] font-semibold text-slate-300 leading-none text-center truncate w-full text-center">
        {category.name}
      </span>
      {total > 0 ? (
        <>
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((pct || 0) * 100)}%`, background: category.color }}
            />
          </div>
          <span
            className="text-[10px] font-bold leading-none"
            style={{ color: allDone ? category.color : 'rgb(148,163,184)' }}
          >
            {completed}/{total}
          </span>
        </>
      ) : (
        <span className="text-[10px] text-slate-600 leading-none">{t('dashboard.restDay')}</span>
      )}
    </div>
  );
}

// ─── Health Growth Chart ──────────────────────────────────────────────────────

const H_METRICS = [
  { key: 'water',    emoji: '💧', label: 'Water',    color: '#38bdf8', goal: 2, fmt: v => `${v}L`                               },
  { key: 'sleep',    emoji: '😴', label: 'Sleep',    color: '#a78bfa', goal: 8, fmt: v => `${v}h`                               },
  { key: 'meals',    emoji: '🍽️', label: 'Meals',    color: '#fb923c', goal: 5, fmt: v => `${v}/5 meals`                       },
  { key: 'exercise', emoji: '💪', label: 'Exercise', color: '#34d399', goal: 2, fmt: v => `${v} session${v !== 1 ? 's' : ''}` },
];

const MEAL_IDS_H    = ['habit_breakfast', 'habit_lunch', 'habit_dinner', 'habit_fruits', 'habit_vitamins'];
const EXERCISE_IDS_H = ['habit_jiujitsu', 'habit_gym'];

const HEALTH_MEDALS = [
  { id: 'hydration_week',   emoji: '💧', label: 'Hydration Week',   desc: '7-day water goal streak' },
  { id: 'hydration_master', emoji: '💧', label: 'Hydration Master', desc: '30-day water goal streak' },
  { id: 'sleep_week',       emoji: '😴', label: 'Sleep Week',       desc: '7-day sleep goal streak' },
  { id: 'sleep_master',     emoji: '😴', label: 'Sleep Master',     desc: '30-day sleep goal streak' },
  { id: 'meals_week',       emoji: '🍽️', label: 'Meal Streak',     desc: '7 perfect meal days' },
  { id: 'double_training',  emoji: '⚡', label: 'Double Training',  desc: 'Gym + BJJ same day, 5×' },
  { id: 'wellness_warrior', emoji: '🏆', label: 'Wellness Warrior', desc: 'All health goals in one week' },
];

function getHealthPct(habits, key, dateStr) {
  if (key === 'water') {
    const v = habits.find(x => x.id === 'habit_water')?.numericValues?.[dateStr];
    return v != null ? v / 2 : null;
  }
  if (key === 'sleep') {
    const v = habits.find(x => x.id === 'habit_sleep')?.numericValues?.[dateStr];
    return v != null ? v / 8 : null;
  }
  if (key === 'meals') {
    const c = MEAL_IDS_H.filter(id => habits.find(x => x.id === id)?.completions.includes(dateStr)).length;
    return c > 0 ? c / 5 : null;
  }
  if (key === 'exercise') {
    const c = EXERCISE_IDS_H.filter(id => habits.find(x => x.id === id)?.completions.includes(dateStr)).length;
    return c > 0 ? c / 2 : null;
  }
  return null;
}

const HEALTH_CHART_RANGES = RANGES.slice(0, 4); // 1W, 1M, 3M, 6M

function HealthGrowthChart({ habits, achievements }) {
  const { t } = useLanguage();
  const [rangeIdx, setRangeIdx] = useState(0);
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const range = HEALTH_CHART_RANGES[rangeIdx];
  const W = 600, H = 200;

  const data = useMemo(() => {
    return getLastNDays(range.days).map(date => {
      const vals = {};
      H_METRICS.forEach(m => { vals[m.key] = getHealthPct(habits, m.key, date); });
      const arr = Object.values(vals).filter(v => v !== null);
      return { date, ...vals, avg: arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null };
    });
  }, [habits, range.days]);

  const n = data.length;

  const series = useMemo(() => H_METRICS.map(m => {
    const pts = data.map((d, i) => ({
      x: PAD.l + (i / Math.max(n - 1, 1)) * cW,
      y: d[m.key] !== null ? PAD.t + (1 - Math.min(d[m.key], 1)) * cH : null,
    }));
    const segs = []; let cur = [];
    pts.forEach(p => { if (p.y !== null) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } });
    if (cur.length) segs.push(cur);
    return { ...m, pts, segs };
  }), [data, n]);

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = null, minDist = Infinity;
    series[0]?.pts.forEach((p, i) => {
      const dist = Math.abs(p.x - svgX);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setHover(closest !== null ? closest : null);
  }, [series]);

  const nonNull = data.filter(d => d.avg !== null);
  const avg = nonNull.length ? Math.round(nonNull.reduce((s, d) => s + d.avg, 0) / nonNull.length * 100) : 0;
  const peak = nonNull.length ? Math.round(Math.max(...nonNull.map(d => d.avg)) * 100) : 0;
  const perfect = nonNull.filter(d => d.avg >= 1).length;

  const step = xAxisStep(range.days);
  const labelIdxs = useMemo(() => {
    const idxs = [];
    for (let i = 0; i < n; i += step) idxs.push(i);
    if (idxs[idxs.length - 1] !== n - 1) idxs.push(n - 1);
    return idxs;
  }, [n, step]);

  const latestValues = useMemo(() => H_METRICS.map(m => {
    for (let d = 0; d <= 14; d++) {
      const dt = new Date(); dt.setDate(dt.getDate() - d);
      const ds = dt.toISOString().split('T')[0];
      const v = getHealthPct(habits, m.key, ds);
      if (v !== null) return { ...m, pct: v, rawVal: Math.round(v * m.goal * 10) / 10, daysAgo: d };
    }
    return { ...m, pct: null, rawVal: null, daysAgo: null };
  }), [habits]);

  const unlockedSet = new Set((achievements || []).map(a => a.id));
  const hoverData = hover !== null ? data[hover] : null;

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--bg-inner, #0a0a0a)', borderColor: 'var(--bg-inner-border, #1a1a1a)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-white font-semibold text-sm">{t('dashboard.healthMetrics')}</p>
          <p className="text-[#4b5563] text-xs mt-0.5">{t('dashboard.dailyGoal')}</p>
        </div>
        <RangeSelector ranges={HEALTH_CHART_RANGES} activeIdx={rangeIdx} onSelect={(i) => { setRangeIdx(i); setHover(null); }} accent="#34d399" />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-4 pb-2">
        <div><p className="text-white font-bold text-base leading-none">{avg}%</p><p className="text-[#4b5563] text-[10px] mt-0.5">{t('dashboard.avg')}</p></div>
        <div className="w-px h-5" style={{ background: 'var(--bg-inner-border)' }} />
        <div><p className="text-white font-bold text-base leading-none">{peak}%</p><p className="text-[#4b5563] text-[10px] mt-0.5">{t('dashboard.peak')}</p></div>
        <div className="w-px h-5" style={{ background: 'var(--bg-inner-border)' }} />
        <div><p className="font-bold text-base leading-none" style={{ color: '#34d399' }}>{perfect}</p><p className="text-[#4b5563] text-[10px] mt-0.5">{t('dashboard.perfect')}</p></div>
        {hoverData && (
          <>
            <div className="flex-1" />
            <div className="text-right">
              <p className="font-bold text-base leading-none" style={{ color: '#34d399' }}>
                {hoverData.avg !== null ? `${Math.round(hoverData.avg * 100)}%` : '—'}
              </p>
              <p className="text-[#4b5563] text-[10px] mt-0.5">
                {new Date(hoverData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Series legend */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {latestValues.map(m => (
          <div key={m.key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border"
            style={{ background: `${m.color}0d`, borderColor: `${m.color}25` }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
            <span className="text-[9px] text-[#4b5563]">{m.emoji} {m.label}</span>
            <span className="text-[9px] font-bold" style={{ color: m.pct !== null ? m.color : '#374151' }}>
              {m.rawVal !== null ? m.fmt(m.rawVal) : '—'}
            </span>
            {m.daysAgo > 0 && <span className="text-[9px] text-[#374151]">{m.daysAgo}d ago</span>}
          </div>
        ))}
      </div>

      {/* SVG chart */}
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full"
        style={{ height: H, display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.key} id={`hgrad_${s.key}`} x1="0" y1={PAD.t} x2="0" y2={PAD.t + cH} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        <ChartGrid />
        {series.map(s => s.segs.map((seg, i) => (
          <path key={`f${s.key}${i}`} d={buildSmoothPath(seg, true)} fill={`url(#hgrad_${s.key})`} />
        )))}
        {series.map(s => s.segs.map((seg, i) => (
          <path key={`l${s.key}${i}`} d={buildSmoothPath(seg)} fill="none" stroke={s.color} strokeWidth="1.6" strokeLinecap="round" />
        )))}
        {labelIdxs.map(i => (
          <text key={i} x={PAD.l + (i / Math.max(n - 1, 1)) * cW} y={H - 6}
            textAnchor="middle" fontSize="8.5" fill="var(--text-dim)" fontFamily="Inter, system-ui, sans-serif">
            {formatXLabel(data[i].date, range.days)}
          </text>
        ))}
        {hover !== null && series[0]?.pts[hover] && (() => {
          const hx = series[0].pts[hover].x;
          return (
            <g>
              <line x1={hx} y1={PAD.t} x2={hx} y2={PAD.t + cH} stroke="#34d399" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
              {series.map(s => {
                const p = s.pts[hover];
                if (!p || p.y === null) return null;
                return <circle key={s.key} cx={hx} cy={p.y} r="4" fill={s.color} stroke="var(--bg-inner, #0a0a0a)" strokeWidth="2" />;
              })}
            </g>
          );
        })()}
      </svg>

      {/* Health medals */}
      <div className="px-4 pb-4 pt-3 border-t" style={{ borderColor: 'var(--bg-inner-border, #1a1a1a)' }}>
        <p className="text-[#4b5563] text-[10px] font-semibold uppercase tracking-wider mb-2">{t('dashboard.healthMedals')}</p>
        <div className="flex flex-wrap gap-1.5">
          {HEALTH_MEDALS.map(ach => {
            const unlocked = unlockedSet.has(ach.id);
            return (
              <div key={ach.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs"
                style={{
                  background: unlocked ? 'rgba(250,204,21,0.08)' : 'var(--bg-subtle)',
                  borderColor: unlocked ? 'rgba(250,204,21,0.35)' : 'var(--border-subtle)',
                  color: unlocked ? '#fcd34d' : 'rgb(100,116,139)',
                  boxShadow: unlocked ? '0 0 8px rgba(250,204,21,0.2)' : '',
                }}
                title={ach.desc}>
                <span>{unlocked ? '🏅' : '🔒'}</span>
                <span className="font-medium">{ach.emoji} {ach.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({ habits, selectedDate, onSelectDate }) {
  const { t } = useLanguage();
  const today = getTodayString();
  const todayObj = new Date();

  const [viewYear, setViewYear] = useState(() => new Date(selectedDate + 'T00:00:00').getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate + 'T00:00:00').getMonth());

  const firstDOW = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const canGoNext =
    viewYear < todayObj.getFullYear() ||
    (viewYear === todayObj.getFullYear() && viewMonth < todayObj.getMonth());

  const goBack = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const goForward = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDOW; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div
      className="rounded-3xl p-5 border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
    >
      <div className="mb-1">
        <h3 className="text-white font-semibold text-base">{t('dashboard.pickDate')}</h3>
        <p className="text-slate-500 text-xs mt-0.5">{t('dashboard.pickDateDesc')}</p>
      </div>

      <div className="flex items-center justify-between mt-4 mb-3">
        <button
          onClick={goBack}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all text-base leading-none"
        >
          ‹
        </button>
        <span className="text-white font-medium text-sm">{monthLabel}</span>
        <button
          onClick={goForward}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all text-base leading-none disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-slate-500">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isFuture = dateStr > today;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const pct = getDayCompletion(habits, dateStr, today);

          let bg = 'var(--bg-subtle)';
          if (!isFuture && pct !== null) {
            if (pct === 0) bg = 'var(--bg-subtle)';
            else if (pct < 0.5) bg = 'rgba(34,197,94,0.25)';
            else if (pct < 1) bg = 'rgba(34,197,94,0.55)';
            else bg = '#22c55e';
          }

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onSelectDate(dateStr)}
              disabled={isFuture}
              className="aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-150"
              style={{
                background: isSelected ? '#16a34a' : bg,
                border: isSelected
                  ? '1px solid #4ade80'
                  : isToday && !isSelected
                  ? '1px solid rgba(34,197,94,0.5)'
                  : '1px solid transparent',
                color: isFuture
                  ? 'var(--text-faded)'
                  : isSelected ? 'white' : 'var(--text-primary)',
                boxShadow: isSelected ? '0 0 10px rgba(34,197,94,0.5)' : '',
                cursor: isFuture ? 'default' : 'pointer',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-slate-600 text-[10px]">0%</span>
        {['var(--bg-subtle)', 'rgba(34,197,94,0.25)', 'rgba(34,197,94,0.55)', '#22c55e'].map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-slate-600 text-[10px]">100%</span>
      </div>
    </div>
  );
}

// ─── Mood Tracker ─────────────────────────────────────────────────────────────

const MOODS = [
  { key: 'crushing', emoji: '🚀', label: 'Crushing it', labelKey: 'moods.crushingIt', score: 5, color: '#22c55e', glow: 'rgba(34,197,94,0.4)' },
  { key: 'great',    emoji: '😄', label: 'Great',       labelKey: 'moods.great',      score: 4, color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  { key: 'good',     emoji: '🙂', label: 'Good',        labelKey: 'moods.good',       score: 3, color: '#8b5cf6', glow: 'rgba(139,92,246,0.4)' },
  { key: 'meh',      emoji: '😐', label: 'Meh',         labelKey: 'moods.meh',        score: 2, color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  { key: 'rough',    emoji: '😩', label: 'Rough',       labelKey: 'moods.rough',      score: 1, color: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
];

function MoodTracker({ moods, logMood, addToast }) {
  const today = getTodayString();
  const todayMood = moods[today];
  const { t } = useLanguage();
  const [hoveredKey, setHoveredKey] = useState(null);
  const [justLogged, setJustLogged] = useState(false);

  // Last 14 days for the strip (oldest → newest)
  const strip = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      days.push({ date: ds, mood: moods[ds] || null, isToday: ds === today });
    }
    return days;
  }, [moods, today]);

  const handleSelect = (mood) => {
    logMood(today, mood);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1200);
    addToast({ type: 'xp', title: t('dashboard.moodLogged'), message: `${mood.emoji} ${t(mood.labelKey)}`, reasons: [] });
  };

  return (
    <div
      className="rounded-3xl border overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-inner-border)' }}
    >
      <div className="px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-semibold text-sm">{t('dashboard.howFeeling')}</p>
            <p className="text-[#4b5563] text-xs mt-0.5">
              {todayMood ? `${t('dashboard.todayMoodPrefix')} ${todayMood.emoji} ${t(MOODS.find(m => m.key === todayMood.key)?.labelKey || 'moods.good')}` : t('dashboard.logMood')}
            </p>
          </div>
          {todayMood && (
            <span
              className="text-3xl transition-all duration-300"
              style={{ filter: `drop-shadow(0 0 8px ${todayMood.color})` }}
            >
              {todayMood.emoji}
            </span>
          )}
        </div>

        {/* Mood picker */}
        <div className="flex gap-2 justify-between">
          {MOODS.map(m => {
            const isSelected = todayMood?.key === m.key;
            const isHovered = hoveredKey === m.key;
            return (
              <button
                key={m.key}
                onClick={() => handleSelect(m)}
                onMouseEnter={() => setHoveredKey(m.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-200"
                style={{
                  background: isSelected ? `${m.color}18` : isHovered ? `${m.color}0d` : 'var(--bg-subtle)',
                  borderColor: isSelected ? `${m.color}60` : isHovered ? `${m.color}35` : 'var(--bg-border)',
                  boxShadow: isSelected ? `0 0 16px ${m.glow}` : 'none',
                  transform: isSelected ? 'scale(1.06)' : isHovered ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                <span
                  className="text-2xl leading-none transition-all duration-200"
                  style={{ filter: isSelected ? `drop-shadow(0 0 6px ${m.color})` : 'none' }}
                >
                  {m.emoji}
                </span>
                <span
                  className="text-[10px] font-semibold leading-none text-center"
                  style={{ color: isSelected ? m.color : '#4b5563' }}
                >
                  {t(m.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 14-day strip */}
      <div className="px-5 pb-4">
        <p className="text-[10px] font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{t('dashboard.last14Days')}</p>
        <div className="flex gap-1">
          {strip.map(({ date, mood, isToday }) => {
            const m = mood ? MOODS.find(x => x.key === mood.key) : null;
            return (
              <div
                key={date}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${date}${mood ? ` · ${mood.emoji} ${mood.label}` : ''}`}
              >
                <div
                  className="w-full aspect-square rounded-lg flex items-center justify-center text-[11px] transition-all"
                  style={{
                    background: m ? `${m.color}20` : 'var(--bg-subtle)',
                    border: isToday ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    boxShadow: m && isToday ? `0 0 8px ${m.glow}` : 'none',
                  }}
                >
                  {mood ? mood.emoji : <span style={{ color: 'var(--text-dim)' }}>·</span>}
                </div>
                {isToday && (
                  <div className="w-1 h-1 rounded-full bg-white/30" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard({ setActiveTab }) {
  const {
    habits,
    profile,
    achievements,
    todayHabits,
    completedToday,
    stats,
    currentLevel,
    levelProgress,
    levelTitle,
    focusHabitId,
    focusHabitDate,
    setFocusHabit,
    clearFocusHabit,
    events,
    moods,
    logMood,
    addToast,
    accentColor,
  } = useHabits();

  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayString);

  const today = getTodayString();
  const greetingKey = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'dashboard.goodMorning';
    if (h < 18) return 'dashboard.goodAfternoon';
    return 'dashboard.goodEvening';
  })();
  const greeting = t(greetingKey);
  const formattedDate = getFormattedDate();
  const levelColor = getLevelColor(currentLevel);
  const isViewingToday = selectedDate === today;

  const allDoneToday = todayHabits.length > 0 && completedToday.length === todayHabits.length;

  // Habits applicable on the selected date
  const selectedDateHabits = useMemo(
    () => habits.filter(h => isHabitApplicableOnDate(h, selectedDate)),
    [habits, selectedDate]
  );

  const completedOnSelected = selectedDateHabits.filter(h => h.completions.includes(selectedDate));
  const completionPercentSelected = selectedDateHabits.length > 0
    ? Math.round((completedOnSelected.length / selectedDateHabits.length) * 100)
    : 0;
  const allDoneOnSelected = selectedDateHabits.length > 0 && completedOnSelected.length === selectedDateHabits.length;

  const habitsByCategory = useMemo(() => {
    return CATEGORIES.map(cat => ({
      ...cat,
      habits: selectedDateHabits.filter(h => h.category === cat.name),
    })).filter(cat => cat.habits.length > 0);
  }, [selectedDateHabits]);

  const streakHighlights = habits
    .filter(h => (h.streak || 0) >= 2)
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* ── Greeting Banner ─────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-6 border"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--bg-border)',
        }}
      >
        <p className="text-[#4b5563] text-xs font-medium mb-1 uppercase tracking-wider">{formattedDate}</p>
        <h1 className="text-white font-black text-2xl leading-tight mb-1">
          {greeting},
        </h1>
        <h1
          className="font-black text-2xl leading-tight"
          style={{ color: levelColor }}
        >
          {profile.name || 'Rafael'}! {allDoneToday ? '🎉' : '💪'}
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          {allDoneToday
            ? t('dashboard.crushedAll')
            : todayHabits.length === 0
            ? t('dashboard.addFirstPrompt')
            : `${completedToday.length} ${t('dashboard.of')} ${todayHabits.length} ${t('dashboard.habitsDone')}`}
        </p>
      </div>

      {/* ── Upcoming Events Strip ─────────────────────────────────────── */}
      {(() => {
        const upcoming = (events || [])
          .filter(e => e.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 4);
        if (upcoming.length === 0) return null;
        return (
          <div
            className="rounded-2xl p-3.5 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider">{t('dashboard.upcoming')}</span>
              <button
                onClick={() => setActiveTab('events')}
                className="text-[#4b5563] hover:text-[#22c55e] text-xs transition-colors"
              >
                {t('dashboard.allEvents')} →
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
              {upcoming.map(event => {
                const days = Math.round((new Date(event.date + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000);
                return (
                  <div
                    key={event.id}
                    className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border"
                    style={{ background: `${event.color}0d`, borderColor: `${event.color}25` }}
                  >
                    <span className="text-lg">{event.emoji}</span>
                    <div>
                      <p className="text-white text-xs font-semibold leading-none truncate max-w-[100px]">{event.title}</p>
                      <p className="text-[10px] mt-0.5 font-medium" style={{ color: days <= 7 ? '#fbbf24' : event.color }}>
                        {days === 0 ? t('dashboard.todayExcl') : days === 1 ? t('dashboard.tomorrow') : `${days}${t('dashboard.daysAway')}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Category Summary Strip (for selected date) ───────────────────── */}
      <div className="grid grid-cols-5 gap-2">
        {CATEGORIES.map(cat => (
          <CategoryCard
            key={cat.name}
            category={cat}
            dateHabits={selectedDateHabits}
            selectedDate={selectedDate}
          />
        ))}
      </div>

      {/* ── Focus Habit Widget ────────────────────────────────────────── */}
      {isViewingToday && (
        <div
          className="rounded-2xl p-4 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span className="text-white text-sm font-semibold">{t('dashboard.focusHabit')}</span>
              <span className="text-[10px] text-[#4b5563] bg-white/5 px-2 py-0.5 rounded-full">2× XP</span>
            </div>
            {focusHabitId && focusHabitDate === today && (
              <button
                onClick={clearFocusHabit}
                className="text-[#4b5563] hover:text-white text-xs transition-colors"
              >
                {t('dashboard.clear')}
              </button>
            )}
          </div>
          {focusHabitId && focusHabitDate === today ? (() => {
            const fh = todayHabits.find(h => h.id === focusHabitId);
            if (!fh) return (
              <p className="text-[#4b5563] text-xs">Habit not found — pick a new one.</p>
            );
            const isDone = fh.completions.includes(today);
            return (
              <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'var(--bg-inner)', borderColor: isDone ? 'rgba(34,197,94,0.3)' : 'var(--bg-border)' }}>
                <span className="text-xl">{fh.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDone ? 'text-slate-400 line-through' : 'text-white'}`}>{fh.name}</p>
                  <p className="text-[10px] text-[#4b5563] mt-0.5">{isDone ? `✓ ${t('dashboard.doneBonus')}` : t('dashboard.completeFirst')}</p>
                </div>
                {isDone && <span className="text-[#22c55e] text-lg">✓</span>}
              </div>
            );
          })() : (
            <div>
              <p className="text-[#4b5563] text-xs mb-2">{t('dashboard.pickFocus')}</p>
              <div className="flex flex-wrap gap-1.5">
                {todayHabits.filter(h => !h.completions.includes(today)).slice(0, 6).map(h => (
                  <button
                    key={h.id}
                    onClick={() => setFocusHabit(h.id, today)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all hover:border-[#22c55e]/40 hover:text-white text-[#9ca3af]"
                    style={{ background: 'var(--bg-inner)', borderColor: 'var(--bg-border)' }}
                  >
                    <span>{h.emoji}</span>
                    <span className="truncate max-w-[80px]">{h.name}</span>
                  </button>
                ))}
                {todayHabits.filter(h => !h.completions.includes(today)).length === 0 && (
                  <p className="text-[#22c55e] text-xs">{t('dashboard.allDoneGreat')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Mood Tracker ─────────────────────────────────────────────────── */}
      {isViewingToday && (
        <MoodTracker moods={moods} logMood={logMood} addToast={addToast} />
      )}

      {/* ── Progress Ring + XP row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Progress Ring for selected date */}
        <div
          className="rounded-3xl p-6 border flex items-center gap-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <ProgressRing
            percentage={completionPercentSelected}
            size={110}
            strokeWidth={11}
            color={allDoneOnSelected ? '#22c55e' : completionPercentSelected >= 50 ? '#22c55e' : '#3f3f3f'}
            bgColor={allDoneOnSelected ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)'}
            glowColor={allDoneOnSelected ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.2)'}
            animate={true}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-white leading-none">
                {completedOnSelected.length}
              </span>
              <span className="text-slate-400 text-xs mt-0.5 leading-none">
                of {selectedDateHabits.length}
              </span>
              {allDoneOnSelected && <span className="text-base mt-1">⭐</span>}
            </div>
          </ProgressRing>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg">
              {isViewingToday ? t('dashboard.todayProgress') : getDayLabel(selectedDate)}
            </h3>
            <p className="text-slate-400 text-sm">{completionPercentSelected}% {t('dashboard.complete')}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: '#22c55e' }}
                />
                <span className="text-slate-300 text-sm">{completedOnSelected.length} {t('dashboard.completedCount')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />
                <span className="text-slate-400 text-sm">
                  {selectedDateHabits.length - completedOnSelected.length} {t('dashboard.remaining')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* XP / Level Card */}
        <div
          className="rounded-3xl p-6 border"
          style={{
            background: `linear-gradient(135deg, ${levelColor}15, ${levelColor}05)`,
            borderColor: `${levelColor}25`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚡</span>
            <h3 className="text-white font-bold text-lg">{t('dashboard.xpLevel')}</h3>
          </div>
          <XPBar totalXP={profile.totalXP || 0} compact={true} />
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-white font-bold text-xl">{stats.currentLongestStreak}</p>
              <p className="text-slate-400 text-xs">{t('dashboard.bestStreak')}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-white font-bold text-xl">{stats.completionRateLast7}%</p>
              <p className="text-slate-400 text-xs">{t('dashboard.sevenDayRate')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Streak Highlights ────────────────────────────────────────────── */}
      {streakHighlights.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-base mb-3 flex items-center gap-2">
            🔥 {t('dashboard.activeStreaks')}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {streakHighlights.map(habit => (
              <div
                key={habit.id}
                className="rounded-2xl p-3 border border-white/8 flex flex-col items-center gap-2 text-center"
                style={{
                  background: `${habit.color}12`,
                  borderColor: `${habit.color}25`,
                }}
              >
                <span className="text-2xl">{habit.emoji}</span>
                <div>
                  <p className="font-black text-2xl leading-none" style={{ color: habit.color }}>
                    {habit.streak}
                  </p>
                  <p className="text-slate-400 text-xs">{t('dashboard.dayStreak')}</p>
                </div>
                <p className="text-white text-xs font-medium truncate w-full px-1">{habit.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Growth Chart ──────────────────────────────────────────────────── */}
      {habits.length > 0 && <SharedGrowthChart habits={habits} accentColor={accentColor} />}

      {/* ── Health Growth Chart ───────────────────────────────────────────── */}
      {habits.length > 0 && <HealthGrowthChart habits={habits} achievements={achievements} />}

      {/* ── On This Day ─────────────────────────────────────────────────── */}
      {(() => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];
        const weekAgoHabits = habits.filter(h => isHabitApplicableOnDate(h, weekAgoStr));
        const weekAgoDone = weekAgoHabits.filter(h => h.completions.includes(weekAgoStr));
        const weekAgoPct = weekAgoHabits.length > 0 ? Math.round((weekAgoDone.length / weekAgoHabits.length) * 100) : null;

        if (weekAgoPct === null) return null;
        return (
          <div
            className="rounded-2xl p-4 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🕐</span>
              <span className="text-white text-sm font-semibold">{t('dashboard.onThisDay')}</span>
              <span className="text-[#4b5563] text-xs">· {t('dashboard.weekAgo')}</span>
            </div>
            <p className="text-[#9ca3af] text-sm">
              {t('dashboard.youCompleted')}{' '}
              <span className="text-white font-semibold">{weekAgoDone.length}/{weekAgoHabits.length} {t('dashboard.habitsLower')}</span>
              {' '}({weekAgoPct}%)
              {weekAgoPct === 100 ? ` ${t('dashboard.aPerfectDay')}` : weekAgoPct >= 75 ? ` ${t('dashboard.solidEffort')}` : '.'}
            </p>
            {weekAgoDone.length > 0 && (
              <div className="flex gap-1 mt-2">
                {weekAgoDone.slice(0, 6).map(h => (
                  <span key={h.id} className="text-base" title={h.name}>{h.emoji}</span>
                ))}
                {weekAgoDone.length > 6 && <span className="text-[#4b5563] text-xs self-center">+{weekAgoDone.length - 6}</span>}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Mini Calendar ─────────────────────────────────────────────────── */}
      <MiniCalendar
        habits={habits}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* ── Habits for selected date ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-base flex items-center gap-2">
            {allDoneOnSelected ? '🎉' : '📋'}{' '}
            {isViewingToday ? t('dashboard.todaysHabits') : `${t('dashboard.habitsLabel')} — ${getDayLabel(selectedDate)}`}
          </h3>
          <div className="flex items-center gap-2">
            {!isViewingToday && (
              <button
                onClick={() => setSelectedDate(today)}
                className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                ← {t('dashboard.today')}
              </button>
            )}
            {isViewingToday && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 text-primary-lighter text-sm hover:text-white transition-colors font-medium"
              >
                <span>+</span> {t('dashboard.add')}
              </button>
            )}
          </div>
        </div>

        {selectedDateHabits.length === 0 ? (
          <div
            className="rounded-3xl p-8 border border-dashed text-center"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="text-4xl mb-3">🌱</div>
            <h4 className="text-white font-semibold mb-1">
              {habits.length === 0 ? t('dashboard.noHabitsYet') : t('dashboard.noHabitsScheduled')}
            </h4>
            <p className="text-slate-400 text-sm mb-4 max-w-xs mx-auto">
              {habits.length === 0
                ? t('dashboard.addFirstHabitDesc')
                : t('dashboard.restUp')}
            </p>
            {habits.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:scale-105 transition-all"
              >
                {t('dashboard.addFirstBtn')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {habitsByCategory.map(cat => {
              const catCompleted = cat.habits.filter(h => h.completions.includes(selectedDate)).length;
              const catAllDone = catCompleted === cat.habits.length;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-sm font-bold" style={{ color: cat.color }}>
                        {cat.name}
                      </span>
                      {catAllDone && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${cat.color}25`, color: cat.color }}
                        >
                          ✓ {t('dashboard.done')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{catCompleted}/{cat.habits.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cat.habits.map(habit => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        showWeeklyGrid={false}
                        compact={true}
                        selectedDate={selectedDate}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {allDoneOnSelected && (
              <div
                className="rounded-3xl p-4 border text-center mt-2 animate-bounce-in"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
                  borderColor: 'rgba(16,185,129,0.3)',
                }}
              >
                <p className="text-emerald-400 font-bold">
                  {isViewingToday ? t('dashboard.perfectDay') : t('dashboard.allDoneCrushed')} {t('dashboard.crushedHabits')} {selectedDateHabits.length} {t('dashboard.habitsWord')}
                </p>
                {isViewingToday && (
                  <p className="text-emerald-500 text-sm mt-1">
                    {t('dashboard.bonusXP')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
