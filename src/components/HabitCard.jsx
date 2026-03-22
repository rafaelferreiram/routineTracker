import { useState, useCallback } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getTodayString, isHabitApplicableToday } from '../utils/dateUtils.js';
import { StreakPill } from './StreakBadge.jsx';
import AddHabitModal from './AddHabitModal.jsx';

export default function HabitCard({ habit, showWeeklyGrid = true, compact = false, selectedDate = null, weekDays = null }) {
  const { toggleCompletion, deleteHabit, getHabitStats, freezeShields, useFreezeShield } = useHabits();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const stats = getHabitStats(habit);
  const today = getTodayString();
  const isApplicableToday = isHabitApplicableToday(habit);
  const isToday = isApplicableToday; // alias used by non-compact render

  // Compact mode: use selectedDate if provided, else today
  const effectiveDate = compact && selectedDate ? selectedDate : today;
  const isEffectiveFuture = effectiveDate > today;
  const isCompletedOnEffective = habit.completions.includes(effectiveDate);

  // Check applicability on effectiveDate
  let isApplicableOnEffective = isApplicableToday;
  if (compact && selectedDate) {
    const dow = new Date(effectiveDate + 'T00:00:00').getDay();
    if (habit.frequency === 'weekdays') isApplicableOnEffective = dow >= 1 && dow <= 5;
    else if (habit.frequency === 'weekends') isApplicableOnEffective = dow === 0 || dow === 6;
    else isApplicableOnEffective = true;
  }

  const handleToggleEffective = useCallback(() => {
    if (isEffectiveFuture || !isApplicableOnEffective) return;
    if (!isCompletedOnEffective) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    toggleCompletion(habit.id, effectiveDate);
  }, [toggleCompletion, habit.id, effectiveDate, isEffectiveFuture, isApplicableOnEffective, isCompletedOnEffective]);

  const handleToggleToday = useCallback(() => {
    if (!stats.isCompletedToday) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    toggleCompletion(habit.id);
  }, [toggleCompletion, habit.id, stats.isCompletedToday]);

  const handleToggleDate = useCallback((date) => {
    if (date > today) return;
    toggleCompletion(habit.id, date);
  }, [toggleCompletion, habit.id, today]);

  if (compact) {
    const canToggle = !isEffectiveFuture && isApplicableOnEffective;
    return (
      <>
        <div
          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
            isCompletedOnEffective
              ? 'bg-white/5 border-white/10'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
          style={isCompletedOnEffective ? { borderColor: `${habit.color}33`, background: `${habit.color}08` } : {}}
        >
          {/* Check button */}
          <button
            onClick={handleToggleEffective}
            disabled={!canToggle}
            className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border-2 transition-all duration-200 ${
              justCompleted ? 'animate-pop' : ''
            } ${
              !canToggle
                ? 'opacity-30 cursor-not-allowed border-slate-600 bg-slate-700/30'
                : isCompletedOnEffective
                ? 'border-transparent text-white shadow-lg'
                : 'border-white/30 hover:border-white/50 bg-white/5 hover:bg-white/10'
            }`}
            style={
              isCompletedOnEffective && canToggle
                ? { background: habit.color, boxShadow: `0 0 12px ${habit.color}60` }
                : {}
            }
          >
            {isCompletedOnEffective ? '✓' : ''}
          </button>

          {/* Emoji */}
          <span className="text-xl flex-shrink-0">{habit.emoji}</span>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate transition-all ${isCompletedOnEffective ? 'text-slate-400 line-through' : 'text-white'}`}>
              {habit.name}
            </p>
          </div>

          {/* Streak */}
          {stats.streak > 0 && <StreakPill streak={stats.streak} />}

          {/* Difficulty badge */}
          {habit.difficulty && habit.difficulty !== 'medium' && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium difficulty-${habit.difficulty}`}>
              {habit.difficulty === 'easy' ? '🟢' : '🔴'}
            </span>
          )}
        </div>

        {showEdit && <AddHabitModal editHabit={habit} onClose={() => setShowEdit(false)} />}
      </>
    );
  }

  return (
    <>
      <div
        className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
          stats.isCompletedToday
            ? 'opacity-90'
            : 'hover:scale-[1.01] hover:shadow-xl'
        }`}
        style={{
          background: stats.isCompletedToday
            ? `linear-gradient(135deg, ${habit.color}15, ${habit.color}08)`
            : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          borderColor: stats.isCompletedToday ? `${habit.color}50` : 'rgba(255,255,255,0.08)',
          boxShadow: stats.isCompletedToday ? `0 4px 20px ${habit.color}20` : '',
        }}
      >
        <div className="p-4">
          {/* Top row */}
          <div className="flex items-start gap-3">
            {/* Emoji badge */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg transition-all"
              style={{
                background: `${habit.color}20`,
                border: `2px solid ${habit.color}50`,
                boxShadow: stats.isCompletedToday ? `0 0 16px ${habit.color}50` : `0 0 8px ${habit.color}20`,
              }}
            >
              {habit.emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3
                    className={`font-semibold text-sm leading-snug transition-all ${
                      stats.isCompletedToday ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {habit.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${habit.color}20`, color: habit.color }}
                    >
                      {habit.category}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{habit.frequency}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setShowEdit(true)}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-all"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-900/30 text-slate-400 hover:text-red-400 flex items-center justify-center text-xs transition-all"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2">
                {stats.streak > 0 && <StreakPill streak={stats.streak} />}
                <span className="text-xs text-slate-500">
                  {stats.totalCompletions} total
                </span>
                <span className="text-xs text-slate-500">
                  {stats.last7Rate}% last week
                </span>
              </div>
            </div>

            {/* Complete button */}
            <button
              onClick={handleToggleToday}
              disabled={!isToday}
              className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl border-2 transition-all duration-300 ${
                justCompleted ? 'animate-bounce-in' : ''
              } ${
                !isToday
                  ? 'opacity-30 cursor-not-allowed border-slate-600 bg-slate-700/20'
                  : stats.isCompletedToday
                  ? 'text-white'
                  : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
              }`}
              style={
                stats.isCompletedToday && isToday
                  ? {
                      background: habit.color,
                      borderColor: habit.color,
                      boxShadow: `0 0 20px ${habit.color}60`,
                    }
                  : {}
              }
              title={
                !isToday
                  ? `Not scheduled for today (${habit.frequency})`
                  : stats.isCompletedToday
                  ? 'Mark as incomplete'
                  : 'Mark as complete'
              }
            >
              {stats.isCompletedToday ? '✓' : '○'}
            </button>
          </div>

          {/* Freeze Shield button — shown when habit has streak but not done today and shields available */}
          {isToday && !stats.isCompletedToday && stats.streak >= 3 && freezeShields > 0 && (
            <button
              onClick={() => useFreezeShield(habit.id, today)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA' }}
              title={`Use a Freeze Shield to protect your ${stats.streak}-day streak`}
            >
              🛡️ Use Freeze Shield ({freezeShields} left) — protect {stats.streak}d streak
            </button>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-3 pt-3 border-t border-white/5 w-full flex items-center justify-between text-slate-500 hover:text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">{expanded ? 'Hide' : 'Show'} history</span>
              {!expanded && habit.difficulty && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize difficulty-${habit.difficulty || 'medium'}`}>
                  {habit.difficulty || 'medium'}
                </span>
              )}
            </div>
            <span className="text-xs">{expanded ? '▲' : '▼'}</span>
          </button>

          {/* Weekly grid - only when expanded */}
          {expanded && showWeeklyGrid && weekDays && (
            <div className="mt-3">
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((date) => {
                  const dayObj = new Date(date + 'T00:00:00');
                  const dow = dayObj.getDay();
                  const isApplicable = (() => {
                    if (habit.frequency === 'weekdays') return dow >= 1 && dow <= 5;
                    if (habit.frequency === 'weekends') return dow === 0 || dow === 6;
                    return true;
                  })();
                  const isCompleted = habit.completions.includes(date);
                  const isCurrentToday = date === today;
                  const isFuture = date > today;
                  const dayName = dayObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const monthDay = dayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <div key={date} className="flex flex-col items-center gap-1">
                      {/* Day label */}
                      <div className={`flex flex-col items-center leading-none gap-0.5 ${isCurrentToday ? 'text-violet-400' : 'text-slate-500'}`}>
                        <span className="text-[9px] font-semibold">{dayName}</span>
                        <span className="text-[8px]">{monthDay}</span>
                      </div>
                      {/* Cell */}
                      <button
                        onClick={() => !isFuture && isApplicable && handleToggleDate(date)}
                        disabled={isFuture || !isApplicable}
                        className={`w-full aspect-square rounded-md transition-all duration-200 flex items-center justify-center ${
                          isFuture || !isApplicable ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                        }`}
                        style={{
                          background: isCompleted && isApplicable
                            ? habit.color
                            : isCurrentToday && !isCompleted
                            ? `${habit.color}25`
                            : 'rgba(255,255,255,0.05)',
                          boxShadow: isCompleted && isApplicable ? `0 0 5px ${habit.color}50` : '',
                          border: isCurrentToday ? `1px solid ${habit.color}60` : '1px solid transparent',
                          opacity: isFuture ? 0.15 : !isApplicable ? 0.15 : 1,
                        }}
                        title={`${date}${isCompleted ? ' ✓' : isFuture ? ' (future)' : !isApplicable ? ' (rest day)' : ' — click to toggle'}`}
                      >
                        {isCompleted && isApplicable
                          ? <span className="text-white text-[10px] font-bold">✓</span>
                          : isCurrentToday && !isCompleted
                          ? <span className="text-[8px]" style={{ color: `${habit.color}90` }}>•</span>
                          : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && <AddHabitModal editHabit={habit} onClose={() => setShowEdit(false)} />}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/10 p-6 animate-bounce-in"
            style={{ background: '#111111' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-white font-bold text-lg">Delete Habit?</h3>
              <p className="text-slate-400 text-sm mt-1">
                "{habit.name}" and all its history will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteHabit(habit.id); setShowDeleteConfirm(false); }}
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
