import { useState, useMemo, useRef } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { getTodayString } from '../utils/dateUtils.js';
import EventItinerary from './EventItinerary.jsx';

const EVENT_EMOJIS = ['✈️','🥊','🎉','🎂','💼','🏋️','🥋','🎓','🏀','⚽','🎵','🎤','🏆','🌍','🍽️','❤️','🙏','📅','🎯','🚀','🏖️','🎭','🎬','🤝','💡'];
const EVENT_COLORS = ['#22c55e','#3b82f6','#f87171','#fbbf24','#a78bfa','#f97316','#ec4899','#06b6d4','#84cc16','#e879f9'];

const MOOD_RATINGS = [
  { value: 5, emoji: '🤩', label: 'Incrível', color: '#22c55e' },
  { value: 4, emoji: '😊', label: 'Muito bom', color: '#84cc16' },
  { value: 3, emoji: '🙂', label: 'Bom', color: '#fbbf24' },
  { value: 2, emoji: '😐', label: 'OK', color: '#f97316' },
  { value: 1, emoji: '😔', label: 'Ruim', color: '#ef4444' },
];

// Calculate days between two dates
function getDaysBetween(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

// Get array of dates between start and end
function getDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatShortDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'short'
  });
}

function EventForm({ initial = null, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [startDate, setStartDate] = useState(initial?.date || '');
  const [endDate, setEndDate] = useState(initial?.endDate || '');
  const [isMultiDay, setIsMultiDay] = useState(initial?.endDate && initial?.endDate !== initial?.date);
  const [emoji, setEmoji] = useState(initial?.emoji || '📅');
  const [color, setColor] = useState(initial?.color || '#22c55e');
  const [note, setNote] = useState(initial?.note || '');
  const [showEmoji, setShowEmoji] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim()) { setError('Dê um nome ao evento'); return; }
    if (!startDate) { setError('Escolha uma data'); return; }
    const finalEndDate = isMultiDay && endDate ? endDate : startDate;
    if (isMultiDay && endDate && endDate < startDate) {
      setError('Data final deve ser depois da inicial');
      return;
    }
    onSave({ 
      title: title.trim(), 
      date: startDate, 
      endDate: finalEndDate,
      emoji, 
      color, 
      note: note.trim() 
    });
  };

  const duration = isMultiDay && endDate && startDate ? getDaysBetween(startDate, endDate) : 1;

  return (
    <div className="rounded-2xl border p-4 space-y-4"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
      
      {/* Emoji + Title */}
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          <button type="button" onClick={() => setShowEmoji(v => !v)}
            className="w-12 h-12 rounded-xl border text-2xl flex items-center justify-center transition-all"
            style={{ background: `${color}15`, borderColor: `${color}40` }}>
            {emoji}
          </button>
          {showEmoji && (
            <div className="absolute top-14 left-0 z-20 p-2 rounded-xl border shadow-2xl grid grid-cols-5 gap-1 w-44"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
              {EVENT_EMOJIS.map(e => (
                <button key={e} onClick={() => { setEmoji(e); setShowEmoji(false); }}
                  className={`text-xl w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 ${emoji === e ? 'bg-white/10' : ''}`}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <input autoFocus value={title} onChange={e => { setTitle(e.target.value); setError(''); }}
          placeholder="Nome do evento…" maxLength={60}
          className="flex-1 bg-transparent text-white placeholder-[#4b5563] rounded-xl px-3 py-2.5 outline-none border border-[#1f1f1f] focus:border-[#22c55e]/50 text-sm" />
      </div>

      {/* Duration Toggle */}
      <div className="flex gap-2">
        <button 
          onClick={() => setIsMultiDay(false)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${!isMultiDay ? 'text-white' : 'text-[#6b7280]'}`}
          style={{ 
            background: !isMultiDay ? `${color}20` : 'transparent',
            border: `1px solid ${!isMultiDay ? color : '#1f1f1f'}`
          }}>
          1 dia
        </button>
        <button 
          onClick={() => setIsMultiDay(true)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${isMultiDay ? 'text-white' : 'text-[#6b7280]'}`}
          style={{ 
            background: isMultiDay ? `${color}20` : 'transparent',
            border: `1px solid ${isMultiDay ? color : '#1f1f1f'}`
          }}>
          Período
        </button>
      </div>

      {/* Dates */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-[#4b5563] uppercase tracking-wider mb-1 block">
            {isMultiDay ? 'Início' : 'Data'}
          </label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setError(''); }}
            className="w-full bg-transparent text-white rounded-xl px-3 py-2.5 outline-none border border-[#1f1f1f] focus:border-[#22c55e]/50 text-sm"
            style={{ colorScheme: 'dark' }} />
        </div>
        {isMultiDay && (
          <div className="flex-1">
            <label className="text-[10px] text-[#4b5563] uppercase tracking-wider mb-1 block">Fim</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              min={startDate}
              className="w-full bg-transparent text-white rounded-xl px-3 py-2.5 outline-none border border-[#1f1f1f] focus:border-[#22c55e]/50 text-sm"
              style={{ colorScheme: 'dark' }} />
          </div>
        )}
      </div>

      {/* Duration info */}
      {isMultiDay && duration > 1 && (
        <p className="text-[#4b5563] text-xs">
          {duration} dias · até {duration * 2} fotos nas memórias
        </p>
      )}

      {/* Colors */}
      <div className="flex gap-1.5 flex-wrap">
        {EVENT_COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full transition-all hover:scale-110"
            style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--bg-card), 0 0 0 3.5px ${c}` : 'none' }} />
        ))}
      </div>

      {/* Note */}
      <input value={note} onChange={e => setNote(e.target.value)}
        placeholder="Nota opcional…" maxLength={120}
        className="w-full bg-transparent text-white placeholder-[#4b5563] rounded-xl px-3 py-2.5 outline-none border border-[#1f1f1f] focus:border-[#22c55e]/50 text-xs" />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-[#6b7280] text-sm font-medium border border-[#1f1f1f] hover:bg-white/5">
          Cancelar
        </button>
        <button onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: color, color: '#000' }}>
          {initial ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  );
}

// Review Modal with photos per day
function EventReviewModal({ event, onSave, onClose }) {
  const [mood, setMood] = useState(event.review?.mood || null);
  const [comment, setComment] = useState(event.review?.comment || '');
  const [photosByDay, setPhotosByDay] = useState(event.review?.photosByDay || {});
  const [activeDay, setActiveDay] = useState(null);
  const fileInputRef = useRef(null);

  const eventDays = getDateRange(event.date, event.endDate || event.date);
  const isMultiDay = eventDays.length > 1;
  const maxPhotosPerDay = 2;
  const totalPhotos = Object.values(photosByDay).flat().length;
  const maxTotalPhotos = eventDays.length * maxPhotosPerDay;

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !activeDay) return;

    const currentDayPhotos = photosByDay[activeDay] || [];
    const remainingSlots = maxPhotosPerDay - currentDayPhotos.length;

    files.slice(0, remainingSlots).forEach(file => {
      if (!file.type.startsWith('image/') || file.size > 3 * 1024 * 1024) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotosByDay(prev => ({
          ...prev,
          [activeDay]: [...(prev[activeDay] || []), ev.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (day, index) => {
    setPhotosByDay(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave({
      mood,
      comment: comment.trim(),
      photosByDay,
      reviewedAt: new Date().toISOString(),
    });
  };

  const selectedMood = MOOD_RATINGS.find(m => m.value === mood);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        
        {/* Header */}
        <div className="sticky top-0 p-4 pb-3 border-b text-center" 
          style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-4xl block mb-2">{event.emoji}</span>
          <h3 className="text-white font-bold text-lg">{event.title}</h3>
          <p className="text-[#6b7280] text-sm">
            {isMultiDay ? `${formatShortDate(event.date)} — ${formatShortDate(event.endDate)}` : formatShortDate(event.date)}
          </p>
        </div>

        <div className="p-4 space-y-5">
          {/* Mood */}
          <div>
            <p className="text-[#4b5563] text-xs font-medium uppercase tracking-wider mb-3">Como foi?</p>
            <div className="flex justify-between gap-1">
              {MOOD_RATINGS.map(m => (
                <button key={m.value} onClick={() => setMood(m.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${mood === m.value ? '' : 'opacity-40 hover:opacity-70'}`}
                  style={{ 
                    background: mood === m.value ? `${m.color}15` : 'transparent',
                    border: `1.5px solid ${mood === m.value ? m.color : 'transparent'}`
                  }}>
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[9px] font-medium" style={{ color: mood === m.value ? m.color : '#6b7280' }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className="text-[#4b5563] text-xs font-medium uppercase tracking-wider mb-2">Memória</p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="O que marcou esse momento?"
              rows={2}
              maxLength={500}
              className="w-full bg-transparent text-white placeholder-[#4b5563] rounded-xl px-3 py-2.5 outline-none border border-[#1f1f1f] focus:border-[#22c55e]/50 text-sm resize-none"
            />
          </div>

          {/* Photos Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#4b5563] text-xs font-medium uppercase tracking-wider">
                Fotos {isMultiDay ? 'por dia' : ''}
              </p>
              <span className="text-[#4b5563] text-xs">{totalPhotos}/{maxTotalPhotos}</span>
            </div>

            {isMultiDay ? (
              // Multi-day: show days as tabs
              <div className="space-y-3">
                <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                  {eventDays.map(day => {
                    const dayPhotos = photosByDay[day] || [];
                    const isActive = activeDay === day;
                    return (
                      <button key={day} onClick={() => setActiveDay(isActive ? null : day)}
                        className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive ? 'text-white' : 'text-[#6b7280]'}`}
                        style={{ 
                          background: isActive ? `${event.color}20` : 'var(--bg-inner)',
                          border: `1px solid ${isActive ? event.color : 'var(--bg-border)'}`
                        }}>
                        {formatShortDate(day)}
                        {dayPhotos.length > 0 && (
                          <span className="ml-1 text-[10px] opacity-60">({dayPhotos.length})</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {activeDay && (
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-inner)', border: '1px solid var(--bg-border)' }}>
                    <p className="text-white text-sm font-medium mb-2">{formatShortDate(activeDay)}</p>
                    <div className="flex gap-2 flex-wrap">
                      {(photosByDay[activeDay] || []).map((photo, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removePhoto(activeDay, i)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs">✕</span>
                          </button>
                        </div>
                      ))}
                      {(photosByDay[activeDay] || []).length < maxPhotosPerDay && (
                        <button onClick={() => fileInputRef.current?.click()}
                          className="w-16 h-16 rounded-lg border border-dashed border-[#2a2a2a] flex items-center justify-center text-[#4b5563] hover:border-[#4b5563] transition-colors">
                          <span className="text-lg">+</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Single day: simple photo grid
              <div className="flex gap-2 flex-wrap">
                {(photosByDay[event.date] || []).map((photo, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(event.date, i)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white">✕</span>
                    </button>
                  </div>
                ))}
                {(photosByDay[event.date] || []).length < maxPhotosPerDay && (
                  <button onClick={() => { setActiveDay(event.date); fileInputRef.current?.click(); }}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-[#2a2a2a] flex flex-col items-center justify-center text-[#4b5563] hover:border-[#4b5563] transition-colors">
                    <span className="text-xl">📷</span>
                    <span className="text-[9px] mt-1">Adicionar</span>
                  </button>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 p-4 pt-3 border-t flex gap-3" 
          style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-[#6b7280] text-sm font-medium border border-[#1f1f1f]">
            Depois
          </button>
          <button onClick={handleSave} disabled={!mood}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: selectedMood?.color || '#22c55e', color: '#000' }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// Past Event Card
function PastEventCard({ event, onReview, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const hasReview = event.review?.mood;
  const moodData = MOOD_RATINGS.find(m => m.value === event.review?.mood);
  const eventDays = getDateRange(event.date, event.endDate || event.date);
  const isMultiDay = eventDays.length > 1;
  const allPhotos = Object.entries(event.review?.photosByDay || {});
  const totalPhotos = allPhotos.reduce((sum, [_, photos]) => sum + photos.length, 0);

  return (
    <div className={`rounded-2xl border overflow-hidden ${hasReview ? '' : 'opacity-60'}`}
      style={{ background: 'var(--bg-card)', borderColor: hasReview ? `${moodData?.color}30` : 'var(--bg-border)' }}>
      
      <div className="flex items-center gap-3 p-3.5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${hasReview ? '' : 'grayscale'}`}
          style={{ background: `${event.color}15`, border: `1.5px solid ${event.color}30` }}>
          {event.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{event.title}</p>
          <p className="text-[#4b5563] text-xs">
            {formatShortDate(event.date)}
            {isMultiDay && ` — ${formatShortDate(event.endDate)}`}
            {isMultiDay && <span className="text-[#6b7280]"> · {eventDays.length} dias</span>}
          </p>
        </div>
        
        {hasReview ? (
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: `${moodData?.color}15` }}>
            <span className="text-lg">{moodData?.emoji}</span>
            {totalPhotos > 0 && <span className="text-[10px] text-[#6b7280]">📷{totalPhotos}</span>}
          </button>
        ) : (
          <button onClick={onReview}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: `${event.color}20`, color: event.color }}>
            Avaliar
          </button>
        )}
      </div>

      {/* Expanded Review */}
      {expanded && hasReview && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t" style={{ borderColor: 'var(--bg-border)' }}>
          {event.review.comment && (
            <p className="text-[#9ca3af] text-sm mt-3 italic">"{event.review.comment}"</p>
          )}
          
          {totalPhotos > 0 && (
            <div className="space-y-2">
              {allPhotos.map(([day, photos]) => photos.length > 0 && (
                <div key={day}>
                  {isMultiDay && (
                    <p className="text-[#4b5563] text-[10px] uppercase tracking-wider mb-1">{formatShortDate(day)}</p>
                  )}
                  <div className="flex gap-1.5">
                    {photos.map((photo, i) => (
                      <img key={i} src={photo} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-3 pt-2">
            <button onClick={() => onReview()} 
              className="text-xs text-[#6b7280] hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              data-testid="edit-memory-btn">
              ✏️ Editar memória
            </button>
            <button onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir esta memória? As fotos e avaliação serão removidas.')) {
                onReview(null, true);
              }
            }}
              className="text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
              data-testid="delete-memory-btn">
              🗑️ Excluir memória
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function daysUntil(dateStr) {
  const today = new Date(getTodayString() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function daysSince(dateStr) {
  return -daysUntil(dateStr);
}

export default function EventsPanel() {
  const { events, addEvent, updateEvent, deleteEvent } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [reviewingEvent, setReviewingEvent] = useState(null);
  const [itineraryEvent, setItineraryEvent] = useState(null);
  const today = getTodayString();

  const { upcoming, past } = useMemo(() => {
    const sorted = [...events].filter(e => e?.date).sort((a, b) => a.date.localeCompare(b.date));
    return {
      upcoming: sorted.filter(e => (e.endDate || e.date) >= today),
      past: sorted.filter(e => (e.endDate || e.date) < today).reverse(),
    };
  }, [events, today]);

  const needsReview = past.filter(e => !e.review?.mood && daysSince(e.endDate || e.date) >= 1);
  const eventToPrompt = needsReview[0];

  const handleAdd = (data) => { addEvent(data); setShowAdd(false); };
  const handleUpdate = (data) => { updateEvent({ id: editingId, ...data }); setEditingId(null); };
  const handleSaveReview = (review, isDelete = false) => {
    if (isDelete) {
      // Clear the review completely
      updateEvent({ id: reviewingEvent?.id, review: null });
    } else {
      updateEvent({ id: reviewingEvent.id, review });
    }
    setReviewingEvent(null);
  };
  const handleDeleteMemory = (eventId) => {
    updateEvent({ id: eventId, review: null });
  };
  const handleSaveItinerary = (data) => { updateEvent({ id: itineraryEvent.id, ...data }); setItineraryEvent(null); };

  // Check if event is multi-day (period)
  const isMultiDayEvent = (event) => {
    if (!event.endDate || event.endDate === event.date) return false;
    return getDaysBetween(event.date, event.endDate) > 1;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Eventos</h2>
          <p className="text-[#6b7280] text-sm">Momentos e memórias</p>
        </div>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)}
            className="px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
            + Novo
          </button>
        )}
      </div>

      {/* Review Prompt */}
      {eventToPrompt && !reviewingEvent && (
        <button onClick={() => setReviewingEvent(eventToPrompt)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left"
          style={{ background: `${eventToPrompt.color}10`, border: `1px solid ${eventToPrompt.color}30` }}>
          <span className="text-3xl">{eventToPrompt.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{eventToPrompt.title}</p>
            <p className="text-[#9ca3af] text-sm">Como foi? Registre suas memórias</p>
          </div>
          <span className="text-2xl">→</span>
        </button>
      )}

      {/* Add Form */}
      {showAdd && <EventForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-[#4b5563] text-xs font-medium uppercase tracking-wider mb-3">Próximos</p>
          <div className="space-y-2">
            {upcoming.map(event => {
              const days = daysUntil(event.date);
              const isToday = event.date <= today && (event.endDate || event.date) >= today;
              const eventDays = getDaysBetween(event.date, event.endDate || event.date);
              const isMultiDay = isMultiDayEvent(event);
              const hasItinerary = event.itinerary && event.itinerary.length > 0;
              
              return editingId === event.id ? (
                <EventForm key={event.id} initial={event} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
              ) : (
                <div key={event.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    background: isToday ? `${event.color}10` : 'var(--bg-card)',
                    borderColor: isToday ? `${event.color}40` : 'var(--bg-border)',
                  }}>
                  <div className="flex items-center gap-3 p-3.5 group">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${event.color}15`, border: `1.5px solid ${event.color}30` }}>
                      {event.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{event.title}</p>
                      <p className="text-[#6b7280] text-xs">
                        {formatShortDate(event.date)}
                        {eventDays > 1 && ` — ${formatShortDate(event.endDate)}`}
                        {eventDays > 1 && <span className="text-[#4b5563]"> · {eventDays}d</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm" style={{ color: isToday ? event.color : days <= 7 ? '#fbbf24' : '#6b7280' }}>
                        {isToday ? 'Agora' : days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `${days}d`}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={() => setEditingId(event.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-white text-xs"
                        style={{ background: 'var(--bg-border)' }}>✏</button>
                      <button onClick={() => deleteEvent(event.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-red-400 text-xs"
                        style={{ background: 'var(--bg-border)' }}>✕</button>
                    </div>
                  </div>
                  
                  {/* Itinerary button for multi-day events */}
                  {isMultiDay && (
                    <button 
                      onClick={() => setItineraryEvent(event)}
                      className="w-full flex items-center justify-between px-4 py-2.5 border-t text-left transition-colors hover:bg-white/5"
                      style={{ borderColor: 'var(--bg-border)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📋</span>
                        <span className="text-sm text-[#9ca3af]">
                          {hasItinerary ? 'Ver Roteiro' : 'Planejar Roteiro'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasItinerary && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${event.color}20`, color: event.color }}>
                            {event.itinerary.reduce((sum, d) => sum + (d.activities?.length || 0), 0)} atividades
                          </span>
                        )}
                        <span className="text-xs" style={{ color: event.color }}>→</span>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p className="text-[#4b5563] text-xs font-medium uppercase tracking-wider mb-3">
            Memórias · {past.filter(e => e.review?.mood).length}/{past.length}
          </p>
          <div className="space-y-2">
            {past.map(event => (
              <PastEventCard 
                key={event.id} 
                event={event} 
                onReview={(reviewData, isDelete) => {
                  if (isDelete) {
                    handleDeleteMemory(event.id);
                  } else {
                    setReviewingEvent(event);
                  }
                }}
                onDelete={() => deleteEvent(event.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {events.length === 0 && !showAdd && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">✈️</p>
          <h3 className="text-white font-medium">Nenhum evento</h3>
          <p className="text-[#4b5563] text-sm mt-1 mb-4">Registre momentos especiais</p>
          <button onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
            + Primeiro evento
          </button>
        </div>
      )}

      {/* Review Modal */}
      {reviewingEvent && (
        <EventReviewModal 
          event={reviewingEvent} 
          onSave={handleSaveReview} 
          onClose={() => setReviewingEvent(null)} 
        />
      )}

      {/* Itinerary Modal */}
      {itineraryEvent && (
        <EventItinerary
          event={itineraryEvent}
          onSave={handleSaveItinerary}
          onClose={() => setItineraryEvent(null)}
        />
      )}
    </div>
  );
}
