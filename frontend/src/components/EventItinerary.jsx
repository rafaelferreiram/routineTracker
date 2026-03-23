import { useState, useRef, useEffect } from 'react';
import PlaceSearch from './PlaceSearch';

const API_URL = import.meta.env.VITE_API_URL || '';

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

function formatDayOfWeek(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short'
  });
}

export default function EventItinerary({ event, onSave, onClose }) {
  const [itinerary, setItinerary] = useState(event.itinerary || []);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Olá! Sou seu assistente de roteiro para "${event.title}". Me conte o que você quer fazer e eu organizo nos dias do evento!` }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary'); // 'itinerary', 'search', 'chat'
  const [searchLocation, setSearchLocation] = useState(event.note || event.title);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const eventDays = getDateRange(event.date, event.endDate || event.date);
  
  // Auto-expand first day if no day is active
  useEffect(() => {
    if (!activeDay && eventDays.length > 0) {
      setActiveDay(eventDays[0]);
    }
  }, [eventDays]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get itinerary for a specific day
  const getDayActivities = (date) => {
    const dayData = itinerary.find(d => d.date === date);
    return dayData?.activities || [];
  };

  // Send message to AI
  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('rq_token');
      const response = await fetch(`${API_URL}/api/ai/itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_title: event.title,
          start_date: event.date,
          end_date: event.endDate || event.date,
          user_message: text,
          current_itinerary: itinerary
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        if (data.itinerary && data.itinerary.length > 0) {
          setItinerary(data.itinerary);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
      }
    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Mic error:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Transcribe audio using Whisper
  const transcribeAudio = async (audioBlob) => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('rq_token');
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      
      const response = await fetch(`${API_URL}/api/ai/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success && data.text) {
        await sendMessage(data.text);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Não consegui entender o áudio. Tente novamente.' }]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Transcribe error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao transcrever áudio.' }]);
      setIsLoading(false);
    }
  };

  // Add activity manually or from place search
  const addActivity = (date, activity) => {
    setItinerary(prev => {
      const existing = prev.find(d => d.date === date);
      if (existing) {
        return prev.map(d => 
          d.date === date 
            ? { ...d, activities: [...d.activities, activity].sort((a, b) => (a.time || '').localeCompare(b.time || '')) }
            : d
        );
      } else {
        return [...prev, { date, activities: [activity] }].sort((a, b) => a.date.localeCompare(b.date));
      }
    });
  };

  // Remove activity
  const removeActivity = (date, index) => {
    setItinerary(prev => 
      prev.map(d => 
        d.date === date 
          ? { ...d, activities: d.activities.filter((_, i) => i !== index) }
          : d
      ).filter(d => d.activities.length > 0)
    );
  };

  // Handle place added from search
  const handlePlaceAdded = (activity) => {
    if (activeDay) {
      addActivity(activeDay, activity);
      // Show success feedback
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `✅ Adicionei "${activity.title}" ao roteiro de ${formatShortDate(activeDay)} às ${activity.time}!` 
      }]);
      setActiveTab('itinerary');
    }
  };

  // Handle save
  const handleSave = () => {
    onSave({ itinerary });
  };

  // Generate ICS file for calendar export
  const generateICS = () => {
    if (!itinerary || itinerary.length === 0) {
      alert('Adicione atividades ao roteiro antes de exportar!');
      return;
    }

    const formatICSDate = (dateStr, timeStr) => {
      const [year, month, day] = dateStr.split('-');
      const [hour, minute] = (timeStr || '09:00').split(':');
      return `${year}${month}${day}T${hour}${minute}00`;
    };

    const escapeICS = (text) => {
      return (text || '').replace(/[\\;,\n]/g, (match) => {
        if (match === '\n') return '\\n';
        return '\\' + match;
      });
    };

    const getDayTLDR = (dayData) => {
      const activities = dayData.activities || [];
      if (activities.length === 0) return '';
      const activityNames = activities.map(a => a.title).join(', ');
      return `TL;DR: ${activityNames}`;
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RoutineTracker//Roteiro//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICS(event.title)} - Roteiro`,
    ];

    itinerary.forEach(dayData => {
      const dayDate = dayData.date;
      const dayTLDR = getDayTLDR(dayData);
      const dayFormatted = new Date(dayDate + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long'
      });

      (dayData.activities || []).forEach((activity, idx) => {
        const startTime = activity.time || '09:00';
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHour = hours + 1;
        const endTime = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        const description = [
          `${event.emoji} ${event.title}`,
          '',
          `📅 ${dayFormatted}`,
          '',
          dayTLDR,
          '',
          activity.notes ? `📝 ${activity.notes}` : '',
          '',
          '—',
          'Gerado por RoutineTracker'
        ].filter(Boolean).join('\\n');

        const uid = `${event.id}-${dayDate}-${idx}@routinetracker`;

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${formatICSDate(new Date().toISOString().split('T')[0], '00:00')}`,
          `DTSTART:${formatICSDate(dayDate, startTime)}`,
          `DTEND:${formatICSDate(dayDate, endTime)}`,
          `SUMMARY:${escapeICS(activity.title)} - ${escapeICS(event.title)}`,
          `DESCRIPTION:${description}`,
          `LOCATION:${escapeICS(activity.notes || event.note || '')}`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_roteiro.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Count total activities
  const totalActivities = itinerary.reduce((sum, d) => sum + (d.activities?.length || 0), 0);

  // Tab buttons
  const tabs = [
    { id: 'itinerary', label: 'Roteiro', icon: '📋' },
    { id: 'search', label: 'Buscar Lugares', icon: '🗺️' },
    { id: 'chat', label: 'Assistente IA', icon: '🤖' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="event-itinerary-modal">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b flex items-center gap-3"
          style={{ borderColor: 'var(--bg-border)' }}>
          <span className="text-3xl">{event.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate">{event.title}</h3>
            <p className="text-[#6b7280] text-sm">
              {formatShortDate(event.date)} — {formatShortDate(event.endDate)} · {eventDays.length} dias
            </p>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white p-2" data-testid="close-itinerary-button">✕</button>
        </div>

        {/* Tab Navigation - Mobile only */}
        <div className="lg:hidden flex-shrink-0 border-b" style={{ borderColor: 'var(--bg-border)' }}>
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                  activeTab === tab.id ? 'border-b-2' : 'text-[#6b7280]'
                }`}
                style={{ 
                  borderColor: activeTab === tab.id ? event.color : 'transparent',
                  color: activeTab === tab.id ? event.color : undefined
                }}
                data-testid={`tab-${tab.id}`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="block mt-0.5">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content - Three columns on desktop */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left: Itinerary by day */}
          <div className={`lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r overflow-hidden ${
            activeTab !== 'itinerary' ? 'hidden lg:flex' : 'flex'
          }`}
            style={{ borderColor: 'var(--bg-border)' }}>
            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--bg-border)' }}>
              <p className="text-[#4b5563] text-xs font-medium uppercase tracking-wider">Roteiro</p>
              {totalActivities > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${event.color}20`, color: event.color }}>
                  {totalActivities} atividades
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {eventDays.map(day => {
                const activities = getDayActivities(day);
                const isActive = activeDay === day;
                
                return (
                  <div key={day} className="rounded-xl overflow-hidden"
                    style={{ 
                      background: 'var(--bg-inner)', 
                      border: `1px solid ${isActive ? event.color : 'var(--bg-border)'}` 
                    }}
                    data-testid={`day-${day}`}>
                    
                    <button 
                      onClick={() => setActiveDay(isActive ? null : day)}
                      className="w-full flex items-center justify-between p-3 text-left">
                      <div>
                        <p className="text-white font-medium text-sm">{formatShortDate(day)}</p>
                        <p className="text-[#4b5563] text-xs">{formatDayOfWeek(day)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activities.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${event.color}20`, color: event.color }}>
                            {activities.length}
                          </span>
                        )}
                        <span className="text-[#4b5563] text-xs">{isActive ? '▼' : '▶'}</span>
                      </div>
                    </button>
                    
                    {isActive && (
                      <div className="px-3 pb-3 space-y-2">
                        {activities.length === 0 ? (
                          <p className="text-[#4b5563] text-xs italic py-2">Nenhuma atividade ainda</p>
                        ) : (
                          activities.map((activity, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg group"
                              style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs font-mono text-[#6b7280] w-12 flex-shrink-0">
                                {activity.time || '--:--'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm">{activity.title}</p>
                                {activity.notes && (
                                  <p className="text-[#4b5563] text-xs mt-0.5 truncate">{activity.notes}</p>
                                )}
                                {activity.rating && (
                                  <p className="text-yellow-400 text-xs mt-0.5">
                                    {'★'.repeat(Math.floor(activity.rating))} {activity.rating.toFixed(1)}
                                  </p>
                                )}
                              </div>
                              <button 
                                onClick={() => removeActivity(day, i)}
                                className="text-[#4b5563] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100"
                                data-testid={`remove-activity-${i}`}>
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                        
                        {/* Quick add */}
                        <button 
                          onClick={() => {
                            const title = prompt('Nome da atividade:');
                            if (title) {
                              const time = prompt('Horário (ex: 10:00):', '09:00');
                              addActivity(day, { time: time || '', title, notes: '' });
                            }
                          }}
                          className="w-full py-2 text-xs text-[#4b5563] hover:text-white border border-dashed rounded-lg"
                          style={{ borderColor: 'var(--bg-border)' }}
                          data-testid="add-activity-manual">
                          + Adicionar manualmente
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle: Place Search */}
          <div className={`lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r overflow-hidden ${
            activeTab !== 'search' ? 'hidden lg:flex' : 'flex'
          }`}
            style={{ borderColor: 'var(--bg-border)' }}>
            <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--bg-border)' }}>
              <span className="text-lg">🗺️</span>
              <p className="text-[#4b5563] text-xs font-medium uppercase tracking-wider">Buscar Lugares</p>
            </div>
            
            {/* Location Input */}
            <div className="p-3 border-b" style={{ borderColor: 'var(--bg-border)' }}>
              <label className="text-[#6b7280] text-xs mb-1.5 block">Localização da busca:</label>
              <input
                type="text"
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
                placeholder="Ex: Times Square, NYC"
                className="w-full bg-transparent text-white placeholder-[#4b5563] rounded-xl px-4 py-2.5 outline-none border text-sm"
                style={{ borderColor: 'var(--bg-border)' }}
                data-testid="search-location-input"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              <PlaceSearch
                location={searchLocation}
                onAddToItinerary={handlePlaceAdded}
                selectedDate={activeDay}
                accentColor={event.color}
              />
            </div>
          </div>

          {/* Right: AI Chat */}
          <div className={`lg:w-1/3 flex flex-col flex-1 lg:flex-initial overflow-hidden ${
            activeTab !== 'chat' ? 'hidden lg:flex' : 'flex'
          }`}>
            <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--bg-border)' }}>
              <span className="text-lg">🤖</span>
              <p className="text-[#4b5563] text-xs font-medium uppercase tracking-wider">Assistente IA</p>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'rounded-br-md' 
                      : 'rounded-bl-md'
                  }`}
                    style={{ 
                      background: msg.role === 'user' ? event.color : 'var(--bg-inner)',
                      color: msg.role === 'user' ? '#000' : 'var(--text-primary, #e5e7eb)'
                    }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md px-4 py-3"
                    style={{ background: 'var(--bg-inner)' }}>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#4b5563] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#4b5563] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#4b5563] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: 'var(--bg-border)' }}>
              <div className="flex gap-2">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isRecording ? 'animate-pulse' : ''
                  }`}
                  style={{ 
                    background: isRecording ? '#ef4444' : 'var(--bg-inner)',
                    border: '1px solid var(--bg-border)'
                  }}
                  data-testid="voice-record-button">
                  <span className="text-lg">{isRecording ? '⏹' : '🎤'}</span>
                </button>
                
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(inputText)}
                  placeholder="Digite ou fale o que quer fazer..."
                  disabled={isLoading || isRecording}
                  className="flex-1 bg-transparent text-white placeholder-[#4b5563] rounded-xl px-4 py-2.5 outline-none border text-sm"
                  style={{ borderColor: 'var(--bg-border)' }}
                  data-testid="ai-chat-input"
                />
                
                <button
                  onClick={() => sendMessage(inputText)}
                  disabled={isLoading || !inputText.trim()}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ background: event.color }}
                  data-testid="send-message-button">
                  <span className="text-lg">➤</span>
                </button>
              </div>
              
              <p className="text-[#4b5563] text-[10px] mt-2 text-center">
                Ex: "Quero visitar museus, fazer compras e jantar em restaurantes bons"
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t space-y-3" style={{ borderColor: 'var(--bg-border)' }}>
          {/* Export to Calendar */}
          {totalActivities > 0 && (
            <button 
              onClick={generateICS}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--bg-border)', color: 'var(--text-primary, #e5e7eb)' }}
              data-testid="export-calendar-button">
              <span>📅</span>
              <span>Adicionar ao Calendário</span>
              <span className="text-xs text-[#6b7280]">({totalActivities} atividades)</span>
            </button>
          )}
          
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-[#6b7280] text-sm font-medium border"
              style={{ borderColor: 'var(--bg-border)' }}
              data-testid="cancel-button">
              Fechar
            </button>
            <button onClick={handleSave}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: event.color, color: '#000' }}
              data-testid="save-itinerary-button">
              Salvar Roteiro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
