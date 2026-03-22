import { useState, useEffect, useRef } from 'react';
import { useHabits } from '../hooks/useHabits.js';

const DEFAULT_CATEGORIES = [
  { name: 'Religion', emoji: '🙏' },
  { name: 'Exercise', emoji: '💪' },
  { name: 'Meals', emoji: '🍽️' },
  { name: 'Work', emoji: '💼' },
  { name: 'Study', emoji: '📚' },
  { name: 'Family', emoji: '❤️' },
  { name: 'Health', emoji: '🌿' },
  { name: 'Other', emoji: '⭐' },
];

const FREQUENCIES = [
  { value: 'daily',    label: 'Every day',   icon: '📅' },
  { value: 'weekdays', label: 'Weekdays',     icon: '💼' },
  { value: 'weekends', label: 'Weekends',     icon: '🎉' },
  { value: 'weekly_3', label: '3× / week',   icon: '🔥' },
  { value: 'weekly_2', label: '2× / week',   icon: '⚡' },
  { value: 'weekly_1', label: '1× / week',   icon: '🎯' },
];

const COLORS = [
  '#7C3AED', '#8B5CF6', '#A78BFA',
  '#3B82F6', '#60A5FA', '#06B6D4',
  '#10B981', '#34D399', '#84CC16',
  '#F59E0B', '#FBBF24', '#F97316',
  '#EF4444', '#F472B6', '#EC4899',
];

const SUGGESTED_EMOJIS = [
  '💧', '🏃', '📚', '🧘', '💪', '🌱', '🎯', '🍎',
  '🛌', '💊', '🧹', '✍️', '🎵', '📝', '☕', '🚴',
  '🏊', '🧗', '🧪', '💡', '📞', '🎨', '🌅', '🥗',
];

export default function AddHabitModal({ onClose, editHabit = null }) {
  const { addHabit, updateHabit, settings } = useHabits();
  const categories = (settings.categories && settings.categories.length > 0)
    ? settings.categories
    : DEFAULT_CATEGORIES;
  const isEdit = !!editHabit;

  const [name, setName] = useState(editHabit?.name || '');
  const [emoji, setEmoji] = useState(editHabit?.emoji || '⭐');
  const [category, setCategory] = useState(editHabit?.category || categories[0]?.name || 'Other');
  const [color, setColor] = useState(editHabit?.color || '#7C3AED');
  const [frequency, setFrequency] = useState(editHabit?.frequency || 'daily');
  const [difficulty, setDifficulty] = useState(editHabit?.difficulty || 'medium');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a habit name');
      inputRef.current?.focus();
      return;
    }
    if (name.trim().length > 60) {
      setError('Name must be 60 characters or less');
      return;
    }

    const habitData = {
      name: name.trim(),
      emoji,
      category,
      color,
      frequency,
      difficulty,
    };

    if (isEdit) {
      updateHabit({ ...editHabit, ...habitData });
    } else {
      addHabit(habitData);
    }

    onClose();
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl animate-slide-up overflow-hidden"
        style={{ background: '#111111' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/10">
          <h2 className="text-white font-bold text-xl">
            {isEdit ? '✏️ Edit Habit' : '✨ New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-all text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Emoji + Name row */}
          <div className="flex gap-3">
            {/* Emoji button */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-14 h-14 rounded-2xl border-2 border-white/20 hover:border-primary/60 bg-white/5 hover:bg-white/10 text-2xl flex items-center justify-center transition-all shadow-lg"
                style={{ boxShadow: showEmojiPicker ? `0 0 0 2px ${color}` : '' }}
              >
                {emoji}
              </button>

              {showEmojiPicker && (
                <div className="absolute top-16 left-0 z-10 p-3 rounded-2xl border border-white/10 shadow-2xl w-64" style={{ background: '#111111' }}>
                  <p className="text-slate-400 text-xs mb-2 font-medium">Choose an emoji</p>
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    {SUGGESTED_EMOJIS.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                        className={`w-8 h-8 rounded-lg text-lg hover:bg-white/10 flex items-center justify-center transition-all ${emoji === e ? 'bg-primary/30 ring-1 ring-primary' : ''}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-white/10 text-white text-sm rounded-lg px-2 py-1.5 outline-none border border-white/10 focus:border-primary/50"
                      placeholder="Custom emoji..."
                      value={customEmoji}
                      onChange={e => setCustomEmoji(e.target.value)}
                      maxLength={2}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customEmoji.trim()) { setEmoji(customEmoji.trim()); setShowEmojiPicker(false); setCustomEmoji(''); }
                      }}
                      className="px-3 py-1.5 bg-primary/80 hover:bg-primary text-white text-xs rounded-lg font-medium transition-all"
                    >
                      Use
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Name input */}
            <div className="flex-1">
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Habit Name *</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="e.g., Drink 8 glasses of water"
                maxLength={60}
                className="w-full bg-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-primary/60 focus:bg-white/15 transition-all text-sm"
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    category === cat.name
                      ? 'bg-primary/20 border-primary/60 text-white shadow-lg shadow-primary/20'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="truncate text-xs">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-xl transition-all hover:scale-110"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 2px white, 0 0 12px ${c}` : `0 0 0 1px ${c}33`,
                    transform: color === c ? 'scale(1.2)' : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">Frequency</label>
            <div className="grid grid-cols-3 gap-2 grid-rows-2">
              {FREQUENCIES.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                    frequency === f.value
                      ? 'bg-primary/20 border-primary/60 text-white shadow-lg shadow-primary/20'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-xs text-center leading-tight">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">Difficulty <span className="text-slate-600">(affects XP)</span></label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'easy', label: 'Easy', icon: '🟢', xp: '7-8 XP', color: '#4ade80' },
                { value: 'medium', label: 'Medium', icon: '🟡', xp: '10 XP', color: '#fbbf24' },
                { value: 'hard', label: 'Hard', icon: '🔴', xp: '15 XP', color: '#f87171' },
              ].map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    difficulty === d.value
                      ? 'text-white'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                  style={difficulty === d.value ? {
                    background: `${d.color}15`,
                    borderColor: `${d.color}50`,
                    color: d.color,
                  } : {}}
                >
                  <span className="text-base">{d.icon}</span>
                  <span className="text-xs font-semibold">{d.label}</span>
                  <span className="text-[10px] opacity-70">{d.xp}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <p className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wider">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
                style={{ background: `${color}22`, border: `2px solid ${color}60`, boxShadow: `0 0 12px ${color}30` }}
              >
                {emoji}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{name || 'Your habit name'}</p>
                <p className="text-slate-400 text-xs flex items-center gap-1 flex-wrap">
                  {categories.find(c => c.name === category)?.emoji} {category} · {FREQUENCIES.find(f => f.value === frequency)?.label}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize"
                    style={{
                      color: difficulty === 'easy' ? '#4ade80' : difficulty === 'hard' ? '#f87171' : '#fbbf24',
                      background: difficulty === 'easy' ? 'rgba(74,222,128,0.12)' : difficulty === 'hard' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)',
                    }}>
                    {difficulty}
                  </span>
                </p>
              </div>
              <div
                className="ml-auto px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
              >
                {frequency}
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-semibold text-sm transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-2xl font-semibold text-sm transition-all text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 0 20px ${color}40` }}
            >
              {isEdit ? '💾 Save Changes' : '✨ Add Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
