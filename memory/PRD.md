# RoutineQuest PRD

## Original Problem Statement
"Given this repository please connect to some db to store the data make it safe also store the users data and passwords and its routines achievements so, use the Vercel connection as well so its accessible from anywhere with this link and make it very very responsive for iPhone usage and desktops as well please"

## User Choices
- Keep both rafael (password: admin) and gabriela (password: gabriela) accounts with all existing data
- All existing habits, achievements, XP, events, and seed data preserved

## Architecture

### Tech Stack
- **Frontend**: Vite + React (port 3000, supervisor-managed at /app/frontend)
- **Backend**: FastAPI (port 8001, supervisor-managed at /app/backend)
- **Database**: MongoDB (local instance via MONGO_URL)
- **Auth**: JWT (python-jose, bcrypt hashing, 90-day tokens)

### Key Files
- `/app/backend/server.py` - FastAPI REST API
- `/app/backend/.env` - MONGO_URL, DB_NAME, JWT_SECRET
- `/app/frontend/src/api/client.js` - API client helper
- `/app/frontend/src/store/useAuth.js` - JWT-based auth
- `/app/frontend/src/store/useStore.js` - State store with API sync
- `/app/frontend/src/main.jsx` - App shell with auth gate
- `/app/frontend/src/components/LoginScreen.jsx` - Login/signup UI

## Core Requirements (Static)

### Security
- [x] bcrypt password hashing (salt rounds auto)
- [x] JWT tokens (90-day expiry)
- [x] HTTPS in production (nginx proxy)
- [x] No plaintext passwords anywhere

### Database
- [x] MongoDB users collection (with unique username index)
- [x] MongoDB user_data collection (full state blob per user)
- [x] Both rafael and gabriela seeded on backend startup

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
- [x] pb-28 bottom padding on mobile content

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/auth/login | Login → JWT + user info |
| POST | /api/auth/register | Create new account |
| GET | /api/data | Get user's full state |
| PUT | /api/data | Save user's full state |

## User Accounts

| Username | Password | Level | XP |
|----------|----------|-------|-----|
| rafael | admin | 10 | 3,685 |
| gabriela | gabriela | 1 | 0 |

## What's Been Implemented

### 2026-03-22 - MVP Cloud Integration
- Created FastAPI backend with JWT auth and MongoDB integration
- bcrypt password hashing replacing insecure btoa
- localStorage + API dual-save strategy (instant local + cloud sync)
- Login screen updated to async API calls with loading states
- User tiles (known users) preserved via localStorage migration
- Seeded both users on backend startup
- Vite proxy for local API routing
- `allowedHosts: true` for preview URL access
- Legacy rq_users localStorage migration
- displayName passed to StoreProvider via `{...theme, displayName}`
- New user account creation works end-to-end
- Imported real user data dump from GitHub for both rafael and gabriela

### 2026-03-22 - Mobile Navigation Redesign
- New bottom nav with 4 primary tabs: Today, Habits, Stats, Journal + "More" button
- "More" slides up an iOS-style sheet with: Medals, Events, Friends, Customize, Profile + Sign out
- More sheet has user info strip (avatar, name, level/XP)
- Active tab state: accent color label + light tinted background pill
- More button highlights when user is on a secondary tab
- Mobile header redesigned: user avatar + level/XP (tappable → Profile) + section badge + backup button
- Desktop sidebar completely unchanged (all 9 items, full profile card)
- Animations: fadeIn for tab transitions, slideUp for More sheet, backdropIn for overlay
- `viewport-fit=cover` + apple-mobile-web-app-capable meta tags for iPhone notch support
- `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent` for native-feel touch
- Safe area insets handled via `env(safe-area-inset-bottom)` in bottom nav

## Prioritized Backlog

### P0 (Critical - Blocking)
- None currently

### P1 (High Priority)
- Password change/reset functionality
- Profile photo/avatar upload
- Push notifications for daily reminders

### P2 (Medium Priority)
- Social features (friends data from DB, not just placeholders)
- Two-factor authentication
- Data export to PDF/CSV

### P3 (Nice to Have)
- Admin dashboard to view all users
- Email-based auth (forgot password)
- Real-time sync with WebSockets

## Next Tasks
1. Test on actual iPhone device (Safari)
2. Add "Remember me" session persistence option
3. Consider adding a /api/auth/me endpoint for token refresh
