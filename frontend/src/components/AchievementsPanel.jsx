import { useMemo, useState } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { ACHIEVEMENTS, TROPHY_TIERS, GROUP_THRESHOLDS, calculatePerfectDayStreak } from '../utils/gamification.js';

const TIER_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

function TrophyCard({ achievement, unlockedAt, isDisabled, onToggle, isLocked }) {
  const tier = TROPHY_TIERS[achievement.tier] || TROPHY_TIERS.bronze;
  const isEarned = !!unlockedAt && !isDisabled;
  const showAsLocked = !unlockedAt || isDisabled;

  return (
    <div
      data-testid={`trophy-card-${achievement.id}`}
      className={`relative rounded-2xl p-4 border transition-all duration-300 ${
        isEarned ? 'hover:scale-[1.03]' : 'opacity-60'
      }`}
      style={{
        background: isEarned
          ? `linear-gradient(145deg, ${tier.bg}CC, ${tier.bg}88)`
          : 'rgba(255,255,255,0.02)',
        borderColor: isEarned ? `${tier.border}88` : 'rgba(255,255,255,0.06)',
        boxShadow: isEarned ? tier.glow : '',
      }}
    >
      {/* Tier badge */}
      <div className="absolute top-2 right-2">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
          style={{
            background: isEarned ? `${tier.border}22` : 'rgba(255,255,255,0.04)',
            color: isEarned ? tier.border : 'rgba(148,163,184,0.4)',
            border: `1px solid ${isEarned ? tier.border + '33' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          {achievement.tier}
        </span>
      </div>

      {/* Icon */}
      <div className="relative mb-2.5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto"
          style={{
            background: isEarned ? `${tier.border}18` : 'rgba(255,255,255,0.04)',
            border: `2px solid ${isEarned ? tier.border : 'rgba(255,255,255,0.08)'}`,
            filter: showAsLocked ? 'grayscale(100%)' : 'none',
          }}
        >
          {isLocked ? '?' : achievement.icon}
        </div>
        {isEarned && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
            style={{ background: tier.border, boxShadow: `0 0 6px ${tier.border}` }}
          >
            ✓
          </div>
        )}
        {showAsLocked && !isLocked && !unlockedAt && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg opacity-60">🔒</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="text-center">
        <h3
          className={`font-bold text-xs leading-tight mb-1 ${isDisabled ? 'line-through opacity-50' : ''}`}
          style={{ color: isEarned ? tier.text : 'rgba(148,163,184,0.6)' }}
        >
          {isLocked ? '???' : achievement.name}
        </h3>
        <p className="text-[10px] text-slate-500 leading-snug mb-1.5 line-clamp-2">
          {isLocked ? 'Unlock this tier to reveal' : achievement.description}
        </p>

        {/* XP reward */}
        {!isLocked && achievement.xpReward > 0 && (
          <div className="flex items-center justify-center gap-1">
            <span className="text-yellow-500 text-[10px]">⚡</span>
            <span className="text-[10px] text-slate-400">+{achievement.xpReward} XP</span>
          </div>
        )}

        {/* Earned date */}
        {isEarned && unlockedAt && (
          <p className="text-[10px] mt-1 font-medium" style={{ color: tier.border }}>
            {new Date(unlockedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
          </p>
        )}

        {/* Toggle for earned trophies */}
        {unlockedAt && (
          <button
            data-testid={`trophy-toggle-${achievement.id}`}
            onClick={(e) => { e.stopPropagation(); onToggle(achievement.id); }}
            className="mt-2 flex items-center justify-center gap-1.5 mx-auto px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
            style={{
              background: isDisabled ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
              color: isDisabled ? '#f87171' : '#22c55e',
              border: `1px solid ${isDisabled ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
            }}
          >
            <span className="w-3 h-3 rounded-full border relative flex-shrink-0"
              style={{
                borderColor: isDisabled ? '#f87171' : '#22c55e',
                background: isDisabled ? 'transparent' : '#22c55e',
              }}
            >
              {!isDisabled && (
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">✓</span>
              )}
            </span>
            {isDisabled ? 'Desativado' : 'Ativo'}
          </button>
        )}
      </div>
    </div>
  );
}

function MysteryCard() {
  return (
    <div className="rounded-2xl p-4 border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center min-h-[140px]">
      <span className="text-2xl mb-2 opacity-30">?</span>
      <span className="text-[10px] text-slate-600 text-center">Desbloqueie mais</span>
    </div>
  );
}

export default function AchievementsPanel() {
  const { habits, achievements, disabledTrophies, disableTrophy, enableTrophy, accentColor } = useHabits();
  const { t } = useLanguage();
  const [expandedGroup, setExpandedGroup] = useState(null);

  const unlockedMap = useMemo(() => {
    const map = {};
    achievements.forEach(a => { map[a.id] = a.unlockedAt; });
    return map;
  }, [achievements]);

  const disabledSet = useMemo(() => new Set(disabledTrophies), [disabledTrophies]);

  // Active = unlocked AND not disabled
  const activeCount = useMemo(() =>
    achievements.filter(a => !disabledSet.has(a.id)).length
  , [achievements, disabledSet]);

  const perfectStreak = useMemo(() => calculatePerfectDayStreak(habits), [habits]);

  // Determine which groups are visible
  const maxVisibleGroup = useMemo(() => {
    if (activeCount >= GROUP_THRESHOLDS[4]) return 4;
    if (activeCount >= GROUP_THRESHOLDS[3]) return 3;
    if (activeCount >= GROUP_THRESHOLDS[2]) return 2;
    return 1;
  }, [activeCount]);

  // Count trophies by tier (only active ones)
  const tierCounts = useMemo(() => {
    const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    achievements.forEach(a => {
      if (disabledSet.has(a.id)) return;
      const def = ACHIEVEMENTS.find(d => d.id === a.id);
      if (def) counts[def.tier] = (counts[def.tier] || 0) + 1;
    });
    return counts;
  }, [achievements, disabledSet]);

  const totalAvailable = ACHIEVEMENTS.length;
  const completionPct = Math.round((activeCount / totalAvailable) * 100);

  // Next unlock info
  const nextGroupThreshold = maxVisibleGroup < 4 ? GROUP_THRESHOLDS[maxVisibleGroup + 1] : null;
  const trophiesToNextTier = nextGroupThreshold ? nextGroupThreshold - activeCount : 0;

  // Organize trophies by group
  const groups = useMemo(() => {
    const result = {};
    for (let g = 1; g <= 4; g++) {
      result[g] = ACHIEVEMENTS.filter(a => a.group === g)
        .sort((a, b) => {
          const aEarned = !!unlockedMap[a.id] && !disabledSet.has(a.id);
          const bEarned = !!unlockedMap[b.id] && !disabledSet.has(b.id);
          if (aEarned !== bEarned) return aEarned ? -1 : 1;
          return (TIER_ORDER[a.tier] || 3) - (TIER_ORDER[b.tier] || 3);
        });
    }
    return result;
  }, [unlockedMap, disabledSet]);

  const handleToggle = (id) => {
    if (disabledSet.has(id)) {
      enableTrophy(id);
    } else {
      disableTrophy(id);
    }
  };

  const groupLabels = {
    1: { name: 'Tier 1 - Iniciante', desc: 'Primeiros passos' },
    2: { name: 'Tier 2 - Dedicado',  desc: `Desbloqueado com ${GROUP_THRESHOLDS[2]} troféus` },
    3: { name: 'Tier 3 - Campeão',   desc: `Desbloqueado com ${GROUP_THRESHOLDS[3]} troféus` },
    4: { name: 'Tier 4 - Lendário',  desc: `Desbloqueado com ${GROUP_THRESHOLDS[4]} troféus` },
  };

  return (
    <div data-testid="achievements-panel" className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <h2 className="text-white font-bold text-2xl">{t('achievements.title') || 'Troféus'}</h2>
        <p className="text-slate-400 text-sm mt-1">Sistema PlayStation de conquistas</p>
      </div>

      {/* Summary Card */}
      <div
        data-testid="trophy-summary"
        className="rounded-2xl p-5 border"
        style={{ background: 'linear-gradient(145deg, rgba(26,26,46,0.8), rgba(26,26,46,0.4))', borderColor: 'rgba(184,212,227,0.15)' }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl font-black text-white">
            {activeCount}
            <span className="text-slate-400 text-2xl font-medium">/{totalAvailable}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm font-medium">Troféus conquistados</span>
              <span className="font-bold text-sm" style={{ color: '#B8D4E3' }}>{completionPct}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${completionPct}%`,
                  background: 'linear-gradient(90deg, #CD7F32, #C0C0C0, #FFD700, #B8D4E3)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(['bronze', 'silver', 'gold', 'platinum']).map(tier => {
            const t = TROPHY_TIERS[tier];
            const total = ACHIEVEMENTS.filter(a => a.tier === tier).length;
            return (
              <div key={tier} className="text-center p-2 rounded-xl" style={{ background: `${t.bg}66`, border: `1px solid ${t.border}22` }}>
                <p className="text-lg mb-0.5">{t.icon}</p>
                <p className="font-bold text-sm" style={{ color: t.border }}>{tierCounts[tier]}/{total}</p>
                <p className="text-[10px] text-slate-500 capitalize">{tier === 'platinum' ? 'Platina' : tier === 'gold' ? 'Ouro' : tier === 'silver' ? 'Prata' : 'Bronze'}</p>
              </div>
            );
          })}
        </div>

        {/* Perfect Day Streak */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-2xl">🔥</span>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Dias Perfeitos Seguidos</p>
            <p className="text-slate-400 text-xs">Complete todos os hábitos do dia</p>
          </div>
          <div className="text-right">
            <p className="text-white font-black text-xl">{perfectStreak}</p>
            <p className="text-[10px] text-slate-500">{perfectStreak === 1 ? 'dia' : 'dias'}</p>
          </div>
        </div>

        {/* Next tier unlock */}
        {nextGroupThreshold && (
          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: accentColor }}>
            <span>⚡</span>
            <span>Faltam <strong>{trophiesToNextTier}</strong> troféus para desbloquear o Tier {maxVisibleGroup + 1}!</span>
          </div>
        )}
      </div>

      {/* Trophy Groups */}
      {[1, 2, 3, 4].map(groupNum => {
        const isVisible = groupNum <= maxVisibleGroup;
        const trophies = groups[groupNum] || [];
        const groupEarned = trophies.filter(a => unlockedMap[a.id] && !disabledSet.has(a.id)).length;
        const label = groupLabels[groupNum];
        const isExpanded = expandedGroup === groupNum || isVisible;

        // Earned trophies from hidden groups still show
        const earnedFromThisHiddenGroup = !isVisible
          ? trophies.filter(a => unlockedMap[a.id])
          : [];

        if (!isVisible && earnedFromThisHiddenGroup.length === 0) {
          // Show locked tier placeholder
          return (
            <div key={groupNum} data-testid={`trophy-group-${groupNum}-locked`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  <h3 className="text-slate-500 font-bold text-sm">{label.name}</h3>
                </div>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-slate-600 bg-white/[0.03] px-2 py-1 rounded-md">
                  {GROUP_THRESHOLDS[groupNum]} troféus necessários
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[0, 1, 2].map(i => <MysteryCard key={i} />)}
                <div className="rounded-2xl p-4 border border-dashed border-white/10 bg-white/[0.01] flex items-center justify-center min-h-[140px]">
                  <span className="text-xs text-slate-600">+{trophies.length - 3}</span>
                </div>
              </div>
            </div>
          );
        }

        // If hidden but has earned trophies, show only those
        if (!isVisible) {
          return (
            <div key={groupNum} data-testid={`trophy-group-${groupNum}-partial`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  <h3 className="text-slate-400 font-bold text-sm">{label.name}</h3>
                </div>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-slate-500 bg-white/[0.03] px-2 py-1 rounded-md">
                  {earnedFromThisHiddenGroup.length} conquistado(s)
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {earnedFromThisHiddenGroup.map(a => (
                  <TrophyCard
                    key={a.id}
                    achievement={a}
                    unlockedAt={unlockedMap[a.id]}
                    isDisabled={disabledSet.has(a.id)}
                    onToggle={handleToggle}
                  />
                ))}
                <MysteryCard />
              </div>
            </div>
          );
        }

        // Visible group
        return (
          <div key={groupNum} data-testid={`trophy-group-${groupNum}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{groupNum <= maxVisibleGroup ? '🏆' : '🔒'}</span>
                <h3 className="text-white font-bold text-sm">{label.name}</h3>
              </div>
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-slate-400 bg-white/[0.03] px-2 py-1 rounded-md">
                {groupEarned}/{trophies.length}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {trophies.map(a => (
                <TrophyCard
                  key={a.id}
                  achievement={a}
                  unlockedAt={unlockedMap[a.id]}
                  isDisabled={disabledSet.has(a.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {activeCount === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">
            Complete hábitos para conquistar seu primeiro troféu!
          </p>
        </div>
      )}
    </div>
  );
}
