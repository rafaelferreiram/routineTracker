import { createContext, useContext, useReducer, useEffect, useCallback, useRef, createElement } from 'react';
import { getTodayString, calculateStreak } from '../utils/dateUtils.js';
import {
  checkAchievements,
  calculateXPGain,
  getLevelFromXP,
  ACHIEVEMENTS,
} from '../utils/gamification.js';

// ─── Seed Data Helper ─────────────────────────────────────────────────────────

const d = (n) => `2026-03-${String(n).padStart(2, '0')}`;
const days = (...nums) => nums.map(d);

// ─── Initial State ────────────────────────────────────────────────────────────

// ─── Meals Habits (added via migration) ───────────────────────────────────────

const ALL_MARCH = days(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21);

const MEALS_HABITS = [
  {
    id: 'habit_breakfast',
    name: 'Take Breakfast',
    emoji: '🥞',
    category: 'Meals',
    color: '#F59E0B',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: ALL_MARCH,
    completionTimestamps: {},
    streak: 21,
    bestStreak: 21,
  },
  {
    id: 'habit_lunch',
    name: 'Have Lunch',
    emoji: '🥗',
    category: 'Meals',
    color: '#10B981',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: ALL_MARCH,
    completionTimestamps: {},
    streak: 21,
    bestStreak: 21,
  },
  {
    id: 'habit_dinner',
    name: 'Have Dinner',
    emoji: '🍽️',
    category: 'Meals',
    color: '#F97316',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: ALL_MARCH,
    completionTimestamps: {},
    streak: 21,
    bestStreak: 21,
  },
  {
    id: 'habit_fruits',
    name: 'Eat Fruits',
    emoji: '🍎',
    category: 'Meals',
    color: '#EF4444',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: ALL_MARCH,
    completionTimestamps: {},
    streak: 21,
    bestStreak: 21,
  },
  {
    id: 'habit_vitamins',
    name: 'Take Vitamins',
    emoji: '💊',
    category: 'Meals',
    color: '#8B5CF6',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: ALL_MARCH,
    completionTimestamps: {},
    streak: 21,
    bestStreak: 21,
  },
];

const DEFAULT_HABITS = [
  // ── RELIGION ──────────────────────────────────────────────────────────────
  {
    id: 'habit_pray',
    name: 'Pray',
    emoji: '🙏',
    category: 'Religion',
    color: '#8B5CF6',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: days(1,2,3,4,5,6,7,9,10,11,12,13,14,16,17,18,19,20,21),
    completionTimestamps: {},
    streak: 6,
    bestStreak: 14,
  },
  {
    id: 'habit_thank',
    name: 'Thank God',
    emoji: '✨',
    category: 'Religion',
    color: '#A78BFA',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: days(1,2,3,4,5,7,9,10,11,12,14,16,17,18,19,20,21),
    completionTimestamps: {},
    streak: 6,
    bestStreak: 9,
  },

  // ── EXERCISE ──────────────────────────────────────────────────────────────
  {
    id: 'habit_jiujitsu',
    name: 'Jiu Jitsu',
    emoji: '🥋',
    category: 'Exercise',
    color: '#10B981',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: days(1,2,4,7,9,11,14,16,18,20,21),
    completionTimestamps: {},
    streak: 2,
    bestStreak: 2,
  },
  {
    id: 'habit_gym',
    name: 'Gym',
    emoji: '🏋️',
    category: 'Exercise',
    color: '#34D399',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: days(3,5,6,10,12,13,17,19,20,21),
    completionTimestamps: {},
    streak: 3,
    bestStreak: 3,
  },

  // ── WORK (weekdays) ───────────────────────────────────────────────────────
  {
    id: 'habit_meeting_blip',
    name: 'Daily Meeting Blip',
    emoji: '📊',
    category: 'Work',
    color: '#3B82F6',
    frequency: 'weekdays',
    createdAt: '2026-03-01',
    completions: days(2,3,4,5,6,9,10,11,12,13,16,17,18,19,20),
    completionTimestamps: {},
    streak: 15,
    bestStreak: 15,
  },
  {
    id: 'habit_meeting_livelo',
    name: 'Daily Meeting Livelo',
    emoji: '🟠',
    category: 'Work',
    color: '#F97316',
    frequency: 'weekdays',
    createdAt: '2026-03-01',
    completions: days(2,3,4,5,6,9,10,11,12,13,16,17,18,19,20),
    completionTimestamps: {},
    streak: 15,
    bestStreak: 15,
  },
  {
    id: 'habit_meeting_fox',
    name: 'Daily Meeting Fox',
    emoji: '🦊',
    category: 'Work',
    color: '#EF4444',
    frequency: 'weekdays',
    createdAt: '2026-03-01',
    completions: days(2,3,4,5,6,9,10,11,12,13,16,17,18,19,20),
    completionTimestamps: {},
    streak: 15,
    bestStreak: 15,
  },
  {
    id: 'habit_meeting_pinterest',
    name: 'Daily Meeting Pinterest',
    emoji: '📌',
    category: 'Work',
    color: '#E1306C',
    frequency: 'weekdays',
    createdAt: '2026-03-01',
    completions: days(2,3,4,5,6,9,10,11,12,13,16,17,18,19,20),
    completionTimestamps: {},
    streak: 15,
    bestStreak: 15,
  },
  {
    id: 'habit_work_blip',
    name: 'Work time Blip',
    emoji: '⏱️',
    category: 'Work',
    color: '#60A5FA',
    frequency: 'weekdays',
    createdAt: '2026-03-01',
    completions: days(2,3,4,5,6,9,10,11,12,13,16,17,18,19,20),
    completionTimestamps: {},
    streak: 15,
    bestStreak: 15,
  },
  {
    id: 'habit_work_livelo',
    name: 'Work time Livelo',
    emoji: '⏳',
    category: 'Work',
    color: '#FB923C',
    frequency: 'weekdays',
    createdAt: '2026-03-01',
    completions: days(2,3,4,6,9,10,11,12,13,16,17,18,19,20),
    completionTimestamps: {},
    streak: 14,
    bestStreak: 14,
  },
  {
    id: 'habit_work_fox',
    name: 'Work time Fox',
    emoji: '🕐',
    category: 'Work',
    color: '#F87171',
    frequency: 'weekdays',
    createdAt: '2026-03-01',
    completions: days(2,3,4,5,6,9,10,12,13,16,17,18,19,20),
    completionTimestamps: {},
    streak: 14,
    bestStreak: 14,
  },
  {
    id: 'habit_work_pinterest',
    name: 'Work time Pinterest',
    emoji: '🕑',
    category: 'Work',
    color: '#F9A8D4',
    frequency: 'weekdays',
    createdAt: '2026-03-01',
    completions: days(2,3,4,5,6,9,10,11,12,16,17,18,19,20),
    completionTimestamps: {},
    streak: 14,
    bestStreak: 14,
  },

  // ── STUDY ─────────────────────────────────────────────────────────────────
  {
    id: 'habit_read',
    name: 'Read time',
    emoji: '📖',
    category: 'Study',
    color: '#F59E0B',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: days(1,2,4,5,7,9,10,12,13,14,16,17,19,20,21),
    completionTimestamps: {},
    streak: 3,
    bestStreak: 5,
  },
  {
    id: 'habit_study_ai',
    name: 'Study AI',
    emoji: '🤖',
    category: 'Study',
    color: '#FBBF24',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: days(2,3,5,9,10,12,16,17,19,20,21),
    completionTimestamps: {},
    streak: 3,
    bestStreak: 3,
  },
  {
    id: 'habit_study_bitcoin',
    name: 'Study Bitcoin',
    emoji: '🪙',
    category: 'Study',
    color: '#D97706',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: days(1,3,7,9,11,14,16,18,21),
    completionTimestamps: {},
    streak: 1,
    bestStreak: 2,
  },

  // ── FAMILY ────────────────────────────────────────────────────────────────
  {
    id: 'habit_family_time',
    name: 'Family time',
    emoji: '👨‍👩‍👧‍👦',
    category: 'Family',
    color: '#EC4899',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: days(1,2,3,4,5,6,7,9,10,11,12,13,14,16,17,18,19,20,21),
    completionTimestamps: {},
    streak: 6,
    bestStreak: 19,
  },
  {
    id: 'habit_thankful',
    name: 'Be thankful',
    emoji: '💝',
    category: 'Family',
    color: '#F472B6',
    frequency: 'daily',
    createdAt: '2026-03-01',
    completions: days(1,2,3,4,5,6,7,8,9,10,11,12,14,16,17,18,19,20,21),
    completionTimestamps: {},
    streak: 6,
    bestStreak: 12,
  },
  ...MEALS_HABITS,
];

function getInitialState() {
  try {
    const stored = localStorage.getItem('routineTracker_v3');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.habits) {
        parsed.habits = parsed.habits.map(h => ({
          completionTimestamps: {},
          completions: [],
          ...h,
        }));
      }
      if (parsed.profile) {
        parsed.profile = {
          freezeShields: 0,
          focusHabitId: null,
          focusHabitDate: null,
          ...parsed.profile,
        };
      }
      if (parsed.settings) {
        parsed.settings = {
          theme: 'dark',
          accentColor: '#22c55e',
          appName: 'RoutineQuest',
          appIcon: '⚡',
          ...parsed.settings,
        };
      }
      // Migration: inject Meals habits if not present
      if (parsed.habits) {
        const existingIds = new Set(parsed.habits.map(h => h.id));
        const missing = MEALS_HABITS.filter(h => !existingIds.has(h.id));
        if (missing.length > 0) {
          parsed.habits = [...parsed.habits, ...missing];
        }
        // Migration: remove 2026-03-22 from meals completions (not done yet)
        const mealsIds = new Set(MEALS_HABITS.map(h => h.id));
        parsed.habits = parsed.habits.map(h => {
          if (!mealsIds.has(h.id)) return h;
          const completions = (h.completions || []).filter(d => d !== '2026-03-22');
          return { ...h, completions };
        });
      }
      return {
        toasts: [],
        confetti: false,
        levelUpPending: null,
        events: [],
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }

  return {
    profile: {
      name: 'Rafael',
      totalXP: 2800,
      level: 8,
      joinDate: '2026-03-01',
      freezeShields: 0,
      focusHabitId: null,
      focusHabitDate: null,
    },
    habits: DEFAULT_HABITS,
    achievements: [],
    journalEntries: [],
    events: [
      { id: 'event_nyc', title: 'Travel to NYC', date: '2026-04-17', emoji: '✈️', color: '#22c55e', note: '', createdAt: new Date().toISOString() },
      { id: 'event_ufc', title: 'UFC White House', date: '2026-06-04', emoji: '🥊', color: '#f87171', note: '', createdAt: new Date().toISOString() },
    ],
    settings: { theme: 'dark', accentColor: '#22c55e', appName: 'RoutineQuest', appIcon: '⚡' },
    toasts: [],
    confetti: false,
    levelUpPending: null,
  };
}

// ─── Action Types ─────────────────────────────────────────────────────────────

export const ACTIONS = {
  // Habits
  ADD_HABIT: 'ADD_HABIT',
  UPDATE_HABIT: 'UPDATE_HABIT',
  DELETE_HABIT: 'DELETE_HABIT',
  TOGGLE_COMPLETION: 'TOGGLE_COMPLETION',
  TOGGLE_COMPLETION_DATE: 'TOGGLE_COMPLETION_DATE',

  // Profile
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  ADD_XP: 'ADD_XP',

  // Achievements
  UNLOCK_ACHIEVEMENT: 'UNLOCK_ACHIEVEMENT',

  // UI
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  SET_CONFETTI: 'SET_CONFETTI',

  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

  // Journal
  ADD_JOURNAL_ENTRY: 'ADD_JOURNAL_ENTRY',
  DELETE_JOURNAL_ENTRY: 'DELETE_JOURNAL_ENTRY',

  // Events
  ADD_EVENT: 'ADD_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  DELETE_EVENT: 'DELETE_EVENT',

  // Freeze Shield
  TOGGLE_FREEZE_SHIELD: 'TOGGLE_FREEZE_SHIELD',
  USE_FREEZE_SHIELD: 'USE_FREEZE_SHIELD',

  // Focus Habit
  SET_FOCUS_HABIT: 'SET_FOCUS_HABIT',
  CLEAR_FOCUS_HABIT: 'CLEAR_FOCUS_HABIT',

  // Level Up
  SET_LEVEL_UP: 'SET_LEVEL_UP',
  CLEAR_LEVEL_UP: 'CLEAR_LEVEL_UP',
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_HABIT: {
      const newHabit = {
        id: `habit_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        completions: [],
        completionTimestamps: {},
        streak: 0,
        bestStreak: 0,
        createdAt: getTodayString(),
        ...action.payload,
      };
      return { ...state, habits: [...state.habits, newHabit] };
    }

    case ACTIONS.UPDATE_HABIT: {
      return {
        ...state,
        habits: state.habits.map(h =>
          h.id === action.payload.id ? { ...h, ...action.payload } : h
        ),
      };
    }

    case ACTIONS.DELETE_HABIT: {
      return {
        ...state,
        habits: state.habits.filter(h => h.id !== action.payload.id),
      };
    }

    case ACTIONS.TOGGLE_COMPLETION: {
      const { habitId, date, timestamp } = action.payload;
      const targetDate = date || getTodayString();

      return {
        ...state,
        habits: state.habits.map(h => {
          if (h.id !== habitId) return h;

          const wasCompleted = h.completions.includes(targetDate);
          let newCompletions;
          let newTimestamps = { ...(h.completionTimestamps || {}) };

          if (wasCompleted) {
            newCompletions = h.completions.filter(d => d !== targetDate);
            delete newTimestamps[targetDate];
          } else {
            newCompletions = [...h.completions, targetDate];
            newTimestamps[targetDate] = timestamp || new Date().toISOString();
          }

          const newStreak = calculateStreak(newCompletions, h.frequency);
          const newBestStreak = Math.max(h.bestStreak || 0, newStreak);

          return {
            ...h,
            completions: newCompletions,
            completionTimestamps: newTimestamps,
            streak: newStreak,
            bestStreak: newBestStreak,
          };
        }),
      };
    }

    case ACTIONS.ADD_XP: {
      const oldLevel = getLevelFromXP(state.profile.totalXP || 0);
      const newTotalXP = (state.profile.totalXP || 0) + action.payload.amount;
      const newLevel = getLevelFromXP(newTotalXP);
      const leveledUp = newLevel > oldLevel;
      return {
        ...state,
        profile: {
          ...state.profile,
          totalXP: newTotalXP,
          level: newLevel,
        },
        levelUpPending: leveledUp ? { oldLevel, newLevel } : state.levelUpPending,
      };
    }

    case ACTIONS.UPDATE_PROFILE: {
      return {
        ...state,
        profile: { ...state.profile, ...action.payload },
      };
    }

    case ACTIONS.UNLOCK_ACHIEVEMENT: {
      const alreadyUnlocked = state.achievements.some(a => a.id === action.payload.id);
      if (alreadyUnlocked) return state;
      return {
        ...state,
        achievements: [
          ...state.achievements,
          { id: action.payload.id, unlockedAt: new Date().toISOString() },
        ],
      };
    }

    case ACTIONS.ADD_TOAST: {
      return {
        ...state,
        toasts: [...state.toasts, { id: Date.now(), ...action.payload }],
      };
    }

    case ACTIONS.REMOVE_TOAST: {
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload.id),
      };
    }

    case ACTIONS.SET_CONFETTI: {
      return { ...state, confetti: action.payload.active };
    }

    case ACTIONS.UPDATE_SETTINGS: {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    }

    case ACTIONS.ADD_JOURNAL_ENTRY: {
      const entry = {
        id: `journal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      return {
        ...state,
        journalEntries: [entry, ...(state.journalEntries || [])],
      };
    }

    case ACTIONS.DELETE_JOURNAL_ENTRY: {
      return {
        ...state,
        journalEntries: (state.journalEntries || []).filter(e => e.id !== action.payload.id),
      };
    }

    case ACTIONS.ADD_EVENT: {
      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        emoji: '📅',
        color: '#22c55e',
        note: '',
        ...action.payload,
      };
      return {
        ...state,
        events: [...(state.events || []), event].sort((a, b) => a.date.localeCompare(b.date)),
      };
    }

    case ACTIONS.UPDATE_EVENT: {
      return {
        ...state,
        events: (state.events || [])
          .map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e)
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
    }

    case ACTIONS.DELETE_EVENT: {
      return {
        ...state,
        events: (state.events || []).filter(e => e.id !== action.payload.id),
      };
    }

    case ACTIONS.TOGGLE_FREEZE_SHIELD: {
      return {
        ...state,
        profile: {
          ...state.profile,
          freezeShields: (state.profile.freezeShields || 0) + 1,
        },
      };
    }

    case ACTIONS.USE_FREEZE_SHIELD: {
      const { habitId, date } = action.payload;
      const shields = state.profile.freezeShields || 0;
      if (shields <= 0) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          freezeShields: shields - 1,
        },
        habits: state.habits.map(h => {
          if (h.id !== habitId) return h;
          if (h.completions.includes(date)) return h;
          const newCompletions = [...h.completions, date];
          const newStreak = calculateStreak(newCompletions, h.frequency);
          return {
            ...h,
            completions: newCompletions,
            streak: newStreak,
            bestStreak: Math.max(h.bestStreak || 0, newStreak),
          };
        }),
      };
    }

    case ACTIONS.SET_FOCUS_HABIT: {
      return {
        ...state,
        profile: {
          ...state.profile,
          focusHabitId: action.payload.habitId,
          focusHabitDate: action.payload.date,
        },
      };
    }

    case ACTIONS.CLEAR_FOCUS_HABIT: {
      return {
        ...state,
        profile: {
          ...state.profile,
          focusHabitId: null,
          focusHabitDate: null,
        },
      };
    }

    case ACTIONS.SET_LEVEL_UP: {
      return { ...state, levelUpPending: action.payload };
    }

    case ACTIONS.CLEAR_LEVEL_UP: {
      return { ...state, levelUpPending: null };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const prevHabitsRef = useRef(null); // null so first run always checks
  const prevAchievementsRef = useRef(state.achievements);

  // Persist to localStorage (debounced) — do NOT persist levelUpPending
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const toSave = {
          profile: state.profile,
          habits: state.habits,
          achievements: state.achievements,
          journalEntries: state.journalEntries || [],
          events: state.events || [],
          settings: state.settings,
        };
        localStorage.setItem('routineTracker_v3', JSON.stringify(toSave));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }, 300);
    return () => clearTimeout(saveTimerRef.current);
  }, [state.profile, state.habits, state.achievements, state.journalEntries, state.settings]);

  // Check achievements on mount + whenever habits change
  useEffect(() => {
    if (prevHabitsRef.current === state.habits) return;
    const prevHabits = prevHabitsRef.current;
    prevHabitsRef.current = state.habits;

    const newlyUnlocked = checkAchievements(
      state.habits,
      state.achievements,
      state.profile
    );

    newlyUnlocked.forEach(achievementId => {
      dispatch({ type: ACTIONS.UNLOCK_ACHIEVEMENT, payload: { id: achievementId } });
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (achievement) {
        dispatch({
          type: ACTIONS.ADD_TOAST,
          payload: {
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `${achievement.icon} ${achievement.name}`,
            description: achievement.description,
            xp: achievement.xpReward,
          },
        });
        if (achievement.xpReward) {
          dispatch({ type: ACTIONS.ADD_XP, payload: { amount: achievement.xpReward } });
        }
      }
    });

    // Award freeze shield if any habit just hit 7-day streak milestone (skip on initial mount)
    const justHit7 = prevHabits !== null && state.habits.some(h => {
      const oldH = prevHabits.find(p => p.id === h.id);
      return oldH && (oldH.streak || 0) < 7 && (h.streak || 0) >= 7;
    });
    if (justHit7) {
      dispatch({ type: ACTIONS.TOGGLE_FREEZE_SHIELD });
      dispatch({
        type: ACTIONS.ADD_TOAST,
        payload: {
          type: 'info',
          title: '🛡️ Freeze Shield Earned!',
          message: 'You hit a 7-day streak!',
          description: 'Use it to protect a streak if you miss a day.',
        },
      });
    }
  }, [state.habits, state.achievements, state.profile]);

  const value = { state, dispatch };

  return createElement(StoreContext.Provider, { value }, children);
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
