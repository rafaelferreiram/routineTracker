import { useAuth } from '../store/useAuth.js';
import { useHabits } from '../hooks/useHabits.js';
import { getLevelColor } from '../utils/gamification.js';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

export default function ProfilePanel() {
  const { currentUser, users, logout } = useAuth();
  const { profile, currentLevel, accentColor } = useHabits();
  const levelColor = getLevelColor(currentLevel);

  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-white font-bold text-xl">Account</h2>
        <p className="text-[#4b5563] text-sm mt-0.5">Manage your profile and switch users</p>
      </div>

      {/* Current user card */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
        <div className="p-5 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{
              background: `rgba(${hexToRgb(levelColor)}, 0.15)`,
              border: `2px solid rgba(${hexToRgb(levelColor)}, 0.5)`,
              color: levelColor,
            }}
          >
            {(profile.name || currentUser?.displayName || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight capitalize">{profile.name || currentUser?.displayName}</p>
            <p className="text-[#4b5563] text-sm">@{currentUser?.username}</p>
            <p className="text-sm font-semibold mt-1" style={{ color: levelColor }}>
              Level {currentLevel} · {(profile.totalXP || 0).toLocaleString()} XP
            </p>
          </div>
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
          />
        </div>
      </div>

      {/* Switch to another user */}
      {otherUsers.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--bg-border, #1f1f1f)' }}>
            <p className="text-white font-semibold text-sm">Switch Account</p>
          </div>
          <div className="p-3 space-y-1">
            {otherUsers.map(user => {
              const isRosa = user.username === 'gabriela';
              const accent = isRosa ? '#ec4899' : user.theme?.accentColor || '#22c55e';
              return (
                <button
                  key={user.id}
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-white/5 active:scale-98 text-left"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: `rgba(${hexToRgb(accent)}, 0.15)`,
                      border: `1.5px solid rgba(${hexToRgb(accent)}, 0.4)`,
                      color: accent,
                    }}
                  >
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium capitalize">{user.displayName}</p>
                    <p className="text-[#4b5563] text-xs">@{user.username}</p>
                  </div>
                  <span className="text-[#4b5563] text-sm">→</span>
                </button>
              );
            })}
            <p className="text-[#374151] text-[10px] px-3 pb-1">
              Switching takes you back to the login screen
            </p>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
        <div className="p-5">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:opacity-80 active:scale-95"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            <span className="text-base">↩</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
