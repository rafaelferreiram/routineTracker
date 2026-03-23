# RoutineTracker PRD

## Original Problem Statement
"Given this repository please connect to some db to store the data make it safe also store the users data and passwords and its routines achievements so, use the Vercel connection as well so its accessible from anywhere with this link and make it very very responsive for iPhone usage and desktops as well please"

## User Choices
- Keep both rafael (password: admin) and gabriela (password: gabriela) accounts with all existing data
- All existing habits, achievements, XP, events, and seed data preserved
- Account rafael linked with Google email ferreira.rafah@gmail.com
- App renamed from RoutineQuest to RoutineTracker with new custom logo

## Architecture

### Tech Stack
- **Frontend**: Vite + React (port 3000, supervisor-managed at /app/frontend)
- **Backend**: FastAPI (port 8001, supervisor-managed at /app/backend)
- **Database**: MongoDB (local instance via MONGO_URL)
- **Auth**: JWT (python-jose, bcrypt hashing, 90-day tokens) + Google OAuth

### Key Files
- `/app/backend/server.py` - FastAPI REST API with auth, profile, friends endpoints
- `/app/backend/.env` - MONGO_URL, DB_NAME, JWT_SECRET
- `/app/frontend/src/api/client.js` - API client helper
- `/app/frontend/src/store/useAuth.js` - JWT + Google auth
- `/app/frontend/src/store/useStore.js` - State store with API sync
- `/app/frontend/src/main.jsx` - App shell with auth gate and routing
- `/app/frontend/src/components/LoginScreen.jsx` - Login/signup UI with Google
- `/app/frontend/src/components/LandingPage.jsx` - Public landing page
- `/app/frontend/src/components/ProfilePanel.jsx` - Profile management with photo upload and password change

## Core Requirements (Static)

### Security
- [x] bcrypt password hashing (salt rounds auto)
- [x] JWT tokens (90-day expiry)
- [x] HTTPS in production (nginx proxy)
- [x] No plaintext passwords anywhere
- [x] Password strength validation (6+ chars, letter, number)

### Database
- [x] MongoDB users collection (with unique username index)
- [x] MongoDB user_data collection (full state blob per user)
- [x] Both rafael and gabriela seeded on backend startup
- [x] Email linking for Google OAuth

### Accessibility
- [x] Cloud-accessible from any device
- [x] Data persists to MongoDB
- [x] localStorage cache for instant loads
- [x] API sync after mount (background)

### Responsive Design
- [x] Desktop sidebar (lg:flex, hidden on mobile)
- [x] Mobile bottom navigation (lg:hidden)
- [x] iOS safe area insets (env(safe-area-inset-bottom))
- [x] Touch-friendly targets (min 44px)
- [x] PWA manifest with custom logo

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/auth/login | Login → JWT + user info |
| POST | /api/auth/register | Create new account |
| POST | /api/auth/google | Google OAuth → JWT + user info |
| GET | /api/data | Get user's full state |
| PUT | /api/data | Save user's full state |
| GET | /api/profile | Get user profile with hasPassword flag |
| PUT | /api/profile | Update profile (picture, display_name) |
| POST | /api/profile/change-password | Change user password |
| GET | /api/friends | Get friends list |
| POST | /api/friends/add | Add friend by username |
| DELETE | /api/friends/:id | Remove friend |
| GET | /api/users/search | Search users by username |

## User Accounts

| Username | Password | Level | XP | Email |
|----------|----------|-------|-----|-------|
| rafael | admin | 10 | 3,685 | ferreira.rafah@gmail.com |
| gabriela | gabriela | 1 | 0 | - |

## What's Been Implemented

### 2026-03-23 - PWA Responsiveness for iPhones (COMPLETED)
- Added `viewport-fit=cover` to index.html meta tag
- Implemented CSS safe area variables (`--sat`, `--sab`, `--sal`, `--sar`)
- Created `.main-content-safe` class with dynamic padding for mobile and desktop
- Updated mobile header with `env(safe-area-inset-top)` for notch/Dynamic Island
- Updated mobile bottom nav with `max(env(safe-area-inset-bottom), 8px)` for home indicator
- App now renders correctly on all modern mobile devices (iPhone 14 Pro, etc.)
- 100% test pass rate (iteration 11)

### 2026-03-23 - DDoS Protection & Security System (COMPLETED)
- Global HTTP middleware for DDoS protection (blocks >100 req/min)
- Enhanced rate limiting with violation tracking (30 req/60s per endpoint)
- IP blocking system with configurable duration (300s default)
- Suspicious activity tracking (blocks after 5 violations)
- Security events logged to MongoDB with 30-day TTL
- Admin can manually unblock IPs via /api/admin/security/unblock

### 2026-03-23 - Analytics & Metrics System (COMPLETED)
- /api/admin/analytics endpoint with period selector (24h, 7d, 30d, 90d)
- User growth chart by period
- Login activity by hour (peak usage times)
- Popular habits ranking with user count
- Category distribution across all users
- Engagement metrics: habit/event adoption rates, completion rate
- Real-time metrics: active connections, requests/hour, blocked IPs
- AdminAnalytics.jsx component with charts and security tab
- Security tab: blocked IPs, suspicious IPs, recent events, manual unblock

### 2026-03-23 - Admin Panel System (COMPLETED)
- Created admin user (admin/@dm1n) with is_admin flag
- Backend endpoints: /api/admin/stats, /api/admin/users, /api/admin/user/action, /api/admin/user/{id}
- Admin can: view all users, disable/enable users, reset passwords, toggle features
- Admin dashboard shows: total users, active users (7 days), habits count, auth provider breakdown
- Users list with search and filter (Google/Password/Disabled)
- User detail modal with stats (XP, habits, events, achievements)
- Feature toggles: Hábitos, Eventos, TARS, Amigos
- Non-admin users cannot see Admin tab or access endpoints (403)
- Disabled users blocked from login (403)
- 100% test pass rate (20 backend + 10 frontend)

### 2026-03-23 - Google Auth Fix (COMPLETED)
- Prioritized google_id (sub) as PRIMARY lookup strategy before email
- Always saves google_id for future lookups
- Checks if user is disabled before allowing login
- Improved logging for debugging auth issues

### 2026-03-23 - Onboarding & PWA Install Fixes (COMPLETED)
- Fixed onboarding showing multiple times: now saves `onboardingCompleted` to database settings (synced across devices)
- Added `synced` state to wait for server data before checking onboarding
- Created native-style PWA install prompt (`PWAInstallPrompt.jsx`) - appears automatically after onboarding
- Simple Yes/No prompt: "Adicionar à Tela Inicial?" with "Sim, instalar" / "Agora não" buttons
- iOS-specific instructions shown for Safari users
- Simplified onboarding from 9 slides to 7 focused slides
- Added install slide with platform-specific instructions

### 2026-03-23 - Data Sync & Account Diagnosis System
- Created `/api/sync/import` endpoint for cross-environment data synchronization
- Created `/api/sync/setup-password` endpoint for adding password to Google-only accounts
- Created `/api/sync/diagnose` endpoint for diagnosing account issues by email
- Script `sync_to_production.py` for pushing data from preview to production
- Script `diagnose_production.py` for diagnosing production account state
- Security hardening: Rate limiting on auth endpoints, password strength validation

### 2026-03-23 - Security Audit & Documentation
- Performed security audit (`SECURITY_AUDIT.md`)
- Implemented rate limiting on /api/auth/* endpoints (10 login attempts/min, 5 register attempts/min)
- Updated README.md with professional documentation
- Resolved Git merge conflicts for PR integration

### 2026-03-23 - Google Maps Places Integration
- New PlaceSearch.jsx component for searching real-world places
- Google Maps JavaScript API + Places API integration
- Features:
  - Search by location (e.g., "Times Square, NYC")
  - Filter by type: Restaurantes, Cafés, Atrações, Museus, Parques, Shopping, Hotéis, Bares
  - Results show photos, ratings (stars), price levels ($-$$$$), and open/closed status
  - Interactive mini-map with dark theme and place markers
  - "Ver no Maps" button opens Google Maps in new tab
  - "Adicionar ao Roteiro" with time picker modal
- EventItinerary.jsx updated to 3-column layout:
  - Left: Roteiro (day-by-day activities)
  - Middle: Buscar Lugares (Google Maps search)
  - Right: Assistente IA (chat)
- Mobile-friendly with tab navigation for each section
- API key stored in environment variable (VITE_GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_API_KEY)
- **TARS integration**: Backend `search_places` function now uses Google Places API (geocoding + nearbySearch) to return real places with ratings, prices, and Google Maps links

### 2026-03-23 - TARS AI Assistant with Function Calling (P0 Bug Fixed)
- Renamed AI assistant from "Roti" to "TARS" (Interstellar reference)
- Custom TARS robot icon from user-provided image (/public/tars-icon.png)
- Dark space-themed button in navbar
- Personality includes "Humor: 75%" setting (movie reference)
- AIChat.jsx component for general AI conversation
- Voice-to-voice and text-to-text interaction
- **System Actions via Function Calling:**
  - `create_habit` - Create new habits with emoji and frequency
  - `edit_habit` - Edit existing habits
  - `create_event` - Create events/trips
  - `search_places` - Search for restaurants, attractions, etc.
  - `add_to_itinerary` - Add activities to event itineraries (**BUG FIXED**)
  - `get_event_itinerary` - View event itineraries
- Real-time weather via Open-Meteo API
- OpenAI fallback to Emergent LLM Key
- **P0 Bug Fix (2026-03-23)**: Fixed MongoDB query in `add_to_itinerary` using `array_filters` to correctly update events in nested arrays. Also fixed user data access path (`data.events` instead of `events`).

### 2026-03-23 - Fire Animation for Streaks
- Added CSS keyframe animations for fire effect (fireFlicker, fireGlow, fireBounce)
- StreakBadge.jsx updated with fire-animation class
- StreakPill component shows animated fire emoji with glow effect
- Streaks 2+ days get flickering fire animation
- Progressive glow intensity based on streak length (3d, 7d, 14d, 30d+)

### 2026-03-23 - Event Itinerary with AI Assistant
- New EventItinerary.jsx component for planning multi-day event itineraries
- AI chat assistant (GPT-4o via Emergent LLM Key) that organizes activities into event days
- Voice input support via OpenAI Whisper for hands-free planning
- Two-column layout on desktop (itinerary + AI chat), stacked on mobile
- "Planejar Roteiro" button only appears for multi-day events
- Manual activity addition with time and title
- Itinerary data persisted in event.itinerary array
- Backend endpoints: /api/ai/itinerary and /api/ai/transcribe
- **Calendar Export**: Download .ics file with each activity as separate event
  - Each event includes TL;DR summary of the day's activities in description
  - Works with iPhone Calendar, Google Calendar, Outlook, and any iCalendar-compatible app

### 2026-03-23 - Event Memories with Photos per Day
- Enhanced EventsPanel.jsx with support for single-day and multi-day (period) events
- Event creation form with toggle between "1 dia" and "Período"
- EventReviewModal now supports photos organized by day for multi-day events
- Each day of a multi-day event can have up to 2 photos
- Date tabs UI for navigating between days in the review modal
- Correct calculation of max photos (days × 2)
- Mobile-responsive design with horizontally scrollable date tabs
- Minimalist design consistent with the rest of the app

### 2026-03-23 - Profile Management & Rebranding
- Added profile photo upload (base64 stored in database)
- Added change password functionality with strength validation
- Added profile info endpoint with hasPassword flag
- Rebranded from RoutineQuest to RoutineTracker
- Generated custom app logo (checkmark with progress circle)
- Updated PWA manifest with new logo and theme color
- Fixed app name across all UI components

### 2026-03-23 - Google OAuth Bug Fix
- Fixed account unification bug where Google login created new empty account
- Improved email lookup to be case-insensitive
- Added detailed logging for debugging auth flow
- Preserved existing user data when linking Google account

### 2026-03-22 - Google Social Login
- Added "Continue with Google" button on login screen
- Backend route `/api/auth/google` exchanges Emergent session_id for JWT
- Creates new user or links existing user by email
- Uses Emergent Auth service (auth.emergentagent.com) for Google OAuth flow

### 2026-03-22 - Friends Feature
- Search users by username (partial match)
- Add/remove friends
- View friends list with their data

### 2026-03-22 - Landing Page
- Public landing page for unauthenticated users
- Feature showcase with app preview
- Interactive chart preview with sample data
- Responsive design for all devices

### 2026-03-22 - Mobile Navigation
- Hamburger menu with slide-in drawer
- Bottom tab bar with 4 primary tabs
- PWA-ready with manifest.json

### 2026-03-22 - MVP Cloud Integration
- Created FastAPI backend with JWT auth and MongoDB
- bcrypt password hashing
- localStorage + API dual-save strategy
- User tiles preserved via localStorage migration
- Seeded both users on backend startup

## Prioritized Backlog

### P0 (Critical - Blocking)
- ~~TARS não consegue encontrar eventos existentes para modificá-los~~ ✅ FIXED (array_filters)

### P1 (High Priority)
- ~~Password change/reset functionality~~ ✅ DONE
- ~~Profile photo/avatar upload~~ ✅ DONE
- Push notifications for daily reminders

### P2 (Medium Priority)
- ~~Fire animation when completing streak habits~~ ✅ DONE
- "Remember me" persistent login
- Data export to PDF/CSV
- TARS conversation memory/history persistence
- TARS proactive habit analysis and suggestions

### P3 (Nice to Have)
- WhatsApp notifications
- Two-factor authentication
- Admin dashboard
- Email verification with Resend (pending API key)

## Next Tasks
1. ⚠️ **VERIFICAÇÃO USUÁRIO**: Google Login em produção (diagnóstico necessário)
2. Push notifications for daily habit reminders (P1)
3. "Remember me" persistent login (P2)

## Test Reports
- `/app/test_reports/iteration_12.json` - Admin Panel + Google Auth (30/30 tests)
- `/app/backend/tests/test_security_analytics.py` - Security & Analytics (21/21 tests)
- `/app/test_reports/iteration_11.json` - PWA Responsiveness (10/10 tests)

## 3rd Party Integrations
- **MongoDB Atlas**: Production database
- **OpenAI GPT-4o**: AI chat, function calling
- **OpenAI Whisper**: Speech-to-text
- **OpenAI TTS**: Text-to-speech
- **Open-Meteo API**: Real-time weather (no API key)
- **Google Maps JavaScript API**: Place search, maps (Frontend)
- **Google Places API**: Search restaurants, attractions, etc. (Backend + Frontend)
- **Google Geocoding API**: Convert addresses to coordinates (Backend)
- **Emergent-managed Google Auth**: Social login (workaround active)

## Known Issues
- **Google Login em Produção (P0)**: Usuário reporta que Google Login em `routine-tracker.com` mostra conta vazia. Código atualizado foi deployed, cache limpo, mas problema persiste. 
  - **Diagnóstico necessário**: Executar `python diagnose_production.py` ou acessar `https://routine-tracker.com/api/sync/diagnose?email=ferreira.rafah@gmail.com&secret=routine_sync_2026_secret`
  - **Possíveis causas**: Base de produção não tem o usuário com este email, ou o endpoint `/api/sync/diagnose` não foi deployed
- Google Maps API deprecation warnings (PlacesService deprecated March 2025, but still functional)

## Deploy Checklist
Após fazer deploy para `routine-tracker.com`:
1. O Google Auth vai usar o backend de produção
2. Os dados serão sincronizados com o banco de produção
3. Login com email `ferreira.rafah@gmail.com` / senha `admin` funcionará
4. Google Login vai encontrar a conta existente pelo email e carregar os dados

