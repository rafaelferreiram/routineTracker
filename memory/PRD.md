# RoutineTracker PRD

## Original Problem Statement
"Given this repository please connect to some db to store the data make it safe also store the users data and passwords and its routines achievements so, use the Vercel connection as well so its accessible from anywhere with this link and make it very very responsive for iPhone usage and desktops as well please"

## User Choices
- Keep both rafael (password: newpassword) and gabriela (password: Gabriela@123) accounts with all existing data
- All existing habits, achievements, XP, events, and seed data preserved
- Account rafael linked with Google email ferreira.rafah@gmail.com
- App renamed from RoutineQuest to RoutineTracker with new custom logo
- Internationalization (i18n) for English, Portuguese (Brazil), Spanish, and German

## Architecture

### Tech Stack
- **Frontend**: Vite + React (port 3000, supervisor-managed at /app/frontend)
- **Backend**: FastAPI (port 8001, supervisor-managed at /app/backend)
- **Database**: MongoDB (local instance via MONGO_URL)
- **Auth**: JWT (python-jose, bcrypt hashing, 90-day tokens) + Google OAuth
- **i18n**: React Context (LanguageContext) + central translations file

### Key Files
- `/app/backend/server.py` - FastAPI REST API with auth, profile, admin, DDoS protection, shared events
- `/app/backend/.env` - MONGO_URL, DB_NAME, JWT_SECRET
- `/app/frontend/src/api/client.js` - API client helper
- `/app/frontend/src/store/useAuth.js` - JWT + Google auth
- `/app/frontend/src/store/useStore.js` - State store with API sync, disabledTrophies support
- `/app/frontend/src/main.jsx` - App shell with LanguageProvider, auth gate, routing
- `/app/frontend/src/i18n/translations.js` - Central translation strings for EN/PT/ES/DE
- `/app/frontend/src/i18n/LanguageContext.jsx` - Language provider and useLanguage hook
- `/app/frontend/src/components/Navbar.jsx` - Navigation (no hamburger in mobile header)
- `/app/frontend/src/components/AchievementsPanel.jsx` - PlayStation-style trophy cabinet
- `/app/frontend/src/utils/gamification.js` - Trophy tier system, 44 achievements, perfect day streak
- `/app/frontend/src/hooks/useHabits.js` - Habit hooks + disableTrophy/enableTrophy actions

## Implemented Features

### Core
- [x] Habit tracking (CRUD, daily/weekly/specific days, categories, emoji icons)
- [x] XP & leveling system with gamification
- [x] Streak tracking and bonuses
- [x] Growth chart with daily/weekly/monthly views
- [x] Mood tracker (5 moods, 14-day history strip)
- [x] Calendar date picker for viewing past days
- [x] Focus Habit with 2x XP bonus
- [x] On This Day (1 week ago recall)
- [x] Health metrics chart with completion rate

### PlayStation Trophy System (NEW - 2026-03-24)
- [x] 44 trophies across 4 tiers (Bronze, Silver, Gold, Platinum)
- [x] 4 trophy groups with progressive unlock (10 initial, unlock next 10 at 70%)
  - Group 1: Always visible (10 trophies)
  - Group 2: Unlock at 7 active trophies (10 trophies)
  - Group 3: Unlock at 14 active trophies (10 trophies)
  - Group 4: Unlock at 21 active trophies (14 trophies)
- [x] Disable/enable earned trophies (toggle Ativo/Desativado)
- [x] Disabled trophies don't count toward group unlock thresholds
- [x] Disabled trophies won't be auto-re-unlocked by checkAchievements
- [x] Perfect day streak calculator and display
- [x] Perfect day streak trophy milestones: 10d=100XP, 20d=150XP, 30d=300XP, 60d=700XP, 90d=1000XP
- [x] Trophy summary card with tier breakdown
- [x] Next tier unlock progress indicator
- [x] Earned trophies from hidden groups still visible for management

### UI Refinement (2026-03-24)
- [x] Hamburger menu removed from mobile header (only in footer)
- [x] Footer nav: Today, Habits, TARS, Trophies, Menu
- [x] Nav label updated from "Medals" to "Trophies" / "Troféus"

### Security & Auth
- [x] bcrypt password hashing
- [x] JWT tokens (90-day expiry)
- [x] Google OAuth via Emergent-managed Google Auth
- [x] DDoS protection middleware (rate limiting)
- [x] Password change with current password verification
- [x] "Remember Me" login option (localStorage vs sessionStorage)
- [x] Email verification with Resend

### Admin System
- [x] Role-based access control (isAdmin flag)
- [x] Separate AdminDashboard.jsx
- [x] User management (enable/disable accounts)
- [x] Feature toggling per user
- [x] Analytics dashboard
- [x] Password reset for users

### Internationalization (i18n) - COMPLETE
- [x] React Context-based language system
- [x] 500+ translation keys for EN/PT/ES/DE
- [x] All components fully translated

### Other Features
- [x] Events with Friends (collaborative, server-side)
- [x] Landing Page with mockups and sections
- [x] Confetti on Streak Milestones
- [x] PWA support with install prompt
- [x] Safe area support for iPhone notch
- [x] TARS AI assistant (text + voice)
- [x] Journal panel
- [x] Friends system (backend)
- [x] Export/Import data
- [x] Theme customization

## Pending Issues
- **P1**: Google Login on production (routine-tracker.com) - fix implemented but pending user deployment/verification
- **P2**: Resend domain verification needed for production email delivery

## Upcoming Tasks
- **P1**: "Forgot Password" functionality using Resend
- **P1**: In-app notification system (event invites)
- **P1**: Daily push notifications for habit reminders
- **P2**: Internationalize AdminDashboard.jsx
- **Backlog**: TARS persistent conversation history

## DB Schema
- **users**: username, password_hash, displayName, email, google_id, isAdmin, isDisabled, settings, last_login_at, created_at
- **user_data**: user_id, state blob (habits, completions, achievements, disabledTrophies, xp, moods, events, journal)
- **shared_events**: id, owner_id, participants[], title, date, emoji, color, note, itinerary[], review
- **analytics**: Time-series collection with TTL

## 3rd Party Integrations
- OpenAI (GPT-4o, Whisper, TTS) - Emergent LLM Key
- Google Maps JavaScript API
- Google Places API
- MongoDB Atlas (production)
- Emergent-managed Google Auth
- Resend (transactional emails)

## Credentials
- Admin: admin / @dm1n
- User: rafael / newpassword
- User: gabriela / Gabriela@123
