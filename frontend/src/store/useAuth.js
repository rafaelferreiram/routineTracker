import { createContext, useContext, useState, useEffect, createElement } from 'react';
import { api, getToken } from '../api/client.js';

// Local storage keys
const TOKEN_KEY       = 'rq_token';
const SESSION_KEY     = 'rq_session';
const KNOWN_USERS_KEY = 'rq_known_users';

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function loadKnownUsers() {
  try { return JSON.parse(localStorage.getItem(KNOWN_USERS_KEY) || '[]'); } catch { return []; }
}

// Migrate known users from the old rq_users localStorage key (one-time migration)
function migrateLegacyUsers() {
  if (localStorage.getItem(KNOWN_USERS_KEY)) return; // already done
  try {
    const legacy = localStorage.getItem('rq_users');
    if (legacy) {
      const users = JSON.parse(legacy);
      const known = users.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName || u.username,
        theme: u.theme || {},
      }));
      localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(known));
    }
  } catch { /* ignore */ }
}

migrateLegacyUsers();

function persistKnownUser(user) {
  const known   = loadKnownUsers();
  // Filter by both id and username to avoid duplicates
  const updated = known.filter(u => u.id !== user.id && u.username !== user.username);
  updated.push({ 
    id: user.id, 
    username: user.username, 
    displayName: user.displayName, 
    theme: user.theme,
    picture: user.picture || ''
  });
  localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(updated.slice(-10)));
}

// ── Context ────────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadSession());
  const [users, setUsers] = useState(() => loadKnownUsers());

  // Keep users list in sync with localStorage
  useEffect(() => {
    const known = loadKnownUsers();
    setUsers(known);
  }, [currentUser]);

  async function login(username, password) {
    try {
      const data = await api.login(username, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      persistKnownUser(data.user);
      setCurrentUser(data.user);
      setUsers(loadKnownUsers());
      return { ok: true };
    } catch (err) {
      return { error: err.message || 'Login failed' };
    }
  }

  async function signup(username, password) {
    try {
      const data = await api.register(username, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      persistKnownUser(data.user);
      setCurrentUser(data.user);
      setUsers(loadKnownUsers());
      return { ok: true };
    } catch (err) {
      return { error: err.message || 'Signup failed' };
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }

  async function loginWithGoogle(sessionId) {
    try {
      const data = await api.googleAuth(sessionId);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      persistKnownUser(data.user);
      setCurrentUser(data.user);
      setUsers(loadKnownUsers());
      return { ok: true };
    } catch (err) {
      return { error: err.message || 'Google login failed' };
    }
  }

  function startGoogleLogin() {
    // Redirect to Emergent Google Auth
    const redirectUri = encodeURIComponent(window.location.origin);
    window.location.href = `https://auth.emergentagent.com/oauth/google?redirect_uri=${redirectUri}`;
  }

  return createElement(
    AuthContext.Provider,
    { value: { currentUser, users, login, signup, logout, loginWithGoogle, startGoogleLogin } },
    children,
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
