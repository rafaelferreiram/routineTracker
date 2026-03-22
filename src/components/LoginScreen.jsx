import { useState } from 'react';
import { useAuth } from '../store/useAuth.js';

export default function LoginScreen() {
  const { login, signup, users } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const knownUsers = users.slice(0, 6); // show up to 6 user tiles

  function handleUserTile(user) {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword('');
    setError('');
    setMode('login');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'login') {
      const result = login(username, password);
      if (result.error) setError(result.error);
    } else {
      const result = signup(username, password);
      if (result.error) setError(result.error);
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
  const bgTileHex = isGabriela ? '#1c1022' : '#111111';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#080808' }}>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-4xl mb-3">⚡</div>
        <h1 className="text-white font-bold text-2xl tracking-tight">RoutineQuest</h1>
        <p className="text-[#4b5563] text-sm mt-1">Track your habits. Level up your life.</p>
      </div>

      <div className="w-full max-w-sm">

        {/* User tiles (shown when no user selected and mode=login) */}
        {!selectedUser && mode === 'login' && knownUsers.length > 0 && (
          <div className="mb-6">
            <p className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider mb-3 text-center">
              Who's playing?
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {knownUsers.map(user => {
                const isRosa = user.username === 'gabriela';
                const accent = isRosa ? '#ec4899' : '#22c55e';
                const bg = isRosa ? '#1c1022' : '#111111';
                const border = isRosa ? '#2e1a35' : '#1f1f1f';
                const initial = user.displayName.charAt(0).toUpperCase();
                return (
                  <button
                    key={user.id}
                    onClick={() => handleUserTile(user)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95"
                    style={{ background: bg, borderColor: border, minWidth: 90 }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ background: `rgba(${hexToRgb(accent)}, 0.15)`, color: accent, border: `2px solid rgba(${hexToRgb(accent)}, 0.4)` }}>
                      {initial}
                    </div>
                    <span className="text-white text-sm font-medium capitalize">{user.displayName}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <button
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: `rgba(${hexToRgb(accentHex)}, 0.15)`, color: accentHex }}>
                    {selectedUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-semibold">{selectedUser.displayName}</span>
                </div>
              ) : (
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0f0f0f' }}>
                  {['login', 'signup'].map(m => (
                    <button key={m} onClick={() => { setMode(m); setError(''); }}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={mode === m
                        ? { background: '#1f1f1f', color: '#ffffff' }
                        : { color: '#4b5563' }}>
                      {m === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <button onClick={handleBack}
                  className="text-[#4b5563] hover:text-white text-xs transition-colors">
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
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder="your username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-sm outline-none placeholder-[#374151] focus:border-[#374151] transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-sm outline-none placeholder-[#374151] focus:border-[#374151] transition-colors"
                />
              </div>

              {error && (
                <p className="text-[#f87171] text-xs bg-[#f871711a] border border-[#f8717133] rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: accentHex, color: '#000000' }}
              >
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        )}

        {/* Sign up link when on manual login (no tile selected) */}
        {!selectedUser && mode === 'login' && knownUsers.length === 0 && (
          <div className="mt-4 text-center">
            <button onClick={() => setMode('signup')}
              className="text-[#4b5563] hover:text-white text-xs transition-colors">
              Don't have an account? <span className="text-white underline">Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}
