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
      return {
        toasts: [],
        confetti: false,
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
    },
    habits: DEFAULT_HABITS,
    achievements: [],
    journalEntries: [],
    settings: { theme: 'dark' },
    toasts: [],
    confetti: false,
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
      const newTotalXP = (state.profile.totalXP || 0) + action.payload.amount;
      const newLevel = getLevelFromXP(newTotalXP);
      return {
        ...state,
        profile: {
          ...state.profile,
          totalXP: newTotalXP,
          level: newLevel,
        },
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

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const prevHabitsRef = useRef(state.habits);
  const prevAchievementsRef = useRef(state.achievements);

  // Persist to localStorage (debounced)
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
          settings: state.settings,
        };
        localStorage.setItem('routineTracker_v3', JSON.stringify(toSave));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }, 300);
    return () => clearTimeout(saveTimerRef.current);
  }, [state.profile, state.habits, state.achievements, state.journalEntries, state.settings]);

  // Check achievements whenever habits change
  useEffect(() => {
    if (prevHabitsRef.current === state.habits) return;
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
  }, [state.habits, state.achievements, state.profile]);

  const value = { state, dispatch };

  return createElement(StoreContext.Provider, { value }, children);
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
