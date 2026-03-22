import { useState, useMemo } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getTodayString } from '../utils/dateUtils.js';

const EVENT_EMOJIS = ['✈️','🥊','🎉','🎂','💼','🏋️','🥋','🎓','🏀','⚽','🎵','🎤','🏆','🌍','🍽️','❤️','🙏','📅','🎯','🚀','🏖️','🎭','🎬','🤝','💡'];
const EVENT_COLORS = ['#22c55e','#3b82f6','#f87171','#fbbf24','#a78bfa','#f97316','#ec4899','#06b6d4','#84cc16','#e879f9'];

function EventForm({ initial = null, onSave, onCancel }) {
  const today = getTodayString();
  const [title, setTitle] = useState(initial?.title || '');
  const [date, setDate] = useState(initial?.date || '');
  const [emoji, setEmoji] = useState(initial?.emoji || '📅');
  const [color, setColor] = useState(initial?.color || '#22c55e');
  const [note, setNote] = useState(initial?.note || '');
  const [showEmoji, setShowEmoji] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim()) { setError('Give your event a name'); return; }
    if (!date) { setError('Pick a date'); return; }
    onSave({ title: title.trim(), date, emoji, color, note: note.trim() });
  };

  return (
    <div
      className="rounded-2xl border p-4 space-y-3 animate-slide-up"
      style={{ background: 'var(--bg-inner)', borderColor: 'var(--bg-border)' }}
    >
      {/* Emoji + title row */}
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowEmoji(v => !v)}
            className="w-12 h-12 rounded-xl border text-2xl flex items-center justify-center transition-all"
            style={{ background: `${color}15`, borderColor: `${color}40` }}
          >
            {emoji}
          </button>
          {showEmoji && (
            <div
              className="absolute top-14 left-0 z-20 p-2 rounded-xl border shadow-2xl grid grid-cols-5 gap-1 w-44"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
            >
              {EVENT_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => { setEmoji(e); setShowEmoji(false); }}
                  className={`text-xl w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all ${emoji === e ? 'bg-white/10' : ''}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            autoFocus
            value={title}
            onChange={e => { setTitle(e.target.value); setError(''); }}
            placeholder="Event name…"
            maxLength={60}
            className="w-full bg-[#1a1a1a] text-white placeholder-[#4b5563] rounded-xl px-3 py-2.5 outline-none border border-[#1f1f1f] focus:border-[#22c55e]/50 text-sm transition-all"
          />
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setError(''); }}
            className="w-full bg-[#1a1a1a] text-white rounded-xl px-3 py-2.5 outline-none border border-[#1f1f1f] focus:border-[#22c55e]/50 text-sm transition-all"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Color row */}
      <div className="flex gap-1.5 flex-wrap">
        {EVENT_COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full transition-all hover:scale-110"
            style={{
              background: c,
              boxShadow: color === c ? `0 0 0 2px #111111, 0 0 0 3.5px ${c}` : 'none',
              transform: color === c ? 'scale(1.15)' : undefined,
            }}
          />
        ))}
      </div>

      {/* Optional note */}
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note… (e.g. Flight at 8am)"
        maxLength={120}
        className="w-full bg-[#1a1a1a] text-white placeholder-[#4b5563] rounded-xl px-3 py-2 outline-none border border-[#1f1f1f] focus:border-[#22c55e]/50 text-xs transition-all"
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-[#6b7280] hover:text-white text-sm font-medium transition-all border border-[#1f1f1f] hover:border-[#2a2a2a]"
          style={{ background: 'var(--bg-card)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
          style={{ background: `${color}25`, border: `1px solid ${color}50`, color }}
        >
          {initial ? 'Save Changes' : '+ Add Event'}
        </button>
      </div>
    </div>
  );
}

function daysUntil(dateStr) {
  const today = new Date(getTodayString() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatEventDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function EventsPanel() {
  const { events, addEvent, updateEvent, deleteEvent } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const today = getTodayString();

  const { upcoming, past } = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    return {
      upcoming: sorted.filter(e => e.date >= today),
      past: sorted.filter(e => e.date < today).reverse(),
    };
  }, [events, today]);

  const handleAdd = (data) => {
    addEvent(data);
    setShowAdd(false);
  };

  const handleUpdate = (data) => {
    updateEvent({ id: editingId, ...data });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Events</h2>
          <p className="text-[#6b7280] text-sm mt-1">Life milestones & upcoming moments</p>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}
          >
            + Event
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <EventForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider mb-3">Upcoming</p>
          <div className="space-y-2">
            {upcoming.map(event => {
              const days = daysUntil(event.date);
              const isToday = event.date === today;
              const isSoon = days <= 7;
              return editingId === event.id ? (
                <EventForm
                  key={event.id}
                  initial={event}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  key={event.id}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border group transition-all"
                  style={{
                    background: isToday ? `${event.color}12` : 'var(--bg-card)',
                    borderColor: isToday ? `${event.color}40` : 'var(--bg-border)',
                    boxShadow: isToday ? `0 0 16px ${event.color}15` : 'none',
                  }}
                >
                  {/* Emoji */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${event.color}15`, border: `1.5px solid ${event.color}30` }}
                  >
                    {event.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{event.title}</p>
                    <p className="text-[#6b7280] text-xs mt-0.5">{formatEventDate(event.date)}</p>
                    {event.note && <p className="text-[#4b5563] text-xs mt-0.5 truncate">{event.note}</p>}
                  </div>

                  {/* Countdown */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className="font-bold text-sm"
                      style={{ color: isToday ? event.color : isSoon ? '#fbbf24' : '#6b7280' }}
                    >
                      {isToday ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </p>
                    <p className="text-[#4b5563] text-[10px]">away</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => setEditingId(event.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[#6b7280] hover:text-white transition-colors"
                      style={{ background: 'var(--bg-border)' }}
                      title="Edit"
                    >
                      ✏
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[#6b7280] hover:text-red-400 transition-colors"
                      style={{ background: 'var(--bg-border)' }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p className="text-[#4b5563] text-xs font-semibold uppercase tracking-wider mb-3">Past</p>
          <div className="space-y-2">
            {past.map(event => (
              <div
                key={event.id}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl border opacity-50"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 grayscale"
                  style={{ background: 'var(--bg-inner-border)', border: '1.5px solid #1f1f1f' }}>
                  {event.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#6b7280] font-medium text-sm truncate line-through">{event.title}</p>
                  <p className="text-[#4b5563] text-xs mt-0.5">{formatEventDate(event.date)}</p>
                </div>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[#4b5563] hover:text-red-400 transition-colors flex-shrink-0"
                  style={{ background: 'var(--bg-inner-border)' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && !showAdd && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">✈️</p>
          <h3 className="text-white font-semibold">No events yet</h3>
          <p className="text-[#4b5563] text-sm mt-1">Add trips, fights, milestones — anything worth marking</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}
          >
            + Add your first event
          </button>
        </div>
      )}
    </div>
  );
}
