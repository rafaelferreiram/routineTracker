export default function StreakBadge({ streak = 0, size = 'md', showLabel = true, className = '' }) {
  const sizeMap = {
    xs: { outer: 'w-7 h-7 text-sm', text: 'text-xs', label: 'text-xs' },
    sm: { outer: 'w-9 h-9 text-base', text: 'text-xs', label: 'text-xs' },
    md: { outer: 'w-12 h-12 text-xl', text: 'text-sm', label: 'text-sm' },
    lg: { outer: 'w-16 h-16 text-3xl', text: 'text-base', label: 'text-sm' },
    xl: { outer: 'w-20 h-20 text-4xl', text: 'text-lg', label: 'text-base' },
  };

  const s = sizeMap[size] || sizeMap.md;

  const getStreakStyle = (streak) => {
    if (streak === 0) return { bg: 'bg-slate-700/50', border: 'border-slate-600', glow: '', fire: '💤', textColor: 'text-slate-400', animate: false };
    if (streak < 3) return { bg: 'bg-orange-900/30', border: 'border-orange-600/50', glow: '', fire: '🔥', textColor: 'text-orange-300', animate: true };
    if (streak < 7) return { bg: 'bg-orange-800/40', border: 'border-orange-500', glow: '0 0 12px rgba(249,115,22,0.4)', fire: '🔥', textColor: 'text-orange-400', animate: true };
    if (streak < 14) return { bg: 'bg-amber-800/40', border: 'border-amber-500', glow: '0 0 16px rgba(245,158,11,0.5)', fire: '🔥', textColor: 'text-amber-400', animate: true };
    if (streak < 30) return { bg: 'bg-yellow-800/40', border: 'border-yellow-400', glow: '0 0 20px rgba(234,179,8,0.6)', fire: '⚡', textColor: 'text-yellow-300', animate: true };
    return { bg: 'bg-purple-800/40', border: 'border-purple-400', glow: '0 0 24px rgba(167,139,250,0.7)', fire: '👑', textColor: 'text-purple-300', animate: true };
  };

  const style = getStreakStyle(streak);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${s.outer} rounded-2xl flex items-center justify-center border-2 ${style.bg} ${style.border} flex-shrink-0 ${style.animate ? 'fire-animation' : ''}`}
        style={{ boxShadow: style.glow }}
      >
        {streak > 0 ? (
          <span className={style.animate ? 'fire-bounce' : ''}>{style.fire}</span>
        ) : (
          <span className="text-slate-500">{style.fire}</span>
        )}
      </div>

      {showLabel && (
        <div>
          <div className={`font-bold ${s.text} ${style.textColor}`}>
            {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'}` : 'No streak'}
          </div>
          <div className={`${s.label} text-slate-500`}>
            {streak === 0 ? 'Start today!' : 'streak'}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline streak indicator with fire animation
 */
export function StreakPill({ streak = 0, className = '' }) {
  if (streak === 0) return null;

  const getColor = (s) => {
    if (s < 3) return 'bg-orange-900/40 text-orange-300 border-orange-700/50';
    if (s < 7) return 'bg-orange-800/40 text-orange-400 border-orange-500';
    if (s < 14) return 'bg-amber-800/40 text-amber-300 border-amber-600';
    if (s < 30) return 'bg-yellow-800/40 text-yellow-300 border-yellow-600';
    return 'bg-purple-800/40 text-purple-300 border-purple-500';
  };

  const getGlow = (s) => {
    if (s < 3) return '';
    if (s < 7) return '0 0 8px rgba(249,115,22,0.3)';
    if (s < 14) return '0 0 10px rgba(245,158,11,0.4)';
    if (s < 30) return '0 0 12px rgba(234,179,8,0.5)';
    return '0 0 16px rgba(167,139,250,0.6)';
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border fire-animation ${getColor(streak)} ${className}`}
      style={{ boxShadow: getGlow(streak) }}
    >
      <span className="fire-bounce streak-fire">🔥</span> {streak}
    </span>
  );
}
