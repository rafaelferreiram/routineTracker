import { useState, useMemo } from 'react';

// ─── TradingView-style Mini Chart ────────────────────────────────────────────
const W = 280, H = 90;
const PAD = { l: 6, r: 6, t: 6, b: 16 };
const cW = W - PAD.l - PAD.r;
const cH = H - PAD.t - PAD.b;

function buildSmoothPath(pts, close = false) {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cpx} ${pts[i - 1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  if (close && pts.length > 1) {
    d += ` L ${pts[pts.length - 1].x} ${PAD.t + cH} L ${pts[0].x} ${PAD.t + cH} Z`;
  }
  return d;
}

function MiniChart({ data, color = '#22c55e' }) {
  const points = useMemo(() => data.map((d, i) => ({
    ...d,
    x: PAD.l + (i / Math.max(data.length - 1, 1)) * cW,
    y: PAD.t + (1 - d.value / 100) * cH,
  })), [data]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 70 }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1={PAD.t} x2="0" y2={PAD.t + cH} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 50, 100].map(pct => (
        <line key={pct} x1={PAD.l} y1={PAD.t + (1 - pct / 100) * cH} x2={PAD.l + cW} y2={PAD.t + (1 - pct / 100) * cH} stroke="#1a1a1a" strokeWidth="1" />
      ))}
      <path d={buildSmoothPath(points, true)} fill="url(#chartGrad)" />
      <path d={buildSmoothPath(points)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} opacity={i === points.length - 1 ? 1 : 0.5} />
      ))}
    </svg>
  );
}

// ─── Sample Data ─────────────────────────────────────────────────────────────
const CHART_DATA = [
  { value: 60 }, { value: 75 }, { value: 65 }, { value: 85 }, 
  { value: 90 }, { value: 95 }, { value: 88 },
];

// ─── UI Mockup Components ────────────────────────────────────────────────────
function MockHabitCard({ emoji, name, completed, streak, onTap }) {
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${onTap ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      style={{ 
        background: completed ? '#22c55e10' : '#0d0d0d', 
        borderColor: completed ? '#22c55e40' : '#1a1a1a' 
      }}
      onClick={onTap}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        style={{ background: '#1a1a1a' }}>
        {emoji}
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{name}</p>
        <p className="text-[#4b5563] text-xs">{streak} dias de streak</p>
      </div>
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all"
        style={{ 
          borderColor: completed ? '#22c55e' : '#2a2a2a',
          background: completed ? '#22c55e' : 'transparent'
        }}
      >
        {completed && <span className="text-black text-sm">✓</span>}
      </div>
    </div>
  );
}

function MockAddButton() {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-[#2a2a2a] text-[#4b5563]">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-dashed border-[#2a2a2a]">
        +
      </div>
      <span className="text-sm">Adicionar hábito</span>
    </div>
  );
}

function MockEvent({ emoji, title, date, color }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}20` }}>
        {emoji}
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{title}</p>
        <p className="text-[#4b5563] text-xs">{date}</p>
      </div>
    </div>
  );
}

function MockMedal({ emoji, name, unlocked }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${unlocked ? '' : 'grayscale opacity-40'}`}
        style={{ 
          background: unlocked ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#1a1a1a',
          boxShadow: unlocked ? '0 4px 12px rgba(251, 191, 36, 0.3)' : 'none'
        }}
      >
        {emoji}
      </div>
      <span className={`text-[10px] ${unlocked ? 'text-white' : 'text-[#4b5563]'}`}>{name}</span>
    </div>
  );
}

function HandPointer({ style }) {
  return (
    <div className="absolute animate-bounce" style={{ ...style, animationDuration: '1s' }}>
      <span className="text-2xl">👆</span>
    </div>
  );
}

// ─── Slide Data ──────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 'welcome',
    tag: 'Bem-vindo',
    title: 'Sua jornada começa aqui',
    description: 'Vamos mostrar como usar o RoutineTracker em poucos passos.',
  },
  {
    id: 'add-habit',
    tag: 'Passo 1',
    title: 'Adicione seus hábitos',
    description: 'Toque no botão + para criar um novo hábito. Escolha emoji, nome, categoria e frequência.',
  },
  {
    id: 'complete-habit',
    tag: 'Passo 2', 
    title: 'Marque como feito',
    description: 'Toque no círculo para marcar o hábito como completo. Você ganha XP e mantém seu streak!',
  },
  {
    id: 'view-stats',
    tag: 'Passo 3',
    title: 'Acompanhe seu progresso',
    description: 'Na aba Stats, veja gráficos do seu desempenho ao longo do tempo.',
  },
  {
    id: 'events',
    tag: 'Passo 4',
    title: 'Agende eventos',
    description: 'Adicione viagens, compromissos ou metas futuras na aba Events.',
  },
  {
    id: 'ai-assistant',
    tag: 'Novidade',
    title: 'Conheça o Roti',
    description: 'Seu assistente IA pessoal! Fale por voz e ele responde por voz. Digite texto e ele responde por texto.',
  },
  {
    id: 'medals',
    tag: 'Passo 5',
    title: 'Conquiste medalhas',
    description: 'Complete desafios para desbloquear medalhas. São 30 conquistas no total!',
  },
  {
    id: 'tips',
    tag: 'Dicas',
    title: 'Aproveite ao máximo',
    description: 'Personalize cores em Customize. Adicione amigos em Friends. Instale o app na home!',
  },
  {
    id: 'ready',
    tag: 'Pronto!',
    title: 'Agora é com você',
    description: 'Comece criando seu primeiro hábito. Consistência é a chave do sucesso!',
  },
];

// ─── Visual Components for each slide ────────────────────────────────────────
function WelcomeVisual() {
  return (
    <div className="relative w-20 h-20 mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 animate-pulse" />
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png" 
          alt="Logo" 
          className="w-14 h-14"
        />
      </div>
    </div>
  );
}

function AddHabitVisual() {
  return (
    <div className="space-y-2 relative">
      <MockHabitCard emoji="🙏" name="Orar" completed={true} streak={7} />
      <MockHabitCard emoji="💪" name="Academia" completed={false} streak={3} />
      <div className="relative">
        <MockAddButton />
        <HandPointer style={{ bottom: -8, right: '30%' }} />
      </div>
    </div>
  );
}

function CompleteHabitVisual() {
  const [demo, setDemo] = useState(false);
  return (
    <div className="space-y-2 relative">
      <MockHabitCard emoji="📚" name="Ler 30 min" completed={true} streak={5} />
      <div className="relative">
        <MockHabitCard 
          emoji="💧" 
          name="Beber 2L água" 
          completed={demo} 
          streak={demo ? 4 : 3}
          onTap={() => setDemo(!demo)}
        />
        {!demo && <HandPointer style={{ top: '50%', right: 2, transform: 'translateY(-50%)' }} />}
      </div>
      {demo && (
        <div className="text-center animate-bounce">
          <span className="text-[#22c55e] text-sm font-semibold">+15 XP! 🎉</span>
        </div>
      )}
    </div>
  );
}

function StatsVisual() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-xs font-medium">Taxa de Conclusão</span>
          <span className="text-[#22c55e] text-xs font-semibold">+28% ↑</span>
        </div>
        <MiniChart data={CHART_DATA} color="#22c55e" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
          <p className="text-white font-bold text-lg">87%</p>
          <p className="text-[#4b5563] text-[10px]">Média</p>
        </div>
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
          <p className="text-[#22c55e] font-bold text-lg">12</p>
          <p className="text-[#4b5563] text-[10px]">Dias Perfeitos</p>
        </div>
      </div>
    </div>
  );
}

function EventsVisual() {
  return (
    <div className="space-y-2 relative">
      <MockEvent emoji="✈️" title="Viagem NYC" date="17-27 Abr" color="#3b82f6" />
      <MockEvent emoji="🥊" title="UFC" date="4 Jun" color="#ef4444" />
      <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-[#2a2a2a] text-[#4b5563]">
        <span className="text-xl">+</span>
        <span className="text-sm">Adicionar evento</span>
      </div>
      <HandPointer style={{ bottom: 0, right: '35%' }} />
    </div>
  );
}

function AIAssistantVisual() {
  return (
    <div className="space-y-3 relative">
      {/* Chat bubbles mockup */}
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm"
          style={{ background: '#22c55e', color: '#000' }}>
          <div className="flex items-center gap-1">
            <span className="text-xs">🎤</span>
            <span>Como melhorar minha rotina?</span>
          </div>
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm"
          style={{ background: '#1a1a1a', color: '#e5e7eb' }}>
          <div className="flex items-start gap-2">
            <span className="text-xs">🔊</span>
            <span>Comece com 3 hábitos simples e aumente gradualmente...</span>
          </div>
        </div>
      </div>
      
      {/* AI button mockup */}
      <div className="flex justify-center mt-4">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg animate-bounce"
          style={{ 
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.5)',
            animationDuration: '2s'
          }}
        >
          <span className="text-2xl">🤖</span>
        </div>
      </div>
      <p className="text-center text-[#6b7280] text-xs">Toque no Roti na barra inferior</p>
    </div>
  );
}

function MedalsVisual() {
  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-4">
        <MockMedal emoji="🔥" name="On Fire" unlocked={true} />
        <MockMedal emoji="⭐" name="7 Dias" unlocked={true} />
        <MockMedal emoji="🏆" name="Mestre" unlocked={false} />
        <MockMedal emoji="💎" name="Lendário" unlocked={false} />
      </div>
      <div className="text-center">
        <p className="text-white text-sm font-medium">10/30 medalhas</p>
        <div className="w-full h-2 rounded-full bg-[#1a1a1a] mt-2 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]" style={{ width: '33%' }} />
        </div>
      </div>
    </div>
  );
}

function TipsVisual() {
  const tips = [
    { emoji: '🎨', text: 'Customize: mude cores e tema' },
    { emoji: '👥', text: 'Friends: adicione amigos' },
    { emoji: '📲', text: 'Instale na tela inicial' },
  ];
  return (
    <div className="space-y-2">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
          <span className="text-xl">{tip.emoji}</span>
          <span className="text-white text-sm">{tip.text}</span>
        </div>
      ))}
    </div>
  );
}

function ReadyVisual() {
  return (
    <div className="relative w-24 h-24 mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#22c55e]/30 to-transparent animate-ping" style={{ animationDuration: '2s' }} />
      <div className="absolute inset-0 flex items-center justify-center text-6xl">
        🚀
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OnboardingCarousel({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) onComplete();
    else setCurrent(prev => prev + 1);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(prev => prev - 1);
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && !isLast) handleNext();
      else if (diff < 0 && current > 0) handlePrev();
    }
    setTouchStart(null);
  };

  const renderVisual = () => {
    switch (slide.id) {
      case 'welcome': return <WelcomeVisual />;
      case 'add-habit': return <AddHabitVisual />;
      case 'complete-habit': return <CompleteHabitVisual />;
      case 'view-stats': return <StatsVisual />;
      case 'events': return <EventsVisual />;
      case 'ai-assistant': return <AIAssistantVisual />;
      case 'medals': return <MedalsVisual />;
      case 'tips': return <TipsVisual />;
      case 'ready': return <ReadyVisual />;
      default: return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#080808' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2">
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png" 
            alt="Logo" 
            className="w-6 h-6"
          />
          <span className="text-white font-semibold text-sm">RoutineTracker</span>
        </div>
        <button 
          onClick={onComplete}
          className="text-[#6b7280] text-sm font-medium hover:text-white transition-colors"
        >
          Pular
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4">
        <div className="flex gap-1">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= current ? '#22c55e' : '#1a1a1a' }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-4 overflow-hidden">
        {/* Tag */}
        <div className="flex justify-center mb-4">
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e30' }}
          >
            {slide.tag}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
          {slide.title}
        </h1>

        {/* Description */}
        <p className="text-[#9ca3af] text-center text-sm max-w-xs mx-auto leading-relaxed mb-6">
          {slide.description}
        </p>

        {/* Visual - takes remaining space */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[280px]">
            {renderVisual()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          {current > 0 && (
            <button
              onClick={handlePrev}
              className="px-5 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{ background: '#1a1a1a', color: '#9ca3af' }}
            >
              ←
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: '#22c55e', color: '#000' }}
          >
            {isLast ? 'Começar! 🎉' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
