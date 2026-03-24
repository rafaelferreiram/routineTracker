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

// ── Reset password page ────────────────────────────────────────────────────────
function ResetPasswordPage({ token, onDone }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('form'); // form | loading | success | error
  const [message, setMessage] = useState('');

  async function handleReset(e) {
    e.preventDefault();
    if (newPassword.length < 6) { setMessage('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setMessage('As senhas não coincidem.'); return; }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.detail || 'Erro ao redefinir senha.'); }
      else { setStatus('success'); setMessage(data.message || 'Senha redefinida!'); }
    } catch {
      setStatus('error'); setMessage('Erro de conexão.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#080808]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png"
            alt="RoutineTracker" className="w-14 h-14 mx-auto mb-4" />
        </div>

        {status === 'loading' && (
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Redefinindo senha...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#22c55e15] border border-[#22c55e30] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Senha redefinida!</h2>
            <p className="text-[#9ca3af] text-sm mb-6">{message}</p>
            <button onClick={onDone}
              data-testid="reset-done-btn"
              className="w-full py-3 rounded-xl text-sm font-semibold bg-[#22c55e] text-black hover:bg-[#16a34a]">
              Fazer login →
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#ef444415] border border-[#ef444430] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Erro</h2>
            <p className="text-[#9ca3af] text-sm mb-6">{message}</p>
            <button onClick={onDone}
              className="w-full py-3 rounded-xl text-sm font-medium border border-[#1f1f1f] text-[#9ca3af] hover:text-white">
              Voltar ao login
            </button>
          </div>
        )}

        {status === 'form' && (
          <>
            <h2 className="text-white font-bold text-2xl text-center mb-2">Nova senha</h2>
            <p className="text-[#4b5563] text-sm text-center mb-6">Escolha uma nova senha para sua conta</p>

            <div className="rounded-3xl border border-[#1f1f1f] overflow-hidden" style={{ background: '#111111' }}>
              <form onSubmit={handleReset} className="p-6 space-y-4">
                <div>
                  <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">Nova senha</label>
                  <input
                    data-testid="reset-new-password"
                    type="password"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setMessage(''); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3.5 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-base outline-none placeholder-[#374151] focus:border-[#374151] transition-colors"
                  />
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                      <span>{newPassword.length >= 6 ? '✓' : '○'}</span> Mínimo 6 caracteres
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">Confirmar senha</label>
                  <input
                    data-testid="reset-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setMessage(''); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3.5 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-base outline-none placeholder-[#374151] focus:border-[#374151] transition-colors"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-[#f87171] mt-1">As senhas não coincidem</p>
                  )}
                </div>

                {message && (
                  <p data-testid="reset-error" className="text-[#f87171] text-xs bg-[#f871711a] border border-[#f8717133] rounded-xl px-3 py-2.5">
                    {message}
                  </p>
                )}

                <button
                  data-testid="reset-submit-btn"
                  type="submit"
                  disabled={newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full py-4 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 bg-[#f59e0b] text-black"
                >
                  Redefinir senha
                </button>
              </form>
            </div>
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
  const [resetToken, setResetToken]   = useState(null);
  const hasProcessedOAuth = useRef(false);

  // Handle Google OAuth callback, email verification token, AND reset password token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailToken = params.get('verify_email');
    if (emailToken) {
      window.history.replaceState(null, '', window.location.pathname);
      setVerifyToken(emailToken);
      return;
    }
    const resetPwToken = params.get('reset_password');
    if (resetPwToken) {
      window.history.replaceState(null, '', window.location.pathname);
      setResetToken(resetPwToken);
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

  // Reset password page
  if (resetToken) {
    return <ResetPasswordPage token={resetToken} onDone={() => { setResetToken(null); setShowAuth(true); }} />;
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
