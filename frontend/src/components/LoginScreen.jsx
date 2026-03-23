import { useState } from 'react';
import { useAuth } from '../store/useAuth.js';

export default function LoginScreen({ onBack }) {
  const { login, signup, users, startGoogleLogin } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Note: Google OAuth callback is now handled in main.jsx
  const [mode, setMode]               = useState('login');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const knownUsers = users.slice(0, 6);

  function handleUserTile(user) {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword('');
    setError('');
    setMode('login');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = (mode === 'login' || mode === 'other')
        ? await login(username, password)
        : await signup(username, password);
      if (result.error) setError(result.error);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setSelectedUser(null);
    setUsername('');
    setPassword('');
    setError('');
    setMode('login');
  }

  const isGabriela = selectedUser?.username === 'gabriela' ||
    (!selectedUser && username.toLowerCase() === 'gabriela');

  const accentHex = isGabriela ? '#ec4899' : '#22c55e';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#080808' }}>

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-2 text-[#6b7280] hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-[#111]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>
      )}

      {/* Logo */}
      <div className="mb-8 text-center">
        <img src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png" alt="RoutineTracker" className="w-16 h-16 mx-auto mb-3" />
        <h1 className="text-white font-bold text-2xl tracking-tight">RoutineTracker</h1>
        <p className="text-[#4b5563] text-sm mt-1">Track your habits. Level up your life.</p>
      </div>

      <div className="w-full max-w-sm">

        {/* Known user tiles */}
        {!selectedUser && mode === 'login' && knownUsers.length > 0 && (
          <div className="mb-6">
            <p className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider mb-3 text-center">
              Who&apos;s playing?
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {knownUsers.map(user => {
                const isRosa  = user.username === 'gabriela';
                const accent  = isRosa ? '#ec4899' : (user.theme?.accentColor || '#22c55e');
                const bg      = isRosa ? '#1c1022' : '#111111';
                const border  = isRosa ? '#2e1a35' : '#1f1f1f';
                const initial = user.displayName.charAt(0).toUpperCase();
                return (
                  <button
                    key={user.id || user.username}
                    data-testid={`user-tile-${user.username}`}
                    onClick={() => handleUserTile(user)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95"
                    style={{ background: bg, borderColor: border, minWidth: 90 }}
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl"
                      style={{
                        background: `${accent}25`,
                        color: accent,
                        border: `2px solid ${accent}66`,
                      }}>
                      {initial}
                    </div>
                    <span className="text-white text-sm font-medium capitalize">{user.displayName}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex justify-center gap-4">
              <button
                data-testid="new-account-btn"
                onClick={() => { setMode('signup'); setSelectedUser(null); setUsername(''); setPassword(''); }}
                className="text-[#4b5563] hover:text-white text-xs transition-colors underline underline-offset-2"
              >
                + Nova conta
              </button>
              <button
                data-testid="other-account-btn"
                onClick={() => { setMode('other'); setSelectedUser(null); setUsername(''); setPassword(''); }}
                className="text-[#4b5563] hover:text-white text-xs transition-colors underline underline-offset-2"
              >
                Outra conta
              </button>
            </div>
          </div>
        )}

        {/* Form card */}
        {(selectedUser || mode === 'signup' || mode === 'other' || knownUsers.length === 0) && (
          <div className="rounded-3xl border border-[#1f1f1f] overflow-hidden"
            style={{ background: '#111111' }}>

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-[#1f1f1f]">
              {selectedUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base"
                    style={{ background: `${accentHex}25`, color: accentHex }}>
                    {selectedUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-semibold">{selectedUser.displayName}</span>
                </div>
              ) : mode === 'other' ? (
                <span className="text-white font-semibold">Entrar com outra conta</span>
              ) : (
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0f0f0f' }}>
                  {['login', 'signup'].map(m => (
                    <button key={m}
                      data-testid={`mode-${m}`}
                      onClick={() => { setMode(m); setError(''); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all min-h-[36px]"
                      style={mode === m
                        ? { background: '#1f1f1f', color: '#ffffff' }
                        : { color: '#4b5563' }}>
                      {m === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>
              )}
              {(selectedUser || mode === 'other') && knownUsers.length > 0 && (
                <button data-testid="back-btn"
                  onClick={handleBack}
                  className="text-[#4b5563] hover:text-white text-sm transition-colors px-2 py-1">
                  ← Voltar
                </button>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!selectedUser && (
                <div>
                  <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    {mode === 'signup' ? 'Username' : 'Username ou Email'}
                  </label>
                  <input
                    data-testid="username-input"
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder={mode === 'signup' ? 'your username' : 'username ou email@exemplo.com'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete={mode === 'signup' ? 'username' : 'email'}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-base outline-none placeholder-[#374151] focus:border-[#374151] transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Password
                </label>
                <input
                  data-testid="password-input"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full px-4 py-3.5 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-base outline-none placeholder-[#374151] focus:border-[#374151] transition-colors"
                />
                {mode === 'signup' && (
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs flex items-center gap-1.5 ${password.length >= 6 ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                      <span>{password.length >= 6 ? '✓' : '○'}</span> Mínimo 6 caracteres
                    </p>
                    <p className={`text-xs flex items-center gap-1.5 ${/[a-zA-Z]/.test(password) ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                      <span>{/[a-zA-Z]/.test(password) ? '✓' : '○'}</span> Pelo menos uma letra
                    </p>
                    <p className={`text-xs flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                      <span>{/[0-9]/.test(password) ? '✓' : '○'}</span> Pelo menos um número
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <p data-testid="auth-error"
                  className="text-[#f87171] text-xs bg-[#f871711a] border border-[#f8717133] rounded-xl px-3 py-2.5">
                  {error}
                </p>
              )}

              <button
                data-testid="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ background: accentHex, color: '#000000' }}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {(mode === 'login' || mode === 'other') ? 'Entrando...' : 'Criando...'}
                  </>
                ) : (
                  (mode === 'login' || mode === 'other') ? 'Entrar' : 'Criar Conta'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Sign up link */}
        {!selectedUser && mode === 'login' && knownUsers.length === 0 && (
          <div className="mt-4 text-center">
            <button data-testid="switch-to-signup"
              onClick={() => setMode('signup')}
              className="text-[#4b5563] hover:text-white text-sm transition-colors py-2">
              Don&apos;t have an account? <span className="text-white underline">Sign Up</span>
            </button>
          </div>
        )}

        {/* Cloud sync badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          <span className="text-[#4b5563] text-xs">Cloud-synced · Secure</span>
        </div>

        {/* Google Sign In */}
        <div className="mt-5">
          <div className="relative flex items-center justify-center my-4">
            <div className="flex-grow border-t border-[#1f1f1f]"></div>
            <span className="px-3 text-[#4b5563] text-xs">or</span>
            <div className="flex-grow border-t border-[#1f1f1f]"></div>
          </div>
          
          {googleError && (
            <p data-testid="google-error"
              className="text-[#f87171] text-xs bg-[#f871711a] border border-[#f8717133] rounded-xl px-3 py-2.5 mb-3">
              {googleError}
            </p>
          )}
          
          <button
            data-testid="google-signin-btn"
            onClick={startGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3.5 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3 border border-[#1f1f1f] bg-[#111111] hover:bg-[#1a1a1a] text-white"
          >
            {googleLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando com Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
