import { useEffect, useState } from 'react';
import { getLevelColor, getLevelIcon, getLevelTitle } from '../utils/gamification.js';

export default function LevelUpCeremony({ oldLevel, newLevel, onClose }) {
  const [phase, setPhase] = useState('entering'); // entering → showing → exiting

  const color = getLevelColor(newLevel);
  const icon = getLevelIcon(newLevel);
  const title = getLevelTitle(newLevel);
  const oldTitle = getLevelTitle(oldLevel);

  const tierChange = getLevelTitle(newLevel) !== getLevelTitle(oldLevel);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('showing'), 100);
    const t2 = setTimeout(() => setPhase('exiting'), 4000);
    const t3 = setTimeout(() => onClose(), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        opacity: phase === 'entering' ? 0 : phase === 'exiting' ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
      onClick={onClose}
    >
      <div
        className="text-center px-8 py-10 max-w-sm"
        style={{
          transform: phase === 'showing' ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Rays */}
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
              transform: 'scale(3)',
            }}
          />

          {/* Main icon */}
          <div
            className="relative w-28 h-28 rounded-3xl flex items-center justify-center text-6xl mx-auto animate-bounce-in shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${color}30, ${color}15)`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 60px ${color}50, 0 0 120px ${color}20`,
            }}
          >
            {icon}
          </div>
        </div>

        <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-widest mb-2">
          Level Up!
        </p>
        <h2 className="text-white font-black text-5xl mb-1" style={{ textShadow: `0 0 30px ${color}60` }}>
          {newLevel}
        </h2>
        <p className="font-bold text-lg mb-1" style={{ color }}>
          {title}
        </p>
        {tierChange && (
          <p className="text-[#4b5563] text-sm mb-4">
            <span className="line-through">{oldTitle}</span> → <span style={{ color }}>{title}</span>
          </p>
        )}
        <p className="text-[#6b7280] text-sm mt-4">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
