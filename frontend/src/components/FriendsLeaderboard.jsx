import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../store/useAuth.js';
import { useHabits } from '../hooks/useHabits.js';
import {
  getLevelFromXP,
  getLevelIcon,
  getLevelColor,
  ACHIEVEMENTS,
} from '../utils/gamification.js';
import {
  getTodayString,
  isHabitApplicableToday,
  calculateStreak,
} from '../utils/dateUtils.js';

// ── helpers ────────────────────────────────────────────────────────────────────

function computeStats(habits = [], profile = {}, achievements = []) {
  const today = getTodayString();
  const applicable = habits.filter(h => isHabitApplicableToday(h));
  const completedToday = applicable.filter(h =>
    (h.completions || []).includes(today)
  ).length;
  const todayPct =
    applicable.length > 0
      ? Math.round((completedToday / applicable.length) * 100)
      : 0;

  const bestStreak = habits.reduce(
    (max, h) =>
      Math.max(max, calculateStreak(h.completions || [], h.frequency)),
    0
  );

  return {
    xp: profile.totalXP || 0,
    level: getLevelFromXP(profile.totalXP || 0),
    todayPct,
    todayDone: completedToday,
    todayTotal: applicable.length,
    bestStreak,
    medals: achievements.length,
    habitsCount: habits.length,
  };
}

const MEDAL_COLORS = {
  0: { text: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', label: '🥇' },
  1: { text: '#9ca3af', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.20)', label: '🥈' },
  2: { text: '#cd7f32', bg: 'rgba(205,127,50,0.10)', border: 'rgba(205,127,50,0.20)', label: '🥉' },
};

const METRICS = [
  { id: 'xp',     label: 'XP',       desc: 'Total acumulado',     key: 'xp',       fmt: v => v.toLocaleString('pt-BR') },
  { id: 'today',  label: 'Hoje',     desc: '% de hábitos feitos', key: 'todayPct', fmt: v => `${v}%` },
  { id: 'streak', label: 'Sequência',desc: 'Maior streak atual',   key: 'bestStreak', fmt: v => `${v}d` },
  { id: 'medals', label: 'Medalhas', desc: 'Conquistas desbloqueadas', key: 'medals', fmt: v => `${v}` },
];

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ picture, name, accent = '#22c55e', size = 32 }) {
  if (picture) {
    return (
      <img
        src={picture}
        alt=""
        referrerPolicy="no-referrer"
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs"
      style={{
        width: size,
        height: size,
        background: `${accent}22`,
        color: accent,
        border: `1.5px solid ${accent}44`,
      }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

// ── Single leaderboard row ─────────────────────────────────────────────────────
function LeaderRow({ rank, player, metric, maxValue, isMe }) {
  const medal = MEDAL_COLORS[rank];
  const value = player.stats[metric.key];
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  const levelColor = getLevelColor(player.stats.level);
  const accent = player.accentColor || '#22c55e';

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
      style={{
        background: isMe
          ? `${accent}0d`
          : medal
          ? medal.bg
          : 'transparent',
        border: `1px solid ${
          isMe
            ? `${accent}30`
            : medal
            ? medal.border
            : 'transparent'
        }`,
      }}
    >
      {/* Rank badge */}
      <div className="w-7 text-center flex-shrink-0">
        {medal ? (
          <span className="text-base leading-none">{medal.label}</span>
        ) : (
          <span className="text-xs font-bold" style={{ color: '#4b5563' }}>
            {rank + 1}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar
        picture={player.picture}
        name={player.displayName}
        accent={isMe ? accent : levelColor}
        size={30}
      />

      {/* Name + subtitle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-semibold truncate"
            style={{ color: isMe ? accent : '#e5e7eb' }}
          >
            {player.displayName}
          </span>
          {isMe && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ background: `${accent}20`, color: accent }}
            >
              Você
            </span>
          )}
        </div>
        {/* Mini progress bar */}
        <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden" style={{ width: '100%' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: isMe ? accent : medal ? medal.text : '#374151',
            }}
          />
        </div>
      </div>

      {/* Value */}
      <div className="text-right flex-shrink-0">
        <span
          className="text-sm font-bold"
          style={{
            color: isMe ? accent : medal ? medal.text : '#9ca3af',
          }}
        >
          {metric.fmt(value)}
        </span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FriendsLeaderboard() {
  const { currentUser } = useAuth();
  const { habits: myHabits, profile: myProfile, achievements: myAchievements } = useHabits();

  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [activeMetric, setActiveMetric] = useState('xp');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    api
      .getFriends()
      .then(d => setFriends(d.friends || []))
      .catch(() => {})
      .finally(() => setLoadingFriends(false));
  }, []);

  const metric = METRICS.find(m => m.id === activeMetric) || METRICS[0];

  // Build ranked list: me + friends
  const ranked = useMemo(() => {
    const me = {
      id: currentUser?.id || 'me',
      displayName: currentUser?.displayName || currentUser?.username || 'Você',
      username: currentUser?.username || '',
      picture: currentUser?.picture || '',
      accentColor: '#22c55e',
      isMe: true,
      stats: computeStats(
        myHabits || [],
        myProfile || {},
        myAchievements || []
      ),
    };

    const friendPlayers = friends.map(f => ({
      id: f.id,
      displayName: f.data?.profile?.name || f.displayName || f.username,
      username: f.username,
      picture: f.picture || '',
      accentColor: f.theme?.accentColor || '#22c55e',
      isMe: false,
      stats: computeStats(
        f.data?.habits || [],
        f.data?.profile || {},
        f.data?.achievements || []
      ),
    }));

    return [me, ...friendPlayers].sort(
      (a, b) => b.stats[metric.key] - a.stats[metric.key]
    );
  }, [friends, myHabits, myProfile, myAchievements, currentUser, activeMetric]);

  const maxValue = ranked.length > 0 ? ranked[0].stats[metric.key] : 1;
  const myRank = ranked.findIndex(p => p.isMe);

  const totalAchievements = ACHIEVEMENTS.length;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-card, #111111)',
        border: '1px solid var(--bg-border, #1f1f1f)',
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">🏆</span>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Ranking de Amigos</p>
            <p className="text-[#4b5563] text-[10px]">
              {loadingFriends
                ? 'Carregando...'
                : friends.length === 0
                ? 'Adicione amigos para competir'
                : `${ranked.length} jogadores · você está em #${myRank + 1}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!collapsed && myRank <= 2 && ranked.length > 1 && (
            <span className="text-base">{MEDAL_COLORS[myRank]?.label}</span>
          )}
          <svg
            className="w-4 h-4 text-[#4b5563] transition-transform"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <>
          {/* Metric tabs */}
          <div
            className="flex gap-1 px-3 pb-2.5 overflow-x-auto"
            style={{ borderBottom: '1px solid var(--bg-border, #1f1f1f)' }}
          >
            {METRICS.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
                style={
                  activeMetric === m.id
                    ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }
                    : { background: 'transparent', color: '#6b7280', border: '1px solid transparent' }
                }
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="p-2.5 space-y-1">
            {loadingFriends ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
              </div>
            ) : ranked.length === 1 ? (
              // Only me — no friends yet
              <div className="text-center py-5">
                <p className="text-2xl mb-2">👥</p>
                <p className="text-[#4b5563] text-xs">
                  Adicione amigos para ver o ranking
                </p>
              </div>
            ) : (
              ranked.map((player, rank) => (
                <LeaderRow
                  key={player.id}
                  rank={rank}
                  player={player}
                  metric={metric}
                  maxValue={maxValue}
                  isMe={player.isMe}
                />
              ))
            )}
          </div>

          {/* Footer stat */}
          {ranked.length > 1 && (
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--bg-border, #1f1f1f)' }}
            >
              <span className="text-[10px] text-[#4b5563]">{metric.desc}</span>
              {activeMetric === 'medals' && (
                <span className="text-[10px] text-[#4b5563]">
                  /{totalAchievements} disponíveis
                </span>
              )}
              {activeMetric === 'today' && ranked.find(p => p.isMe) && (
                <span className="text-[10px] text-[#4b5563]">
                  {ranked.find(p => p.isMe).stats.todayDone}/
                  {ranked.find(p => p.isMe).stats.todayTotal} hábitos
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
