# RoutineQuest 🔥

A gamified habit tracker built with React. Track your daily routines across multiple life categories, earn XP, maintain streaks, and unlock achievements — all stored locally in your browser.

## Features

- **Daily habit tracking** — habits grouped by category with editable 21-day history grid
- **Gamification** — XP system, levels, streaks, and achievements
- **Dashboard** — progress ring, category summary, 3-week heatmap, and streak highlights
- **Stats panel** — completion trends and per-habit analytics
- **Journal** — daily notes alongside your habit log
- **Achievements panel** — milestone tracking
- **No backend** — all data persisted in `localStorage`

## Tech Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- No external chart libraries (SVG/CSS only)
- No state management library (React Context + `useReducer`)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker

Build and run with Docker (served via nginx on port 80):

```bash
docker build -t routinequest .
docker run -p 8080:80 routinequest
```

Then open [http://localhost:8080](http://localhost:8080).

## Project Structure

```
src/
├── components/       # UI components (Dashboard, HabitCard, StatsPanel, etc.)
├── hooks/
│   └── useHabits.js  # Computed values and action creators
├── store/
│   └── useStore.js   # Global state + localStorage persistence
├── utils/
│   ├── gamification.js  # XP, levels, and achievements logic
│   └── dateUtils.js     # Date helpers
└── App.jsx
```
