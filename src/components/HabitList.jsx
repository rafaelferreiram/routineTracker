import { useState, useMemo, useCallback } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getTodayString, isHabitApplicableOnDate } from '../utils/dateUtils.js';
import { StreakPill } from './StreakBadge.jsx';
import AddHabitModal from './AddHabitModal.jsx';
import HabitCard from './HabitCard.jsx';

// ─── Category Config (matches actual app data) ────────────────────────────────

const CATEGORIES = [
  { name: 'Religion', icon: '🙏', color: '#8B5CF6' },
  { name: 'Exercise', icon: '💪', color: '#10B981' },
  { name: 'Meals',    icon: '🍽️', color: '#F59E0B' },
  { name: 'Work',     icon: '💼', color: '#3B82F6' },
  { name: 'Study',    icon: '📚', color: '#F59E0B' },
  { name: 'Family',   icon: '❤️', color: '#EC4899' },
  { name: 'Health',   icon: '🌿', color: '#06B6D4' },
  { name: 'Other',    icon: '⭐', color: '#94A3B8' },
];

const FREQ_OPTIONS = [
  { value: 'daily',    label: 'Daily',    short: 'Every day',   icon: '☀️' },
  { value: 'weekdays', label: 'Weekdays', short: 'Mon–Fri',     icon: '💼' },
  { value: 'weekends', label: 'Weekends', short: 'Sat–Sun',     icon: '🎉' },
];

function getWeekDays(offset = 0) {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

function weekRangeLabel(weekDays) {
  const start = new Date(weekDays[0] + 'T00:00:00');
  const end   = new Date(weekDays[6] + 'T00:00:00');
  const fmt   = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ─── Frequency Quick-Edit Badge ───────────────────────────────────────────────

function FreqBadge({ habit, onUpdate }) {
  const [open, setOpen] = useState(false);
  const freq = FREQ_OPTIONS.find(f => f.value === habit.frequency) || FREQ_OPTIONS[0];

  const pick = (value) => {
    onUpdate({ ...habit, frequency: value });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all hover:bg-white/8"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}
        title="Change frequency"
      >
        <span>{freq.icon}</span>
        <span>{freq.short}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-20 rounded-xl border shadow-2xl overflow-hidden min-w-[130px]"
            style={{ background: '#111111', borderColor: '#1f1f1f' }}
          >
            {FREQ_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={e => { e.stopPropagation(); pick(f.value); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-white/6 text-left ${
                  habit.frequency === f.value ? 'text-white' : 'text-[#6b7280]'
                }`}
              >
                <span>{f.icon}</span>
                <div>
                  <p className="leading-none">{f.label}</p>
                  <p className="text-[9px] text-[#4b5563] mt-0.5">{f.short}</p>
                </div>
                {habit.frequency === f.value && (
                  <span className="ml-auto text-[#22c55e] text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Single Habit Check-In Row ────────────────────────────────────────────────

function HabitCheckRow({ habit, date, isToday, onToggle, onEdit, onDelete, onUpdateFreq, onLogNumeric, accentColor }) {
  const today = getTodayString();
  const isFuture = date > today;
  const dow = new Date(date + 'T00:00:00').getDay();
  const applicable = (() => {
    if (habit.frequency === 'weekdays') return dow >= 1 && dow <= 5;
    if (habit.frequency === 'weekends') return dow === 0 || dow === 6;
    return true;
  })();
  const done = habit.completions.includes(date);
  const canToggle = !isFuture && applicable;

  const isNumeric = habit.type === 'numeric';
  const numericValue = isNumeric ? (habit.numericValues || {})[date] : null;
  const [showNumericInput, setShowNumericInput] = useState(false);
  const [numericInputVal, setNumericInputVal] = useState('');

  const [justDone, setJustDone] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogNumeric = useCallback(() => {
    const val = parseFloat(numericInputVal);
    if (!isNaN(val) && val >= 0 && onLogNumeric) {
      onLogNumeric(habit.id, date, val);
      setShowNumericInput(false);
      setNumericInputVal('');
    }
  }, [numericInputVal, habit.id, date, onLogNumeric]);

  const handleCheck = useCallback(() => {
    if (!canToggle) return;
    if (!done) { setJustDone(true); setTimeout(() => setJustDone(false), 500); }
    onToggle(habit.id, date);
  }, [canToggle, done, habit.id, date, onToggle]);

  if (!applicable) {
    return (
      <div className="flex items-center gap-3 px-3 py-3 rounded-2xl opacity-30 select-none">
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#2a2a2a] flex-shrink-0" />
        <span className="text-lg">{habit.emoji}</span>
        <p className="text-[#4b5563] text-sm flex-1 truncate">{habit.name}</p>
        <span className="text-[10px] text-[#374151] bg-[#111111] px-2 py-0.5 rounded-full">
          {habit.frequency === 'weekdays' ? 'Weekend off' : 'Weekday off'}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex items-center gap-3 px-3 py-3 rounded-2xl border transition-all duration-200 group ${
          done ? '' : 'hover:border-[#2a2a2a]'
        }`}
        style={{
          background: done ? `${habit.color}0f` : '#0f0f0f',
          borderColor: done ? `${habit.color}35` : '#1a1a1a',
        }}
      >
        {/* Check Button — numeric vs boolean */}
        {isNumeric ? (
          <button
            onClick={() => { if (!isFuture && applicable) { setShowNumericInput(v => !v); setNumericInputVal(numericValue != null ? String(numericValue) : ''); } }}
            className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
            style={{
              background: numericValue != null && numericValue >= (habit.goal || 1)
                ? (accentColor || '#22c55e')
                : numericValue != null
                  ? 'rgba(251,191,36,0.15)'
                  : 'rgba(255,255,255,0.06)',
              border: numericValue != null && numericValue >= (habit.goal || 1)
                ? `2px solid ${accentColor || '#22c55e'}`
                : numericValue != null
                  ? '2px solid rgba(251,191,36,0.5)'
                  : '2px solid rgba(255,255,255,0.08)',
              color: numericValue != null && numericValue >= (habit.goal || 1)
                ? '#080808'
                : numericValue != null ? '#fbbf24' : '#4b5563',
              opacity: !applicable ? 0.3 : 1,
            }}
            disabled={isFuture || !applicable}
            title={applicable ? `Log ${habit.unit}` : 'Not applicable today'}
          >
            {numericValue != null ? `${numericValue}${habit.unit}` : `+${habit.unit}`}
          </button>
        ) : (
          <button
            onClick={handleCheck}
            disabled={!canToggle}
            className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all duration-200 ${
              justDone ? 'scale-110' : done ? 'scale-100' : 'scale-100 hover:scale-105'
            } ${!canToggle ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
            style={done ? {
              background: habit.color,
              borderColor: habit.color,
              boxShadow: `0 0 16px ${habit.color}50`,
            } : {
              background: 'transparent',
              borderColor: '#2a2a2a',
              boxShadow: 'none',
            }}
            title={done ? 'Mark as not done' : 'Mark as done'}
          >
            {done
              ? <span className="text-white text-lg font-bold leading-none">✓</span>
              : <span className="text-[#2a2a2a] text-lg leading-none group-hover:text-[#3a3a3a] transition-colors">○</span>
            }
          </button>
        )}

        {/* Emoji */}
        <span className={`text-xl flex-shrink-0 transition-all ${done ? 'opacity-50' : ''}`}>
          {habit.emoji}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate transition-all ${done ? 'text-[#4b5563] line-through' : 'text-white'}`}>
            {habit.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {(habit.streak || 0) >= 2 && <StreakPill streak={habit.streak} />}
            {habit.difficulty && habit.difficulty !== 'medium' && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium difficulty-${habit.difficulty}`}>
                {habit.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Right side: freq badge + actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <FreqBadge habit={habit} onUpdate={onUpdateFreq} />

          {/* Edit / delete — appear on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(habit)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4b5563] hover:text-white transition-colors"
              style={{ background: '#1a1a1a' }}
              title="Edit"
            >
              ✏
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4b5563] hover:text-red-400 transition-colors"
              style={{ background: '#1a1a1a' }}
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Numeric input inline */}
      {isNumeric && showNumericInput && (
        <div className="flex items-center gap-2 mt-2 pl-14" onClick={e => e.stopPropagation()}>
          <input
            type="number"
            step={habit.unit === 'L' ? '0.1' : '0.5'}
            min="0"
            value={numericInputVal}
            onChange={e => setNumericInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLogNumeric(); if (e.key === 'Escape') setShowNumericInput(false); }}
            placeholder={`e.g. ${habit.goal}`}
            className="w-24 bg-[#1a1a1a] text-white rounded-xl px-3 py-1.5 text-sm outline-none border border-[#2a2a2a] focus:border-[#22c55e]/50"
            style={{ colorScheme: 'dark' }}
            autoFocus
          />
          <span className="text-[#6b7280] text-xs font-medium">{habit.unit}</span>
          <span className="text-[#4b5563] text-xs">/ {habit.goal}{habit.unit}</span>
          <button
            onClick={handleLogNumeric}
            className="text-xs font-bold px-2 py-1 rounded-lg transition-all"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
          >✓</button>
          <button
            onClick={() => setShowNumericInput(false)}
            className="text-[#4b5563] text-xs px-1.5 py-1 rounded-lg hover:text-white transition-colors"
          >✕</button>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-[#1f1f1f] p-6 animate-bounce-in"
            style={{ background: '#111111' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">{habit.emoji}</div>
              <h3 className="text-white font-bold text-lg">Delete "{habit.name}"?</h3>
              <p className="text-[#6b7280] text-sm mt-1">All history will be permanently lost.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm transition-all border border-[#1f1f1f]"
                style={{ background: '#1a1a1a' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(habit.id); setShowDeleteConfirm(false); }}
                className="flex-1 py-3 rounded-2xl bg-red-600/80 hover:bg-red-600 text-white font-semibold text-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Category Group ───────────────────────────────────────────────────────────

function CategoryGroup({ category, habits, date, onToggle, onEdit, onDelete, onUpdateFreq, onLogNumeric, accentColor }) {
  const today = getTodayString();
  const applicable = habits.filter(h => {
    const dow = new Date(date + 'T00:00:00').getDay();
    if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5;
    if (h.frequency === 'weekends') return dow === 0 || dow === 6;
    return true;
  });
  const done = applicable.filter(h => h.completions.includes(date)).length;
  const total = applicable.length;
  const allDone = total > 0 && done === total;
  const pct = total > 0 ? (done / total) : 0;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#1a1a1a', background: '#0a0a0a' }}>
      {/* Category header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{
          background: allDone ? `${category.color}0d` : '#111111',
          borderColor: allDone ? `${category.color}25` : '#1a1a1a',
        }}
      >
        <span className="text-lg">{category.icon}</span>
        <span className="text-white font-semibold text-sm flex-1">{category.name}</span>

        {/* Mini progress */}
        {total > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round(pct * 100)}%`, background: category.color }}
              />
            </div>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: allDone ? category.color : '#4b5563' }}
            >
              {done}/{total}
            </span>
            {allDone && <span className="text-base">✨</span>}
          </div>
        )}
      </div>

      {/* Habit rows */}
      <div className="px-2 py-2 space-y-1">
        {habits.map(habit => (
          <HabitCheckRow
            key={habit.id}
            habit={habit}
            date={date}
            isToday={date === today}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateFreq={onUpdateFreq}
            onLogNumeric={onLogNumeric}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

// ─── HabitList ────────────────────────────────────────────────────────────────

export default function HabitList() {
  const { habits, toggleCompletion, deleteHabit, updateHabit, logNumericValue, accentColor } = useHabits();
  const [showAddModal, setShowAddModal]   = useState(false);
  const [editHabit, setEditHabit]         = useState(null);
  const [view, setView]                   = useState('today');   // 'today' | 'manage'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [weekOffset, setWeekOffset]       = useState(0);
  const [manageSort, setManageSort]       = useState('category');

  const today = getTodayString();
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const isCurrentWeek = weekOffset === 0;

  // date used for check-in (today, or selected past day in week)
  const [selectedDay, setSelectedDay] = useState(today);
  const checkDate = view === 'today' ? selectedDay : today;

  const allCategories = useMemo(() =>
    CATEGORIES.filter(cat => habits.some(h => h.category === cat.name)),
    [habits]
  );

  // Habits grouped by category for check-in view
  const habitsByCategory = useMemo(() =>
    CATEGORIES.map(cat => ({
      ...cat,
      habits: habits.filter(h => h.category === cat.name),
    })).filter(cat => cat.habits.length > 0),
    [habits]
  );

  // Today summary
  const todayDow = new Date(checkDate + 'T00:00:00').getDay();
  const applicableToday = habits.filter(h => {
    if (h.frequency === 'weekdays') return todayDow >= 1 && todayDow <= 5;
    if (h.frequency === 'weekends') return todayDow === 0 || todayDow === 6;
    return true;
  });
  const doneToday = applicableToday.filter(h => h.completions.includes(checkDate));
  const pctToday = applicableToday.length > 0
    ? Math.round((doneToday.length / applicableToday.length) * 100)
    : 0;
  const allDoneToday = applicableToday.length > 0 && doneToday.length === applicableToday.length;

  // Manage view filtered habits
  const managedHabits = useMemo(() => {
    const filtered = selectedCategory === 'All'
      ? habits
      : habits.filter(h => h.category === selectedCategory);
    if (manageSort === 'streak')      return [...filtered].sort((a, b) => (b.streak || 0) - (a.streak || 0));
    if (manageSort === 'completions') return [...filtered].sort((a, b) => b.completions.length - a.completions.length);
    if (manageSort === 'name')        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    // category sort (default)
    return [...filtered].sort((a, b) => {
      const ai = CATEGORIES.findIndex(c => c.name === a.category);
      const bi = CATEGORIES.findIndex(c => c.name === b.category);
      return ai - bi;
    });
  }, [habits, selectedCategory, manageSort]);

  // Week day labels for the day-picker strip
  const weekDayLabels = useMemo(() => weekDays.map(d => {
    const obj = new Date(d + 'T00:00:00');
    return {
      date: d,
      dayShort: obj.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: obj.getDate(),
      isFuture: d > today,
    };
  }), [weekDays, today]);

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Habits</h2>
          <p className="text-[#4b5563] text-sm mt-0.5">{habits.length} habits tracked</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white font-semibold text-sm transition-all"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e' }}
        >
          <span className="text-base font-bold">+</span>
          <span>New Habit</span>
        </button>
      </div>

      {/* ── View Toggle ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
        {[
          { id: 'today',  label: 'Check-In', icon: '✅' },
          { id: 'manage', label: 'Manage',   icon: '⚙️' },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={view === v.id ? {
              background: '#1f1f1f',
              color: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            } : {
              color: '#4b5563',
            }}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CHECK-IN VIEW
      ════════════════════════════════════════════════════════════════════ */}
      {view === 'today' && (
        <>
          {/* Day picker strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#4b5563] hover:text-white transition-colors text-lg"
                style={{ background: '#111111', border: '1px solid #1a1a1a' }}
              >
                ‹
              </button>
              <span className="text-[#4b5563] text-xs font-medium">
                {isCurrentWeek ? 'This week' : weekRangeLabel(weekDays)}
              </span>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                disabled={isCurrentWeek}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#4b5563] hover:text-white transition-colors text-lg disabled:opacity-25 disabled:cursor-not-allowed"
                style={{ background: '#111111', border: '1px solid #1a1a1a' }}
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {weekDayLabels.map(({ date, dayShort, dayNum, isFuture }) => {
                const isSelected = date === selectedDay;
                const isToday    = date === today;
                const dow        = new Date(date + 'T00:00:00').getDay();
                const applicable = habits.filter(h => {
                  if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5;
                  if (h.frequency === 'weekends') return dow === 0 || dow === 6;
                  return true;
                });
                const done = applicable.filter(h => h.completions.includes(date)).length;
                const pct  = applicable.length > 0 ? done / applicable.length : 0;
                const allDone = applicable.length > 0 && done === applicable.length;

                return (
                  <button
                    key={date}
                    onClick={() => !isFuture && setSelectedDay(date)}
                    disabled={isFuture}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isSelected ? '#1f1f1f' : 'transparent',
                      border: isSelected
                        ? '1px solid #2a2a2a'
                        : isToday
                        ? '1px solid rgba(34,197,94,0.3)'
                        : '1px solid transparent',
                      opacity: isFuture ? 0.25 : 1,
                    }}
                  >
                    <span className={`text-[9px] font-semibold uppercase ${isSelected || isToday ? 'text-white' : 'text-[#4b5563]'}`}>
                      {dayShort}
                    </span>
                    <span className={`text-sm font-bold leading-none ${isSelected ? 'text-white' : isToday ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                      {dayNum}
                    </span>
                    {/* Completion dot */}
                    {!isFuture && applicable.length > 0 && (
                      <div
                        className="w-4 h-1 rounded-full transition-all"
                        style={{
                          background: allDone ? '#22c55e' : pct > 0 ? `rgba(34,197,94,${0.3 + pct * 0.5})` : '#1f1f1f',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress summary bar */}
          {applicableToday.length > 0 && (
            <div
              className="rounded-2xl p-4 border"
              style={{
                background: allDoneToday ? 'rgba(34,197,94,0.08)' : '#111111',
                borderColor: allDoneToday ? 'rgba(34,197,94,0.25)' : '#1a1a1a',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-xl tabular-nums">{doneToday.length}</span>
                  <span className="text-[#4b5563] text-sm">/ {applicableToday.length}</span>
                  <span className="text-[#6b7280] text-sm">habits</span>
                  {allDoneToday && <span className="text-base ml-1">🎉</span>}
                </div>
                <span
                  className="font-bold text-lg tabular-nums"
                  style={{ color: allDoneToday ? '#22c55e' : pctToday >= 50 ? '#22c55e' : '#4b5563' }}
                >
                  {pctToday}%
                </span>
              </div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pctToday}%`,
                    background: allDoneToday
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : 'linear-gradient(90deg, #22c55e, #16a34a)',
                  }}
                />
              </div>
              {allDoneToday && (
                <p className="text-[#22c55e] text-xs font-semibold mt-2 text-center">
                  Perfect day — all habits done! ✨
                </p>
              )}
              {!allDoneToday && applicableToday.length - doneToday.length > 0 && (
                <p className="text-[#4b5563] text-xs mt-2">
                  {applicableToday.length - doneToday.length} left to complete
                </p>
              )}
            </div>
          )}

          {/* Category groups */}
          {habits.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🌱</p>
              <h3 className="text-white font-semibold">No habits yet</h3>
              <p className="text-[#4b5563] text-sm mt-1 mb-4">Add your first habit to start tracking</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-2xl text-white font-semibold text-sm"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}
              >
                + Add Your First Habit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {habitsByCategory.map(cat => (
                <CategoryGroup
                  key={cat.name}
                  category={cat}
                  habits={cat.habits}
                  date={selectedDay}
                  onToggle={toggleCompletion}
                  onEdit={setEditHabit}
                  onDelete={deleteHabit}
                  onUpdateFreq={updateHabit}
                  onLogNumeric={logNumericValue}
                  accentColor={accentColor}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MANAGE VIEW
      ════════════════════════════════════════════════════════════════════ */}
      {view === 'manage' && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[{ name: 'All', icon: '🌟', color: '#6b7280' }, ...CATEGORIES].map(cat => {
              const count = cat.name === 'All' ? habits.length : habits.filter(h => h.category === cat.name).length;
              if (count === 0 && cat.name !== 'All') return null;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0"
                  style={isActive ? {
                    background: `${cat.color || '#22c55e'}15`,
                    borderColor: `${cat.color || '#22c55e'}40`,
                    color: cat.color || '#22c55e',
                  } : {
                    background: '#111111',
                    borderColor: '#1a1a1a',
                    color: '#6b7280',
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: isActive ? `${cat.color || '#22c55e'}25` : '#1a1a1a' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-[#4b5563] text-xs">Sort:</span>
            {[
              { value: 'category',    label: 'Category' },
              { value: 'streak',      label: 'Streak' },
              { value: 'completions', label: 'Total' },
              { value: 'name',        label: 'A–Z' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setManageSort(opt.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={manageSort === opt.value ? {
                  background: 'rgba(34,197,94,0.1)',
                  color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.25)',
                } : {
                  color: '#4b5563',
                  border: '1px solid transparent',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {managedHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                showWeeklyGrid={true}
                weekDays={getWeekDays(0)}
              />
            ))}
            {managedHabits.length === 0 && (
              <div className="text-center py-10">
                <p className="text-[#4b5563] text-sm">No habits in this category</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} />}
      {editHabit   && <AddHabitModal editHabit={editHabit} onClose={() => setEditHabit(null)} />}
    </div>
  );
}
