/**
 * Unit tests for FriendsLeaderboard logic
 *
 * Tests the pure stat-computation and ranking functions
 * extracted from FriendsLeaderboard.jsx without needing
 * a running server or React renderer.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getLevelFromXP, getLevelIcon, getLevelColor } from '../utils/gamification.js';
import { getTodayString, isHabitApplicableToday, calculateStreak } from '../utils/dateUtils.js';

// ── Re-implement computeStats here (mirrors FriendsLeaderboard.jsx) ──────────
// This lets us test the logic in isolation without importing the full component.
function computeStats(habits = [], profile = {}, achievements = []) {
  const today = getTodayString();
  const applicable = habits.filter(h => isHabitApplicableToday(h));
  const completedToday = applicable.filter(h =>
    (h.completions || []).includes(today)
  ).length;
  const todayPct =
    applicable.length > 0
      ? Math.round((completedToday / applicable.length) * 100)
      : 0;

  const bestStreak = habits.reduce(
    (max, h) =>
      Math.max(max, calculateStreak(h.completions || [], h.frequency)),
    0
  );

  return {
    xp: profile.totalXP || 0,
    level: getLevelFromXP(profile.totalXP || 0),
    todayPct,
    todayDone: completedToday,
    todayTotal: applicable.length,
    bestStreak,
    medals: achievements.length,
    habitsCount: habits.length,
  };
}

// Ranking sort (mirrors FriendsLeaderboard.jsx)
function rankPlayers(players, metricKey) {
  return [...players].sort((a, b) => b.stats[metricKey] - a.stats[metricKey]);
}

// ── Test data helpers ─────────────────────────────────────────────────────────
const today = getTodayString();

function makeHabit(overrides = {}) {
  return {
    id: `h_${Math.random()}`,
    name: 'Test Habit',
    frequency: 'daily',
    completions: [],
    ...overrides,
  };
}

function makeProfile(totalXP = 0) {
  return { totalXP, name: 'Test User' };
}

// ── computeStats ──────────────────────────────────────────────────────────────
describe('computeStats', () => {
  it('returns zero values for empty data', () => {
    const stats = computeStats([], {}, []);
    expect(stats.xp).toBe(0);
    expect(stats.level).toBe(1);
    expect(stats.todayPct).toBe(0);
    expect(stats.todayDone).toBe(0);
    expect(stats.todayTotal).toBe(0);
    expect(stats.bestStreak).toBe(0);
    expect(stats.medals).toBe(0);
    expect(stats.habitsCount).toBe(0);
  });

  it('reads totalXP from profile', () => {
    const stats = computeStats([], makeProfile(500), []);
    expect(stats.xp).toBe(500);
  });

  it('derives level from XP using getLevelFromXP', () => {
    expect(computeStats([], makeProfile(0), []).level).toBe(1);
    expect(computeStats([], makeProfile(100), []).level).toBe(2);
    expect(computeStats([], makeProfile(250), []).level).toBe(3);
    expect(computeStats([], makeProfile(500), []).level).toBe(4);
    expect(computeStats([], makeProfile(1000), []).level).toBe(5);
  });

  it('counts achievements as medals', () => {
    const achievements = [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }];
    expect(computeStats([], {}, achievements).medals).toBe(3);
  });

  it('counts total habits correctly', () => {
    const habits = [makeHabit(), makeHabit(), makeHabit()];
    expect(computeStats(habits, {}, []).habitsCount).toBe(3);
  });

  it('counts habits completed today', () => {
    const habits = [
      makeHabit({ completions: [today] }),   // done today
      makeHabit({ completions: [] }),         // not done
      makeHabit({ completions: [today] }),   // done today
    ];
    const stats = computeStats(habits, {}, []);
    expect(stats.todayDone).toBe(2);
    expect(stats.todayTotal).toBe(3);
    expect(stats.todayPct).toBe(67); // Math.round(2/3*100)
  });

  it('returns todayPct=0 when no habits are applicable', () => {
    // weekly habit not applicable today (unless today matches)
    const stats = computeStats([], {}, []);
    expect(stats.todayPct).toBe(0);
  });

  it('returns todayPct=100 when all habits done today', () => {
    const habits = [
      makeHabit({ completions: [today] }),
      makeHabit({ completions: [today] }),
    ];
    const stats = computeStats(habits, {}, []);
    expect(stats.todayPct).toBe(100);
  });

  it('computes bestStreak from all habits', () => {
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })();

    const habits = [
      makeHabit({ completions: [yesterday, today] }),  // streak=2
      makeHabit({ completions: [today] }),               // streak=1
    ];
    const stats = computeStats(habits, {}, []);
    expect(stats.bestStreak).toBeGreaterThanOrEqual(1);
  });

  it('bestStreak is 0 when no habits have completions', () => {
    const habits = [makeHabit({ completions: [] }), makeHabit({ completions: [] })];
    const stats = computeStats(habits, {}, []);
    expect(stats.bestStreak).toBe(0);
  });
});

// ── rankPlayers ───────────────────────────────────────────────────────────────
describe('rankPlayers', () => {
  const players = [
    { id: 'b', stats: { xp: 200, todayPct: 80, bestStreak: 5, medals: 3 } },
    { id: 'a', stats: { xp: 500, todayPct: 60, bestStreak: 10, medals: 7 } },
    { id: 'c', stats: { xp: 100, todayPct: 100, bestStreak: 2, medals: 1 } },
  ];

  it('ranks by XP descending', () => {
    const ranked = rankPlayers(players, 'xp');
    expect(ranked.map(p => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('ranks by todayPct descending', () => {
    const ranked = rankPlayers(players, 'todayPct');
    expect(ranked.map(p => p.id)).toEqual(['c', 'b', 'a']);
  });

  it('ranks by bestStreak descending', () => {
    const ranked = rankPlayers(players, 'bestStreak');
    expect(ranked.map(p => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('ranks by medals descending', () => {
    const ranked = rankPlayers(players, 'medals');
    expect(ranked.map(p => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the original array', () => {
    const original = [...players];
    rankPlayers(players, 'xp');
    expect(players).toEqual(original);
  });

  it('handles a single player without error', () => {
    const single = [{ id: 'solo', stats: { xp: 999 } }];
    expect(rankPlayers(single, 'xp')[0].id).toBe('solo');
  });

  it('handles empty array', () => {
    expect(rankPlayers([], 'xp')).toEqual([]);
  });
});

// ── Metric definitions ────────────────────────────────────────────────────────
describe('METRICS format functions', () => {
  const METRICS = [
    { id: 'xp',     key: 'xp',         fmt: v => v.toLocaleString('pt-BR') },
    { id: 'today',  key: 'todayPct',    fmt: v => `${v}%` },
    { id: 'streak', key: 'bestStreak',  fmt: v => `${v}d` },
    { id: 'medals', key: 'medals',      fmt: v => `${v}` },
  ];

  it('XP formatter adds locale separators for large values', () => {
    const m = METRICS.find(m => m.id === 'xp');
    const result = m.fmt(1000);
    expect(result).toMatch(/1[.,]000/); // pt-BR uses dot as thousands separator
  });

  it('todayPct formatter appends % sign', () => {
    const m = METRICS.find(m => m.id === 'today');
    expect(m.fmt(75)).toBe('75%');
    expect(m.fmt(0)).toBe('0%');
    expect(m.fmt(100)).toBe('100%');
  });

  it('streak formatter appends d suffix', () => {
    const m = METRICS.find(m => m.id === 'streak');
    expect(m.fmt(7)).toBe('7d');
    expect(m.fmt(0)).toBe('0d');
  });

  it('medals formatter converts to string', () => {
    const m = METRICS.find(m => m.id === 'medals');
    expect(m.fmt(3)).toBe('3');
  });
});

// ── getLevelFromXP (gamification utils used by leaderboard) ──────────────────
describe('getLevelFromXP', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(1);
  });

  it('returns level 2 at 100 XP threshold', () => {
    expect(getLevelFromXP(100)).toBe(2);
  });

  it('returns level 1 just below threshold', () => {
    expect(getLevelFromXP(99)).toBe(1);
  });

  it('increases level correctly through multiple thresholds', () => {
    expect(getLevelFromXP(250)).toBe(3);
    expect(getLevelFromXP(500)).toBe(4);
    expect(getLevelFromXP(1000)).toBe(5);
  });

  it('returns level >= 5 for very high XP', () => {
    expect(getLevelFromXP(99999)).toBeGreaterThan(5);
  });
});

// ── getLevelColor / getLevelIcon ──────────────────────────────────────────────
describe('getLevelColor', () => {
  it('returns a hex color string for any level', () => {
    [1, 5, 10, 20, 30, 40, 50].forEach(level => {
      const color = getLevelColor(level);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('returns different colors for different level ranges', () => {
    const beginner = getLevelColor(1);
    const legend   = getLevelColor(35);
    expect(beginner).not.toBe(legend);
  });
});

describe('getLevelIcon', () => {
  it('returns an emoji string for any level', () => {
    [1, 5, 10, 20, 30, 40, 50].forEach(level => {
      const icon = getLevelIcon(level);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });
  });

  it('returns different icons for different level ranges', () => {
    expect(getLevelIcon(1)).not.toBe(getLevelIcon(50));
  });
});

// ── Player my-rank detection ──────────────────────────────────────────────────
describe('my rank detection', () => {
  it('finds the correct rank position for the current user', () => {
    const players = [
      { id: 'friend1', isMe: false, stats: { xp: 800 } },
      { id: 'me',      isMe: true,  stats: { xp: 500 } },
      { id: 'friend2', isMe: false, stats: { xp: 200 } },
    ];
    const ranked = rankPlayers(players, 'xp');
    const myRank = ranked.findIndex(p => p.isMe);
    expect(myRank).toBe(1); // #2 (0-indexed)
  });

  it('finds rank 0 when current user has the highest XP', () => {
    const players = [
      { id: 'me',      isMe: true,  stats: { xp: 1000 } },
      { id: 'friend1', isMe: false, stats: { xp: 500 } },
    ];
    const ranked = rankPlayers(players, 'xp');
    expect(ranked.findIndex(p => p.isMe)).toBe(0);
  });
});
