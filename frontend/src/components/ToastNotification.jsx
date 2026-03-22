import { useEffect, useRef, useState } from 'react';
import { useHabits } from '../hooks/useHabits.js';

function Toast({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const startExit = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  useEffect(() => {
    timerRef.current = setTimeout(startExit, 4000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const typeConfig = {
    xp: {
      bg: 'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(109,40,217,0.9))',
      border: 'rgba(167,139,250,0.4)',
      icon: '⚡',
      glow: 'rgba(124,58,237,0.5)',
    },
    achievement: {
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(217,119,6,0.9))',
      border: 'rgba(251,191,36,0.4)',
      icon: '🏆',
      glow: 'rgba(245,158,11,0.5)',
    },
    info: {
      bg: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(37,99,235,0.9))',
      border: 'rgba(147,197,253,0.4)',
      icon: 'ℹ️',
      glow: 'rgba(59,130,246,0.4)',
    },
    success: {
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.9))',
      border: 'rgba(110,231,183,0.4)',
      icon: '✅',
      glow: 'rgba(16,185,129,0.4)',
    },
  };

  const cfg = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border max-w-sm w-full shadow-2xl cursor-pointer ${
        exiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      style={{
        background: cfg.bg,
        borderColor: cfg.border,
        boxShadow: `0 8px 32px ${cfg.glow}, 0 0 0 1px ${cfg.border}`,
        backdropFilter: 'blur(16px)',
      }}
      onClick={() => { clearTimeout(timerRef.current); startExit(); }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
        {toast.type === 'achievement' && toast.message
          ? toast.message.split(' ')[0]
          : cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight">
          {toast.title}
        </p>

        {toast.type === 'xp' ? (
          <p className="text-white/80 text-xs mt-0.5 truncate">{toast.message}</p>
        ) : (
          <>
            <p className="text-white/90 text-xs mt-0.5">
              {toast.message?.split(' ').slice(1).join(' ')}
            </p>
            {toast.description && (
              <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{toast.description}</p>
            )}
            {toast.xp > 0 && (
              <p className="text-yellow-300 text-xs font-semibold mt-1">+{toast.xp} XP rewarded!</p>
            )}
          </>
        )}

        {/* XP reasons */}
        {toast.type === 'xp' && toast.reasons && toast.reasons.length > 1 && (
          <div className="mt-1.5 space-y-0.5">
            {toast.reasons.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-white/70 text-xs">{r.label}</span>
                <span className="text-yellow-300 text-xs font-semibold">+{r.xp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        className="flex-shrink-0 w-5 h-5 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white text-xs transition-all"
        onClick={(e) => { e.stopPropagation(); clearTimeout(timerRef.current); startExit(); }}
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useHabits();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.slice(-5).map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
