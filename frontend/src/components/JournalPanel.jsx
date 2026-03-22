import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore.js';
import { ACTIONS } from '../store/useStore.js';
import { getTodayString } from '../utils/dateUtils.js';

// ─── NLP Helpers ─────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function parseDateFromText(text) {
  const lower = text.toLowerCase();
  const now = new Date();
  const year = now.getFullYear();

  // "march 4th", "on march 7", "march 4"
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const re = new RegExp(`${MONTH_NAMES[i]}\\s+(\\d{1,2})(?:st|nd|rd|th)?`, 'i');
    const m = lower.match(re);
    if (m) {
      const day = parseInt(m[1], 10);
      return `${year}-${String(i + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // "the 4th", "on the 7th"
  const dayOrdinal = lower.match(/\bthe\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (dayOrdinal) {
    const day = parseInt(dayOrdinal[1], 10);
    return `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  if (lower.includes('yesterday')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  return getTodayString();
}

const DETECTION_RULES = [
  { keywords: ['jiu jitsu', 'jiujitsu', 'bjj', 'belt', 'graduation', 'stripe', 'grappling', 'submission', 'triangle', 'armbar', 'sparring'], emoji: '🥋', category: 'Exercise', color: '#10B981' },
  { keywords: ['gym', 'workout', 'lift', 'deadlift', 'squat', 'bench press', 'pull up', 'weight', 'cardio', 'run', 'jogging', 'cycling', 'swim'], emoji: '🏋️', category: 'Exercise', color: '#10B981' },
  { keywords: ['restaurant', 'lunch', 'dinner', 'breakfast', 'food', 'meal', 'ate', 'eat', 'cafe', 'coffee', 'bar', 'bistro', 'enoteca', 'sushi', 'pizza'], emoji: '🍽️', category: 'Family', color: '#EC4899' },
  { keywords: ['pray', 'prayer', 'church', 'god', 'jesus', 'bible', 'blessing', 'worship', 'mass', 'faith', 'holy'], emoji: '🙏', category: 'Religion', color: '#8B5CF6' },
  { keywords: ['thankful', 'grateful', 'gratitude', 'blessed', 'thankfulness', 'amazing grace', 'so thankful'], emoji: '💝', category: 'Religion', color: '#8B5CF6' },
  { keywords: ['family', 'wife', 'husband', 'kids', 'children', 'son', 'daughter', 'parents', 'mom', 'dad', 'brother', 'sister'], emoji: '❤️', category: 'Family', color: '#EC4899' },
  { keywords: ['trip', 'travel', 'vacation', 'holiday', 'visit', 'flew', 'flight', 'airport', 'hotel'], emoji: '✈️', category: 'Family', color: '#EC4899' },
  { keywords: ['work', 'meeting', 'project', 'client', 'job', 'office', 'deadline', 'presentation', 'promotion', 'salary', 'hired'], emoji: '💼', category: 'Work', color: '#3B82F6' },
  { keywords: ['study', 'read', 'book', 'learn', 'course', 'class', 'certificate', 'degree', 'exam', 'test', 'ai', 'bitcoin', 'crypto', 'blockchain'], emoji: '📚', category: 'Study', color: '#F59E0B' },
  { keywords: ['milestone', 'achievement', 'award', 'trophy', 'medal', 'first place', 'won', 'champion', 'record'], emoji: '🏆', category: 'Exercise', color: '#10B981' },
  { keywords: ['birthday', 'anniversary', 'wedding', 'party', 'celebrate', 'celebration'], emoji: '🎉', category: 'Family', color: '#EC4899' },
];

function detectMeta(text) {
  const lower = text.toLowerCase();
  for (const rule of DETECTION_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return { emoji: rule.emoji, category: rule.category, color: rule.color };
    }
  }
  return { emoji: '📝', category: 'Life', color: '#94A3B8' };
}

function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function groupByMonth(entries) {
  const groups = {};
  for (const entry of entries) {
    const [y, m] = entry.date.split('-');
    const key = `${y}-${m}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [y, m] = key.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { label, items: items.sort((a, b) => b.date.localeCompare(a.date)) };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JournalPanel() {
  const { state, dispatch } = useStore();
  const entries = state.journalEntries || [];

  const [text, setText] = useState('');
  const [dateOverride, setDateOverride] = useState('');
  const [preview, setPreview] = useState(null);
  const [saved, setSaved] = useState(false);

  const grouped = useMemo(() => groupByMonth(entries), [entries]);

  function handleAnalyze() {
    if (!text.trim()) return;
    const parsedDate = dateOverride || parseDateFromText(text);
    const meta = detectMeta(text);
    setPreview({ date: parsedDate, ...meta });
  }

  function handleSave() {
    if (!text.trim() || !preview) return;
    dispatch({
      type: ACTIONS.ADD_JOURNAL_ENTRY,
      payload: {
        text: text.trim(),
        date: preview.date,
        emoji: preview.emoji,
        category: preview.category,
        color: preview.color,
      },
    });
    setText('');
    setDateOverride('');
    setPreview(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleDelete(id) {
    dispatch({ type: ACTIONS.DELETE_JOURNAL_ENTRY, payload: { id } });
  }

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-6 border relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(139,92,246,0.12) 60%, rgba(59,130,246,0.08) 100%)',
          borderColor: 'rgba(236,72,153,0.25)',
          boxShadow: '0 0 40px rgba(236,72,153,0.1)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F472B6, transparent)' }} />
        <div className="relative z-10">
          <h2 className="text-white font-black text-2xl mb-1">📖 Life Journal</h2>
          <p className="text-slate-400 text-sm">
            Describe something that happened — I'll figure out the date, category and save it for you.
          </p>
        </div>
      </div>

      {/* ── Input Card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-5 border border-white/8 space-y-4"
        style={{ background: 'rgba(255,255,255,0.025)' }}
      >
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2 block">
            What happened?
          </label>
          <textarea
            rows={4}
            value={text}
            onChange={e => { setText(e.target.value); setPreview(null); }}
            placeholder={`e.g. "on march 4th I got my first graduation on jiu jitsu as a white belt — now I'm white belt 1st degree!" or "march 7th we had lunch at Enoteca 1756, amazing place, so thankful 🙏"`}
            className="w-full rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-600 text-sm px-4 py-3 resize-none focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
          />
        </div>

        {/* Optional date override */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-slate-500 text-xs mb-1 block">Override date (optional)</label>
            <input
              type="date"
              value={dateOverride}
              onChange={e => { setDateOverride(e.target.value); setPreview(null); }}
              max={getTodayString()}
              className="w-full rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm px-3 py-2 focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!text.trim()}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.7), rgba(236,72,153,0.5))',
              border: '1px solid rgba(167,139,250,0.3)',
              color: 'white',
              boxShadow: text.trim() ? '0 0 16px rgba(124,58,237,0.3)' : '',
            }}
          >
            ✨ Analyse
          </button>
        </div>

        {/* Preview / Confirm */}
        {preview && (
          <div
            className="rounded-2xl p-4 border flex items-center justify-between gap-4 animate-fade-in"
            style={{
              background: `${preview.color}12`,
              borderColor: `${preview.color}40`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl flex-shrink-0">{preview.emoji}</span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">
                  {formatDisplayDate(preview.date)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: preview.color }}>
                  {preview.category}
                </p>
                <p className="text-slate-400 text-xs mt-1 truncate">{text.slice(0, 80)}{text.length > 80 ? '…' : ''}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
              style={{
                background: preview.color,
                boxShadow: `0 0 14px ${preview.color}60`,
              }}
            >
              Save ✓
            </button>
          </div>
        )}

        {saved && (
          <div className="text-center text-emerald-400 font-semibold text-sm animate-fade-in py-1">
            ✅ Entry saved to your journal!
          </div>
        )}
      </div>

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <div
          className="rounded-3xl p-10 border border-dashed border-white/10 text-center"
          style={{ background: 'rgba(255,255,255,0.015)' }}
        >
          <div className="text-5xl mb-3">📖</div>
          <h4 className="text-white font-semibold mb-1">Your journal is empty</h4>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Start by describing something meaningful that happened. I'll organise it into a beautiful timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-white font-semibold text-base flex items-center gap-2">
            🗓️ Your Memories
          </h3>
          {grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              <div className="space-y-3">
                {items.map(entry => (
                  <div
                    key={entry.id}
                    className="rounded-2xl p-4 border flex items-start gap-4 group transition-all"
                    style={{
                      background: `${entry.color}0A`,
                      borderColor: `${entry.color}25`,
                    }}
                  >
                    {/* Emoji bubble */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
                      style={{ background: `${entry.color}20`, border: `1px solid ${entry.color}30` }}
                    >
                      {entry.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold text-sm">
                          {formatDisplayDate(entry.date)}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${entry.color}20`, color: entry.color }}
                        >
                          {entry.category}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{entry.text}</p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="flex-shrink-0 w-7 h-7 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-base"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
