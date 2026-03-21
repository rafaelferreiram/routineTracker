import { useState, useMemo } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getTodayString } from '../utils/dateUtils.js';
import HabitCard from './HabitCard.jsx';
import AddHabitModal from './AddHabitModal.jsx';

const CATEGORIES = ['All', 'Health', 'Fitness', 'Mind', 'Social', 'Work', 'Other'];

const CATEGORY_EMOJIS = {
  All: '🌟',
  Health: '❤️',
  Fitness: '💪',
  Mind: '🧠',
  Social: '👥',
  Work: '💼',
  Other: '⭐',
};

function getWeekDays(offset = 0) {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

function weekRangeLabel(weekDays) {
  const start = new Date(weekDays[0] + 'T00:00:00');
  const end = new Date(weekDays[6] + 'T00:00:00');
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function HabitList() {
  const { habits } = useHabits();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('created');
  const [editPastMode, setEditPastMode] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const today = getTodayString();

  // weekOffset 0 = current week, -1 = last week, etc.
  const weekDays = useMemo(() => getWeekDays(editPastMode ? weekOffset : 0), [editPastMode, weekOffset]);
  const isCurrentWeek = weekOffset === 0;
  const weekLabel = weekRangeLabel(weekDays);

  const handleToggleEditMode = () => {
    setEditPastMode(prev => {
      if (prev) setWeekOffset(0); // reset to current week on exit
      return !prev;
    });
  };

  const filteredHabits = habits
    .filter(h => selectedCategory === 'All' || h.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'streak') return (b.streak || 0) - (a.streak || 0);
      if (sortBy === 'completions') return b.completions.length - a.completions.length;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.createdAt > a.createdAt ? 1 : -1;
    });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? habits.length : habits.filter(h => h.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-2xl">My Habits</h2>
          <p className="text-slate-400 text-sm mt-1">
            {habits.length} habit{habits.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleToggleEditMode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium transition-all border ${
              editPastMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>✏️</span>
            <span className="hidden sm:inline">Past Weeks</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all active:scale-95"
          >
            <span className="text-lg">+</span>
            Add Habit
          </button>
        </div>
      </div>

      {/* Past week editor bar */}
      {editPastMode && (
        <div
          className="rounded-2xl p-3 border flex items-center justify-between gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all text-lg leading-none flex-shrink-0"
          >
            ‹
          </button>

          <div className="flex flex-col items-center gap-0.5 flex-1 text-center">
            <span className="text-amber-300 text-xs font-semibold">
              {isCurrentWeek ? 'Current Week' : 'Past Week'}
            </span>
            <span className="text-white text-sm font-bold">{weekLabel}</span>
          </div>

          <button
            onClick={() => setWeekOffset(w => w + 1)}
            disabled={isCurrentWeek}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all text-lg leading-none flex-shrink-0 disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.filter(cat => cat === 'All' || categoryCounts[cat] > 0).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
              selectedCategory === cat
                ? 'bg-primary/20 border-primary/50 text-white shadow-lg shadow-primary/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{CATEGORY_EMOJIS[cat]}</span>
            <span>{cat}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                selectedCategory === cat ? 'bg-primary/40 text-white' : 'bg-white/10 text-slate-400'
              }`}
            >
              {categoryCounts[cat]}
            </span>
          </button>
        ))}
      </div>

      {/* Sort controls */}
      {habits.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-medium">Sort by:</span>
          {[
            { value: 'created', label: 'Recent' },
            { value: 'streak', label: 'Streak' },
            { value: 'completions', label: 'Completions' },
            { value: 'name', label: 'Name' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                sortBy === opt.value
                  ? 'bg-primary/20 text-primary-lighter border border-primary/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Habit cards */}
      {filteredHabits.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="text-6xl mb-4">
            {habits.length === 0 ? '🌱' : '🔍'}
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">
            {habits.length === 0 ? 'No habits yet!' : `No ${selectedCategory} habits`}
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            {habits.length === 0
              ? 'Start your journey by adding your first habit. Every legend starts with a single step!'
              : `You don't have any habits in the ${selectedCategory} category yet.`}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all"
          >
            ✨ Add Your First Habit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHabits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              showWeeklyGrid={true}
              weekDays={weekDays}
            />
          ))}
        </div>
      )}

      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
