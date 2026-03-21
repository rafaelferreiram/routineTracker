import { useMemo } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { ACHIEVEMENTS, RARITY_COLORS } from '../utils/gamification.js';

function AchievementCard({ achievement, unlockedAt }) {
  const isUnlocked = !!unlockedAt;
  const rarity = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;

  const formattedDate = useMemo(() => {
    if (!unlockedAt) return null;
    return new Date(unlockedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [unlockedAt]);

  return (
    <div
      className={`rounded-3xl p-5 border transition-all duration-300 ${
        isUnlocked
          ? 'hover:scale-[1.02]'
          : 'opacity-50'
      }`}
      style={{
        background: isUnlocked
          ? `linear-gradient(135deg, ${rarity.bg}AA, ${rarity.bg}66)`
          : 'rgba(255,255,255,0.02)',
        borderColor: isUnlocked ? rarity.border : 'rgba(255,255,255,0.06)',
        boxShadow: isUnlocked ? rarity.glow : '',
      }}
    >
      {/* Icon */}
      <div className="relative mb-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto"
          style={{
            background: isUnlocked ? `${rarity.border}22` : 'rgba(255,255,255,0.05)',
            border: `2px solid ${isUnlocked ? rarity.border : 'rgba(255,255,255,0.1)'}`,
            filter: isUnlocked ? 'none' : 'grayscale(100%)',
          }}
        >
          {achievement.icon}
        </div>

        {isUnlocked && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
            style={{ background: rarity.border, boxShadow: `0 0 6px ${rarity.border}` }}
          >
            ✓
          </div>
        )}

        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <h3
            className="font-bold text-sm"
            style={{ color: isUnlocked ? rarity.text : 'rgba(148,163,184,0.6)' }}
          >
            {achievement.name}
          </h3>
        </div>

        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-2"
          style={{
            background: isUnlocked ? `${rarity.border}22` : 'rgba(255,255,255,0.05)',
            color: isUnlocked ? rarity.border : 'rgba(148,163,184,0.4)',
            border: `1px solid ${isUnlocked ? rarity.border + '44' : 'rgba(255,255,255,0.05)'}`,
          }}
        >
          {achievement.rarity}
        </span>

        <p className="text-xs text-slate-500 leading-snug mb-2">
          {achievement.description}
        </p>

        {isUnlocked && formattedDate && (
          <p
            className="text-xs font-medium"
            style={{ color: rarity.border }}
          >
            Unlocked {formattedDate}
          </p>
        )}

        {achievement.xpReward > 0 && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="text-yellow-500 text-xs">⚡</span>
            <span className="text-xs text-slate-400">+{achievement.xpReward} XP</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AchievementsPanel() {
  const { achievements } = useHabits();

  const unlockedMap = useMemo(() => {
    const map = {};
    achievements.forEach(a => { map[a.id] = a.unlockedAt; });
    return map;
  }, [achievements]);

  const unlockedCount = achievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const completionPct = Math.round((unlockedCount / totalCount) * 100);

  // Sort: unlocked first, then by rarity
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => {
    const aUnlocked = !!unlockedMap[a.id];
    const bUnlocked = !!unlockedMap[b.id];
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
    return (rarityOrder[a.rarity] || 5) - (rarityOrder[b.rarity] || 5);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-white font-bold text-2xl">Achievements</h2>
        <p className="text-slate-400 text-sm mt-1">Unlock medals by completing challenges</p>
      </div>

      {/* Progress summary */}
      <div
        className="rounded-3xl p-5 border border-white/8"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))' }}
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl font-black text-white">
            {unlockedCount}
            <span className="text-slate-400 text-2xl font-medium">/{totalCount}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm font-medium">Medals unlocked</span>
              <span className="text-primary-lighter font-bold text-sm">{completionPct}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${completionPct}%`,
                  background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                  boxShadow: '0 0 10px rgba(124,58,237,0.5)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Rarity breakdown */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {[
            { rarity: 'common', label: 'Common', color: '#6B7280' },
            { rarity: 'uncommon', label: 'Uncommon', color: '#16A34A' },
            { rarity: 'rare', label: 'Rare', color: '#3B82F6' },
            { rarity: 'epic', label: 'Epic', color: '#9333EA' },
            { rarity: 'legendary', label: 'Legendary', color: '#F59E0B' },
          ].map(({ rarity, label, color }) => {
            const total = ACHIEVEMENTS.filter(a => a.rarity === rarity).length;
            const unlocked = ACHIEVEMENTS.filter(a => a.rarity === rarity && unlockedMap[a.id]).length;
            return (
              <div key={rarity} className="text-center p-2 rounded-xl bg-white/5">
                <p className="font-bold text-lg" style={{ color }}>
                  {unlocked}/{total}
                </p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sortedAchievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            unlockedAt={unlockedMap[achievement.id]}
          />
        ))}
      </div>

      {unlockedCount === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">
            Complete habits to unlock your first achievement! 🎯
          </p>
        </div>
      )}
    </div>
  );
}
