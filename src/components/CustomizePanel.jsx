import { useState } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { useAuth } from '../store/useAuth.js';

const ACCENT_PRESETS = [
  { label: 'Green',   value: '#22c55e' },
  { label: 'Blue',    value: '#3b82f6' },
  { label: 'Purple',  value: '#8b5cf6' },
  { label: 'Orange',  value: '#f97316' },
  { label: 'Red',     value: '#ef4444' },
  { label: 'Cyan',    value: '#06b6d4' },
  { label: 'Pink',    value: '#ec4899' },
  { label: 'Yellow',  value: '#eab308' },
  { label: 'Indigo',  value: '#6366f1' },
  { label: 'White',   value: '#e5e7eb' },
];

const APP_ICONS = ['⚡','🔥','💎','🚀','🎯','⭐','🌟','💪','🧠','🏆','🌱','⚔️'];

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: '#0d0d0d', borderColor: '#1a1a1a' }}>
      <div className="px-5 py-3.5 border-b" style={{ borderColor: '#1a1a1a' }}>
        <p className="text-white font-semibold text-sm">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wide block mb-2">{label}</label>
      {children}
      {hint && <p className="text-[#4b5563] text-xs mt-1.5">{hint}</p>}
    </div>
  );
}

export default function CustomizePanel({ onExport }) {
  const { profile, settings, accentColor, updateSettings, updateProfile, habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const { currentUser, logout } = useAuth();

  const appName = settings.appName || 'RoutineQuest';
  const appIcon = settings.appIcon || '⚡';

  const [nameInput, setNameInput] = useState(profile.name || 'Rafael');
  const [appNameInput, setAppNameInput] = useState(appName);
  const [customHex, setCustomHex] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [savedFlash, setSavedFlash] = useState('');

  const flash = (key) => {
    setSavedFlash(key);
    setTimeout(() => setSavedFlash(''), 1500);
  };

  const handleAccent = (color) => {
    updateSettings({ accentColor: color });
    // Also update CSS variable immediately
    document.documentElement.style.setProperty('--accent', color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty('--accent-rgb', `${r} ${g} ${b}`);
  };

  const handleCustomHex = () => {
    const hex = customHex.startsWith('#') ? customHex : `#${customHex}`;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      handleAccent(hex);
      setCustomHex('');
    }
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() });
      flash('name');
    }
  };

  const handleSaveAppName = () => {
    if (appNameInput.trim()) {
      updateSettings({ appName: appNameInput.trim() });
      flash('appName');
    }
  };

  const handleReset = () => {
    if (resetConfirm) {
      localStorage.removeItem('routineTracker_v3');
      window.location.reload();
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white font-bold text-2xl">Customize</h2>
        <p className="text-[#6b7280] text-sm mt-1">Make RoutineQuest yours</p>
      </div>

      {/* ── Appearance ── */}
      <Section title="🎨  Appearance">
        <Field label="Accent Color" hint="Used across charts, buttons, progress bars and indicators.">
          <div className="flex flex-wrap gap-2.5 mb-3">
            {ACCENT_PRESETS.map(preset => {
              const isActive = accentColor === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => handleAccent(preset.value)}
                  title={preset.label}
                  className="w-8 h-8 rounded-full transition-all hover:scale-110 relative flex items-center justify-center"
                  style={{
                    background: preset.value,
                    boxShadow: isActive ? `0 0 0 2px #0d0d0d, 0 0 0 3.5px ${preset.value}` : 'none',
                    transform: isActive ? 'scale(1.2)' : undefined,
                  }}
                >
                  {isActive && (
                    <span className="text-[10px] font-bold" style={{ color: '#080808', mixBlendMode: 'multiply', filter: 'invert(1)' }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Custom hex input */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 flex-1 bg-[#111111] border border-[#1f1f1f] rounded-xl px-3 py-2 focus-within:border-[#2a2a2a]">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 border border-white/10"
                style={{ background: customHex && /^#?[0-9a-fA-F]{6}$/.test(customHex.replace('#','')) ? (customHex.startsWith('#') ? customHex : `#${customHex}`) : accentColor }}
              />
              <input
                value={customHex}
                onChange={e => setCustomHex(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomHex()}
                placeholder="Custom hex e.g. #ff6b35"
                maxLength={7}
                className="flex-1 bg-transparent text-white placeholder-[#4b5563] text-sm outline-none"
              />
            </div>
            <button
              onClick={handleCustomHex}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor }}
            >
              Apply
            </button>
          </div>
          {/* Live preview bar */}
          <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-[#1a1a1a]">
            <div className="h-full rounded-full w-3/4 transition-all duration-300" style={{ background: accentColor }} />
          </div>
        </Field>
      </Section>

      {/* ── Branding ── */}
      <Section title="✏️  Branding">
        <Field label="App Name">
          <div className="flex gap-2">
            <input
              value={appNameInput}
              onChange={e => setAppNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveAppName()}
              maxLength={24}
              className="flex-1 bg-[#111111] text-white placeholder-[#4b5563] rounded-xl px-3 py-2.5 outline-none border border-[#1f1f1f] focus:border-[#2a2a2a] text-sm"
            />
            <button
              onClick={handleSaveAppName}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor }}
            >
              {savedFlash === 'appName' ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </Field>

        <Field label="App Icon">
          <div className="relative">
            <button
              onClick={() => setShowIconPicker(v => !v)}
              className="w-12 h-12 rounded-xl border text-2xl flex items-center justify-center transition-all"
              style={{ background: `${accentColor}15`, borderColor: `${accentColor}40` }}
            >
              {appIcon}
            </button>
            {showIconPicker && (
              <div
                className="absolute top-14 left-0 z-20 p-3 rounded-2xl border shadow-2xl"
                style={{ background: '#111111', borderColor: '#1f1f1f', width: 220 }}
              >
                <div className="grid grid-cols-6 gap-1.5">
                  {APP_ICONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => { updateSettings({ appIcon: ic }); setShowIconPicker(false); }}
                      className={`text-xl w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all ${appIcon === ic ? 'bg-white/10' : ''}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Field>
      </Section>

      {/* ── Profile ── */}
      <Section title="👤  Profile">
        <Field label="Your Name">
          <div className="flex gap-2">
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              maxLength={32}
              className="flex-1 bg-[#111111] text-white placeholder-[#4b5563] rounded-xl px-3 py-2.5 outline-none border border-[#1f1f1f] focus:border-[#2a2a2a] text-sm"
            />
            <button
              onClick={handleSaveName}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor }}
            >
              {savedFlash === 'name' ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </Field>
        <Field label="Joined">
          <p className="text-[#6b7280] text-sm">
            {profile.joinDate
              ? new Date(profile.joinDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : '—'}
          </p>
        </Field>
      </Section>

      {/* ── Data ── */}
      <Section title="💾  Data">
        <div className="flex flex-col gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left"
              style={{ background: '#111111', borderColor: '#1f1f1f', color: '#9ca3af' }}
            >
              <span className="text-lg">📦</span>
              <div>
                <p className="text-white font-semibold text-sm">Backup & Restore</p>
                <p className="text-[#4b5563] text-xs">Export or import your data as JSON</p>
              </div>
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left"
            style={{
              background: resetConfirm ? 'rgba(239,68,68,0.1)' : '#111111',
              borderColor: resetConfirm ? 'rgba(239,68,68,0.4)' : '#1f1f1f',
            }}
          >
            <span className="text-lg">{resetConfirm ? '⚠️' : '🗑️'}</span>
            <div>
              <p className={`font-semibold text-sm ${resetConfirm ? 'text-red-400' : 'text-white'}`}>
                {resetConfirm ? 'Tap again to confirm — all data will be lost!' : 'Reset All Data'}
              </p>
              <p className="text-[#4b5563] text-xs">Clear habits, completions, XP and achievements</p>
            </div>
          </button>
        </div>
      </Section>

      {/* Account */}
      <Section title="Account">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: `rgba(var(--accent-rgb, 34 197 94) / 0.15)`, color: 'var(--accent, #22c55e)', border: '1.5px solid rgba(var(--accent-rgb, 34 197 94) / 0.35)' }}>
              {currentUser?.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-white text-sm font-medium capitalize">{currentUser?.displayName}</p>
              <p className="text-[#4b5563] text-xs">@{currentUser?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
            style={{ background: '#111111', borderColor: '#1f1f1f', color: '#6b7280' }}
          >
            Sign Out
          </button>
        </div>
      </Section>
    </div>
  );
}
