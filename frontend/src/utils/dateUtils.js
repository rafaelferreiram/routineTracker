/**
 * Returns today's date as "YYYY-MM-DD"
 */
export function getTodayString() {
  const now = new Date();
  return formatDateString(now);
}

/**
 * Formats a Date object as "YYYY-MM-DD"
 */
export function formatDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns last N days as array of date strings (oldest first, today last)
 */
export function getLastNDays(n = 7) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDateString(d));
  }
  return days;
}

/**
 * Returns last 7 days including today
 */
export function getLast7Days() {
  return getLastNDays(7);
}

/**
 * Checks if a habit was completed today
 */
export function isCompletedToday(habit) {
  const today = getTodayString();
  return habit.completions.includes(today);
}

/**
 * Checks if a habit was completed on a specific date
 */
export function isCompletedOnDate(habit, dateString) {
  return habit.completions.includes(dateString);
}

/**
 * Returns a human-readable relative date label
 */
export function getDayLabel(dateString) {
  const today = getTodayString();
  const yesterday = formatDateString(new Date(Date.now() - 86400000));
  if (dateString === today) return 'Today';
  if (dateString === yesterday) return 'Yesterday';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Returns the short weekday name for a date string (Mon, Tue, etc.)
 */
export function getShortWeekday(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Gets greeting based on time of day
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Returns formatted date for display
 */
export function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Returns the weekly target for x-per-week frequency strings
 */
export function getWeeklyTarget(frequency) {
  if (frequency === 'weekly_1') return 1;
  if (frequency === 'weekly_2') return 2;
  if (frequency === 'weekly_3') return 3;
  return 0;
}

/**
 * Calculates streak in weeks for weekly-target habits
 */
function calculateWeeklyStreak(completions, target) {
  if (!completions || completions.length === 0) return 0;

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Sunday of current week
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());

  let streak = 0;

  // Check current week — if already met target, count it
  const cws = formatDateString(currentWeekStart);
  const cwe = formatDateString(new Date(currentWeekStart.getTime() + 6 * 86400000));
  const currentDone = completions.filter(d => d >= cws && d <= cwe).length;
  if (currentDone >= target) streak++;

  // Check previous complete weeks going back
  for (let w = 1; w <= 52; w++) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() - (w - 1) * 7 - 1);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    const ws = formatDateString(weekStart);
    const we = formatDateString(weekEnd);
    const done = completions.filter(d => d >= ws && d <= we).length;
    if (done >= target) streak++;
    else break;
  }

  return streak;
}

/**
 * Calculates current streak for a habit
 */
export function calculateStreak(completions, frequency = 'daily') {
  if (!completions || completions.length === 0) return 0;

  const weeklyTarget = getWeeklyTarget(frequency);
  if (weeklyTarget > 0) return calculateWeeklyStreak(completions, weeklyTarget);

  const sorted = [...completions].sort((a, b) => b.localeCompare(a));
  const today = getTodayString();
  const yesterday = formatDateString(new Date(Date.now() - 86400000));

  // If not completed today or yesterday, streak is 0
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let checkDate = sorted[0] === today ? new Date() : new Date(Date.now() - 86400000);

  for (let i = 0; i < 365; i++) {
    const dateStr = formatDateString(checkDate);
    if (completions.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (frequency === 'weekdays') {
        const day = checkDate.getDay();
        if (day === 0 || day === 6) { checkDate.setDate(checkDate.getDate() - 1); continue; }
      }
      if (frequency === 'weekends') {
        const day = checkDate.getDay();
        if (day !== 0 && day !== 6) { checkDate.setDate(checkDate.getDate() - 1); continue; }
      }
      break;
    }
  }

  return streak;
}

/**
 * Checks if a habit is applicable today based on its frequency
 */
export function isHabitApplicableToday(habit) {
  const day = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekdays') return day >= 1 && day <= 5;
  if (habit.frequency === 'weekends') return day === 0 || day === 6;
  // weekly_1 / weekly_2 / weekly_3 — always shown, tracked any day
  if (getWeeklyTarget(habit.frequency) > 0) return true;
  return true;
}

/**
 * Gets the current hour (0-23)
 */
export function getCurrentHour() {
  return new Date().getHours();
}

/**
 * Returns true if current time is before noon
 */
export function isBeforeNoon() {
  return getCurrentHour() < 12;
}

/**
 * Parses a date string safely
 */
export function parseDateString(dateString) {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Returns the number of days between two date strings
 */
export function daysBetween(dateStr1, dateStr2) {
  const d1 = parseDateString(dateStr1);
  const d2 = parseDateString(dateStr2);
  return Math.abs(Math.round((d2 - d1) / 86400000));
}

/**
 * Checks if a habit is applicable on a specific date string
 */
export function isHabitApplicableOnDate(habit, dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  if (habit.frequency === 'weekdays') return dow >= 1 && dow <= 5;
  if (habit.frequency === 'weekends') return dow === 0 || dow === 6;
  if (getWeeklyTarget(habit.frequency) > 0) return true;
  return true;
}
