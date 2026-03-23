import { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AIChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou o Roti, seu assistente pessoal. Como posso ajudar? 😊', isVoice: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send text message
  const sendMessage = async (text, isVoiceInput = false) => {
    if (!text.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: text, isVoice: isVoiceInput };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('rq_token');
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const aiMessage = { role: 'assistant', content: data.message, isVoice: isVoiceInput };
        setMessages(prev => [...prev, aiMessage]);
        
        // If user spoke, AI responds with voice
        if (isVoiceInput) {
          await speakText(data.message);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.', isVoice: false }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente.', isVoice: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert text to speech
  const speakText = async (text) => {
    setIsSpeaking(true);
    try {
      const token = localStorage.getItem('rq_token');
      const response = await fetch(`${API_URL}/api/ai/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text, voice: 'nova' })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };
        }
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
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
        await transcribeAndSend(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Mic error:', error);
      alert('Não foi possível acessar o microfone.');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Transcribe audio and send as message
  const transcribeAndSend = async (audioBlob) => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('rq_token');
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      
      const response = await fetch(`${API_URL}/api/ai/transcribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success && data.text) {
        await sendMessage(data.text, true); // true = voice input
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Não consegui entender. Tente novamente.', isVoice: false }]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Transcribe error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao transcrever áudio.', isVoice: false }]);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg h-[85vh] sm:h-[70vh] flex flex-col rounded-t-3xl sm:rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b flex items-center gap-3"
          style={{ borderColor: 'var(--bg-border)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
            🤖
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">Roti</h3>
            <p className="text-[#6b7280] text-xs">Assistente IA</p>
          </div>
          {isSpeaking && (
            <div className="flex items-center gap-1 text-[#22c55e] text-xs">
              <span className="animate-pulse">🔊</span>
              <span>Falando...</span>
            </div>
          )}
          <button onClick={onClose} className="text-[#6b7280] hover:text-white p-2 text-lg">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user' 
                  ? 'rounded-br-md' 
                  : 'rounded-bl-md'
              }`}
                style={{ 
                  background: msg.role === 'user' ? '#22c55e' : 'var(--bg-inner)',
                  color: msg.role === 'user' ? '#000' : 'var(--text-primary, #e5e7eb)'
                }}>
                <div className="flex items-start gap-2">
                  {msg.isVoice && <span className="text-xs opacity-70">🎤</span>}
                  <span>{msg.content}</span>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-4 py-3"
                style={{ background: 'var(--bg-inner)' }}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: 'var(--bg-border)' }}>
          <div className="flex gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || isSpeaking}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isRecording ? 'animate-pulse' : ''
              }`}
              style={{ 
                background: isRecording ? '#ef4444' : 'var(--bg-inner)',
                border: '1px solid var(--bg-border)'
              }}>
              <span className="text-xl">{isRecording ? '⏹' : '🎤'}</span>
            </button>
            
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(inputText, false)}
              placeholder="Digite sua mensagem..."
              disabled={isLoading || isRecording || isSpeaking}
              className="flex-1 bg-transparent text-white placeholder-[#4b5563] rounded-xl px-4 py-3 outline-none border text-sm"
              style={{ borderColor: 'var(--bg-border)' }}
            />
            
            <button
              onClick={() => sendMessage(inputText, false)}
              disabled={isLoading || !inputText.trim() || isSpeaking}
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: '#22c55e' }}>
              <span className="text-xl">➤</span>
            </button>
          </div>
          
          <p className="text-[#4b5563] text-[10px] mt-2 text-center">
            💡 Fale por voz e o Roti responde por voz! Digite texto para resposta escrita.
          </p>
        </div>

        {/* Hidden audio element for TTS playback */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}
