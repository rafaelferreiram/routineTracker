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
- **Database**: MongoDB Atlas (via MONGO_URL)
- **Auth**: JWT (python-jose, bcrypt hashing, 90-day tokens) + Google OAuth
- **i18n**: React Context (LanguageContext) + central translations file

### Key Files
- `/app/backend/server.py` - FastAPI REST API with auth, profile, admin, DDoS protection, shared events, forgot password
- `/app/backend/.env` - MONGO_URL, DB_NAME, JWT_SECRET, RESEND_API_KEY
- `/app/frontend/src/api/client.js` - API client helper
- `/app/frontend/src/store/useAuth.js` - JWT + Google auth
- `/app/frontend/src/store/useStore.js` - State store with API sync, disabledTrophies support
- `/app/frontend/src/main.jsx` - App shell with LanguageProvider, auth gate, email verify + password reset routing
- `/app/frontend/src/i18n/translations.js` - Central translation strings for EN/PT/ES/DE
- `/app/frontend/src/components/Navbar.jsx` - Navigation (no hamburger in mobile header)
- `/app/frontend/src/components/AchievementsPanel.jsx` - PlayStation-style trophy cabinet
- `/app/frontend/src/components/LoginScreen.jsx` - Login/signup/forgot password flows
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

### PlayStation Trophy System (2026-03-24)
- [x] 44 trophies across 4 tiers (Bronze, Silver, Gold, Platinum)
- [x] 4 trophy groups with progressive unlock (10 initial, unlock next 10 at 70%)
- [x] Disable/enable earned trophies (toggle Ativo/Desativado)
- [x] Perfect day streak calculator with XP milestones
- [x] Trophy summary card with tier breakdown

### Forgot Password (2026-03-24)
- [x] "Esqueci minha senha" link on login screen
- [x] Email input form with amber/yellow accent
- [x] Backend generates reset token (1h expiry) and sends HTML email via Resend
- [x] Reset password page via ?reset_password=TOKEN URL param
- [x] New password form with validation (min 6 chars, confirm match)
- [x] Security: forgot-password always returns success (doesn't reveal if email exists)
- [x] Token is cleared after use; expired tokens are rejected

### Security & Auth
- [x] bcrypt password hashing
- [x] JWT tokens (90-day expiry)
- [x] Google OAuth via Emergent-managed Google Auth
- [x] DDoS protection middleware (rate limiting)
- [x] Password change with current password verification
- [x] "Remember Me" login option (localStorage vs sessionStorage)
- [x] Email verification with Resend
- [x] Forgot password with Resend

### Other Features
- [x] Events with Friends (collaborative, server-side)
- [x] Landing Page with mockups and sections
- [x] Confetti on Streak Milestones
- [x] Admin Dashboard with user management
- [x] PWA support with install prompt
- [x] TARS AI assistant (text + voice)
- [x] Journal panel
- [x] Friends system (backend)
- [x] Export/Import data
- [x] Theme customization

## Pending Issues
- **P1**: Google Login on production (routine-tracker.com) - USER VERIFICATION PENDING
- **P2**: Resend domain verification needed for production email delivery (sandbox only)

## Upcoming Tasks
- **P1**: In-app notification system (event invites)
- **P1**: Daily push notifications for habit reminders
- **P2**: Internationalize AdminDashboard.jsx
- **Backlog**: TARS persistent conversation history

## DB Schema
- **users**: username, password_hash, displayName, email, google_id, isAdmin, isDisabled, email_verified, verification_token, verification_expires, reset_token, reset_token_expires
- **user_data**: user_id, state blob (habits, completions, achievements, disabledTrophies, xp, moods, events, journal)
- **shared_events**: id, owner_id, participants[], title, date, emoji, color, note, itinerary[], review

## 3rd Party Integrations
- OpenAI (GPT-4o, Whisper, TTS) - Emergent LLM Key
- Google Maps & Places API
- MongoDB Atlas (production)
- Emergent-managed Google Auth
- Resend (transactional emails: verification + password reset)

## Credentials
- Admin: admin / @dm1n
- User: rafael / newpassword (email: ferreira.rafah@gmail.com)
- User: gabriela / Gabriela@123
