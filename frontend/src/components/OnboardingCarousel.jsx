import { useState, useEffect } from 'react';

const ONBOARDING_SLIDES = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Bem-vindo ao RoutineTracker!',
    subtitle: 'Transforme seus hábitos em conquistas',
    description: 'Acompanhe suas rotinas diárias, ganhe XP e suba de nível enquanto constrói uma vida mais saudável e produtiva.',
    tip: 'Deslize para conhecer o app →',
    color: '#22c55e',
    animation: (
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/20 to-green-600/20 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-400/30 to-green-600/30 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 flex items-center justify-center text-6xl animate-bounce" style={{ animationDuration: '2s' }}>
          ⚡
        </div>
      </div>
    ),
  },
  {
    id: 'habits',
    emoji: '✅',
    title: 'Crie seus Hábitos',
    subtitle: 'Organize por categorias',
    description: 'Adicione hábitos para Saúde, Trabalho, Estudo, Família e muito mais. Cada hábito pode ser diário, semanal ou personalizado.',
    tip: 'Toque em + para criar um novo hábito',
    color: '#3b82f6',
    animation: (
      <div className="flex justify-center gap-3 mb-6">
        {['🙏', '💪', '📚', '💼', '❤️'].map((emoji, i) => (
          <div 
            key={i}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl animate-bounce"
            style={{ 
              background: `hsl(${i * 60}, 70%, 95%)`,
              border: `2px solid hsl(${i * 60}, 70%, 80%)`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1.5s'
            }}
          >
            {emoji}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'complete',
    emoji: '🔥',
    title: 'Complete e Ganhe XP',
    subtitle: 'Mantenha suas sequências',
    description: 'Cada hábito completado dá XP. Quanto mais dias seguidos (streak), mais bônus você ganha!',
    tip: 'Streaks de 7+ dias = 2x XP!',
    color: '#f59e0b',
    animation: (
      <div className="relative h-32 flex items-center justify-center mb-6">
        <div className="flex items-end gap-2">
          {[40, 55, 70, 85, 100].map((h, i) => (
            <div 
              key={i}
              className="w-8 rounded-t-lg animate-pulse"
              style={{ 
                height: `${h}px`,
                background: `linear-gradient(to top, #f59e0b, #fbbf24)`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
        <div className="absolute -top-2 right-1/4 text-3xl animate-bounce" style={{ animationDuration: '1s' }}>
          🔥
        </div>
        <div className="absolute top-0 left-1/4 text-2xl animate-ping" style={{ animationDuration: '2s' }}>
          +50
        </div>
      </div>
    ),
  },
  {
    id: 'levels',
    emoji: '🏆',
    title: 'Suba de Nível',
    subtitle: 'Desbloqueie conquistas',
    description: 'Acumule XP para subir de nível. Cada nível traz novas cores e desbloqueia medalhas especiais!',
    tip: 'Nível 10 = Mestre dos Hábitos!',
    color: '#8b5cf6',
    animation: (
      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1f1f1f" strokeWidth="8" />
          <circle 
            cx="50" cy="50" r="40" fill="none" stroke="url(#gradient)" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset="50"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">Lv.10</span>
          <span className="text-xs text-[#8b5cf6]">3,685 XP</span>
        </div>
      </div>
    ),
  },
  {
    id: 'medals',
    emoji: '🏅',
    title: 'Conquiste Medalhas',
    subtitle: '30 conquistas para desbloquear',
    description: 'Complete desafios especiais como "7 dias seguidos" ou "100 hábitos completos" e colecione todas as medalhas!',
    tip: 'Veja seu progresso em "Medals"',
    color: '#ec4899',
    animation: (
      <div className="flex justify-center gap-4 mb-6">
        {['🥇', '🎯', '⭐', '💎'].map((medal, i) => (
          <div 
            key={i}
            className="relative"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-bounce"
              style={{ 
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)',
                animationDelay: `${i * 0.15}s`,
                animationDuration: '2s'
              }}
            >
              {medal}
            </div>
            {i < 2 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'install',
    emoji: '📲',
    title: 'Instale o App',
    subtitle: 'Acesso rápido na sua home',
    description: 'Adicione o RoutineTracker à tela inicial do seu celular para acesso instantâneo, como um app nativo!',
    tip: 'Menu ☰ → "Instalar App"',
    color: '#06b6d4',
    animation: (
      <div className="relative w-24 h-40 mx-auto mb-6">
        {/* Phone frame */}
        <div className="absolute inset-0 rounded-3xl border-4 border-gray-700 bg-gray-900">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-700 rounded-full" />
          <div className="absolute inset-3 top-6 rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-pulse">
              <span className="text-xl">⚡</span>
            </div>
          </div>
        </div>
        {/* Floating arrow */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
          ⬇️
        </div>
      </div>
    ),
  },
  {
    id: 'ready',
    emoji: '🚀',
    title: 'Pronto para começar!',
    subtitle: 'Sua jornada começa agora',
    description: 'Crie seu primeiro hábito e comece a transformar sua rotina. Lembre-se: consistência é a chave!',
    tip: 'Você consegue! 💪',
    color: '#22c55e',
    animation: (
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-600/30 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-7xl animate-bounce" style={{ animationDuration: '1s' }}>🚀</span>
        </div>
      </div>
    ),
  },
];

export default function OnboardingCarousel({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  const slide = ONBOARDING_SLIDES[currentSlide];
  const isLast = currentSlide === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && !isLast) {
        handleNext();
      } else if (diff < 0 && currentSlide > 0) {
        handlePrev();
      }
    }
    setTouchStart(null);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#080808' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button */}
      <div className="flex justify-end p-4 pt-safe">
        <button 
          onClick={handleSkip}
          className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-white transition-colors"
        >
          Pular
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        {/* Animation */}
        {slide.animation}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
          {slide.title}
        </h1>

        {/* Subtitle */}
        <p className="text-base font-medium text-center mb-4" style={{ color: slide.color }}>
          {slide.subtitle}
        </p>

        {/* Description */}
        <p className="text-[#9ca3af] text-center text-sm sm:text-base max-w-sm leading-relaxed mb-6">
          {slide.description}
        </p>

        {/* Tip box */}
        <div 
          className="px-4 py-2.5 rounded-full text-sm font-medium"
          style={{ background: `${slide.color}15`, color: slide.color, border: `1px solid ${slide.color}30` }}
        >
          💡 {slide.tip}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="p-6 pb-safe space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {ONBOARDING_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="transition-all duration-300"
              style={{
                width: i === currentSlide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentSlide ? slide.color : '#374151',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 py-4 rounded-2xl text-base font-semibold transition-all active:scale-[0.98]"
              style={{ background: '#1f1f1f', color: '#9ca3af' }}
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-4 rounded-2xl text-base font-semibold transition-all active:scale-[0.98]"
            style={{ background: slide.color, color: '#000' }}
          >
            {isLast ? 'Começar! 🎉' : 'Próximo →'}
          </button>
        </div>
      </div>
    </div>
  );
}
