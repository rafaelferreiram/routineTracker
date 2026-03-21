import { useMemo } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getLast7Days, getShortWeekday, getTodayString } from '../utils/dateUtils.js';
import { getLevelColor, getLevelTitle, getLevelIcon, getLevelFromXP, getLevelProgress, getXPForCurrentLevel, getXPNeededForNextLevel } from '../utils/gamification.js';
import XPBar from './XPBar.jsx';
import ProgressRing from './ProgressRing.jsx';

function StatCard({ label, value, sub, icon, color = '#7C3AED', large = false }) {
  return (
    <div
      className="rounded-3xl p-5 border border-white/8 flex flex-col gap-2"
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        borderColor: `${color}25`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <div>
        <p
          className={`font-bold leading-none ${large ? 'text-4xl' : 'text-3xl'}`}
          style={{ color }}
        >
          {value}
        </p>
        <p className="text-slate-400 text-sm mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function StatsPanel() {
  const { habits, profile, stats, currentLevel, levelProgress } = useHabits();
  const today = getTodayString();
  const last7 = getLast7Days();

  // Build weekly heatmap data
  const weeklyData = useMemo(() => {
    return last7.map(date => {
      const d = new Date(date + 'T00:00:00');
      const dow = d.getDay();
      const applicableHabits = habits.filter(h => {
        const freq = h.frequency || 'daily';
        if (freq === 'weekdays' && (dow === 0 || dow === 6)) return false;
        if (freq === 'weekends' && dow >= 1 && dow <= 5) return false;
        return true;
      });
      const completed = applicableHabits.filter(h => h.completions.includes(date)).length;
      const total = applicableHabits.length;
      const pct = total > 0 ? completed / total : 0;
      return { date, completed, total, pct, day: getShortWeekday(date) };
    });
  }, [habits, last7]);

  // Per-habit stats
  const habitStats = useMemo(() => {
    return habits.map(h => ({
      ...h,
      totalCompletions: h.completions.length,
      last7Count: last7.filter(d => h.completions.includes(d)).length,
      currentStreak: h.streak || 0,
      bestStreak: h.bestStreak || 0,
    })).sort((a, b) => b.totalCompletions - a.totalCompletions);
  }, [habits, last7]);

  const levelColor = getLevelColor(currentLevel);
  const levelTitle = getLevelTitle(currentLevel);
  const levelIcon = getLevelIcon(currentLevel);

  const totalXP = profile.totalXP || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-white font-bold text-2xl">Statistics</h2>
        <p className="text-slate-400 text-sm mt-1">Your performance at a glance</p>
      </div>

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
            style={{
              background: `${levelColor}25`,
              border: `2px solid ${levelColor}60`,
              boxShadow: `0 0 20px ${levelColor}40`,
            }}
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
            <p className="text-slate-400 text-sm mt-1">{totalXP.toLocaleString()} total XP earned</p>
          </div>
        </div>
        <XPBar totalXP={totalXP} />
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Completions"
          value={stats.totalCompletions.toLocaleString()}
          icon="✅"
          color="#10B981"
        />
        <StatCard
          label="Best Streak Ever"
          value={`${stats.bestStreakEver}d`}
          icon="🏆"
          color="#F59E0B"
          sub="all habits"
        />
        <StatCard
          label="Active Streak"
          value={`${stats.currentLongestStreak}d`}
          icon="🔥"
          color="#F97316"
          sub="current"
        />
        <StatCard
          label="Last 7 Days Rate"
          value={`${stats.completionRateLast7}%`}
          icon="📈"
          color="#8B5CF6"
          sub="completion"
        />
      </div>

      {/* Weekly heatmap */}
      <div className="rounded-3xl p-5 border border-white/8 bg-white/3">
        <h3 className="text-white font-semibold text-base mb-4">Weekly Overview</h3>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weeklyData.map(({ date, completed, total, pct, day }) => {
            const isToday = date === today;
            const opacity = total === 0 ? 0.15 : 0.15 + pct * 0.85;
            return (
              <div key={date} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-full aspect-square rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: `rgba(124,58,237,${opacity})`,
                    border: isToday ? '2px solid rgba(124,58,237,0.7)' : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: pct === 1 ? '0 0 10px rgba(124,58,237,0.5)' : '',
                  }}
                >
                  {pct === 1 && total > 0 && (
                    <span className="text-sm">⭐</span>
                  )}
                </div>
                <span className="text-xs text-slate-500 font-medium">{day[0]}</span>
                <span className="text-xs text-slate-600">{total > 0 ? `${completed}/${total}` : '—'}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-slate-500 text-xs">Less</span>
          {[0.15, 0.35, 0.55, 0.75, 1].map((o, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ background: `rgba(124,58,237,${o})` }}
            />
          ))}
          <span className="text-slate-500 text-xs">More</span>
        </div>
      </div>

      {/* Per-habit breakdown */}
      {habitStats.length > 0 && (
        <div className="rounded-3xl p-5 border border-white/8 bg-white/3">
          <h3 className="text-white font-semibold text-base mb-4">Habit Breakdown</h3>
          <div className="space-y-3">
            {habitStats.map(habit => {
              const pct = habit.totalCompletions > 0
                ? Math.round((habit.last7Count / 7) * 100)
                : 0;
              return (
                <div key={habit.id} className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{habit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-white text-sm font-medium truncate">{habit.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {habit.currentStreak > 0 && (
                          <span className="text-orange-400 text-xs font-medium">🔥{habit.currentStreak}</span>
                        )}
                        <span className="text-slate-400 text-xs">{habit.totalCompletions}x</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: habit.color,
                          boxShadow: `0 0 6px ${habit.color}60`,
                        }}
                      />
                    </div>
                    <span className="text-slate-500 text-xs">{pct}% this week</span>
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
          <p className="text-slate-400 text-sm mt-1">Add some habits to see your stats here!</p>
        </div>
      )}
    </div>
  );
}
