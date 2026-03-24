import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { StoreProvider } from './store/useStore.js';
import { AuthProvider, useAuth } from './store/useAuth.js';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import LandingPage from './components/LandingPage.jsx';
import { api } from './api/client.js';

// ── Email verification banner (shown inside app) ────────────────────────────
function VerifyEmailBanner() {
  const [visible, setVisible] = useState(true);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  if (!visible) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      await api.resendVerification();
      setResent(true);
      setTimeout(() => setVisible(false), 4000);
    } catch (err) {
      alert(err.message || 'Erro ao reenviar. Tente novamente.');
    }
    setResending(false);
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 sm:bottom-4"
      style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#fbbf2440] bg-[#0f0f0f] shadow-xl"
        style={{ background: 'rgba(15,15,15,0.95)' }}>
        <span className="text-xl flex-shrink-0">📧</span>
        <div className="flex-1 min-w-0">
          {resent
            ? <p className="text-[#22c55e] text-sm font-medium">E-mail reenviado! Verifique sua caixa de entrada.</p>
            : <p className="text-[#fbbf24] text-sm">Confirme seu e-mail para garantir o acesso à conta.</p>
          }
        </div>
        {!resent && (
          <button onClick={handleResend} disabled={resending}
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: '#fbbf2415', color: '#fbbf24', border: '1px solid #fbbf2430' }}>
            {resending ? '...' : 'Reenviar'}
          </button>
        )}
        <button onClick={() => setVisible(false)} className="text-[#4b5563] hover:text-white flex-shrink-0 text-lg leading-none">×</button>
      </div>
    </div>
  );
}

// ── Email verification page ────────────────────────────────────────────────────
function VerifyEmailPage({ token, onDone }) {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.verifyEmail(token)
      .then(data => { setStatus('success'); setMessage(data.message || 'E-mail confirmado!'); })
      .catch(err => { setStatus('error'); setMessage(err.message || 'Erro ao verificar e-mail.'); });
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#080808]">
      <div className="w-full max-w-sm text-center">
        <img src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png"
          alt="RoutineTracker" className="w-14 h-14 mx-auto mb-6" />

        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Verificando seu e-mail...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[#22c55e15] border border-[#22c55e30] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-white font-bold text-xl mb-2">E-mail confirmado!</h2>
            <p className="text-[#9ca3af] text-sm mb-6">{message}</p>
            <button onClick={onDone}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-[#22c55e] text-black hover:bg-[#16a34a]"
              data-testid="verification-done-btn">
              Entrar no RoutineTracker →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[#ef444415] border border-[#ef444430] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Falha na verificação</h2>
            <p className="text-[#9ca3af] text-sm mb-6">{message}</p>
            <button onClick={onDone}
              className="w-full py-3 rounded-xl text-sm font-medium border border-[#1f1f1f] text-[#9ca3af] hover:text-white">
              Voltar ao início
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AppShell() {
  const { currentUser, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [showAuth, setShowAuth] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verifyToken, setVerifyToken] = useState(null);
  const hasProcessedOAuth = useRef(false);

  // Handle Google OAuth callback AND email verification token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailToken = params.get('verify_email');
    if (emailToken) {
      window.history.replaceState(null, '', window.location.pathname);
      setVerifyToken(emailToken);
      return;
    }

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
              setShowAuth(true);
            }
          })
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [loginWithGoogle]);

  // Email verification page
  if (verifyToken) {
    return <VerifyEmailPage token={verifyToken} onDone={() => { setVerifyToken(null); setShowAuth(true); }} />;
  }

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
        {/* Email verification banner if not verified */}
        {currentUser.email && currentUser.emailVerified === false && <VerifyEmailBanner />}
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
