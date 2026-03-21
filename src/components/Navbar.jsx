import { useState } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getLevelColor } from '../utils/gamification.js';

const NAV_ITEMS = [
  { id: 'today', label: 'Today', icon: '🏠', activeIcon: '🏠' },
  { id: 'habits', label: 'Habits', icon: '✅', activeIcon: '✅' },
  { id: 'stats', label: 'Stats', icon: '📊', activeIcon: '📊' },
  { id: 'achievements', label: 'Medals', icon: '🏅', activeIcon: '🏅' },
  { id: 'journal', label: 'Journal', icon: '📖', activeIcon: '📖' },
];

export default function Navbar({ activeTab, setActiveTab }) {
  const { profile, achievements, currentLevel, completionPercent, todayHabits, completedToday } = useHabits();
  const levelColor = getLevelColor(currentLevel);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name || 'Alex');
  const { updateProfile } = useHabits();

  const handleNameSave = () => {
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() });
    }
    setEditingName(false);
  };

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 min-h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 fixed left-0 top-0 bottom-0 z-40 p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-lighter flex items-center justify-center text-xl shadow-lg shadow-primary/30">
            🔥
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">RoutineQuest</h1>
            <p className="text-slate-400 text-xs">Level up your life</p>
          </div>
        </div>

        {/* Profile */}
        <div
          className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all group"
          onClick={() => setEditingName(true)}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${levelColor}33, ${levelColor}11)`, border: `2px solid ${levelColor}`, boxShadow: `0 0 12px ${levelColor}40` }}
            >
              {(profile.name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <input
                  className="bg-white/10 text-white text-sm font-semibold rounded-lg px-2 py-1 w-full outline-none border border-primary/50 focus:border-primary"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-white font-semibold text-sm truncate">{profile.name || 'Alex'}</p>
                  <span className="text-slate-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                </div>
              )}
              <p className="text-slate-400 text-xs truncate" style={{ color: levelColor }}>
                Lv.{currentLevel} · {profile.totalXP || 0} XP
              </p>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completionPercent}%`, background: levelColor }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {completedToday.length}/{todayHabits.length} today
          </p>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 text-left w-full ${
                  isActive
                    ? 'bg-primary/20 text-white border border-primary/40 shadow-lg shadow-primary/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <span className="text-xl">{isActive ? item.activeIcon : item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Achievements count */}
        <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
          <p className="text-slate-400 text-xs">Achievements</p>
          <p className="text-white font-bold text-xl">
            {achievements.length} <span className="text-slate-500 font-normal text-sm">/ 10</span>
          </p>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-card/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[60px] ${
                  isActive ? 'text-white' : 'text-slate-500'
                }`}
              >
                <span
                  className={`text-2xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                  style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.8))' } : {}}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[10px] font-semibold transition-all ${
                    isActive ? 'text-primary-lighter' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" style={{ position: 'static', marginTop: '2px' }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
