import { getTodayString, getLast7Days, calculateStreak, formatDateString } from './dateUtils.js';

// ─── XP Configuration ───────────────────────────────────────────────────────

export const XP_VALUES = {
  HABIT_COMPLETION: 10,
  PERFECT_DAY_BONUS: 25,
  PERFECT_WEEK_BONUS: 50,
  STREAK_3_BONUS: 5,
  STREAK_7_BONUS: 15,
  STREAK_30_BONUS: 50,
};

export const DIFFICULTY_MULTIPLIERS = {
  easy: 0.75,
  medium: 1.0,
  hard: 1.5,
};

export const DIFFICULTY_LABELS = {
  easy: { label: 'Easy', color: '#4ade80', icon: '🟢' },
  medium: { label: 'Medium', color: '#fbbf24', icon: '🟡' },
  hard: { label: 'Hard', color: '#f87171', icon: '🔴' },
};

// ─── Level Thresholds ────────────────────────────────────────────────────────

export function getLevelThreshold(level) {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  if (level === 3) return 250;
  if (level === 4) return 500;
  if (level === 5) return 1000;
  // Level 6+ = 1000 + (level-5)*500
  return 1000 + (level - 5) * 500;
}

export function getLevelFromXP(totalXP) {
  let level = 1;
  while (getLevelThreshold(level + 1) <= totalXP) {
    level++;
    if (level >= 50) break;
  }
  return level;
}

export function getXPForCurrentLevel(totalXP) {
  const level = getLevelFromXP(totalXP);
  return totalXP - getLevelThreshold(level);
}

export function getXPNeededForNextLevel(totalXP) {
  const level = getLevelFromXP(totalXP);
  if (level >= 50) return 0;
  return getLevelThreshold(level + 1) - getLevelThreshold(level);
}

export function getLevelProgress(totalXP) {
  const level = getLevelFromXP(totalXP);
  if (level >= 50) return 100;
  const currentLevelXP = getXPForCurrentLevel(totalXP);
  const neededXP = getXPNeededForNextLevel(totalXP);
  return Math.min(100, Math.round((currentLevelXP / neededXP) * 100));
}

// ─── Level Titles ────────────────────────────────────────────────────────────

export function getLevelTitle(level) {
  if (level <= 5) return 'Beginner';
  if (level <= 10) return 'Apprentice';
  if (level <= 20) return 'Dedicated';
  if (level <= 30) return 'Champion';
  if (level <= 40) return 'Legend';
  return 'Master';
}

export function getLevelColor(level) {
  if (level <= 5) return '#94A3B8';   // gray
  if (level <= 10) return '#34D399';  // green
  if (level <= 20) return '#60A5FA';  // blue
  if (level <= 30) return '#A78BFA';  // purple
  if (level <= 40) return '#FBBF24';  // gold
  return '#F87171';                   // red (master)
}

export function getLevelIcon(level) {
  if (level <= 5) return '🌱';
  if (level <= 10) return '⚡';
  if (level <= 20) return '🔥';
  if (level <= 30) return '💎';
  if (level <= 40) return '👑';
  return '🌟';
}

// ─── Achievement Definitions ─────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  // ── General ───────────────────────────────────────────────────────────────
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your first habit ever',
    icon: '👣',
    rarity: 'common',
    xpReward: 20,
  },
  {
    id: 'habit_builder',
    name: 'Habit Builder',
    description: 'Create 5 or more habits',
    icon: '🏗️',
    rarity: 'common',
    xpReward: 40,
  },
  {
    id: 'fifty_done',
    name: 'Fifty Done',
    description: 'Reach 50 total habit completions',
    icon: '✌️',
    rarity: 'common',
    xpReward: 50,
  },
  {
    id: 'double_century',
    name: 'Double Century',
    description: 'Reach 200 total habit completions',
    icon: '🎖️',
    rarity: 'uncommon',
    xpReward: 120,
  },
  {
    id: 'five_hundred',
    name: 'Five Hundred',
    description: 'Reach 500 total habit completions',
    icon: '🏅',
    rarity: 'rare',
    xpReward: 250,
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Complete any single habit 100 times',
    icon: '💯',
    rarity: 'epic',
    xpReward: 500,
  },

  // ── Streaks ───────────────────────────────────────────────────────────────
  {
    id: 'on_fire',
    name: 'On Fire',
    description: 'Achieve a 3-day streak on any habit',
    icon: '🔥',
    rarity: 'common',
    xpReward: 30,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day streak on any habit',
    icon: '⚔️',
    rarity: 'uncommon',
    xpReward: 75,
  },
  {
    id: 'consistent',
    name: 'Consistent',
    description: 'Maintain any habit streak for 14 days',
    icon: '🎯',
    rarity: 'rare',
    xpReward: 150,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Maintain any habit streak for 21 days',
    icon: '🌊',
    rarity: 'rare',
    xpReward: 200,
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Achieve a 30-day streak on any habit',
    icon: '🛡️',
    rarity: 'rare',
    xpReward: 300,
  },
  {
    id: 'two_months',
    name: 'Two Months Strong',
    description: 'Achieve a 60-day streak on any habit',
    icon: '💎',
    rarity: 'epic',
    xpReward: 600,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Achieve a 100-day streak on any habit',
    icon: '👑',
    rarity: 'legendary',
    xpReward: 1000,
  },

  // ── Perfect Days ──────────────────────────────────────────────────────────
  {
    id: 'perfect_day',
    name: 'Perfect Day',
    description: 'Complete all habits in one day',
    icon: '⭐',
    rarity: 'uncommon',
    xpReward: 50,
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete all habits every day for 7 days',
    icon: '🏆',
    rarity: 'rare',
    xpReward: 200,
  },
  {
    id: 'perfect_month',
    name: 'Perfect Month',
    description: 'Accumulate 30 perfect days',
    icon: '🌟',
    rarity: 'epic',
    xpReward: 800,
  },

  // ── Early Bird ────────────────────────────────────────────────────────────
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete all habits before noon',
    icon: '🌅',
    rarity: 'uncommon',
    xpReward: 60,
  },

  // ── Jiu Jitsu Graduations ─────────────────────────────────────────────────
  {
    id: 'bjj_white_1',
    name: 'White Belt · 1st Degree',
    description: 'Train Jiu Jitsu 10 times — first stripe earned!',
    icon: '🥋',
    rarity: 'uncommon',
    xpReward: 100,
  },
  {
    id: 'bjj_white_2',
    name: 'White Belt · 2nd Degree',
    description: 'Train Jiu Jitsu 25 times — consistency is key',
    icon: '🥋',
    rarity: 'rare',
    xpReward: 150,
  },
  {
    id: 'bjj_white_3',
    name: 'White Belt · 3rd Degree',
    description: 'Train Jiu Jitsu 50 times — half way to blue!',
    icon: '🥋',
    rarity: 'rare',
    xpReward: 200,
  },
  {
    id: 'bjj_white_4',
    name: 'White Belt · 4th Degree',
    description: 'Train Jiu Jitsu 75 times — almost there!',
    icon: '🥋',
    rarity: 'epic',
    xpReward: 350,
  },
  {
    id: 'bjj_blue_belt',
    name: 'Blue Belt',
    description: 'Train Jiu Jitsu 120 times — a true grappler is born!',
    icon: '🟦',
    rarity: 'legendary',
    xpReward: 1000,
  },

  // ── Faith ─────────────────────────────────────────────────────────────────
  {
    id: 'prayer_warrior',
    name: 'Prayer Warrior',
    description: 'Complete the Pray habit 30 times',
    icon: '🙏',
    rarity: 'uncommon',
    xpReward: 100,
  },
  {
    id: 'grateful_heart',
    name: 'Grateful Heart',
    description: 'Thank God 50 times',
    icon: '✨',
    rarity: 'rare',
    xpReward: 150,
  },

  // ── Study ─────────────────────────────────────────────────────────────────
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Complete Read time 30 times',
    icon: '📖',
    rarity: 'uncommon',
    xpReward: 80,
  },
  {
    id: 'ai_pioneer',
    name: 'AI Pioneer',
    description: 'Study AI 20 times',
    icon: '🤖',
    rarity: 'uncommon',
    xpReward: 80,
  },

  // ── Family ────────────────────────────────────────────────────────────────
  {
    id: 'family_first',
    name: 'Family First',
    description: 'Log Family time 30 times',
    icon: '❤️',
    rarity: 'uncommon',
    xpReward: 100,
  },
  {
    id: 'thankful_soul',
    name: 'Thankful Soul',
    description: 'Be Thankful 14 days in a row',
    icon: '💝',
    rarity: 'rare',
    xpReward: 150,
  },

  // ── Work ──────────────────────────────────────────────────────────────────
  {
    id: 'meeting_champ',
    name: 'Meeting Champ',
    description: 'Complete any daily meeting habit 20 times',
    icon: '📊',
    rarity: 'uncommon',
    xpReward: 80,
  },

  // ── New Features ──────────────────────────────────────────────────────────
  {
    id: 'freeze_shield',
    name: 'Prepared',
    description: 'Use your first Freeze Shield to protect a streak',
    icon: '🛡️',
    rarity: 'uncommon',
    xpReward: 80,
  },
  {
    id: 'hard_mode',
    name: 'Hard Mode',
    description: 'Complete a Hard difficulty habit 10 times',
    icon: '💀',
    rarity: 'rare',
    xpReward: 200,
  },
  {
    id: 'focus_master',
    name: 'Focus Master',
    description: 'Complete your Focus Habit 7 times',
    icon: '🎯',
    rarity: 'uncommon',
    xpReward: 100,
  },
];

export const RARITY_COLORS = {
  common: { bg: '#374151', border: '#6B7280', text: '#D1D5DB', glow: '' },
  uncommon: { bg: '#14532D', border: '#16A34A', text: '#86EFAC', glow: '0 0 10px rgba(22,163,74,0.4)' },
  rare: { bg: '#1E3A5F', border: '#3B82F6', text: '#93C5FD', glow: '0 0 10px rgba(59,130,246,0.4)' },
  epic: { bg: '#3B0764', border: '#9333EA', text: '#D8B4FE', glow: '0 0 15px rgba(147,51,234,0.5)' },
  legendary: { bg: '#451A03', border: '#F59E0B', text: '#FDE68A', glow: '0 0 20px rgba(245,158,11,0.6)' },
};

// ─── Achievement Checking ─────────────────────────────────────────────────────

export function checkAchievements(habits, unlockedAchievements, profile) {
  const newlyUnlocked = [];
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));
  const today = getTodayString();
  const last7 = getLast7Days();

  const check = (id) => !unlockedIds.has(id);

  // First Step: any completion ever
  if (check('first_step')) {
    const anyCompletion = habits.some(h => h.completions.length > 0);
    if (anyCompletion) newlyUnlocked.push('first_step');
  }

  // On Fire: 3-day streak
  if (check('on_fire')) {
    const hasStreak3 = habits.some(h => calculateStreak(h.completions, h.frequency) >= 3 || h.bestStreak >= 3);
    if (hasStreak3) newlyUnlocked.push('on_fire');
  }

  // Week Warrior: 7-day streak
  if (check('week_warrior')) {
    const hasStreak7 = habits.some(h => calculateStreak(h.completions, h.frequency) >= 7 || h.bestStreak >= 7);
    if (hasStreak7) newlyUnlocked.push('week_warrior');
  }

  // Iron Will: 30-day streak
  if (check('iron_will')) {
    const hasStreak30 = habits.some(h => calculateStreak(h.completions, h.frequency) >= 30 || h.bestStreak >= 30);
    if (hasStreak30) newlyUnlocked.push('iron_will');
  }

  // Perfect Day: all habits completed on same day
  if (check('perfect_day') && habits.length > 0) {
    const todayHabits = habits.filter(h => {
      const freq = h.frequency || 'daily';
      const d = new Date(today + 'T00:00:00');
      const dow = d.getDay();
      if (freq === 'weekdays' && (dow === 0 || dow === 6)) return false;
      if (freq === 'weekends' && dow >= 1 && dow <= 5) return false;
      return true;
    });
    const allDoneToday = todayHabits.length > 0 && todayHabits.every(h => h.completions.includes(today));
    if (allDoneToday) newlyUnlocked.push('perfect_day');
  }

  // Perfect Week: all habits completed every day for last 7 days
  if (check('perfect_week') && habits.length > 0) {
    const perfectWeek = last7.every(date => {
      const d = new Date(date + 'T00:00:00');
      const dow = d.getDay();
      const applicableHabits = habits.filter(h => {
        const freq = h.frequency || 'daily';
        if (freq === 'weekdays' && (dow === 0 || dow === 6)) return false;
        if (freq === 'weekends' && dow >= 1 && dow <= 5) return false;
        return true;
      });
      if (applicableHabits.length === 0) return true;
      return applicableHabits.every(h => h.completions.includes(date));
    });
    if (perfectWeek) newlyUnlocked.push('perfect_week');
  }

  // Habit Builder: 5 or more habits
  if (check('habit_builder') && habits.length >= 5) {
    newlyUnlocked.push('habit_builder');
  }

  // Century: any habit completed 100+ times
  if (check('century')) {
    const hasCentury = habits.some(h => h.completions.length >= 100);
    if (hasCentury) newlyUnlocked.push('century');
  }

  // Early Bird: all habits completed before noon (check completionTimestamps)
  if (check('early_bird') && habits.length > 0) {
    const todayHabits = habits.filter(h => {
      const freq = h.frequency || 'daily';
      const d = new Date(today + 'T00:00:00');
      const dow = d.getDay();
      if (freq === 'weekdays' && (dow === 0 || dow === 6)) return false;
      if (freq === 'weekends' && dow >= 1 && dow <= 5) return false;
      return true;
    });
    if (todayHabits.length > 0) {
      const allTimestamps = todayHabits.map(h => {
        const ts = (h.completionTimestamps || {})[today];
        return ts;
      });
      const allBeforeNoon = allTimestamps.every(ts => {
        if (!ts) return false;
        const hour = new Date(ts).getHours();
        return hour < 12;
      });
      if (allBeforeNoon) newlyUnlocked.push('early_bird');
    }
  }

  // Consistent: 14-day streak
  if (check('consistent')) {
    const hasStreak14 = habits.some(h => calculateStreak(h.completions, h.frequency) >= 14 || h.bestStreak >= 14);
    if (hasStreak14) newlyUnlocked.push('consistent');
  }

  // Unstoppable: 21-day streak
  if (check('unstoppable')) {
    const has21 = habits.some(h => calculateStreak(h.completions, h.frequency) >= 21 || h.bestStreak >= 21);
    if (has21) newlyUnlocked.push('unstoppable');
  }

  // Two Months Strong: 60-day streak
  if (check('two_months')) {
    const has60 = habits.some(h => calculateStreak(h.completions, h.frequency) >= 60 || h.bestStreak >= 60);
    if (has60) newlyUnlocked.push('two_months');
  }

  // Centurion: 100-day streak
  if (check('centurion')) {
    const has100 = habits.some(h => calculateStreak(h.completions, h.frequency) >= 100 || h.bestStreak >= 100);
    if (has100) newlyUnlocked.push('centurion');
  }

  // Total completions
  const totalCompletions = habits.reduce((sum, h) => sum + h.completions.length, 0);
  if (check('fifty_done') && totalCompletions >= 50) newlyUnlocked.push('fifty_done');
  if (check('double_century') && totalCompletions >= 200) newlyUnlocked.push('double_century');
  if (check('five_hundred') && totalCompletions >= 500) newlyUnlocked.push('five_hundred');

  // Perfect Month: 30 perfect days total
  if (check('perfect_month') && habits.length > 0) {
    let perfectDayCount = 0;
    const allDates = new Set(habits.flatMap(h => h.completions));
    allDates.forEach(date => {
      if (date > today) return;
      const d = new Date(date + 'T00:00:00');
      const dow = d.getDay();
      const applicable = habits.filter(h => {
        const freq = h.frequency || 'daily';
        if (freq === 'weekdays' && (dow === 0 || dow === 6)) return false;
        if (freq === 'weekends' && dow >= 1 && dow <= 5) return false;
        return true;
      });
      if (applicable.length > 0 && applicable.every(h => h.completions.includes(date))) {
        perfectDayCount++;
      }
    });
    if (perfectDayCount >= 30) newlyUnlocked.push('perfect_month');
  }

  // Jiu Jitsu graduations
  const bjj = habits.find(h => h.id === 'habit_jiujitsu');
  const bjjCount = bjj ? bjj.completions.length : 0;
  if (check('bjj_white_1') && bjjCount >= 10) newlyUnlocked.push('bjj_white_1');
  if (check('bjj_white_2') && bjjCount >= 25) newlyUnlocked.push('bjj_white_2');
  if (check('bjj_white_3') && bjjCount >= 50) newlyUnlocked.push('bjj_white_3');
  if (check('bjj_white_4') && bjjCount >= 75) newlyUnlocked.push('bjj_white_4');
  if (check('bjj_blue_belt') && bjjCount >= 120) newlyUnlocked.push('bjj_blue_belt');

  // Faith
  const prayHabit = habits.find(h => h.id === 'habit_pray');
  if (check('prayer_warrior') && prayHabit && prayHabit.completions.length >= 30) {
    newlyUnlocked.push('prayer_warrior');
  }
  const thankHabit = habits.find(h => h.id === 'habit_thank');
  if (check('grateful_heart') && thankHabit && thankHabit.completions.length >= 50) {
    newlyUnlocked.push('grateful_heart');
  }

  // Study
  const readHabit = habits.find(h => h.id === 'habit_read');
  if (check('bookworm') && readHabit && readHabit.completions.length >= 30) {
    newlyUnlocked.push('bookworm');
  }
  const aiHabit = habits.find(h => h.id === 'habit_study_ai');
  if (check('ai_pioneer') && aiHabit && aiHabit.completions.length >= 20) {
    newlyUnlocked.push('ai_pioneer');
  }

  // Family
  const familyHabit = habits.find(h => h.id === 'habit_family_time');
  if (check('family_first') && familyHabit && familyHabit.completions.length >= 30) {
    newlyUnlocked.push('family_first');
  }
  const thankfulHabit = habits.find(h => h.id === 'habit_thankful');
  if (check('thankful_soul') && thankfulHabit) {
    const streak = calculateStreak(thankfulHabit.completions, thankfulHabit.frequency);
    if (streak >= 14 || thankfulHabit.bestStreak >= 14) newlyUnlocked.push('thankful_soul');
  }

  // Work: any daily meeting habit completed 20 times
  if (check('meeting_champ')) {
    const meetingHabits = habits.filter(h => h.id && h.id.startsWith('habit_meeting_'));
    const hasMeeting20 = meetingHabits.some(h => h.completions.length >= 20);
    if (hasMeeting20) newlyUnlocked.push('meeting_champ');
  }

  return newlyUnlocked;
}

// ─── XP Calculation ──────────────────────────────────────────────────────────

export function calculateXPGain(habits, habitId, date = null) {
  const targetDate = date || getTodayString();
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return { xp: 0, reasons: [] };

  const difficulty = habit.difficulty || 'medium';
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
  const baseXP = Math.round(XP_VALUES.HABIT_COMPLETION * multiplier);

  const reasons = [{ label: multiplier !== 1.0 ? `Habit completed (${difficulty})` : 'Habit completed', xp: baseXP }];
  let totalXP = baseXP;

  // Check streak bonuses
  const streak = calculateStreak([...habit.completions, targetDate], habit.frequency);
  if (streak === 3) {
    reasons.push({ label: '3-day streak bonus!', xp: XP_VALUES.STREAK_3_BONUS });
    totalXP += XP_VALUES.STREAK_3_BONUS;
  } else if (streak === 7) {
    reasons.push({ label: '7-day streak bonus!', xp: XP_VALUES.STREAK_7_BONUS });
    totalXP += XP_VALUES.STREAK_7_BONUS;
  } else if (streak === 30) {
    reasons.push({ label: '30-day streak bonus!', xp: XP_VALUES.STREAK_30_BONUS });
    totalXP += XP_VALUES.STREAK_30_BONUS;
  }

  // Check if this completes the day
  const otherHabitsForToday = habits.filter(h => {
    if (h.id === habitId) return false;
    const freq = h.frequency || 'daily';
    const d = new Date(targetDate + 'T00:00:00');
    const dow = d.getDay();
    if (freq === 'weekdays' && (dow === 0 || dow === 6)) return false;
    if (freq === 'weekends' && dow >= 1 && dow <= 5) return false;
    return true;
  });

  const allOthersDone = otherHabitsForToday.every(h => h.completions.includes(targetDate));
  if (allOthersDone && otherHabitsForToday.length > 0) {
    reasons.push({ label: 'Perfect day bonus!', xp: XP_VALUES.PERFECT_DAY_BONUS });
    totalXP += XP_VALUES.PERFECT_DAY_BONUS;
  }

  return { xp: totalXP, reasons };
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export function computeStats(habits) {
  if (!habits || habits.length === 0) {
    return {
      totalCompletions: 0,
      currentLongestStreak: 0,
      bestStreakEver: 0,
      completionRateLast7: 0,
      completedTodayCount: 0,
      totalHabitsToday: 0,
    };
  }

  const today = getTodayString();
  const last7 = getLast7Days();

  const totalCompletions = habits.reduce((sum, h) => sum + h.completions.length, 0);

  const currentLongestStreak = habits.reduce((max, h) => {
    const s = calculateStreak(h.completions, h.frequency);
    return Math.max(max, s);
  }, 0);

  const bestStreakEver = habits.reduce((max, h) => {
    return Math.max(max, h.bestStreak || 0, calculateStreak(h.completions, h.frequency));
  }, 0);

  // Completion rate for last 7 days
  let possibleCompletions = 0;
  let actualCompletions = 0;
  last7.forEach(date => {
    const d = new Date(date + 'T00:00:00');
    const dow = d.getDay();
    habits.forEach(h => {
      const freq = h.frequency || 'daily';
      if (freq === 'weekdays' && (dow === 0 || dow === 6)) return;
      if (freq === 'weekends' && dow >= 1 && dow <= 5) return;
      possibleCompletions++;
      if (h.completions.includes(date)) actualCompletions++;
    });
  });

  const completionRateLast7 = possibleCompletions > 0
    ? Math.round((actualCompletions / possibleCompletions) * 100)
    : 0;

  // Today's stats
  const todayDow = new Date(today + 'T00:00:00').getDay();
  const todayHabits = habits.filter(h => {
    const freq = h.frequency || 'daily';
    if (freq === 'weekdays' && (todayDow === 0 || todayDow === 6)) return false;
    if (freq === 'weekends' && todayDow >= 1 && todayDow <= 5) return false;
    return true;
  });

  const completedTodayCount = todayHabits.filter(h => h.completions.includes(today)).length;
  const totalHabitsToday = todayHabits.length;

  return {
    totalCompletions,
    currentLongestStreak,
    bestStreakEver,
    completionRateLast7,
    completedTodayCount,
    totalHabitsToday,
  };
}
