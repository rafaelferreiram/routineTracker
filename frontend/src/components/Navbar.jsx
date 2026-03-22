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
  { id: 'profile',      label: 'Profile',   icon: null },
];

// 4 primary tabs shown in the bottom bar
const MOBILE_PRIMARY = ['today', 'habits', 'stats', 'journal'];
// Secondary tabs shown in the "More" sheet
const MOBILE_MORE    = ['achievements', 'events', 'friends', 'customize', 'profile'];

export default function Navbar({ activeTab, setActiveTab, onExport }) {
  const {
    profile, achievements, currentLevel, completionPercent,
    todayHabits, completedToday, updateProfile, accentColor, settings,
  } = useHabits();
  const { currentUser, logout } = useAuth();

  const appName    = (settings && settings.appName) || 'RoutineQuest';
  const appIcon    = (settings && settings.appIcon) || '⚡';
  const levelColor = getLevelColor(currentLevel);
  const initial    = (currentUser?.displayName || '?')[0].toUpperCase();

  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState(profile.name || 'Rafael');
  const [showMore,    setShowMore]    = useState(false);

  const isMoreActive = MOBILE_MORE.includes(activeTab);

  const handleNameSave = () => {
    if (nameInput.trim()) updateProfile({ name: nameInput.trim() });
    setEditingName(false);
  };

  function navigateTo(id) {
    setActiveTab(id);
    setShowMore(false);
  }

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
            const isActive  = activeTab === item.id;
            const isProfile = item.id === 'profile';
            return (
              <button
                key={item.id}
                data-testid={`desktop-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 text-left w-full ${
                  isActive ? 'text-white' : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/3'
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

        {/* Bottom bar */}
        <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
          <div className="flex items-center justify-between px-1">
            <span className="text-[#4b5563] text-xs">Medals</span>
            <span className="text-white text-xs font-bold">{achievements.length}/{30}</span>
          </div>
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-progress, #1f1f1f)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round((achievements.length / 30) * 100)}%`, background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }}
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
      <nav
        data-testid="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: 'var(--bg-nav, rgba(8,8,8,0.97))',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'var(--bg-border, #1f1f1f)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch px-1" style={{ height: 60 }}>
          {/* Primary tabs */}
          {MOBILE_PRIMARY.map(id => {
            const item     = NAV_ITEMS.find(n => n.id === id);
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                data-testid={`mobile-nav-${id}`}
                onClick={() => navigateTo(id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl mx-0.5 transition-all duration-150 active:scale-90"
                style={isActive ? { background: `${accentColor}18` } : {}}
              >
                <span className={`text-[21px] leading-none transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  {item.icon}
                </span>
                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{ color: isActive ? accentColor : '#4b5563' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          <button
            data-testid="mobile-nav-more"
            onClick={() => setShowMore(s => !s)}
            className="flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl mx-0.5 transition-all duration-150 active:scale-90"
            style={isMoreActive || showMore ? { background: `${accentColor}18` } : {}}
          >
            {isMoreActive ? (
              /* Show current "more-section" icon */
              <span className="text-[21px] leading-none transition-transform duration-200 scale-110">
                {NAV_ITEMS.find(n => n.id === activeTab)?.icon || '⊕'}
              </span>
            ) : (
              <div className="flex gap-[5px] items-center" style={{ height: 21 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-[5px] h-[5px] rounded-full transition-all duration-150"
                    style={{ background: showMore ? accentColor : '#4b5563' }} />
                ))}
              </div>
            )}
            <span
              className="text-[10px] font-semibold leading-none"
              style={{ color: isMoreActive || showMore ? accentColor : '#4b5563' }}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ── More Sheet ───────────────────────────────────────────────────── */}
      {showMore && (
        <div
          className="lg:hidden fixed inset-0 z-[55]"
          onClick={() => setShowMore(false)}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 animate-backdrop-in"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl animate-slide-up"
            style={{
              background: 'var(--bg-card, #111111)',
              borderTop: '1px solid var(--bg-border, #1f1f1f)',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-[#374151]" />
            </div>

            {/* User info strip */}
            <div className="px-5 mb-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: `${accentColor}25`, color: accentColor, border: `1.5px solid ${accentColor}50` }}
              >
                {initial}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{profile.name || currentUser?.displayName}</p>
                <p className="text-[11px] font-medium" style={{ color: levelColor }}>
                  Lv.{currentLevel} · {(profile.totalXP || 0).toLocaleString()} XP
                </p>
              </div>
            </div>

            {/* Grid of tabs */}
            <div className="px-4 grid grid-cols-2 gap-2.5 mb-3">
              {MOBILE_MORE.map(id => {
                const item      = NAV_ITEMS.find(n => n.id === id);
                const isActive  = activeTab === id;
                const isProfile = id === 'profile';
                return (
                  <button
                    key={id}
                    data-testid={`more-nav-${id}`}
                    onClick={() => navigateTo(id)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-150 active:scale-95"
                    style={{
                      background:   isActive ? `${accentColor}18` : 'var(--bg-main, #0a0a0a)',
                      border:       `1px solid ${isActive ? `${accentColor}45` : 'var(--bg-border, #1f1f1f)'}`,
                    }}
                  >
                    <span className="text-xl leading-none">
                      {isProfile ? (
                        <span style={{ color: accentColor }} className="font-bold text-sm">{initial}</span>
                      ) : item.icon}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: isActive ? accentColor : '#e5e7eb' }}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentColor }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sign out */}
            <div className="px-4">
              <button
                data-testid="more-signout-btn"
                onClick={() => { setShowMore(false); logout(); }}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-98"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.18)',
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
