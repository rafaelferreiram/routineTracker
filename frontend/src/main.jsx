import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { StoreProvider } from './store/useStore.js';
import { AuthProvider, useAuth } from './store/useAuth.js';
import LoginScreen from './components/LoginScreen.jsx';

function AppShell() {
  const { currentUser } = useAuth();
  if (!currentUser) return <LoginScreen />;
  return (
    <StoreProvider username={currentUser.username} defaultTheme={{ ...currentUser.theme, displayName: currentUser.displayName }}>
      <App />
    </StoreProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </StrictMode>
);
