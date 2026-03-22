import { useState } from 'react';
import { useAuth } from '../store/useAuth.js';

export default function LoginScreen() {
  const { login, signup, users } = useAuth();
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
      const result = mode === 'login'
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
  }

  const isGabriela = selectedUser?.username === 'gabriela' ||
    (!selectedUser && username.toLowerCase() === 'gabriela');

  const accentHex = isGabriela ? '#ec4899' : '#22c55e';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#080808' }}>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">⚡</div>
        <h1 className="text-white font-bold text-2xl tracking-tight">RoutineQuest</h1>
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
            <div className="mt-4 text-center">
              <button
                data-testid="new-account-btn"
                onClick={() => { setMode('signup'); setSelectedUser(null); setUsername(''); setPassword(''); }}
                className="text-[#4b5563] hover:text-white text-xs transition-colors underline underline-offset-2"
              >
                + New account
              </button>
            </div>
          </div>
        )}

        {/* Form card */}
        {(selectedUser || mode === 'signup' || knownUsers.length === 0) && (
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
              {selectedUser && (
                <button data-testid="back-btn"
                  onClick={handleBack}
                  className="text-[#4b5563] hover:text-white text-sm transition-colors px-2 py-1">
                  ← Back
                </button>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!selectedUser && (
                <div>
                  <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Username
                  </label>
                  <input
                    data-testid="username-input"
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder="your username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="username"
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
                    {mode === 'login' ? 'Signing in...' : 'Creating...'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
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
      </div>
    </div>
  );
}
