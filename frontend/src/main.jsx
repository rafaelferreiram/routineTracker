import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { StoreProvider } from './store/useStore.js';
import { AuthProvider, useAuth } from './store/useAuth.js';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import LandingPage from './components/LandingPage.jsx';

function AppShell() {
  const { currentUser, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [showAuth, setShowAuth] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const hasProcessedOAuth = useRef(false);

  // Handle Google OAuth callback at app level (session_id in URL hash)
  useEffect(() => {
    if (hasProcessedOAuth.current) return;
    
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      hasProcessedOAuth.current = true;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];
      if (sessionId) {
        setGoogleLoading(true);
        window.history.replaceState(null, '', window.location.pathname);
        loginWithGoogle(sessionId)
          .then(result => {
            if (result.error) {
              console.error('Google login error:', result.error);
              setShowAuth(true); // Show login screen to display error
            }
          })
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [loginWithGoogle]);

  // Show loading screen while processing Google OAuth
  if (googleLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808]">
        <img 
          src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png" 
          alt="RoutineTracker" 
          className="w-16 h-16 mb-4 animate-pulse" 
        />
        <p className="text-white text-lg font-medium">{t('common.loading')}</p>
        <span className="mt-4 w-6 h-6 border-2 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
      </div>
    );
  }

  // If user is logged in, show app
  if (currentUser) {
    return (
      <StoreProvider username={currentUser.username} defaultTheme={{ ...currentUser.theme, displayName: currentUser.displayName }}>
        <App />
      </StoreProvider>
    );
  }

  // If user clicked "Get Started", show login/signup
  if (showAuth) {
    return <LoginScreen onBack={() => setShowAuth(false)} />;
  }

  // Otherwise show landing page
  return <LandingPage onGetStarted={() => setShowAuth(true)} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>
);
