import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { StoreProvider } from './store/useStore.js';
import { AuthProvider, useAuth } from './store/useAuth.js';
import LoginScreen from './components/LoginScreen.jsx';
import LandingPage from './components/LandingPage.jsx';

function AppShell() {
  const { currentUser } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

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
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </StrictMode>
);
