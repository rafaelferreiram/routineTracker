# RoutineTracker PRD

## Original Problem Statement
"Given this repository please connect to some db to store the data make it safe also store the users data and passwords and its routines achievements so, use the Vercel connection as well so its accessible from anywhere with this link and make it very very responsive for iPhone usage and desktops as well please"

## User Choices
- Keep both rafael (password: admin) and gabriela (password: Gabriela@123) accounts with all existing data
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
- `/app/frontend/src/store/useStore.js` - State store with API sync
- `/app/frontend/src/main.jsx` - App shell with LanguageProvider, auth gate, routing
- `/app/frontend/src/i18n/translations.js` - Central translation strings for EN/PT/ES/DE
- `/app/frontend/src/i18n/LanguageContext.jsx` - Language provider and useLanguage hook
- `/app/frontend/src/components/LanguageSelector.jsx` - Flag-based language switcher
- `/app/frontend/src/components/LoginScreen.jsx` - Login/signup UI with i18n
- `/app/frontend/src/components/LandingPage.jsx` - Public landing page with new sections
- `/app/frontend/src/components/Dashboard.jsx` - Main dashboard with full i18n
- `/app/frontend/src/components/Navbar.jsx` - Navigation with i18n (NAV_KEYS)
- `/app/frontend/src/components/EventsPanel.jsx` - Events (collaborative) with invite system
- `/app/frontend/src/hooks/useCollaborativeEvents.js` - Hook for server-side events CRUD

## Implemented Features

### Core
- [x] Habit tracking (CRUD, daily/weekly/specific days, categories, emoji icons)
- [x] XP & leveling system with gamification
- [x] Achievement/medal system
- [x] Streak tracking and bonuses
- [x] Growth chart with daily/weekly/monthly views
- [x] Mood tracker (5 moods, 14-day history strip)
- [x] Calendar date picker for viewing past days
- [x] Focus Habit with 2x XP bonus
- [x] On This Day (1 week ago recall)
- [x] Health metrics chart with completion rate

### Security & Auth
- [x] bcrypt password hashing
- [x] JWT tokens (90-day expiry)
- [x] Google OAuth via Emergent-managed Google Auth
- [x] Google Auth fix: prioritize google_id lookup over email
- [x] DDoS protection middleware (rate limiting)
- [x] Password change with current password verification

### Admin System
- [x] Role-based access control (isAdmin flag)
- [x] Separate AdminDashboard.jsx (completely isolated from user app)
- [x] User management (enable/disable accounts)
- [x] Feature toggling per user (Habits, Events, TARS)
- [x] Analytics dashboard (user growth, engagement, peak hours)
- [x] Password reset for users

### Internationalization (i18n) - COMPLETE
- [x] React Context-based language system (LanguageContext)
- [x] Central translations file with 500+ keys for EN/PT/ES/DE
- [x] Language selector component with flag buttons
- [x] Landing page fully translated
- [x] Login/Signup screen fully translated
- [x] Onboarding carousel fully translated (SLIDE_KEYS)
- [x] Navigation (desktop sidebar + mobile tabs) fully translated
- [x] Dashboard fully translated (greeting, progress, moods, streaks, focus habit, etc.)
- [x] Customize panel fully translated with LanguageSelector
- [x] Profile panel fully translated (account, security, password modal)
- [x] PWA install prompt fully translated
- [x] Language persistence via localStorage
- [x] Fallback to English for missing translations

### Login & Auth UX (NEW - 2026-03-24)
- [x] "Lembrar-me neste dispositivo" checkbox in login (checked by default)
  - Checked: token stored in localStorage (persistent across browser restarts)
  - Unchecked: token stored in sessionStorage (clears when browser closes)
- [x] getToken() in client.js checks both sessionStorage and localStorage

### Email Verification with Resend (NEW - 2026-03-24)
- [x] Optional email field in signup form
- [x] Email verification token generated on registration (72h expiry)
- [x] Beautiful dark-themed HTML email template matching app design
- [x] POST /api/auth/register sends verification email via Resend
- [x] GET /api/auth/verify-email?token=xxx verifies token + marks email_verified=True
- [x] POST /api/auth/resend-verification resends email (auth required)
- [x] VerifyEmailPage component for handling ?verify_email=TOKEN URL
- [x] VerifyEmailBanner shown in-app for users with unverified emails
- [x] Login/login-email endpoints return emailVerified field
- [x] Note: Resend in test mode - email only reaches verified domain; for prod, user must verify domain at resend.com/domains

### Confetti for Streak Milestones (NEW - 2026-03-24)
- [x] Milestone detection in useHabits.toggleCompletion
- [x] Milestones: 7, 14, 21, 30, 60, 90, 100, 200, 365 days
- [x] Triggers SET_CONFETTI + ADD_TOAST with milestone message
- [x] Perfect day confetti only triggers if no milestone confetti already shown
- [x] Dedicated `shared_events` MongoDB collection
- [x] Full CRUD API: GET/POST/PUT/DELETE /api/events
- [x] Invite friends by username: POST /api/events/{id}/invite
- [x] Leave event: DELETE /api/events/{id}/leave
- [x] Remove participant: DELETE /api/events/{id}/participants/{user_id}
- [x] Migrate local events: POST /api/events/migrate (one-time migration)
- [x] Participant permission: owner edits all, participant edits only review
- [x] EventsPanel rewritten to use useCollaborativeEvents hook
- [x] InviteFriendsModal with search by username + friends list
- [x] ParticipantAvatars component showing participant initials
- [x] "Convidado por [owner]" badge on shared events
- [x] Invite button (👥) always visible (not just on hover) for mobile accessibility
- [x] Auto-migration of local store events on first login

### Landing Page Enrichment (NEW - 2026-03-24)
- [x] "Veja em uso" section with 3 interactive mockups: Dashboard, Events with participants, TARS AI chat
- [x] Dedicated "Eventos Compartilhados" feature section with full showcase
- [x] Testimonials section with 3 user cards (Mariana C., Pedro S., Juliana F.)
- [x] All new sections mobile-responsive

### Other Features
- [x] PWA support with install prompt
- [x] Safe area support for iPhone notch
- [x] Onboarding carousel (one-time, saved to DB)
- [x] Profile panel (name, photo, password change)
- [x] Events/trips tracking with countdown (now server-side)
- [x] TARS AI assistant (text + voice)
- [x] Journal panel
- [x] Friends system (backend)
- [x] Export/Import data
- [x] Theme customization (dark/light, accent colors)
- [x] Custom categories

## Pending Issues
- **P1**: Google Login on production (routine-tracker.com) - fix implemented but pending user deployment/verification

## Upcoming Tasks
- **P1**: Daily push notifications for habit reminders
- **P2**: "Remember me" option for persistent sessions
- **P2**: Full friends system UI (add/remove friends UI, friend requests)
- **P2**: Confetti effect for streak milestones
- **P2**: TARS persistent conversation history
- **P2**: TARS proactive suggestions
- **P3**: Email verification with Resend (blocked: pending API key)
- **P3**: AdminDashboard i18n (currently hardcoded)

## DB Schema
- **users_c**: username, password_hash, displayName, email, google_id, isAdmin, isDisabled, settings (features, onboardingCompleted, theme), last_login_at, created_at
- **user_data_c**: user_id, state blob (habits, completions, achievements, xp, moods, events, journal)
- **shared_events**: id, owner_id, owner_username, owner_display_name, participants[], title, date, end_date, emoji, color, note, itinerary[], review, created_at, updated_at
- **analytics_events_c**: Time-series collection with TTL for analytics

## 3rd Party Integrations
- OpenAI (GPT-4o, Whisper, TTS) - Emergent LLM Key
- Google Maps JavaScript API
- Google Places API
- MongoDB Atlas (production)
- Emergent-managed Google Auth

## Credentials
- Admin: admin / @dm1n
- User (test): gabriela / Gabriela@123
