import { useMemo } from 'react';
import { useAuth } from '../store/useAuth.js';
import { getLevelFromXP, getLevelColor, getLevelIcon, ACHIEVEMENTS } from '../utils/gamification.js';
import { getTodayString, isHabitApplicableToday, calculateStreak } from '../utils/dateUtils.js';
import GrowthChart, { RANGES } from './GrowthChart.jsx';

const FRIEND_RANGES = RANGES.slice(0, 2); // 1W, 1M only

function readUserData(username) {
  try {
    const raw = localStorage.getItem(`routineTracker_v3_${username}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return '34 197 94';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function FriendCard({ user }) {
  const data = useMemo(() => readUserData(user.username), [user.username]);

  const accent = user.theme?.accentColor || '#22c55e';
  const accentRgb = hexToRgb(accent);

  if (!data) {
    return (
      <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-lg"
          style={{ background: `rgba(${accentRgb}, 0.12)`, color: accent, border: `2px solid rgba(${accentRgb}, 0.3)` }}>
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <p className="text-white font-semibold capitalize">{user.displayName}</p>
        <p className="text-[#4b5563] text-xs mt-1">No activity yet</p>
      </div>
    );
  }

  const habits = data.habits || [];
  const profile = data.profile || {};
  const achievements = data.achievements || [];

  const totalXP = profile.totalXP || 0;
  const level = getLevelFromXP(totalXP);
  const levelColor = getLevelColor(level);
  const levelIcon = getLevelIcon(level);

  // Today's progress
  const today = getTodayString();
  const todayHabits = habits.filter(h => isHabitApplicableToday(h));
  const completedToday = todayHabits.filter(h => (h.completions || []).includes(today)).length;
  const todayPct = todayHabits.length > 0 ? Math.round((completedToday / todayHabits.length) * 100) : 0;

  // Top 3 streaks
  const topStreaks = habits
    .map(h => ({ name: h.name, emoji: h.emoji || '✅', streak: calculateStreak(h.completions || [], h.frequency) }))
    .filter(h => h.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3);

  // Best overall streak
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);

  // Medals
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = achievements.length;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: 'var(--bg-border, #1f1f1f)' }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
          style={{ background: `rgba(${hexToRgb(levelColor)}, 0.15)`, border: `2px solid rgba(${hexToRgb(levelColor)}, 0.45)`, color: levelColor }}>
          {(profile.name || user.displayName || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm capitalize leading-tight">
            {profile.name || user.displayName}
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: levelColor }}>
            {levelIcon} Lv.{level} · {totalXP.toLocaleString()} XP
          </p>
        </div>
        {/* Today pill */}
        <div className="flex flex-col items-center flex-shrink-0">
          <span className="text-white font-bold text-sm">{todayPct}%</span>
          <span className="text-[#4b5563] text-[9px]">today</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Growth chart */}
        {habits.length > 0 && (
          <GrowthChart habits={habits} accentColor={accent} compact ranges={FRIEND_RANGES} />
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Medals */}
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <p className="text-white font-bold text-base">{unlockedCount}</p>
            <p className="text-[#7c3aed] text-[9px] font-semibold">MEDALS</p>
            <p className="text-[#4b5563] text-[9px]">/{totalAchievements}</p>
          </div>

          {/* Best streak */}
          <div className="rounded-xl p-2.5 text-center" style={{ background: `rgba(${accentRgb}, 0.08)`, border: `1px solid rgba(${accentRgb}, 0.2)` }}>
            <p className="text-white font-bold text-base">{bestStreak}</p>
            <p className="text-[9px] font-semibold" style={{ color: accent }}>BEST</p>
            <p className="text-[#4b5563] text-[9px]">streak</p>
          </div>

          {/* Total habits */}
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white font-bold text-base">{habits.length}</p>
            <p className="text-[#6b7280] text-[9px] font-semibold">HABITS</p>
            <p className="text-[#4b5563] text-[9px]">tracked</p>
          </div>
        </div>

        {/* Top streaks */}
        {topStreaks.length > 0 && (
          <div>
            <p className="text-[#4b5563] text-[10px] font-semibold uppercase tracking-wider mb-2">Top Streaks 🔥</p>
            <div className="space-y-1.5">
              {topStreaks.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center">{h.emoji}</span>
                  <span className="text-[#9ca3af] text-xs flex-1 truncate">{h.name}</span>
                  <span className="text-white text-xs font-bold">{h.streak}d</span>
                  <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((h.streak / 30) * 100, 100)}%`, background: accent }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medals preview */}
        {unlockedCount > 0 && (
          <div>
            <p className="text-[#4b5563] text-[10px] font-semibold uppercase tracking-wider mb-2">Medals</p>
            <div className="flex flex-wrap gap-1.5">
              {ACHIEVEMENTS.filter(a => achievements.some(u => u.id === a.id)).map(a => (
                <span key={a.id} title={a.name}
                  className="text-lg w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {a.icon}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FriendsPanel() {
  const { currentUser, users } = useAuth();
  const friends = users.filter(u => u.id !== currentUser?.id);

  if (friends.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-white font-bold text-xl">Friends</h2>
          <p className="text-[#4b5563] text-sm mt-0.5">See your friends' progress</p>
        </div>
        <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
          <p className="text-4xl mb-3">👥</p>
          <p className="text-white font-semibold">No friends yet</p>
          <p className="text-[#4b5563] text-sm mt-1">Other users who sign up will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-white font-bold text-xl">Friends</h2>
        <p className="text-[#4b5563] text-sm mt-0.5">{friends.length} {friends.length === 1 ? 'person' : 'people'} on your team</p>
      </div>
      {friends.map(user => (
        <FriendCard key={user.id} user={user} />
      ))}
    </div>
  );
}
