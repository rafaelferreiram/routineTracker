import { getTodayString, getLast7Days, calculateStreak } from './dateUtils.js';

const MEAL_IDS_CHECK = ['habit_breakfast', 'habit_lunch', 'habit_dinner', 'habit_fruits', 'habit_vitamins'];

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
  if (level <= 5) return '#94A3B8';
  if (level <= 10) return '#34D399';
  if (level <= 20) return '#60A5FA';
  if (level <= 30) return '#A78BFA';
  if (level <= 40) return '#FBBF24';
  return '#F87171';
}

export function getLevelIcon(level) {
  if (level <= 5) return '🌱';
  if (level <= 10) return '⚡';
  if (level <= 20) return '🔥';
  if (level <= 30) return '💎';
  if (level <= 40) return '👑';
  return '🌟';
}

// ─── Trophy Tier System (PlayStation-inspired) ───────────────────────────────

export const TROPHY_TIERS = {
  bronze:   { bg: '#3D2813', border: '#CD7F32', text: '#E8C89E', glow: '',                                        icon: '🥉' },
  silver:   { bg: '#2A2D31', border: '#C0C0C0', text: '#E8E8E8', glow: '0 0 8px rgba(192,192,192,0.3)',           icon: '🥈' },
  gold:     { bg: '#3D2F00', border: '#FFD700', text: '#FFF2B3', glow: '0 0 12px rgba(255,215,0,0.4)',            icon: '🥇' },
  platinum: { bg: '#1A1A2E', border: '#B8D4E3', text: '#F0F8FF', glow: '0 0 18px rgba(184,212,227,0.5)',          icon: '💎' },
};

// Backward-compatible alias
export const RARITY_COLORS = TROPHY_TIERS;

// Group visibility thresholds: how many active (unlocked & not disabled) trophies needed
export const GROUP_THRESHOLDS = { 1: 0, 2: 7, 3: 14, 4: 21 };

// ─── Achievement Definitions ─────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  // ══ GROUP 1 (Always visible - First 10) ═══════════════════════════════════
  { id: 'first_step',      name: 'First Step',      description: 'Complete your first habit ever',              icon: '👣',  tier: 'bronze', group: 1, xpReward: 20  },
  { id: 'on_fire',         name: 'On Fire',         description: 'Achieve a 3-day streak on any habit',        icon: '🔥',  tier: 'bronze', group: 1, xpReward: 30  },
  { id: 'habit_builder',   name: 'Habit Builder',   description: 'Create 5 or more habits',                    icon: '🏗️',  tier: 'bronze', group: 1, xpReward: 40  },
  { id: 'fifty_done',      name: 'Fifty Done',      description: 'Reach 50 total habit completions',           icon: '✌️',  tier: 'bronze', group: 1, xpReward: 50  },
  { id: 'perfect_day',     name: 'Perfect Day',     description: 'Complete all habits in one day',             icon: '⭐',  tier: 'silver', group: 1, xpReward: 50  },
  { id: 'week_warrior',    name: 'Week Warrior',    description: 'Achieve a 7-day streak on any habit',        icon: '⚔️',  tier: 'silver', group: 1, xpReward: 75  },
  { id: 'early_bird',      name: 'Early Bird',      description: 'Complete all habits before noon',            icon: '🌅',  tier: 'silver', group: 1, xpReward: 60  },
  { id: 'prayer_warrior',  name: 'Prayer Warrior',  description: 'Complete the Pray habit 30 times',           icon: '🙏',  tier: 'silver', group: 1, xpReward: 100 },
  { id: 'consistent',      name: 'Consistent',      description: 'Maintain any habit streak for 14 days',      icon: '🎯',  tier: 'gold',   group: 1, xpReward: 150 },
  { id: 'double_century',  name: 'Double Century',  description: 'Reach 200 total habit completions',          icon: '🎖️',  tier: 'gold',   group: 1, xpReward: 120 },

  // ══ GROUP 2 (Unlock at 7 trophies) ════════════════════════════════════════
  { id: 'unstoppable',       name: 'Unstoppable',       description: 'Maintain any habit streak for 21 days',          icon: '🌊',  tier: 'silver', group: 2, xpReward: 200 },
  { id: 'bookworm',          name: 'Bookworm',          description: 'Complete Read time 30 times',                    icon: '📖',  tier: 'silver', group: 2, xpReward: 80  },
  { id: 'ai_pioneer',        name: 'AI Pioneer',        description: 'Study AI 20 times',                             icon: '🤖',  tier: 'silver', group: 2, xpReward: 80  },
  { id: 'family_first',      name: 'Family First',      description: 'Log Family time 30 times',                      icon: '❤️',  tier: 'silver', group: 2, xpReward: 100 },
  { id: 'meeting_champ',     name: 'Meeting Champ',     description: 'Complete any daily meeting habit 20 times',      icon: '📊',  tier: 'silver', group: 2, xpReward: 80  },
  { id: 'hydration_week',    name: 'Hydration Habit',   description: 'Hit the 2L water goal 7 days in a row',         icon: '💧',  tier: 'silver', group: 2, xpReward: 75  },
  { id: 'sleep_week',        name: 'Sleep Guardian',    description: 'Hit your sleep goal 7 nights in a row',          icon: '😴',  tier: 'silver', group: 2, xpReward: 75  },
  { id: 'meals_week',        name: 'Meal Prep Pro',     description: 'Complete all 5 meals every day for 7 days',      icon: '🥗',  tier: 'gold',   group: 2, xpReward: 100 },
  { id: 'iron_will',         name: 'Iron Will',         description: 'Achieve a 30-day streak on any habit',           icon: '🛡️',  tier: 'gold',   group: 2, xpReward: 300 },
  { id: 'perfect_streak_10', name: 'Perfect 10',        description: '10 consecutive perfect days',                    icon: '🔟',  tier: 'gold',   group: 2, xpReward: 100 },

  // ══ GROUP 3 (Unlock at 14 trophies) ═══════════════════════════════════════
  { id: 'five_hundred',       name: 'Five Hundred',     description: 'Reach 500 total habit completions',              icon: '🏅',  tier: 'gold',   group: 3, xpReward: 250 },
  { id: 'thankful_soul',      name: 'Thankful Soul',    description: 'Be Thankful 14 days in a row',                  icon: '💝',  tier: 'gold',   group: 3, xpReward: 150 },
  { id: 'grateful_heart',     name: 'Grateful Heart',   description: 'Thank God 50 times',                            icon: '✨',  tier: 'gold',   group: 3, xpReward: 150 },
  { id: 'bjj_white_1',        name: 'White Belt 1st',   description: 'Train Jiu Jitsu 10 times',                      icon: '🥋',  tier: 'silver', group: 3, xpReward: 100 },
  { id: 'bjj_white_2',        name: 'White Belt 2nd',   description: 'Train Jiu Jitsu 25 times',                      icon: '🥋',  tier: 'gold',   group: 3, xpReward: 150 },
  { id: 'double_training',    name: 'Double Threat',    description: 'Train Gym + Jiu Jitsu same day, 5 times',       icon: '⚔️',  tier: 'gold',   group: 3, xpReward: 150 },
  { id: 'hard_mode',          name: 'Hard Mode',        description: 'Complete a Hard difficulty habit 10 times',      icon: '💀',  tier: 'gold',   group: 3, xpReward: 200 },
  { id: 'focus_master',       name: 'Focus Master',     description: 'Complete your Focus Habit 7 times',              icon: '🎯',  tier: 'silver', group: 3, xpReward: 100 },
  { id: 'freeze_shield',      name: 'Prepared',         description: 'Use your first Freeze Shield',                  icon: '🛡️',  tier: 'silver', group: 3, xpReward: 80  },
  { id: 'perfect_streak_20',  name: 'Perfect 20',       description: '20 consecutive perfect days',                   icon: '🏅',  tier: 'gold',   group: 3, xpReward: 150 },

  // ══ GROUP 4 (Unlock at 21 trophies) ═══════════════════════════════════════
  { id: 'two_months',         name: 'Two Months Strong', description: 'Achieve a 60-day streak on any habit',          icon: '💎',  tier: 'gold',     group: 4, xpReward: 600  },
  { id: 'hydration_master',   name: 'Aquaman',           description: 'Hit the 2L water goal 21 days in a row',       icon: '🌊',  tier: 'gold',     group: 4, xpReward: 200  },
  { id: 'sleep_master',       name: 'REM King',          description: 'Hit your sleep goal 21 nights in a row',       icon: '🌙',  tier: 'gold',     group: 4, xpReward: 200  },
  { id: 'bjj_white_3',        name: 'White Belt 3rd',    description: 'Train Jiu Jitsu 50 times',                     icon: '🥋',  tier: 'gold',     group: 4, xpReward: 200  },
  { id: 'bjj_white_4',        name: 'White Belt 4th',    description: 'Train Jiu Jitsu 75 times',                     icon: '🥋',  tier: 'gold',     group: 4, xpReward: 350  },
  { id: 'perfect_week',       name: 'Perfect Week',      description: 'Complete all habits every day for 7 days',     icon: '🏆',  tier: 'gold',     group: 4, xpReward: 200  },
  { id: 'perfect_month',      name: 'Perfect Month',     description: 'Accumulate 30 perfect days',                   icon: '🌟',  tier: 'platinum', group: 4, xpReward: 800  },
  { id: 'century',            name: 'Century',           description: 'Complete any single habit 100 times',           icon: '💯',  tier: 'platinum', group: 4, xpReward: 500  },
  { id: 'bjj_blue_belt',      name: 'Blue Belt',         description: 'Train Jiu Jitsu 120 times',                    icon: '🟦',  tier: 'platinum', group: 4, xpReward: 1000 },
  { id: 'centurion',          name: 'Centurion',         description: 'Achieve a 100-day streak on any habit',        icon: '👑',  tier: 'platinum', group: 4, xpReward: 1000 },
  { id: 'wellness_warrior',   name: 'Wellness Warrior',  description: 'All health habits met 7 consecutive days',     icon: '🏥',  tier: 'platinum', group: 4, xpReward: 300  },
  { id: 'perfect_streak_30',  name: 'Iron Routine',      description: '30 consecutive perfect days (1 month!)',       icon: '🏆',  tier: 'platinum', group: 4, xpReward: 300  },
  { id: 'perfect_streak_60',  name: 'Diamond Routine',   description: '60 consecutive perfect days (2 months!)',      icon: '💎',  tier: 'platinum', group: 4, xpReward: 700  },
  { id: 'perfect_streak_90',  name: 'Legendary Routine',  description: '90 consecutive perfect days (3 months!)',     icon: '👑',  tier: 'platinum', group: 4, xpReward: 1000 },
];

// ─── Perfect Day Streak Calculator ───────────────────────────────────────────

export function calculatePerfectDayStreak(habits) {
  if (!habits || habits.length === 0) return 0;

  const today = getTodayString();
  let streak = 0;
  const date = new Date(today + 'T12:00:00');

  for (let i = 0; i < 365; i++) {
    const dateStr = date.toISOString().split('T')[0];
    const dow = date.getDay();

    const applicable = habits.filter(h => {
      const freq = h.frequency || 'daily';
      if (freq === 'weekdays' && (dow === 0 || dow === 6)) return false;
      if (freq === 'weekends' && dow >= 1 && dow <= 5) return false;
      if (h.createdAt && h.createdAt > dateStr) return false;
      return true;
    });

    if (applicable.length === 0) {
      date.setDate(date.getDate() - 1);
      continue;
    }

    const allDone = applicable.every(h => h.completions.includes(dateStr));
    if (!allDone) break;

    streak++;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

// ─── Achievement Checking ─────────────────────────────────────────────────────

export function checkAchievements(habits, unlockedAchievements, profile, disabledTrophies) {
  const newlyUnlocked = [];
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));
  const disabledIds = new Set(disabledTrophies || []);
  const today = getTodayString();
  const last7 = getLast7Days();

  // Skip both already-unlocked AND user-disabled trophies
  const check = (id) => !unlockedIds.has(id) && !disabledIds.has(id);

  // First Step: any completion ever
  if (check('first_step')) {
    if (habits.some(h => h.completions.length > 0)) newlyUnlocked.push('first_step');
  }

  // On Fire: 3-day streak
  if (check('on_fire')) {
    if (habits.some(h => calculateStreak(h.completions, h.frequency) >= 3 || h.bestStreak >= 3))
      newlyUnlocked.push('on_fire');
  }

  // Week Warrior: 7-day streak
  if (check('week_warrior')) {
    if (habits.some(h => calculateStreak(h.completions, h.frequency) >= 7 || h.bestStreak >= 7))
      newlyUnlocked.push('week_warrior');
  }

  // Iron Will: 30-day streak
  if (check('iron_will')) {
    if (habits.some(h => calculateStreak(h.completions, h.frequency) >= 30 || h.bestStreak >= 30))
      newlyUnlocked.push('iron_will');
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
    if (todayHabits.length > 0 && todayHabits.every(h => h.completions.includes(today)))
      newlyUnlocked.push('perfect_day');
  }

  // Perfect Week: all habits completed every day for last 7 days
  if (check('perfect_week') && habits.length > 0) {
    const perfectWeek = last7.every(date => {
      const d = new Date(date + 'T00:00:00');
      const dow = d.getDay();
      const applicable = habits.filter(h => {
        const freq = h.frequency || 'daily';
        if (freq === 'weekdays' && (dow === 0 || dow === 6)) return false;
        if (freq === 'weekends' && dow >= 1 && dow <= 5) return false;
        return true;
      });
      if (applicable.length === 0) return true;
      return applicable.every(h => h.completions.includes(date));
    });
    if (perfectWeek) newlyUnlocked.push('perfect_week');
  }

  // Habit Builder: 5+ habits
  if (check('habit_builder') && habits.length >= 5) newlyUnlocked.push('habit_builder');

  // Century: any habit 100+ completions
  if (check('century')) {
    if (habits.some(h => h.completions.length >= 100)) newlyUnlocked.push('century');
  }

  // Early Bird: all habits completed before noon
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
      const allBeforeNoon = todayHabits.every(h => {
        const ts = (h.completionTimestamps || {})[today];
        return ts && new Date(ts).getHours() < 12;
      });
      if (allBeforeNoon) newlyUnlocked.push('early_bird');
    }
  }

  // Consistent: 14-day streak
  if (check('consistent')) {
    if (habits.some(h => calculateStreak(h.completions, h.frequency) >= 14 || h.bestStreak >= 14))
      newlyUnlocked.push('consistent');
  }

  // Unstoppable: 21-day streak
  if (check('unstoppable')) {
    if (habits.some(h => calculateStreak(h.completions, h.frequency) >= 21 || h.bestStreak >= 21))
      newlyUnlocked.push('unstoppable');
  }

  // Two Months Strong: 60-day streak
  if (check('two_months')) {
    if (habits.some(h => calculateStreak(h.completions, h.frequency) >= 60 || h.bestStreak >= 60))
      newlyUnlocked.push('two_months');
  }

  // Centurion: 100-day streak
  if (check('centurion')) {
    if (habits.some(h => calculateStreak(h.completions, h.frequency) >= 100 || h.bestStreak >= 100))
      newlyUnlocked.push('centurion');
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
  if (check('prayer_warrior') && prayHabit && prayHabit.completions.length >= 30)
    newlyUnlocked.push('prayer_warrior');
  const thankHabit = habits.find(h => h.id === 'habit_thank');
  if (check('grateful_heart') && thankHabit && thankHabit.completions.length >= 50)
    newlyUnlocked.push('grateful_heart');

  // Study
  const readHabit = habits.find(h => h.id === 'habit_read');
  if (check('bookworm') && readHabit && readHabit.completions.length >= 30)
    newlyUnlocked.push('bookworm');
  const aiHabit = habits.find(h => h.id === 'habit_study_ai');
  if (check('ai_pioneer') && aiHabit && aiHabit.completions.length >= 20)
    newlyUnlocked.push('ai_pioneer');

  // Family
  const familyHabit = habits.find(h => h.id === 'habit_family_time');
  if (check('family_first') && familyHabit && familyHabit.completions.length >= 30)
    newlyUnlocked.push('family_first');
  const thankfulHabit = habits.find(h => h.id === 'habit_thankful');
  if (check('thankful_soul') && thankfulHabit) {
    const streak = calculateStreak(thankfulHabit.completions, thankfulHabit.frequency);
    if (streak >= 14 || thankfulHabit.bestStreak >= 14) newlyUnlocked.push('thankful_soul');
  }

  // Work: any daily meeting 20 times
  if (check('meeting_champ')) {
    const meetingHabits = habits.filter(h => h.id && h.id.startsWith('habit_meeting_'));
    if (meetingHabits.some(h => h.completions.length >= 20)) newlyUnlocked.push('meeting_champ');
  }

  // Health: Water
  const waterH = habits.find(h => h.id === 'habit_water');
  if (waterH) {
    const wStreak = calculateStreak(waterH.completions, waterH.frequency);
    if (check('hydration_week') && (wStreak >= 7 || waterH.bestStreak >= 7)) newlyUnlocked.push('hydration_week');
    if (check('hydration_master') && (wStreak >= 21 || waterH.bestStreak >= 21)) newlyUnlocked.push('hydration_master');
  }

  // Health: Sleep
  const sleepH = habits.find(h => h.id === 'habit_sleep');
  if (sleepH) {
    const sStreak = calculateStreak(sleepH.completions, sleepH.frequency);
    if (check('sleep_week') && (sStreak >= 7 || sleepH.bestStreak >= 7)) newlyUnlocked.push('sleep_week');
    if (check('sleep_master') && (sStreak >= 21 || sleepH.bestStreak >= 21)) newlyUnlocked.push('sleep_master');
  }

  // Health: Meals (all 5 for 7 consecutive days)
  if (check('meals_week')) {
    const mealHabits = MEAL_IDS_CHECK.map(id => habits.find(h => h.id === id)).filter(Boolean);
    if (mealHabits.length === 5) {
      const sortedDates = [...new Set(mealHabits.flatMap(h => h.completions))].sort();
      let maxMealStreak = 0, curMealStreak = 0, prev = null;
      for (const date of sortedDates) {
        const allDone = mealHabits.every(h => h.completions.includes(date));
        if (!allDone) { curMealStreak = 0; prev = null; continue; }
        if (prev) {
          const diff = Math.round((new Date(date + 'T00:00:00') - new Date(prev + 'T00:00:00')) / 86400000);
          curMealStreak = diff === 1 ? curMealStreak + 1 : 1;
        } else { curMealStreak = 1; }
        maxMealStreak = Math.max(maxMealStreak, curMealStreak);
        prev = date;
      }
      if (maxMealStreak >= 7) newlyUnlocked.push('meals_week');
    }
  }

  // Health: Double Training (gym + bjj same day, 5 times)
  if (check('double_training')) {
    const gymH = habits.find(h => h.id === 'habit_gym');
    const bjjH = habits.find(h => h.id === 'habit_jiujitsu');
    if (gymH && bjjH) {
      const gymSet = new Set(gymH.completions);
      if (bjjH.completions.filter(d => gymSet.has(d)).length >= 5) newlyUnlocked.push('double_training');
    }
  }

  // Wellness Warrior: all health habits met 7 consecutive days
  if (check('wellness_warrior')) {
    const healthHabits = [...MEAL_IDS_CHECK, 'habit_water', 'habit_sleep']
      .map(id => habits.find(h => h.id === id)).filter(Boolean);
    if (healthHabits.length >= 5) {
      const allDates = [...new Set(healthHabits.flatMap(h => h.completions))].sort();
      let maxStreak = 0, cur = 0, prev = null;
      for (const date of allDates) {
        const allDone = healthHabits.every(h => h.completions.includes(date));
        if (!allDone) { cur = 0; prev = null; continue; }
        if (prev) {
          const diff = Math.round((new Date(date + 'T00:00:00') - new Date(prev + 'T00:00:00')) / 86400000);
          cur = diff === 1 ? cur + 1 : 1;
        } else { cur = 1; }
        maxStreak = Math.max(maxStreak, cur);
        prev = date;
      }
      if (maxStreak >= 7) newlyUnlocked.push('wellness_warrior');
    }
  }

  // Perfect Day Streak milestones
  const perfectStreak = calculatePerfectDayStreak(habits);
  if (check('perfect_streak_10') && perfectStreak >= 10) newlyUnlocked.push('perfect_streak_10');
  if (check('perfect_streak_20') && perfectStreak >= 20) newlyUnlocked.push('perfect_streak_20');
  if (check('perfect_streak_30') && perfectStreak >= 30) newlyUnlocked.push('perfect_streak_30');
  if (check('perfect_streak_60') && perfectStreak >= 60) newlyUnlocked.push('perfect_streak_60');
  if (check('perfect_streak_90') && perfectStreak >= 90) newlyUnlocked.push('perfect_streak_90');

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
    return Math.max(max, calculateStreak(h.completions, h.frequency));
  }, 0);

  const bestStreakEver = habits.reduce((max, h) => {
    return Math.max(max, h.bestStreak || 0, calculateStreak(h.completions, h.frequency));
  }, 0);

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
