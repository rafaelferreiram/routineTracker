import { useState, Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#f87171', fontFamily: 'monospace', background: '#1a1a2e', minHeight: '100vh' }}>
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
import ToastContainer from './components/ToastNotification.jsx';
import ConfettiEffect from './components/ConfettiEffect.jsx';

function AppContent() {
  const [activeTab, setActiveTab] = useState('today');
  const { confetti } = useHabits();

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'habits':
        return <HabitList />;
      case 'stats':
        return <StatsPanel />;
      case 'achievements':
        return <AchievementsPanel />;
      case 'journal':
        return <JournalPanel />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0C0C0C 0%, #141414 50%, #111111 100%)' }}
    >
      {/* Desktop: sidebar + main content */}
      <div className="lg:flex">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main content area */}
        <main className="flex-1 lg:ml-64 xl:ml-72 min-h-screen">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b border-white/5" style={{ background: 'rgba(12,12,12,0.95)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-white font-bold text-lg">RoutineQuest</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-full">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </span>
            </div>
          </div>

          {/* Page content */}
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto lg:max-w-3xl pb-24 lg:pb-8">
            <div key={activeTab} className="animate-fade-in">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Global overlays */}
      <ToastContainer />
      <ConfettiEffect active={confetti} />
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}
