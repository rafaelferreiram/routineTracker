import { useState, useMemo } from 'react';

// ─── TradingView-style Mini Chart ────────────────────────────────────────────
const W = 320, H = 120;
const PAD = { l: 8, r: 8, t: 8, b: 20 };
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

function MiniChart({ data, color = '#22c55e', label }) {
  const points = useMemo(() => data.map((d, i) => ({
    ...d,
    x: PAD.l + (i / Math.max(data.length - 1, 1)) * cW,
    y: PAD.t + (1 - d.value / 100) * cH,
  })), [data]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1={PAD.t} x2="0" y2={PAD.t + cH} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 50, 100].map(pct => (
          <line key={pct} x1={PAD.l} y1={PAD.t + (1 - pct / 100) * cH} x2={PAD.l + cW} y2={PAD.t + (1 - pct / 100) * cH} stroke="#1a1a1a" strokeWidth="1" />
        ))}
        
        {/* Area */}
        <path d={buildSmoothPath(points, true)} fill={`url(#grad-${label})`} />
        
        {/* Line */}
        <path d={buildSmoothPath(points)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity={i === points.length - 1 ? 1 : 0.5} />
        ))}
        
        {/* Labels */}
        {points.filter((_, i) => i === 0 || i === points.length - 1).map((p, i) => (
          <text key={i} x={p.x} y={H - 4} textAnchor={i === 0 ? 'start' : 'end'} fontSize="9" fill="#4b5563">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Slide Data ──────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 'welcome',
    tag: 'Bem-vindo',
    title: 'Transforme hábitos em conquistas',
    description: 'Acompanhe suas rotinas diárias, ganhe XP e suba de nível enquanto constrói uma vida mais produtiva.',
    visual: 'logo',
  },
  {
    id: 'habits',
    tag: 'Hábitos',
    title: 'Organize por categorias',
    description: 'Crie hábitos para Saúde, Trabalho, Estudo, Família e muito mais. Defina frequência diária, semanal ou personalizada.',
    visual: 'categories',
  },
  {
    id: 'progress',
    tag: 'Progresso',
    title: 'Visualize sua evolução',
    description: 'Gráficos interativos estilo TradingView mostram seu progresso ao longo do tempo. Acompanhe streaks e tendências.',
    visual: 'chart',
  },
  {
    id: 'xp',
    tag: 'XP & Níveis',
    title: 'Suba de nível',
    description: 'Cada hábito completado dá XP. Quanto mais consistente, mais bônus. Desbloqueie cores e conquistas especiais.',
    visual: 'levels',
  },
  {
    id: 'medals',
    tag: 'Conquistas',
    title: '30 medalhas para colecionar',
    description: 'Complete desafios como "7 dias seguidos" ou "100 hábitos" e colecione todas as medalhas.',
    visual: 'medals',
  },
  {
    id: 'ready',
    tag: 'Pronto',
    title: 'Sua jornada começa agora',
    description: 'Instale o app na tela inicial para acesso rápido. Consistência é a chave do sucesso!',
    visual: 'rocket',
  },
];

// Sample chart data
const CHART_DATA = [
  { label: 'Seg', value: 60 },
  { label: 'Ter', value: 75 },
  { label: 'Qua', value: 65 },
  { label: 'Qui', value: 85 },
  { label: 'Sex', value: 90 },
  { label: 'Sáb', value: 95 },
  { label: 'Dom', value: 88 },
];

const XP_CHART_DATA = [
  { label: '1', value: 10 },
  { label: '5', value: 25 },
  { label: '10', value: 45 },
  { label: '15', value: 60 },
  { label: '20', value: 80 },
  { label: '23', value: 100 },
];

// ─── Visual Components ───────────────────────────────────────────────────────
function LogoVisual() {
  return (
    <div className="relative w-24 h-24 mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 animate-pulse" />
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png" 
          alt="Logo" 
          className="w-16 h-16"
        />
      </div>
    </div>
  );
}

function CategoriesVisual() {
  const cats = [
    { emoji: '🙏', color: '#8b5cf6' },
    { emoji: '💪', color: '#22c55e' },
    { emoji: '📚', color: '#f59e0b' },
    { emoji: '💼', color: '#3b82f6' },
    { emoji: '❤️', color: '#ec4899' },
  ];
  return (
    <div className="flex justify-center gap-3">
      {cats.map((c, i) => (
        <div 
          key={i}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{ 
            background: `${c.color}15`,
            border: `1px solid ${c.color}40`,
            animationDelay: `${i * 0.1}s`
          }}
        >
          {c.emoji}
        </div>
      ))}
    </div>
  );
}

function ChartVisual() {
  return (
    <div className="space-y-2">
      <MiniChart data={CHART_DATA} color="#22c55e" label="progress" />
      <div className="flex justify-between text-[10px] px-1">
        <span className="text-[#4b5563]">Completion Rate</span>
        <span className="text-[#22c55e] font-semibold">+28% ↑</span>
      </div>
    </div>
  );
}

function LevelsVisual() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1a1a1a" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#22c55e" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="88" strokeDashoffset="22" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Lv.10</span>
            </div>
          </div>
          <p className="text-[10px] text-[#4b5563] mt-1">3,685 XP</p>
        </div>
        <div className="h-12 w-px bg-[#1a1a1a]" />
        <div className="flex-1 max-w-[140px]">
          <MiniChart data={XP_CHART_DATA} color="#8b5cf6" label="xp" />
        </div>
      </div>
    </div>
  );
}

function MedalsVisual() {
  const medals = ['🥇', '🎯', '🔥', '💎'];
  return (
    <div className="flex justify-center gap-4">
      {medals.map((m, i) => (
        <div key={i} className="relative">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
            }}
          >
            {m}
          </div>
          {i < 2 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#22c55e] rounded-full flex items-center justify-center">
              <span className="text-white text-[8px]">✓</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RocketVisual() {
  return (
    <div className="relative w-20 h-20 mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#22c55e]/20 to-transparent animate-ping" style={{ animationDuration: '2s' }} />
      <div className="absolute inset-0 flex items-center justify-center text-5xl">
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
    if (isLast) {
      onComplete();
    } else {
      setCurrent(prev => prev + 1);
    }
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
    switch (slide.visual) {
      case 'logo': return <LogoVisual />;
      case 'categories': return <CategoriesVisual />;
      case 'chart': return <ChartVisual />;
      case 'levels': return <LevelsVisual />;
      case 'medals': return <MedalsVisual />;
      case 'rocket': return <RocketVisual />;
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

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* Tag */}
        <div className="flex justify-center mb-6">
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e30' }}
          >
            {slide.tag}
          </span>
        </div>

        {/* Visual */}
        <div className="mb-8">
          {renderVisual()}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
          {slide.title}
        </h1>

        {/* Description */}
        <p className="text-[#9ca3af] text-center text-sm sm:text-base max-w-xs mx-auto leading-relaxed">
          {slide.description}
        </p>
      </div>

      {/* Footer */}
      <div className="p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="transition-all duration-300"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === current ? '#22c55e' : '#2a2a2a',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {current > 0 && (
            <button
              onClick={handlePrev}
              className="px-6 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{ background: '#1a1a1a', color: '#9ca3af' }}
            >
              ←
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: '#22c55e', color: '#000' }}
          >
            {isLast ? 'Começar' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
