import { useState, useEffect, Component } from 'react';
import { useAuth } from './store/useAuth.js';
import { getTheme, applyTheme } from './utils/themes.js';

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
import ProfilePanel from './components/ProfilePanel.jsx';
import FriendsPanel from './components/FriendsPanel.jsx';
import OnboardingCarousel from './components/OnboardingCarousel.jsx';

const ONBOARDING_KEY = 'routinetracker_onboarding_complete';

function AppContent() {
  const [activeTab, setActiveTab] = useState('today');
  const [showExport, setShowExport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { confetti, levelUpPending, clearLevelUp, accentColor, settings } = useHabits();
  const { currentUser } = useAuth();

  // Check if onboarding should be shown (first time user)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  // Apply full theme (colors + accent) whenever either changes
  useEffect(() => {
    const themeId = (settings && settings.theme) || 'dark';
    const theme = getTheme(themeId);
    applyTheme(theme, accentColor);
  }, [settings, accentColor]);

  const renderContent = () => {
    switch (activeTab) {
      case 'today':         return <Dashboard setActiveTab={setActiveTab} />;
      case 'habits':        return <HabitList />;
      case 'stats':         return <StatsPanel />;
      case 'achievements':  return <AchievementsPanel />;
      case 'journal':       return <JournalPanel />;
      case 'events':        return <EventsPanel />;
      case 'customize':     return <CustomizePanel setActiveTab={setActiveTab} onExport={() => setShowExport(true)} />;
      case 'friends':       return <FriendsPanel />;
      case 'profile':       return <ProfilePanel />;
      default:              return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-app">
      {/* Onboarding Carousel for first-time users */}
      {showOnboarding && (
        <OnboardingCarousel onComplete={handleOnboardingComplete} />
      )}

      <div className="lg:flex">
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onExport={() => setShowExport(true)}
          onShowOnboarding={handleShowOnboarding}
        />

        <main className="flex-1 lg:ml-60 xl:ml-64 min-h-screen">
          {/* Mobile header is now rendered inside Navbar — just add top padding */}
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto lg:max-w-3xl pt-[74px] lg:pt-6 pb-28 lg:pb-8">
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
