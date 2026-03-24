import { createContext, useContext, useState, useEffect, createElement } from 'react';
import { api, getToken } from '../api/client.js';

// Local storage keys
const TOKEN_KEY       = 'rq_token';
const SESSION_KEY     = 'rq_session';
const KNOWN_USERS_KEY = 'rq_known_users';

// ── Storage helpers (supports both localStorage and sessionStorage) ───────────
function getStorage() {
  // sessionStorage token means "don't remember me" session
  return sessionStorage.getItem(TOKEN_KEY) ? 'session' : 'local';
}

function saveAuth(token, user, rememberMe) {
  const primary   = rememberMe ? localStorage : sessionStorage;
  const secondary = rememberMe ? sessionStorage : localStorage;
  // Clear from the other storage to avoid conflicts
  secondary.removeItem(TOKEN_KEY);
  secondary.removeItem(SESSION_KEY);
  primary.setItem(TOKEN_KEY, token);
  primary.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function loadSession() {
  try {
    const s = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
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

  async function login(username, password, rememberMe = true) {
    try {
      const isEmail = username.includes('@');
      const data = isEmail 
        ? await api.loginEmail(username, password)
        : await api.login(username, password);
      saveAuth(data.token, data.user, rememberMe);
      persistKnownUser(data.user);
      setCurrentUser(data.user);
      setUsers(loadKnownUsers());
      return { ok: true };
    } catch (err) {
      return { error: err.message || 'Login failed' };
    }
  }

  async function signup(username, password, email = null, rememberMe = true) {
    try {
      const data = await api.register(username, password, email);
      saveAuth(data.token, data.user, rememberMe);
      persistKnownUser(data.user);
      setCurrentUser(data.user);
      setUsers(loadKnownUsers());
      return { ok: true, emailSent: data.emailSent, email: data.user?.email };
    } catch (err) {
      return { error: err.message || 'Signup failed' };
    }
  }

  function logout() {
    clearAuth();
    setCurrentUser(null);
  }

  async function loginWithGoogle(sessionId) {
    try {
      const data = await api.googleAuth(sessionId);
      saveAuth(data.token, data.user, true); // always remember for Google login
      persistKnownUser(data.user);
      setCurrentUser(data.user);
      setUsers(loadKnownUsers());
      return { ok: true };
    } catch (err) {
      return { error: err.message || 'Google login failed' };
    }
  }

  function startGoogleLogin() {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    // Redirect to Emergent Google Auth
    const redirectUrl = window.location.origin;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
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
