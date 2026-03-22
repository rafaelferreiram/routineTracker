import { createContext, useContext, useState, createElement } from 'react';

const AUTH_USERS_KEY = 'rq_users';
const AUTH_SESSION_KEY = 'rq_session';

function hashPassword(pw) {
  // Simple obfuscation — fine for a personal, offline-only app
  return btoa(unescape(encodeURIComponent(pw)));
}

// Pre-seeded accounts
const SEED_USERS = [
  {
    id: 'user_rafael',
    username: 'rafael',
    displayName: 'Rafael',
    passwordHash: hashPassword('admin'),
    theme: { accentColor: '#22c55e', bgColor: '#080808', bgCard: '#111111', bgBorder: '#1f1f1f' },
  },
  {
    id: 'user_gabriela',
    username: 'gabriela',
    displayName: 'Gabriela',
    passwordHash: hashPassword('gabriela'),
    theme: { accentColor: '#ec4899', themeId: 'rose' },
  },
];

function loadUsers() {
  try {
    const stored = localStorage.getItem(AUTH_USERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  try {
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    let existing = loadUsers();
    let changed = false;
    for (const seed of SEED_USERS) {
      if (!existing.find(u => u.id === seed.id)) {
        existing = [...existing, seed];
        changed = true;
      }
    }
    if (changed) saveUsers(existing);
    return existing;
  });

  const [currentUser, setCurrentUser] = useState(() => loadSession());

  function login(username, password) {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user) return { error: 'User not found' };
    if (user.passwordHash !== hashPassword(password)) return { error: 'Wrong password' };
    const session = { id: user.id, username: user.username, displayName: user.displayName, theme: user.theme };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    setCurrentUser(session);
    return { ok: true };
  }

  function signup(username, password) {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !password.trim()) return { error: 'Username and password are required' };
    if (trimmed.length < 2) return { error: 'Username must be at least 2 characters' };
    if (users.find(u => u.username.toLowerCase() === trimmed)) return { error: 'Username already taken' };
    const newUser = {
      id: `user_${Date.now()}`,
      username: trimmed,
      displayName: username.trim(),
      passwordHash: hashPassword(password.trim()),
      theme: { accentColor: '#22c55e', bgColor: '#080808', bgCard: '#111111', bgBorder: '#1f1f1f' },
    };
    const updated = [...users, newUser];
    saveUsers(updated);
    setUsers(updated);
    const session = { id: newUser.id, username: newUser.username, displayName: newUser.displayName, theme: newUser.theme };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    setCurrentUser(session);
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setCurrentUser(null);
  }

  return createElement(AuthContext.Provider, { value: { currentUser, users, login, signup, logout } }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}
