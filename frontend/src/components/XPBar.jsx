import { useEffect, useRef, useState } from 'react';
import { getLevelFromXP, getLevelProgress, getLevelTitle, getLevelIcon, getLevelColor, getXPForCurrentLevel, getXPNeededForNextLevel } from '../utils/gamification.js';

export default function XPBar({ totalXP = 0, compact = false, className = '' }) {
  const level = getLevelFromXP(totalXP);
  const progress = getLevelProgress(totalXP);
  const title = getLevelTitle(level);
  const icon = getLevelIcon(level);
  const color = getLevelColor(level);
  const currentLevelXP = getXPForCurrentLevel(totalXP);
  const neededXP = getXPNeededForNextLevel(totalXP);

  const barRef = useRef(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimated(true));
    });
    return () => cancelAnimationFrame(t);
  }, [progress]);

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl font-bold text-sm shadow-lg flex-shrink-0"
          style={{ background: color, boxShadow: `0 0 12px ${color}60` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-300">
              Lv.{level} {title}
            </span>
            <span className="text-xs text-slate-400">
              {level < 50 ? `${currentLevelXP}/${neededXP} XP` : 'MAX'}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              ref={barRef}
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: animated ? `${progress}%` : '0%',
                background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                boxShadow: `0 0 8px ${color}80`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Level badge row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color}33, ${color}11)`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 16px ${color}40`,
            }}
          >
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg leading-none">Level {level}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${color}33`, color, border: `1px solid ${color}66` }}
              >
                {title}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              {level < 50
                ? `${currentLevelXP} / ${neededXP} XP to next level`
                : 'Maximum level reached!'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Total XP</p>
          <p className="text-white font-bold text-lg" style={{ color }}>
            {totalXP.toLocaleString()}
          </p>
        </div>
      </div>

      {/* XP Progress bar */}
      <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
        <div
          ref={barRef}
          className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{
            width: animated ? `${progress}%` : '0%',
            background: `linear-gradient(90deg, ${color}, ${color}AA)`,
            boxShadow: `0 0 10px ${color}80`,
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          />
        </div>

        {/* Milestone markers at 25%, 50%, 75% */}
        {[25, 50, 75].map(pct => (
          <div
            key={pct}
            className="absolute top-0 h-full w-px bg-white/20"
            style={{ left: `${pct}%` }}
          />
        ))}
      </div>

      {level < 50 && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-500">Level {level}</span>
          <span className="text-xs text-slate-500">Level {level + 1}</span>
        </div>
      )}
    </div>
  );
}
