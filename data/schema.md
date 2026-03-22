# RoutineQuest — Data Schema Reference

This directory contains seed data for both users of the RoutineQuest habit tracking app.

## Files

| File | Description |
|------|-------------|
| `user-rafael.json` | Rafael's full baseline — 21 days of tracked habits, 10 XP levels, 10 achievements |
| `user-gabriela.json` | Gabriela's fresh account — rose theme, no habits yet |

---

## Top-level JSON structure

```jsonc
{
  "version": "routinequest_v1",     // always this string
  "exportedAt": "<ISO timestamp>",
  "meta": { ... },                  // display metadata (not stored in app state)
  "profile": { ... },               // user profile & XP
  "achievements": [ ... ],          // unlocked achievement IDs + timestamps
  "events": [ ... ],                // upcoming calendar events
  "journalEntries": [ ... ],        // daily journal (optional)
  "moods": { "<date>": { ... } },   // mood log keyed by YYYY-MM-DD
  "habits": [ ... ]                 // array of habit objects
}
```

---

## profile

```jsonc
{
  "name": "Rafael",
  "totalXP": 3685,        // cumulative XP across all time
  "level": 10,            // derived from totalXP (see XP thresholds below)
  "joinDate": "2026-03-01",
  "freezeShields": 0,     // earned items that protect streaks from breaking
  "focusHabitId": null,   // ID of today's chosen focus habit (2× XP)
  "focusHabitDate": null  // date the focus was set (YYYY-MM-DD)
}
```

### XP level thresholds
| Level | XP Required | Title       |
|-------|-------------|-------------|
| 1     | 0           | Novice      |
| 2     | 100         | Apprentice  |
| 3     | 250         | Initiate    |
| 4     | 500         | Challenger  |
| 5     | 800         | Dedicated   |
| 6     | 1200        | Committed   |
| 7     | 1700        | Expert      |
| 8     | 2300        | Master      |
| 9     | 3000        | Elite       |
| 10    | 4000        | Legend      |

---

## habit object

```jsonc
{
  "id": "habit_pray",            // unique stable ID
  "name": "Pray",
  "emoji": "🙏",
  "category": "Religion",        // one of the 8 categories
  "color": "#8B5CF6",            // hex accent color
  "frequency": "daily",          // "daily" | "weekdays" | "weekends"
  "type": "boolean",             // "boolean" (default) | "numeric"
  "unit": null,                  // only for numeric habits (e.g. "L", "hrs")
  "goal": null,                  // only for numeric habits (target value per day)
  "createdAt": "2026-03-01",
  "streak": 6,                   // current active streak (days)
  "bestStreak": 14,              // all-time best streak
  "completions": [               // array of YYYY-MM-DD dates when completed
    "2026-03-01", "2026-03-02"
  ],
  "numericValues": {             // only for numeric habits — date → logged value
    "2026-03-01": 2.0
  },
  "completionTimestamps": {}     // reserved (unused in current version)
}
```

### Categories
| Name | Emoji |
|------|-------|
| Religion | 🙏 |
| Exercise | 💪 |
| Meals | 🍽️ |
| Work | 💼 |
| Study | 📚 |
| Family | ❤️ |
| Health | 🌿 |
| Other | ⭐ |

---

## achievement object

```jsonc
{ "id": "first_step", "unlockedAt": "2026-03-22T09:51:51.608Z" }
```

### All achievement IDs
| ID | Name | Condition |
|----|------|-----------|
| `first_step` | First Step | Any habit completed |
| `on_fire` | On Fire | 3-day streak on any habit |
| `week_warrior` | Week Warrior | 7-day streak on any habit |
| `iron_will` | Iron Will | 30-day streak on any habit |
| `perfect_day` | Perfect Day | All habits done in one day |
| `perfect_week` | Perfect Week | All habits done every day for 7 days |
| `habit_builder` | Habit Builder | 5+ habits added |
| `consistent` | Consistent | 50+ total completions |
| `unstoppable` | Unstoppable | 100+ total completions |
| `fifty_done` | Fifty Done | 50+ completions on a single habit |
| `double_century` | Double Century | 200+ total completions |
| `early_bird` | Early Bird | 7 completions before 8 AM |
| `night_owl` | Night Owl | 7 completions after 10 PM |
| `social_butterfly` | Social Butterfly | Log with a friend 5× |
| `meals_week` | Meal Streak | 7 perfect meal days |
| `hydration_week` | Hydration Week | 7-day water goal streak |
| `hydration_master` | Hydration Master | 30-day water goal streak |
| `sleep_week` | Sleep Week | 7-day sleep goal streak |
| `sleep_master` | Sleep Master | 30-day sleep goal streak |
| `double_training` | Double Training | Gym + BJJ same day, 5× |
| `wellness_warrior` | Wellness Warrior | All health goals in one week |
| `bjj_white_1` | White Belt Stripe 1 | 10 BJJ sessions |
| `bjj_white_2` | White Belt Stripe 2 | 25 BJJ sessions |
| `bjj_white_3` | White Belt Stripe 3 | 50 BJJ sessions |
| `bjj_white_4` | White Belt Stripe 4 | 75 BJJ sessions |
| `bjj_blue_belt` | Blue Belt | 100 BJJ sessions |

---

## event object

```jsonc
{
  "id": "event_nyc",
  "title": "Travel to NYC",
  "date": "2026-04-17",        // YYYY-MM-DD
  "emoji": "✈️",
  "color": "#22c55e",
  "note": "",
  "createdAt": "<ISO timestamp>"
}
```

---

## mood entry

```jsonc
// moods is a dict keyed by YYYY-MM-DD
"moods": {
  "2026-03-22": {
    "key": "great",        // one of: crushing | great | good | meh | rough
    "emoji": "😄",
    "label": "Great",
    "score": 4,            // 1–5
    "color": "#3b82f6"
  }
}
```

### Mood scale
| key | emoji | score |
|-----|-------|-------|
| crushing | 🚀 | 5 |
| great | 😄 | 4 |
| good | 🙂 | 3 |
| meh | 😐 | 2 |
| rough | 😩 | 1 |

---

## Rafael's habit summary (March 2026)

| Habit | Category | Freq | Streak | Best | Completions |
|-------|----------|------|--------|------|-------------|
| Pray | Religion | daily | 6 | 14 | 19/21 days |
| Thank God | Religion | daily | 6 | 9 | 17/21 days |
| Jiu Jitsu | Exercise | daily | 2 | 2 | 11/21 days |
| Gym | Exercise | daily | 3 | 3 | 10/21 days |
| Daily Meeting Blip | Work | weekdays | 15 | 15 | 15/15 weekdays |
| Daily Meeting Livelo | Work | weekdays | 15 | 15 | 15/15 weekdays |
| Daily Meeting Fox | Work | weekdays | 15 | 15 | 15/15 weekdays |
| Daily Meeting Pinterest | Work | weekdays | 15 | 15 | 15/15 weekdays |
| Work time Blip | Work | weekdays | 15 | 15 | 15/15 weekdays |
| Work time Livelo | Work | weekdays | 14 | 14 | 14/15 weekdays |
| Work time Fox | Work | weekdays | 14 | 14 | 14/15 weekdays |
| Work time Pinterest | Work | weekdays | 14 | 14 | 14/15 weekdays |
| Read time | Study | daily | 3 | 5 | 15/21 days |
| Study AI | Study | daily | 3 | 3 | 11/21 days |
| Study Bitcoin | Study | daily | 1 | 2 | 9/21 days |
| Family time | Family | daily | 6 | 19 | 19/21 days |
| Be thankful | Family | daily | 6 | 12 | 19/21 days |
| Take Breakfast | Meals | daily | 21 | 21 | 21/21 days |
| Have Lunch | Meals | daily | 21 | 21 | 21/21 days |
| Have Dinner | Meals | daily | 21 | 21 | 21/21 days |
| Eat Fruits | Meals | daily | 21 | 21 | 21/21 days |
| Take Vitamins | Meals | daily | 21 | 21 | 21/21 days |
| Drink 2L Water | Health | daily | 5 | 5 | 17/21 days (avg 2.1L/day) |
| Sleep | Health | daily | 0 | 3 | 10/21 days (avg 7.6h/night) |

**Total habits: 24 · Total XP: 3,685 · Level 10**
