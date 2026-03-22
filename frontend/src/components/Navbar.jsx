import { useState } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { useAuth } from '../store/useAuth.js';
import { getLevelColor } from '../utils/gamification.js';

const NAV_ITEMS = [
  { id: 'today',        label: 'Today',     icon: '🏠' },
  { id: 'habits',       label: 'Habits',    icon: '✅' },
  { id: 'stats',        label: 'Stats',     icon: '📊' },
  { id: 'achievements', label: 'Medals',    icon: '🏅' },
  { id: 'journal',      label: 'Journal',   icon: '📖' },
  { id: 'events',       label: 'Events',    icon: '✈️' },
  { id: 'friends',      label: 'Friends',   icon: '👥' },
  { id: 'customize',    label: 'Customize', icon: '🎨' },
  { id: 'profile',      label: 'Profile',   icon: null }, // icon rendered dynamically
];

export default function Navbar({ activeTab, setActiveTab, onExport }) {
  const { profile, achievements, currentLevel, completionPercent, todayHabits, completedToday, updateProfile, accentColor, settings } = useHabits();
  const { currentUser } = useAuth();
  const appName = (settings && settings.appName) || 'RoutineQuest';
  const appIcon = (settings && settings.appIcon) || '⚡';
  const levelColor = getLevelColor(currentLevel);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name || 'Rafael');

  const handleNameSave = () => {
    if (nameInput.trim()) updateProfile({ name: nameInput.trim() });
    setEditingName(false);
  };

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 min-h-screen fixed left-0 top-0 bottom-0 z-40 p-5 border-r"
        style={{ background: 'var(--bg-sidebar, #0a0a0a)', borderColor: 'var(--bg-border, #1f1f1f)' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: `${accentColor}25`, border: `1px solid ${accentColor}50` }}>
            {appIcon}
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-none tracking-tight">{appName}</h1>
            <p className="text-[#4b5563] text-[10px] mt-0.5">Level up your life</p>
          </div>
        </div>

        {/* Profile */}
        <div
          className="mb-6 p-3.5 rounded-2xl border cursor-pointer transition-all group"
          style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}
          onClick={() => setEditingName(true)}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: `${levelColor}20`, border: `1.5px solid ${levelColor}60`, color: levelColor }}
            >
              {(profile.name || 'R')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <input
                  className="bg-white/10 text-white text-sm font-semibold rounded-lg px-2 py-1 w-full outline-none border border-[#22c55e]/50"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-white font-semibold text-sm truncate">{profile.name || 'Rafael'}</p>
                  <span className="text-[#4b5563] text-xs opacity-0 group-hover:opacity-100 transition-opacity">✏</span>
                </div>
              )}
              <p className="text-xs mt-0.5 font-medium" style={{ color: levelColor }}>
                Lv.{currentLevel} · {(profile.totalXP || 0).toLocaleString()} XP
              </p>
            </div>
          </div>

          {/* Today progress bar */}
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-progress, #1f1f1f)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completionPercent}%`, background: completionPercent === 100 ? accentColor : 'var(--text-subtle, #3f3f3f)' }}
            />
          </div>
          <p className="text-[#4b5563] text-[10px] mt-1.5">
            {completedToday.length}/{todayHabits.length} today
          </p>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            const isProfile = item.id === 'profile';
            const initial = (currentUser?.displayName || '?')[0].toUpperCase();
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 text-left w-full ${
                  isActive
                    ? 'text-white'
                    : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/3'
                }`}
                style={isActive ? { background: 'rgba(255,255,255,0.06)', color: 'white' } : {}}
              >
                {isProfile ? (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: isActive ? `${accentColor}25` : 'rgba(255,255,255,0.08)',
                      border: isActive ? `1.5px solid ${accentColor}60` : '1.5px solid rgba(255,255,255,0.12)',
                      color: isActive ? accentColor : '#6b7280',
                    }}
                  >
                    {initial}
                  </div>
                ) : (
                  <span className="text-base w-5 text-center leading-none">{item.icon}</span>
                )}
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-4 rounded-full" style={{ background: accentColor }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Achievements + Export */}
        <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
          <div className="flex items-center justify-between px-1">
            <span className="text-[#4b5563] text-xs">Medals</span>
            <span className="text-white text-xs font-bold">{achievements.length}/{30}</span>
          </div>
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-progress, #1f1f1f)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round((achievements.length / 30) * 100)}%`,
                background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
              }}
            />
          </div>
          {onExport && (
            <button
              onClick={onExport}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/3 transition-all text-xs"
            >
              <span>⊞</span>
              <span>Backup & Restore</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t safe-area-pb"
        style={{ background: 'var(--bg-nav, rgba(8,8,8,0.95))', backdropFilter: 'blur(20px)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
        <div className="flex items-center justify-around px-1 py-2">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            const isProfile = item.id === 'profile';
            const initial = (currentUser?.displayName || '?')[0].toUpperCase();
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-all duration-150 ${
                  isActive ? 'text-white' : 'text-[#4b5563]'
                }`}
                style={{ minWidth: 36 }}
              >
                {isProfile ? (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-150 ${isActive ? 'scale-110' : ''}`}
                    style={{
                      background: isActive
                        ? `rgba(var(--accent-rgb, 34 197 94) / 0.25)`
                        : 'rgba(255,255,255,0.07)',
                      border: isActive
                        ? `1.5px solid rgba(var(--accent-rgb, 34 197 94) / 0.6)`
                        : '1.5px solid rgba(255,255,255,0.1)',
                      color: isActive ? 'var(--accent, #22c55e)' : '#6b7280',
                    }}
                  >
                    {initial}
                  </div>
                ) : (
                  <span className={`text-[18px] leading-none transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                )}
                <span className={`text-[8px] font-semibold leading-none mt-0.5 ${isActive ? '' : 'text-[#4b5563]'}`}
                  style={isActive ? { color: 'var(--accent, #22c55e)' } : {}}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
