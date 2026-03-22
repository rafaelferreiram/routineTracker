import { useMemo } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getLast7Days, getTodayString } from '../utils/dateUtils.js';

export default function WeeklyReview({ onClose }) {
  const { habits, profile, stats, currentLevel } = useHabits();
  const today = getTodayString();
  const last7 = getLast7Days();

  const weekStats = useMemo(() => {
    let possible = 0, done = 0;
    let perfectDays = 0;
    last7.forEach(date => {
      const d = new Date(date + 'T00:00:00');
      const dow = d.getDay();
      const applicable = habits.filter(h => {
        if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5;
        if (h.frequency === 'weekends') return dow === 0 || dow === 6;
        return true;
      });
      const completed = applicable.filter(h => h.completions.includes(date));
      possible += applicable.length;
      done += completed.length;
      if (applicable.length > 0 && completed.length === applicable.length) perfectDays++;
    });

    const rate = possible > 0 ? Math.round((done / possible) * 100) : 0;
    const topHabits = habits
      .map(h => ({ ...h, weekCount: last7.filter(d => h.completions.includes(d)).length }))
      .sort((a, b) => b.weekCount - a.weekCount)
      .slice(0, 3);

    const xpThisWeek = done * 10; // rough estimate

    return { possible, done, rate, perfectDays, topHabits, xpThisWeek };
  }, [habits, last7]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-[#1f1f1f] shadow-2xl animate-slide-up overflow-hidden"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider">Weekly Review</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-[#4b5563] hover:text-white flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-border)' }}
            >
              ✕
            </button>
          </div>
          <h2 className="text-white font-bold text-xl">
            {weekStats.rate >= 90 ? 'Outstanding week! 🏆' :
             weekStats.rate >= 70 ? 'Strong week! 💪' :
             weekStats.rate >= 50 ? 'Decent week. Keep going!' :
             'Room to grow. Next week! 🌱'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Big rate */}
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: weekStats.rate >= 75 ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.12)',
                border: `1.5px solid ${weekStats.rate >= 75 ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)'}`,
              }}
            >
              <span className="text-3xl font-black" style={{ color: weekStats.rate >= 75 ? '#22c55e' : '#fbbf24' }}>
                {weekStats.rate}%
              </span>
            </div>
            <div>
              <p className="text-white font-semibold">{weekStats.done}/{weekStats.possible} completions</p>
              <p className="text-[#6b7280] text-sm mt-0.5">{weekStats.perfectDays} perfect days</p>
              <p className="text-[#6b7280] text-sm">~{weekStats.xpThisWeek} XP earned</p>
            </div>
          </div>

          {/* Top habits */}
          {weekStats.topHabits.length > 0 && (
            <div>
              <p className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider mb-2">Top Habits</p>
              <div className="space-y-2">
                {weekStats.topHabits.map((h, i) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className="text-[#4b5563] text-xs w-4">{i + 1}.</span>
                    <span className="text-base">{h.emoji}</span>
                    <span className="text-white text-sm flex-1 truncate">{h.name}</span>
                    <span className="text-[#22c55e] text-xs font-semibold">{h.weekCount}/7</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next week intention */}
          <div
            className="p-3 rounded-xl border"
            style={{ background: 'var(--bg-inner)', borderColor: 'var(--bg-border)' }}
          >
            <p className="text-[#4b5563] text-xs">
              {weekStats.rate < 70
                ? '💡 Tip: Pick 1-2 habits to really nail next week instead of all at once.'
                : weekStats.perfectDays >= 5
                ? '🔥 You\'re on fire! Consider adding a new challenge habit.'
                : '✨ Keep this momentum going into next week!'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all"
            style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
