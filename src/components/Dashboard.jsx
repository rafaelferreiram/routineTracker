import { useState, useMemo } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getGreeting, getFormattedDate, getTodayString, getDayLabel, isHabitApplicableOnDate } from '../utils/dateUtils.js';
import { getLevelColor } from '../utils/gamification.js';
import ProgressRing from './ProgressRing.jsx';
import XPBar from './XPBar.jsx';
import HabitCard from './HabitCard.jsx';
import AddHabitModal from './AddHabitModal.jsx';

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
        <span className="text-[10px] text-slate-600 leading-none">rest day</span>
      )}
    </div>
  );
}

// ─── Growth Chart ─────────────────────────────────────────────────────────────

function LineChart({ data, color = '#26a69a' }) {
  const valid = data.filter(d => d.pct !== null);
  if (valid.length < 2) {
    return <p className="text-slate-600 text-xs text-center py-8">Not enough data yet</p>;
  }

  const W = 400, H = 96;
  const pad = { l: 4, r: 4, t: 8, b: 4 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = data.length;

  // Build points only for valid entries so gaps are respected
  const points = data.map((d, i) => ({
    x: pad.l + (i / (n - 1)) * innerW,
    y: d.pct !== null ? pad.t + (1 - d.pct) * innerH : null,
    pct: d.pct,
    label: d.dateStr || d.label,
  }));

  // Build SVG path segments (break on null gaps)
  let linePath = '';
  let areaPath = '';
  let currentSegment = [];

  const flushSegment = () => {
    if (currentSegment.length >= 2) {
      const move = `M ${currentSegment[0].x} ${currentSegment[0].y}`;
      const curve = currentSegment.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      linePath += ` ${move} ${curve}`;

      const first = currentSegment[0];
      const last = currentSegment[currentSegment.length - 1];
      const baseline = pad.t + innerH;
      areaPath += ` M ${first.x} ${baseline} L ${first.x} ${first.y} ${currentSegment.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} L ${last.x} ${baseline} Z`;
    }
    currentSegment = [];
  };

  for (const p of points) {
    if (p.y !== null) {
      currentSegment.push(p);
    } else {
      flushSegment();
    }
  }
  flushSegment();

  const areaId = `area-grad-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Horizontal gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(v => {
        const y = pad.t + (1 - v) * innerH;
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={pad.l - 2} y={y + 3} fill="rgba(255,255,255,0.2)" fontSize="7" textAnchor="end">{Math.round(v * 100)}%</text>
          </g>
        );
      })}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill={`url(#${areaId})`} />}

      {/* Line */}
      {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

      {/* Dots for valid points */}
      {points.filter(p => p.y !== null).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} stroke="#0F0F1A" strokeWidth="1.5">
          <title>{p.label}: {Math.round((p.pct || 0) * 100)}%</title>
        </circle>
      ))}
    </svg>
  );
}

function GrowthChart({ habits }) {
  const [view, setView] = useState('month');
  const [chartType, setChartType] = useState('bar');
  const today = getTodayString();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { day, dateStr, pct: getDayCompletion(habits, dateStr, today) };
    });
  }, [habits, today, currentYear, currentMonth]);

  const semesterData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(currentYear, currentMonth - (5 - i), 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      let sum = 0, count = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const pct = getDayCompletion(habits, dateStr, today);
        if (pct !== null) { sum += pct; count++; }
      }
      return { label, pct: count > 0 ? sum / count : null, isCurrent: i === 5 };
    });
  }, [habits, today, currentYear, currentMonth]);

  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div
      className="rounded-3xl p-5 border border-white/8"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-white font-semibold text-base flex items-center gap-2">📈 Growth</h3>
        <div className="flex items-center gap-2">
          {/* Period toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            {[['month', 'Month'], ['semester', '6 Months']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: view === v ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.03)',
                  color: view === v ? 'white' : 'rgb(148,163,184)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Chart type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            {[['bar', '▐▌'], ['line', '∿']].map(([v, icon]) => (
              <button
                key={v}
                onClick={() => setChartType(v)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                title={v === 'bar' ? 'Bar chart' : 'Line chart'}
                style={{
                  background: chartType === v ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.03)',
                  color: chartType === v ? 'white' : 'rgb(148,163,184)',
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'month' && (() => {
        const validData = monthData.filter(d => d.pct !== null);
        return (
          <div>
            <p className="text-slate-500 text-xs mb-3">{currentMonthLabel} — daily completion %</p>

            {chartType === 'line' ? (
              <LineChart data={monthData} color="#26a69a" />
            ) : (
              <>
                <div className="flex items-end gap-[2px]" style={{ height: '100px' }}>
                  {monthData.map(({ day, dateStr, pct }) => {
                    const isToday = dateStr === today;
                    const barH = pct !== null ? Math.max(4, Math.round(pct * 96)) : 3;
                    const color = pct === null
                      ? 'rgba(255,255,255,0.05)'
                      : pct >= 1 ? '#10B981' : pct >= 0.5 ? '#26a69a' : '#065f46';
                    return (
                      <div
                        key={day}
                        className="flex-1 rounded-t-sm transition-all"
                        style={{
                          height: `${barH}px`,
                          background: color,
                          outline: isToday ? `1px solid ${color === 'rgba(255,255,255,0.05)' ? '#26a69a' : color}` : '',
                          boxShadow: isToday ? `0 0 6px ${color}80` : '',
                          minHeight: '3px',
                        }}
                        title={pct !== null ? `${dateStr}: ${Math.round(pct * 100)}%` : dateStr}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1.5 px-0.5">
                  {[1, 7, 14, 21, 28].filter(d => d <= monthData.length).map(d => (
                    <span key={d} className="text-[9px] text-slate-600">{d}</span>
                  ))}
                  {monthData.length > 28 && (
                    <span className="text-[9px] text-slate-600">{monthData.length}</span>
                  )}
                </div>
              </>
            )}

            {validData.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-2 text-right">
                Avg {Math.round(validData.reduce((s, d) => s + d.pct, 0) / validData.length * 100)}% ·{' '}
                Best {Math.round(Math.max(...validData.map(d => d.pct)) * 100)}%
              </p>
            )}
          </div>
        );
      })()}

      {view === 'semester' && (
        <div>
          <p className="text-slate-500 text-xs mb-3">Last 6 months — average daily completion %</p>
          {chartType === 'line' ? (
            <LineChart data={semesterData} color="#26a69a" />
          ) : (
            <div className="flex items-end gap-3" style={{ height: '110px' }}>
              {semesterData.map(({ label, pct, isCurrent }) => {
                const barH = pct !== null ? Math.max(6, Math.round(pct * 90)) : 3;
                const color = pct === null
                  ? 'rgba(255,255,255,0.05)'
                  : pct >= 0.8 ? '#10B981' : pct >= 0.5 ? '#26a69a' : '#065f46';
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex-1 w-full flex flex-col justify-end items-center gap-0.5">
                      {pct !== null && (
                        <span className="text-[9px] text-slate-400">{Math.round(pct * 100)}%</span>
                      )}
                      <div
                        className="w-full rounded-t-lg transition-all duration-700"
                        style={{
                          height: `${barH}px`,
                          background: color,
                          minHeight: '3px',
                          boxShadow: isCurrent && pct !== null ? `0 0 8px ${color}60` : '',
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Health Growth Chart ──────────────────────────────────────────────────────

const H_METRICS = [
  { key: 'water',    emoji: '💧', label: 'Water',    color: '#3b82f6', goal: 2,  unit: 'L' },
  { key: 'sleep',    emoji: '😴', label: 'Sleep',    color: '#8b5cf6', goal: 8,  unit: 'h' },
  { key: 'meals',    emoji: '🍽️', label: 'Meals',    color: '#F59E0B', goal: 5,  unit: '' },
  { key: 'exercise', emoji: '💪', label: 'Exercise', color: '#10B981', goal: 2,  unit: '' },
];

const MEAL_IDS_H = ['habit_breakfast', 'habit_lunch', 'habit_dinner', 'habit_fruits', 'habit_vitamins'];
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

function getHealthRaw(habits, key, dateStr) {
  if (key === 'water') {
    const v = habits.find(x => x.id === 'habit_water')?.numericValues?.[dateStr];
    return v != null ? `${v}L` : '—';
  }
  if (key === 'sleep') {
    const v = habits.find(x => x.id === 'habit_sleep')?.numericValues?.[dateStr];
    return v != null ? `${v}h` : '—';
  }
  if (key === 'meals') {
    const c = MEAL_IDS_H.filter(id => habits.find(x => x.id === id)?.completions.includes(dateStr)).length;
    return c > 0 ? `${c}/5` : '—';
  }
  if (key === 'exercise') {
    const c = EXERCISE_IDS_H.filter(id => habits.find(x => x.id === id)?.completions.includes(dateStr)).length;
    return c > 0 ? `${c} session${c > 1 ? 's' : ''}` : '—';
  }
  return '—';
}

function HealthMultiLineChart({ days }) {
  // days: [{ dateStr, water, sleep, meals, exercise }] — values 0-1 or null
  const W = 400, H = 110;
  const pad = { l: 22, r: 4, t: 8, b: 4 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = days.length;

  if (n < 2) return <p className="text-slate-600 text-xs text-center py-6">Not enough data yet</p>;

  const buildPath = (key) => {
    let path = '';
    let seg = [];
    const flush = () => {
      if (seg.length >= 2) {
        path += `M ${seg[0].x} ${seg[0].y} ` + seg.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' ';
      }
      seg = [];
    };
    days.forEach((d, i) => {
      const v = d[key];
      if (v !== null) {
        seg.push({ x: pad.l + (i / (n - 1)) * innerW, y: pad.t + (1 - Math.min(v, 1)) * innerH });
      } else {
        flush();
      }
    });
    flush();
    return path;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {/* Gridlines */}
      {[0, 0.5, 1].map(v => {
        const y = pad.t + (1 - v) * innerH;
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={pad.l - 3} y={y + 3} fill="rgba(255,255,255,0.2)" fontSize="7" textAnchor="end">{Math.round(v * 100)}%</text>
          </g>
        );
      })}
      {/* Series lines */}
      {H_METRICS.map(m => {
        const d = buildPath(m.key);
        return d ? <path key={m.key} d={d} fill="none" stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" /> : null;
      })}
    </svg>
  );
}

function HealthGrowthChart({ habits, achievements }) {
  const [view, setView] = useState('month');
  const today = getTodayString();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const past = dateStr <= today;
      return {
        day, dateStr,
        water:    past ? getHealthPct(habits, 'water', dateStr)    : null,
        sleep:    past ? getHealthPct(habits, 'sleep', dateStr)    : null,
        meals:    past ? getHealthPct(habits, 'meals', dateStr)    : null,
        exercise: past ? getHealthPct(habits, 'exercise', dateStr) : null,
      };
    });
  }, [habits, today, currentYear, currentMonth]);

  const semesterMonths = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(currentYear, currentMonth - (5 - i), 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const avgs = {};
      H_METRICS.forEach(met => {
        let sum = 0, cnt = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (ds > today) continue;
          const v = getHealthPct(habits, met.key, ds);
          if (v !== null) { sum += v; cnt++; }
        }
        avgs[met.key] = cnt > 0 ? sum / cnt : null;
      });
      return { label, isCurrent: i === 5, ...avgs };
    });
  }, [habits, today, currentYear, currentMonth]);

  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const unlockedSet = new Set((achievements || []).map(a => a.id));

  // Today's snapshot values for the legend
  const todaySnap = H_METRICS.map(m => ({
    ...m,
    raw: getHealthRaw(habits, m.key, today),
    pct: getHealthPct(habits, m.key, today),
  }));

  return (
    <div className="rounded-3xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-white font-semibold text-base flex items-center gap-2">🏥 Health Overview</h3>
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          {[['month', 'Month'], ['semester', '6 Months']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{ background: view === v ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.03)', color: view === v ? 'white' : 'rgb(148,163,184)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend — shows today's values for each metric */}
      <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
        {todaySnap.map(m => (
          <div key={m.key} className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ background: `${m.color}0d`, borderColor: `${m.color}25` }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 leading-none">{m.emoji} {m.label}</p>
              <p className="text-xs font-bold leading-none mt-0.5" style={{ color: m.pct !== null ? m.color : 'rgb(100,116,139)' }}>
                {m.raw}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Month: multi-line chart */}
      {view === 'month' && (
        <div>
          <p className="text-slate-500 text-xs mb-3">{currentMonthLabel} — % of daily goal per metric</p>
          <HealthMultiLineChart days={monthDays} />
          <div className="flex justify-between mt-1.5 px-0.5">
            {[1, 7, 14, 21, 28].filter(d => d <= monthDays.length).map(d => (
              <span key={d} className="text-[9px] text-slate-600">{d}</span>
            ))}
            {monthDays.length > 28 && <span className="text-[9px] text-slate-600">{monthDays.length}</span>}
          </div>
        </div>
      )}

      {/* Semester: grouped bars per month */}
      {view === 'semester' && (
        <div>
          <p className="text-slate-500 text-xs mb-3">Last 6 months — avg % of goal per metric</p>
          <div className="flex items-end gap-2" style={{ height: '110px' }}>
            {semesterMonths.map(({ label, isCurrent, ...vals }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex-1 w-full flex items-end gap-[2px]">
                  {H_METRICS.map(m => {
                    const pct = vals[m.key];
                    const barH = pct !== null ? Math.max(4, Math.round(pct * 90)) : 3;
                    return (
                      <div key={m.key} className="flex-1 rounded-t-sm transition-all duration-700"
                        style={{ height: `${barH}px`, background: pct !== null ? m.color : 'rgba(255,255,255,0.06)', minHeight: '3px', opacity: pct !== null ? 0.85 : 1, boxShadow: isCurrent && pct !== null ? `0 0 6px ${m.color}50` : '' }}
                        title={`${label} ${m.label}: ${pct !== null ? Math.round(pct * 100) + '%' : 'no data'}`}
                      />
                    );
                  })}
                </div>
                <span className={`text-[10px] font-medium ${isCurrent ? 'text-white' : 'text-slate-500'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health medals */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider mb-2">Health Medals</p>
        <div className="flex flex-wrap gap-2">
          {HEALTH_MEDALS.map(ach => {
            const unlocked = unlockedSet.has(ach.id);
            return (
              <div key={ach.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs"
                style={{
                  background: unlocked ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.03)',
                  borderColor: unlocked ? 'rgba(250,204,21,0.35)' : 'rgba(255,255,255,0.07)',
                  color: unlocked ? '#fcd34d' : 'rgb(100,116,139)',
                  boxShadow: unlocked ? '0 0 8px rgba(250,204,21,0.2)' : '',
                }}
                title={ach.desc}
              >
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
      className="rounded-3xl p-5 border border-white/8"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="mb-1">
        <h3 className="text-white font-semibold text-base">📅 Pick a Date</h3>
        <p className="text-slate-500 text-xs mt-0.5">Select any past date to view or log habits</p>
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

          let bg = 'rgba(255,255,255,0.04)';
          if (!isFuture && pct !== null) {
            if (pct === 0) bg = 'rgba(255,255,255,0.06)';
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
                  ? 'rgba(255,255,255,0.15)'
                  : isSelected ? 'white' : 'rgba(255,255,255,0.75)',
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
        {['rgba(255,255,255,0.04)', 'rgba(34,197,94,0.25)', 'rgba(34,197,94,0.55)', '#22c55e'].map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-slate-600 text-[10px]">100%</span>
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
  } = useHabits();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayString);

  const today = getTodayString();
  const greeting = getGreeting();
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
          background: '#111111',
          borderColor: '#1f1f1f',
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
            ? "You've crushed all your habits today — legendary!"
            : todayHabits.length === 0
            ? "Add your first habit to start your journey!"
            : `${completedToday.length} of ${todayHabits.length} habits done. Keep going!`}
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
            style={{ background: '#111111', borderColor: '#1f1f1f' }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider">Upcoming</span>
              <button
                onClick={() => setActiveTab('events')}
                className="text-[#4b5563] hover:text-[#22c55e] text-xs transition-colors"
              >
                All →
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
                        {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d away`}
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
          style={{ background: '#111111', borderColor: '#1f1f1f' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span className="text-white text-sm font-semibold">Focus Habit</span>
              <span className="text-[10px] text-[#4b5563] bg-white/5 px-2 py-0.5 rounded-full">2× XP</span>
            </div>
            {focusHabitId && focusHabitDate === today && (
              <button
                onClick={clearFocusHabit}
                className="text-[#4b5563] hover:text-white text-xs transition-colors"
              >
                clear
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
              <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: '#0f0f0f', borderColor: isDone ? 'rgba(34,197,94,0.3)' : '#1f1f1f' }}>
                <span className="text-xl">{fh.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDone ? 'text-slate-400 line-through' : 'text-white'}`}>{fh.name}</p>
                  <p className="text-[10px] text-[#4b5563] mt-0.5">{isDone ? '✓ Done — 2× XP earned!' : 'Complete this first for bonus XP'}</p>
                </div>
                {isDone && <span className="text-[#22c55e] text-lg">✓</span>}
              </div>
            );
          })() : (
            <div>
              <p className="text-[#4b5563] text-xs mb-2">Pick one habit to focus on today for 2× XP:</p>
              <div className="flex flex-wrap gap-1.5">
                {todayHabits.filter(h => !h.completions.includes(today)).slice(0, 6).map(h => (
                  <button
                    key={h.id}
                    onClick={() => setFocusHabit(h.id, today)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all hover:border-[#22c55e]/40 hover:text-white text-[#9ca3af]"
                    style={{ background: '#0f0f0f', borderColor: '#1f1f1f' }}
                  >
                    <span>{h.emoji}</span>
                    <span className="truncate max-w-[80px]">{h.name}</span>
                  </button>
                ))}
                {todayHabits.filter(h => !h.completions.includes(today)).length === 0 && (
                  <p className="text-[#22c55e] text-xs">All done — great work! 🎉</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Progress Ring + XP row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Progress Ring for selected date */}
        <div
          className="rounded-3xl p-6 border border-white/8 flex items-center gap-5"
          style={{ background: 'rgba(255,255,255,0.03)' }}
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
              {isViewingToday ? "Today's Progress" : getDayLabel(selectedDate)}
            </h3>
            <p className="text-slate-400 text-sm">{completionPercentSelected}% complete</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: '#22c55e' }}
                />
                <span className="text-slate-300 text-sm">{completedOnSelected.length} completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />
                <span className="text-slate-400 text-sm">
                  {selectedDateHabits.length - completedOnSelected.length} remaining
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
            <h3 className="text-white font-bold text-lg">XP & Level</h3>
          </div>
          <XPBar totalXP={profile.totalXP || 0} compact={true} />
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-white font-bold text-xl">{stats.currentLongestStreak}</p>
              <p className="text-slate-400 text-xs">🔥 Best streak</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-white font-bold text-xl">{stats.completionRateLast7}%</p>
              <p className="text-slate-400 text-xs">📈 7-day rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Streak Highlights ────────────────────────────────────────────── */}
      {streakHighlights.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-base mb-3 flex items-center gap-2">
            🔥 Active Streaks
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
                  <p className="text-slate-400 text-xs">day streak</p>
                </div>
                <p className="text-white text-xs font-medium truncate w-full px-1">{habit.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Growth Chart ──────────────────────────────────────────────────── */}
      {habits.length > 0 && <GrowthChart habits={habits} />}

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
            style={{ background: '#111111', borderColor: '#1f1f1f' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🕐</span>
              <span className="text-white text-sm font-semibold">On This Day</span>
              <span className="text-[#4b5563] text-xs">· 1 week ago</span>
            </div>
            <p className="text-[#9ca3af] text-sm">
              You completed{' '}
              <span className="text-white font-semibold">{weekAgoDone.length}/{weekAgoHabits.length} habits</span>
              {' '}({weekAgoPct}%)
              {weekAgoPct === 100 ? ' — a perfect day! ⭐' : weekAgoPct >= 75 ? ' — solid effort! 💪' : '.'}
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
            {isViewingToday ? "Today's Habits" : `Habits — ${getDayLabel(selectedDate)}`}
          </h3>
          <div className="flex items-center gap-2">
            {!isViewingToday && (
              <button
                onClick={() => setSelectedDate(today)}
                className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                ← Today
              </button>
            )}
            {isViewingToday && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 text-primary-lighter text-sm hover:text-white transition-colors font-medium"
              >
                <span>+</span> Add
              </button>
            )}
          </div>
        </div>

        {selectedDateHabits.length === 0 ? (
          <div
            className="rounded-3xl p-8 border border-dashed border-white/10 text-center"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="text-4xl mb-3">🌱</div>
            <h4 className="text-white font-semibold mb-1">
              {habits.length === 0 ? 'No habits yet!' : 'No habits scheduled this day'}
            </h4>
            <p className="text-slate-400 text-sm mb-4 max-w-xs mx-auto">
              {habits.length === 0
                ? 'Add your first habit to start building better routines!'
                : 'All your habits are scheduled for other days. Rest up!'}
            </p>
            {habits.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:scale-105 transition-all"
              >
                ✨ Add First Habit
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
                          ✓ Done
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
                  🎉 {isViewingToday ? 'Perfect Day!' : 'All done!'} You crushed all {selectedDateHabits.length} habits!
                </p>
                {isViewingToday && (
                  <p className="text-emerald-500 text-sm mt-1">
                    +25 bonus XP awarded · Keep the streak alive!
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
