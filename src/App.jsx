import { useState, useEffect, Component } from 'react';
import { useAuth } from './store/useAuth.js';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#f87171', fontFamily: 'monospace', background: '#080808', minHeight: '100vh' }}>
          <h2 style={{ color: '#ef4444' }}>⚠️ Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 13 }}>
            {this.state.error.toString()}{'\n\n'}{this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import { useHabits } from './hooks/useHabits.js';
import Navbar from './components/Navbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import HabitList from './components/HabitList.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import AchievementsPanel from './components/AchievementsPanel.jsx';
import JournalPanel from './components/JournalPanel.jsx';
import EventsPanel from './components/EventsPanel.jsx';
import ToastContainer from './components/ToastNotification.jsx';
import ConfettiEffect from './components/ConfettiEffect.jsx';
import LevelUpCeremony from './components/LevelUpCeremony.jsx';
import ExportImport from './components/ExportImport.jsx';
import CustomizePanel from './components/CustomizePanel.jsx';

function AppContent() {
  const [activeTab, setActiveTab] = useState('today');
  const [showExport, setShowExport] = useState(false);
  const { confetti, levelUpPending, clearLevelUp, accentColor, settings } = useHabits();
  const { currentUser, logout } = useAuth();

  // Inject accent color as CSS variable whenever it changes
  useEffect(() => {
    const hex = accentColor || '#22c55e';
    document.documentElement.style.setProperty('--accent', hex);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    document.documentElement.style.setProperty('--accent-rgb', `${r} ${g} ${b}`);
  }, [accentColor]);

  // Inject background color CSS variables whenever settings.bgColor changes
  useEffect(() => {
    const bg = (settings && settings.bgColor) || (currentUser && currentUser.theme && currentUser.theme.bgColor) || '#080808';
    document.documentElement.style.setProperty('--bg-main', bg);
    document.body.style.background = bg;
    // Derive card/border from bg by lightening slightly
    const card = currentUser?.theme?.bgCard || '#111111';
    const border = currentUser?.theme?.bgBorder || '#1f1f1f';
    document.documentElement.style.setProperty('--bg-card', card);
    document.documentElement.style.setProperty('--bg-border', border);
  }, [settings, currentUser]);

  const renderContent = () => {
    switch (activeTab) {
      case 'today':         return <Dashboard setActiveTab={setActiveTab} />;
      case 'habits':        return <HabitList />;
      case 'stats':         return <StatsPanel />;
      case 'achievements':  return <AchievementsPanel />;
      case 'journal':       return <JournalPanel />;
      case 'events':        return <EventsPanel />;
      case 'customize':     return <CustomizePanel setActiveTab={setActiveTab} onExport={() => setShowExport(true)} />;
      default:              return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="lg:flex">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onExport={() => setShowExport(true)} />

        <main className="flex-1 lg:ml-60 xl:ml-64 min-h-screen">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="text-white font-bold text-base tracking-tight">RoutineQuest</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExport(true)}
                className="text-[#4b5563] hover:text-white text-xs transition-colors p-1.5"
                title="Backup & Restore"
              >
                ⊞
              </button>
              <span className="text-xs text-[#4b5563] px-2 py-1 rounded-full border"
                style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </span>
              {/* User avatar + logout */}
              <button
                onClick={logout}
                title={`Sign out (${currentUser?.displayName})`}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 active:scale-90"
                style={{ background: `rgba(${hexToRgb(accentColor || '#22c55e')}, 0.2)`, color: accentColor || '#22c55e', border: `1.5px solid rgba(${hexToRgb(accentColor || '#22c55e')}, 0.4)` }}
              >
                {currentUser?.displayName?.charAt(0).toUpperCase() || '?'}
              </button>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto lg:max-w-3xl pb-28 lg:pb-8">
            <div key={activeTab} className="animate-fade-in">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Global overlays */}
      <ToastContainer />
      <ConfettiEffect active={confetti} />
      {levelUpPending && (
        <LevelUpCeremony
          oldLevel={levelUpPending.oldLevel}
          newLevel={levelUpPending.newLevel}
          onClose={clearLevelUp}
        />
      )}
      {showExport && <ExportImport onClose={() => setShowExport(false)} />}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}
