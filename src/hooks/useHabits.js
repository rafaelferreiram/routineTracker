import { useCallback } from 'react';
import { useStore, ACTIONS } from '../store/useStore.js';
import { getTodayString, isHabitApplicableToday, isCompletedToday, getLast7Days, calculateStreak } from '../utils/dateUtils.js';
import { calculateXPGain, computeStats, getLevelFromXP, getLevelProgress, getLevelTitle, getLevelIcon } from '../utils/gamification.js';

export function useHabits() {
  const { state, dispatch } = useStore();
  const { habits, profile, achievements, settings, toasts, confetti, levelUpPending } = state;

  // ─── Computed Values ───────────────────────────────────────────────────────

  const today = getTodayString();
  const todayHabits = habits.filter(h => isHabitApplicableToday(h));
  const completedToday = todayHabits.filter(h => isCompletedToday(h));
  const completionPercent = todayHabits.length > 0
    ? Math.round((completedToday.length / todayHabits.length) * 100)
    : 0;

  const stats = computeStats(habits);
  const currentLevel = getLevelFromXP(profile.totalXP || 0);
  const levelProgress = getLevelProgress(profile.totalXP || 0);
  const levelTitle = getLevelTitle(currentLevel);
  const levelIcon = getLevelIcon(currentLevel);

  // New profile fields
  const freezeShields = profile.freezeShields || 0;
  const focusHabitId = profile.focusHabitId;
  const focusHabitDate = profile.focusHabitDate;

  // ─── Actions ──────────────────────────────────────────────────────────────

  const addHabit = useCallback((habitData) => {
    dispatch({ type: ACTIONS.ADD_HABIT, payload: habitData });
  }, [dispatch]);

  const updateHabit = useCallback((habitData) => {
    dispatch({ type: ACTIONS.UPDATE_HABIT, payload: habitData });
  }, [dispatch]);

  const deleteHabit = useCallback((habitId) => {
    dispatch({ type: ACTIONS.DELETE_HABIT, payload: { id: habitId } });
  }, [dispatch]);

  const toggleCompletion = useCallback((habitId, date = null) => {
    const targetDate = date || today;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const wasCompleted = habit.completions.includes(targetDate);
    const isToday = targetDate === today;

    dispatch({
      type: ACTIONS.TOGGLE_COMPLETION,
      payload: { habitId, date: targetDate, timestamp: new Date().toISOString() },
    });

    // Only grant XP for completing (not uncompleting) and only for today
    if (!wasCompleted && isToday) {
      let { xp, reasons } = calculateXPGain(habits, habitId, targetDate);

      // Focus habit 2× XP bonus
      const isFocusHabit = profile.focusHabitId === habitId && profile.focusHabitDate === targetDate;
      if (isFocusHabit) {
        const focusBonus = xp; // double total XP
        xp += focusBonus;
        reasons = [...reasons, { label: 'Focus Habit 2× bonus!', xp: focusBonus }];
      }

      dispatch({ type: ACTIONS.ADD_XP, payload: { amount: xp } });

      // Show XP toast
      dispatch({
        type: ACTIONS.ADD_TOAST,
        payload: {
          type: 'xp',
          title: `+${xp} XP`,
          message: habit.name,
          reasons,
        },
      });

      // Check if all done today (after this toggle)
      const otherTodayHabits = todayHabits.filter(h => h.id !== habitId);
      const allOthersDone = otherTodayHabits.every(h => h.completions.includes(today));

      if (allOthersDone && otherTodayHabits.length > 0) {
        // Trigger confetti for perfect day!
        dispatch({ type: ACTIONS.SET_CONFETTI, payload: { active: true } });
        setTimeout(() => {
          dispatch({ type: ACTIONS.SET_CONFETTI, payload: { active: false } });
        }, 4000);
      }
    }
  }, [habits, todayHabits, today, profile.focusHabitId, profile.focusHabitDate, dispatch]);

  const updateProfile = useCallback((profileData) => {
    dispatch({ type: ACTIONS.UPDATE_PROFILE, payload: profileData });
  }, [dispatch]);

  const removeToast = useCallback((toastId) => {
    dispatch({ type: ACTIONS.REMOVE_TOAST, payload: { id: toastId } });
  }, [dispatch]);

  const addToast = useCallback((toast) => {
    dispatch({ type: ACTIONS.ADD_TOAST, payload: toast });
  }, [dispatch]);

  // ─── New Action Dispatchers ────────────────────────────────────────────────

  const useFreezeShield = useCallback((habitId, date) => {
    dispatch({ type: ACTIONS.USE_FREEZE_SHIELD, payload: { habitId, date } });
    dispatch({
      type: ACTIONS.ADD_TOAST,
      payload: {
        type: 'info',
        title: '🛡️ Freeze Shield Used!',
        message: 'Streak protected!',
        description: 'Your streak lives to fight another day.',
      },
    });
  }, [dispatch]);

  const setFocusHabit = useCallback((habitId, date) => {
    dispatch({ type: ACTIONS.SET_FOCUS_HABIT, payload: { habitId, date } });
  }, [dispatch]);

  const clearFocusHabit = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_FOCUS_HABIT });
  }, [dispatch]);

  const clearLevelUp = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_LEVEL_UP });
  }, [dispatch]);

  // ─── Selectors ────────────────────────────────────────────────────────────

  const getHabitById = useCallback((id) => habits.find(h => h.id === id), [habits]);

  const getHabitStats = useCallback((habit) => {
    const streak = calculateStreak(habit.completions, habit.frequency);
    const totalCompletions = habit.completions.length;
    const last7 = getLast7Days();
    const last7Completions = last7.filter(d => habit.completions.includes(d)).length;
    const last7Rate = Math.round((last7Completions / 7) * 100);

    return {
      streak,
      bestStreak: Math.max(habit.bestStreak || 0, streak),
      totalCompletions,
      last7Completions,
      last7Rate,
      isCompletedToday: habit.completions.includes(today),
    };
  }, [today]);

  return {
    // State
    habits,
    profile,
    achievements,
    settings,
    toasts,
    confetti,

    // New state
    freezeShields,
    focusHabitId,
    focusHabitDate,
    levelUpPending,

    // Computed
    today,
    todayHabits,
    completedToday,
    completionPercent,
    stats,
    currentLevel,
    levelProgress,
    levelTitle,
    levelIcon,

    // Actions
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    updateProfile,
    removeToast,
    addToast,
    getHabitById,
    getHabitStats,

    // New actions
    useFreezeShield,
    setFocusHabit,
    clearFocusHabit,
    clearLevelUp,
  };
}
