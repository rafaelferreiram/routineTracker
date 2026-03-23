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
- API key stored in environment variable (VITE_GOOGLE_MAPS_API_KEY)

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
1. Push notifications for daily habit reminders (P1)
2. Test Google Login in production with real Google account
3. "Remember me" persistent login (P2)

## Test Reports
- `/app/test_reports/iteration_9.json` - Latest (6/6 tests - Google Maps PlaceSearch Integration)
- `/app/test_reports/iteration_8.json` - Previous (8/8 tests - TARS Function Calling - P0 Bug Fixed)
- `/app/test_reports/iteration_7.json` - Earlier (8 backend + 9 frontend tests - Event Itinerary with AI)
- `/app/test_reports/iteration_6.json` - Earlier (7/7 frontend features - Events with photos per day)

## 3rd Party Integrations
- **MongoDB Atlas**: Production database
- **OpenAI GPT-4o**: AI chat, function calling
- **OpenAI Whisper**: Speech-to-text
- **OpenAI TTS**: Text-to-speech
- **Open-Meteo API**: Real-time weather (no API key)
- **Google Maps JavaScript API**: Place search, maps
- **Google Places API**: Search restaurants, attractions, etc.
- **Emergent-managed Google Auth**: Social login (workaround active)

