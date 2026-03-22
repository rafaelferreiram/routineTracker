import { useState } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { useAuth } from '../store/useAuth.js';
import { getLevelColor } from '../utils/gamification.js';

const ALL_NAV = [
  { id: 'today',        label: 'Today',     icon: '🏠', section: 'main' },
  { id: 'habits',       label: 'Habits',    icon: '✅', section: 'main' },
  { id: 'stats',        label: 'Stats',     icon: '📊', section: 'main' },
  { id: 'journal',      label: 'Journal',   icon: '📖', section: 'main' },
  { id: 'achievements', label: 'Medals',    icon: '🏅', section: 'more' },
  { id: 'events',       label: 'Events',    icon: '✈️',  section: 'more' },
  { id: 'friends',      label: 'Friends',   icon: '👥', section: 'more' },
  { id: 'customize',    label: 'Customize', icon: '🎨', section: 'more' },
  { id: 'profile',      label: 'Profile',   icon: null,  section: 'more' },
];

const BOTTOM_TABS = ALL_NAV.filter(n => n.section === 'main');

// Avatar component - uses Google photo or initial as fallback
function Avatar({ picture, initial, size = 36, levelColor, accentColor, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const showImage = picture && !imgError;
  
  return (
    <div 
      className={`rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0 ${className}`}
      style={{ 
        width: size, 
        height: size,
        background: showImage ? 'transparent' : `${levelColor || accentColor}22`,
        border: `1.5px solid ${levelColor || accentColor}55`,
        color: levelColor || accentColor
      }}
    >
      {showImage ? (
        <img 
          src={picture} 
          alt="Profile" 
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{initial}</span>
      )}
    </div>
  );
}

export default function Navbar({ activeTab, setActiveTab, onExport }) {
  const {
    profile, achievements, currentLevel,
    completionPercent, todayHabits, completedToday,
    updateProfile, accentColor, settings,
  } = useHabits();
  const { currentUser, logout } = useAuth();

  const levelColor = getLevelColor(currentLevel);
  const initial    = (profile?.name || currentUser?.displayName || '?')[0].toUpperCase();
  const picture    = currentUser?.picture || '';
  const appName    = settings?.appName || 'RoutineQuest';
  const appIcon    = settings?.appIcon || '⚡';

  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState(profile?.name || '');
  const [showMenu,    setShowMenu]    = useState(false);

  const handleNameSave = () => {
    if (nameInput.trim()) updateProfile({ name: nameInput.trim() });
    setEditingName(false);
  };

  function go(id) { setActiveTab(id); setShowMenu(false); }

  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR (lg+)
      ════════════════════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex flex-col w-60 xl:w-64 min-h-screen fixed left-0 top-0 bottom-0 z-40 p-5 border-r"
        style={{ background: 'var(--bg-sidebar, #0a0a0a)', borderColor: 'var(--bg-border, #1f1f1f)' }}
      >
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

        {/* Profile card */}
        <div
          className="mb-6 p-3.5 rounded-2xl border cursor-pointer transition-all group"
          style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}
          onClick={() => setEditingName(true)}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar picture={picture} initial={initial} size={36} levelColor={levelColor} accentColor={accentColor} />
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
                  <p className="text-white font-semibold text-sm truncate">{profile?.name || 'User'}</p>
                  <span className="text-[#4b5563] text-xs opacity-0 group-hover:opacity-100 transition-opacity">✏</span>
                </div>
              )}
              <p className="text-xs mt-0.5 font-medium" style={{ color: levelColor }}>
                Lv.{currentLevel} · {(profile?.totalXP || 0).toLocaleString()} XP
              </p>
            </div>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1f1f1f' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completionPercent}%`, background: completionPercent === 100 ? accentColor : '#3f3f3f' }} />
          </div>
          <p className="text-[#4b5563] text-[10px] mt-1.5">
            {completedToday.length}/{todayHabits.length} today
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {ALL_NAV.map(item => {
            const isActive  = activeTab === item.id;
            const isProfile = item.id === 'profile';
            return (
              <button key={item.id}
                data-testid={`desktop-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 text-left w-full ${
                  isActive ? 'text-white' : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.03]'
                }`}
                style={isActive ? { background: 'rgba(255,255,255,0.06)' } : {}}
              >
                {isProfile ? (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: isActive ? `${accentColor}25` : 'rgba(255,255,255,0.08)', border: `1.5px solid ${isActive ? `${accentColor}60` : 'rgba(255,255,255,0.12)'}`, color: isActive ? accentColor : '#6b7280' }}>
                    {initial}
                  </div>
                ) : (
                  <span className="text-base w-5 text-center leading-none">{item.icon}</span>
                )}
                <span className="font-medium">{item.label}</span>
                {isActive && <div className="ml-auto w-1 h-4 rounded-full" style={{ background: accentColor }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[#4b5563] text-xs">Medals</span>
            <span className="text-white text-xs font-bold">{achievements.length}/30</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1f1f1f' }}>
            <div className="h-full rounded-full"
              style={{ width: `${Math.round((achievements.length / 30) * 100)}%`, background: 'linear-gradient(90deg,#7C3AED,#A78BFA)' }} />
          </div>
          {onExport && (
            <button onClick={onExport}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.03] transition-all text-xs">
              <span>⊞</span><span>Backup & Restore</span>
            </button>
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════
          MOBILE HEADER (fixed top, < lg)
      ════════════════════════════════════════════════════════════ */}
      <header
        data-testid="mobile-header"
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b"
        style={{
          height: 58,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 'env(safe-area-inset-top)',
          background: 'rgba(8,8,8,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--bg-border, #1f1f1f)',
        }}
      >
        {/* Left: avatar + name + level */}
        <button data-testid="mobile-header-profile-btn"
          onClick={() => go('profile')}
          className="flex items-center gap-2.5 active:opacity-60 transition-opacity min-w-0"
        >
          <Avatar picture={picture} initial={initial} size={36} levelColor={levelColor} accentColor={accentColor} />
          <div className="text-left min-w-0">
            <p className="text-white font-semibold text-sm leading-none truncate">{profile?.name || 'User'}</p>
            <p className="text-[10px] font-medium mt-0.5 leading-none" style={{ color: levelColor }}>
              Lv.{currentLevel} · {(profile?.totalXP || 0).toLocaleString()} XP
            </p>
          </div>
        </button>

        {/* Right: section label + hamburger */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-[11px] text-[#6b7280] font-medium px-2.5 py-1 rounded-full"
            style={{ background: 'var(--bg-card, #111111)', border: '1px solid var(--bg-border, #1f1f1f)' }}>
            {activeTab === 'achievements' ? 'Medals'
              : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </span>

          {/* Hamburger button */}
          <button data-testid="hamburger-btn"
            onClick={() => setShowMenu(true)}
            className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-xl active:scale-90 transition-all"
            style={{ background: 'var(--bg-card, #111111)', border: '1px solid var(--bg-border, #1f1f1f)' }}
          >
            <span className="block w-[18px] h-[2px] rounded-full bg-white/75" />
            <span className="block w-[18px] h-[2px] rounded-full bg-white/75" />
            <span className="block w-[12px] h-[2px] rounded-full bg-white/50 self-start ml-[3px]" />
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
          MOBILE BOTTOM TAB BAR — 4 tabs, clean & spacious
      ════════════════════════════════════════════════════════════ */}
      <nav data-testid="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{
          background: 'rgba(8,8,8,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'var(--bg-border, #1f1f1f)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch" style={{ height: 66 }}>
          {BOTTOM_TABS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id}
                data-testid={`mobile-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-150 active:scale-90 relative"
              >
                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                    style={{ background: accentColor }} />
                )}
                <span className={`text-[26px] leading-none transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100 opacity-50'}`}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-semibold leading-none"
                  style={{ color: isActive ? accentColor : '#374151' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════
          HAMBURGER DRAWER (full-screen overlay from right)
      ════════════════════════════════════════════════════════════ */}
      {showMenu && (
        <div className="lg:hidden fixed inset-0 z-[60]" onClick={() => setShowMenu(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 animate-backdrop-in"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />

          {/* Drawer panel — slides in from right */}
          <div className="absolute top-0 right-0 bottom-0 flex flex-col animate-slide-in-right"
            style={{
              width: 'min(300px, 82vw)',
              background: 'var(--bg-card, #111111)',
              borderLeft: '1px solid var(--bg-border, #1f1f1f)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 border-b flex-shrink-0"
              style={{ height: 66, borderColor: 'var(--bg-border, #1f1f1f)', paddingTop: 'env(safe-area-inset-top)' }}>
              <div className="flex items-center gap-3">
                <Avatar picture={picture} initial={initial} size={40} levelColor={levelColor} accentColor={accentColor} />
                <div>
                  <p className="text-white font-semibold text-sm leading-none">{profile?.name || 'User'}</p>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: levelColor }}>
                    Lv.{currentLevel} · {(profile?.totalXP || 0).toLocaleString()} XP
                  </p>
                </div>
              </div>
              {/* Close X */}
              <button onClick={() => setShowMenu(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#6b7280] active:scale-90 transition-all"
                style={{ background: 'var(--bg-main, #0a0a0a)', border: '1px solid var(--bg-border, #1f1f1f)' }}>
                <span className="text-base leading-none">✕</span>
              </button>
            </div>

            {/* Scrollable nav list */}
            <div className="flex-1 overflow-y-auto py-2">
              {/* Main section */}
              <p className="text-[10px] font-bold uppercase tracking-wider px-5 pt-3 pb-1.5 text-[#374151]">Main</p>
              {ALL_NAV.filter(n => n.section === 'main').map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id}
                    data-testid={`menu-nav-${item.id}`}
                    onClick={() => go(item.id)}
                    className="w-full flex items-center gap-3.5 px-4 py-3 transition-all active:opacity-60"
                    style={isActive ? { background: `${accentColor}10` } : {}}
                  >
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: isActive ? `${accentColor}18` : 'var(--bg-main,#0a0a0a)', border: `1px solid ${isActive ? `${accentColor}40` : 'var(--bg-border,#1f1f1f)'}` }}>
                      {item.icon}
                    </div>
                    <span className="font-semibold text-[15px] flex-1 text-left"
                      style={{ color: isActive ? accentColor : '#e5e7eb' }}>
                      {item.label}
                    </span>
                    {isActive && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />}
                  </button>
                );
              })}

              {/* More section */}
              <p className="text-[10px] font-bold uppercase tracking-wider px-5 pt-4 pb-1.5 text-[#374151]">More</p>
              {ALL_NAV.filter(n => n.section === 'more').map(item => {
                const isActive  = activeTab === item.id;
                const isProfile = item.id === 'profile';
                return (
                  <button key={item.id}
                    data-testid={`menu-nav-${item.id}`}
                    onClick={() => go(item.id)}
                    className="w-full flex items-center gap-3.5 px-4 py-3 transition-all active:opacity-60"
                    style={isActive ? { background: `${accentColor}10` } : {}}
                  >
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: isActive ? `${accentColor}18` : 'var(--bg-main,#0a0a0a)', border: `1px solid ${isActive ? `${accentColor}40` : 'var(--bg-border,#1f1f1f)'}` }}>
                      {isProfile
                        ? <span className="text-sm font-bold" style={{ color: accentColor }}>{initial}</span>
                        : item.icon}
                    </div>
                    <span className="font-semibold text-[15px] flex-1 text-left"
                      style={{ color: isActive ? accentColor : '#e5e7eb' }}>
                      {item.label}
                    </span>
                    {isActive && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />}
                  </button>
                );
              })}

              {/* Backup */}
              {onExport && (
                <>
                  <div className="mx-5 my-3 border-t" style={{ borderColor: 'var(--bg-border,#1f1f1f)' }} />
                  <button onClick={() => { setShowMenu(false); onExport(); }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 text-[#6b7280] transition-all active:opacity-60">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                      style={{ background: 'var(--bg-main,#0a0a0a)', border: '1px solid var(--bg-border,#1f1f1f)' }}>
                      ⊞
                    </div>
                    <span className="font-semibold text-[15px]">Backup & Restore</span>
                  </button>
                </>
              )}
            </div>

            {/* Sign out footer */}
            <div className="flex-shrink-0 p-4 border-t"
              style={{ borderColor: 'var(--bg-border,#1f1f1f)', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              <button data-testid="menu-signout-btn"
                onClick={() => { setShowMenu(false); logout(); }}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
