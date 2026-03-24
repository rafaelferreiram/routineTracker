import { useState, useEffect, useCallback, useRef } from 'react';

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('rq_token');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(err.detail || 'Falha na requisição');
  }
  return res.json();
}

export function useCollaborativeEvents(localEvents = [], currentUserId = null) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const initDoneRef = useRef(false);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await apiFetch('/api/events');
      setEvents((data.events || []).sort((a, b) => a.date.localeCompare(b.date)));
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const token = localStorage.getItem('rq_token');
    if (!token) { setLoading(false); return; }

    const migKey = currentUserId ? `events_migrated_${currentUserId}` : null;
    const alreadyMigrated = migKey ? !!localStorage.getItem(migKey) : true;

    const init = async () => {
      await fetchEvents();

      if (!alreadyMigrated && localEvents.length > 0) {
        try {
          await apiFetch('/api/events/migrate', {
            method: 'POST',
            body: JSON.stringify({ events: localEvents }),
          });
          if (migKey) localStorage.setItem(migKey, '1');
          await fetchEvents();
        } catch {
          if (migKey) localStorage.setItem(migKey, '1');
        }
      } else if (migKey && !alreadyMigrated) {
        localStorage.setItem(migKey, '1');
      }
    };

    init();
    intervalRef.current = setInterval(fetchEvents, 30000);
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line

  const addEvent = useCallback(async (data) => {
    const result = await apiFetch('/api/events', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        date: data.date,
        end_date: data.endDate || data.date,
        emoji: data.emoji || '📅',
        color: data.color || '#22c55e',
        note: data.note || '',
      }),
    });
    setEvents(prev => [...prev, result.event].sort((a, b) => a.date.localeCompare(b.date)));
    return result.event;
  }, []);

  const updateEvent = useCallback(async (data) => {
    const { id } = data;
    const body = {};
    if (data.title !== undefined) body.title = data.title;
    if (data.date !== undefined) body.date = data.date;
    if (data.endDate !== undefined) body.end_date = data.endDate;
    if (data.emoji !== undefined) body.emoji = data.emoji;
    if (data.color !== undefined) body.color = data.color;
    if (data.note !== undefined) body.note = data.note;
    if (data.itinerary !== undefined) body.itinerary = data.itinerary;
    if ('review' in data) body.review = data.review;

    const result = await apiFetch(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setEvents(prev =>
      prev.map(e => e.id === id ? result.event : e)
        .sort((a, b) => a.date.localeCompare(b.date))
    );
    return result.event;
  }, []);

  const deleteEvent = useCallback(async (eventId) => {
    await apiFetch(`/api/events/${eventId}`, { method: 'DELETE' });
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  const inviteFriend = useCallback(async (eventId, username) => {
    const result = await apiFetch(`/api/events/${eventId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    await fetchEvents();
    return result;
  }, [fetchEvents]);

  const leaveEvent = useCallback(async (eventId) => {
    await apiFetch(`/api/events/${eventId}/leave`, { method: 'DELETE' });
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  const removeParticipant = useCallback(async (eventId, userId) => {
    await apiFetch(`/api/events/${eventId}/participants/${userId}`, { method: 'DELETE' });
    await fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    inviteFriend,
    leaveEvent,
    removeParticipant,
    refresh: fetchEvents,
  };
}
