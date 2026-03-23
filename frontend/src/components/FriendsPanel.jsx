import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { getLevelFromXP, getLevelColor, getLevelIcon, ACHIEVEMENTS } from '../utils/gamification.js';
import { getTodayString, isHabitApplicableToday, calculateStreak } from '../utils/dateUtils.js';
import GrowthChart, { RANGES } from './GrowthChart.jsx';

const FRIEND_RANGES = RANGES.slice(0, 2); // 1W, 1M only

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return '34 197 94';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function FriendCard({ friend, onRemove }) {
  const data = friend.data || {};
  const accent = friend.theme?.accentColor || '#22c55e';
  const accentRgb = hexToRgb(accent);

  const habits = data.habits || [];
  const profile = data.profile || {};
  const achievements = data.achievements || [];

  const totalXP = profile.totalXP || 0;
  const level = getLevelFromXP(totalXP);
  const levelColor = getLevelColor(level);
  const levelIcon = getLevelIcon(level);

  // Today's progress
  const today = getTodayString();
  const todayHabits = habits.filter(h => isHabitApplicableToday(h));
  const completedToday = todayHabits.filter(h => (h.completions || []).includes(today)).length;
  const todayPct = todayHabits.length > 0 ? Math.round((completedToday / todayHabits.length) * 100) : 0;

  // Top 3 streaks
  const topStreaks = habits
    .map(h => ({ name: h.name, emoji: h.emoji || '✅', streak: calculateStreak(h.completions || [], h.frequency) }))
    .filter(h => h.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3);

  // Best overall streak
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);

  // Medals
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = achievements.length;

  const hasData = habits.length > 0 || totalXP > 0;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: 'var(--bg-border, #1f1f1f)' }}>
        {friend.picture ? (
          <img src={friend.picture} alt="" className="w-11 h-11 rounded-xl object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
            style={{ background: `rgba(${hexToRgb(levelColor)}, 0.15)`, border: `2px solid rgba(${hexToRgb(levelColor)}, 0.45)`, color: levelColor }}>
            {(profile.name || friend.displayName || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm capitalize leading-tight">
            {profile.name || friend.displayName}
          </p>
          <p className="text-[#6b7280] text-xs">@{friend.username}</p>
          {hasData && (
            <p className="text-xs font-semibold mt-0.5" style={{ color: levelColor }}>
              {levelIcon} Lv.{level} · {totalXP.toLocaleString()} XP
            </p>
          )}
        </div>
        {hasData && (
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{todayPct}%</span>
            <span className="text-[#4b5563] text-[9px]">today</span>
          </div>
        )}
        <button
          onClick={() => onRemove(friend.id)}
          className="text-[#6b7280] hover:text-[#f87171] transition-colors p-1"
          title="Remove friend"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {hasData ? (
        <div className="p-4 space-y-4">
          {/* Growth chart */}
          {habits.length > 0 && (
            <GrowthChart habits={habits} accentColor={accent} compact ranges={FRIEND_RANGES} />
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <p className="text-white font-bold text-base">{unlockedCount}</p>
              <p className="text-[#7c3aed] text-[9px] font-semibold">MEDALS</p>
              <p className="text-[#4b5563] text-[9px]">/{totalAchievements}</p>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ background: `rgba(${accentRgb}, 0.08)`, border: `1px solid rgba(${accentRgb}, 0.2)` }}>
              <p className="text-white font-bold text-base">{bestStreak}</p>
              <p className="text-[9px] font-semibold" style={{ color: accent }}>BEST</p>
              <p className="text-[#4b5563] text-[9px]">streak</p>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-white font-bold text-base">{habits.length}</p>
              <p className="text-[#6b7280] text-[9px] font-semibold">HABITS</p>
              <p className="text-[#4b5563] text-[9px]">tracked</p>
            </div>
          </div>

          {/* Top streaks */}
          {topStreaks.length > 0 && (
            <div>
              <p className="text-[#4b5563] text-[10px] font-semibold uppercase tracking-wider mb-2">Top Streaks</p>
              <div className="space-y-1.5">
                {topStreaks.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-center">{h.emoji}</span>
                    <span className="text-[#9ca3af] text-xs flex-1 truncate">{h.name}</span>
                    <span className="text-white text-xs font-bold">{h.streak}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center">
          <p className="text-[#4b5563] text-sm">No activity yet</p>
        </div>
      )}
    </div>
  );
}

function AddFriendModal({ onClose, onAdd }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Search users as user types
  useEffect(() => {
    if (username.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.searchUsers(username);
        setSearchResults(data.users || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  async function handleAdd(usernameToAdd) {
    setLoading(true);
    setError('');
    try {
      await api.addFriend(usernameToAdd);
      onAdd();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) return;
    await handleAdd(username.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--bg-border, #1f1f1f)' }}>
          <h3 className="text-white font-bold text-lg">Add Friend</h3>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">
              Username
            </label>
            <input
              data-testid="add-friend-input"
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Search by username..."
              autoComplete="off"
              autoCapitalize="none"
              className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-sm outline-none placeholder-[#374151] focus:border-[#374151] transition-colors"
            />
          </div>

          {/* Search Results */}
          {searching && (
            <p className="text-[#6b7280] text-sm text-center">Searching...</p>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-[#6b7280] text-xs">Found users:</p>
              {searchResults.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleAdd(user.username)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#1f1f1f] hover:border-[#22c55e] hover:bg-[#22c55e10] transition-all text-left disabled:opacity-50"
                >
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: `${user.theme?.accentColor || '#22c55e'}22`, color: user.theme?.accentColor || '#22c55e' }}>
                      {user.displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{user.displayName}</p>
                    <p className="text-[#6b7280] text-xs">@{user.username}</p>
                  </div>
                  <span className="text-[#22c55e] text-xs">+ Add</span>
                </button>
              ))}
            </div>
          )}

          {!searching && username.length >= 2 && searchResults.length === 0 && (
            <p className="text-[#6b7280] text-sm text-center">No users found</p>
          )}

          {error && (
            <p className="text-[#f87171] text-xs bg-[#f871711a] border border-[#f8717133] rounded-xl px-3 py-2.5">
              {error}
            </p>
          )}

          <button
            data-testid="add-friend-submit"
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 bg-[#22c55e] text-black"
          >
            {loading ? 'Adding...' : 'Add Friend'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function FriendsPanel() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadFriends = useCallback(async () => {
    try {
      const data = await api.getFriends();
      setFriends(data.friends || []);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  async function handleRemoveFriend(friendId) {
    if (!confirm('Remove this friend?')) return;
    try {
      await api.removeFriend(friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
    } catch (err) {
      alert(err.message || 'Failed to remove friend');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Friends</h2>
          <p className="text-[#4b5563] text-sm mt-0.5">
            {friends.length === 0 ? 'Add friends to see their progress' : `${friends.length} ${friends.length === 1 ? 'friend' : 'friends'}`}
          </p>
        </div>
        <button
          data-testid="add-friend-btn"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-[#22c55e] text-black hover:bg-[#16a34a] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {friends.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
          <p className="text-4xl mb-3">👥</p>
          <p className="text-white font-semibold">No friends yet</p>
          <p className="text-[#4b5563] text-sm mt-1 mb-4">Add friends by their username to see their progress</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[#22c55e] text-black hover:bg-[#16a34a] transition-colors"
          >
            Add Your First Friend
          </button>
        </div>
      ) : (
        friends.map(friend => (
          <FriendCard key={friend.id} friend={friend} onRemove={handleRemoveFriend} />
        ))
      )}

      {showAddModal && (
        <AddFriendModal
          onClose={() => setShowAddModal(false)}
          onAdd={loadFriends}
        />
      )}
    </div>
  );
}
