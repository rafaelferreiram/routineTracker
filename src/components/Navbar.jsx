import { useState } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getLevelColor } from '../utils/gamification.js';

const NAV_ITEMS = [
  { id: 'today',        label: 'Today',    icon: '⊙' },
  { id: 'habits',       label: 'Habits',   icon: '◈' },
  { id: 'stats',        label: 'Stats',    icon: '▦' },
  { id: 'achievements', label: 'Medals',   icon: '◉' },
  { id: 'journal',      label: 'Journal',  icon: '◧' },
];

export default function Navbar({ activeTab, setActiveTab, onExport }) {
  const { profile, achievements, currentLevel, completionPercent, todayHabits, completedToday, updateProfile } = useHabits();
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
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 min-h-screen border-r border-[#1f1f1f] fixed left-0 top-0 bottom-0 z-40 p-5"
        style={{ background: '#0a0a0a' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            ⚡
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-none tracking-tight">RoutineQuest</h1>
            <p className="text-[#4b5563] text-[10px] mt-0.5">Level up your life</p>
          </div>
        </div>

        {/* Profile */}
        <div
          className="mb-6 p-3.5 rounded-2xl border border-[#1f1f1f] cursor-pointer hover:border-[#2a2a2a] transition-all group"
          style={{ background: '#111111' }}
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
          <div className="h-1 bg-[#1f1f1f] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completionPercent}%`, background: completionPercent === 100 ? '#22c55e' : '#3f3f3f' }}
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
                <span className="text-base w-5 text-center leading-none">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-4 rounded-full" style={{ background: '#22c55e' }} />
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
          <div className="mt-2 h-1 bg-[#1f1f1f] rounded-full overflow-hidden">
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#1f1f1f] safe-area-pb"
        style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-around px-1 py-2.5">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-150 min-w-[52px] ${
                  isActive ? 'text-white' : 'text-[#4b5563]'
                }`}
              >
                <span className={`text-xl transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[9px] font-semibold ${isActive ? 'text-[#22c55e]' : 'text-[#4b5563]'}`}>
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
