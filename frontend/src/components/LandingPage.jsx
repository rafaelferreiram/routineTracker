import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelectorCompact } from './LanguageSelector';
import LandingChart from './LandingChart.jsx';

// Mini mockups for showcases
function DashboardMockup() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#1f1f1f] bg-[#0a0a0a] p-3 text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#22c55e22] flex items-center justify-center text-[#22c55e] font-bold text-sm">A</div>
        <div>
          <p className="text-white text-xs font-semibold">Alex · Lv.8</p>
          <p className="text-[#22c55e] text-[10px]">2.450 XP</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-white text-sm font-bold">85%</p>
          <p className="text-[#4b5563] text-[9px]">hoje</p>
        </div>
      </div>
      <div className="h-1.5 bg-[#1f1f1f] rounded-full mb-3 overflow-hidden">
        <div className="h-full rounded-full bg-[#22c55e]" style={{ width: '85%' }} />
      </div>
      <div className="space-y-1.5">
        {[
          { e: '🏃', n: 'Corrida matinal', s: 12, done: true },
          { e: '📚', n: 'Ler 30min', s: 8, done: true },
          { e: '🧘', n: 'Meditação', s: 5, done: true },
          { e: '💧', n: 'Beber Água', s: 21, done: false },
        ].map((h, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#0f0f0f] border border-[#1a1a1a]">
            <span className="text-sm">{h.e}</span>
            <span className="flex-1 text-[11px] text-white">{h.n}</span>
            <span className="text-[10px] text-[#f97316]">🔥{h.s}</span>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${h.done ? 'bg-[#22c55e]' : 'bg-[#1f1f1f]'}`}>
              {h.done && <span className="text-black text-[8px] font-bold">✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsMockup() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#1f1f1f] bg-[#0a0a0a] p-3 text-left">
      <p className="text-[#4b5563] text-[10px] uppercase tracking-wider mb-2">Próximos</p>
      <div className="space-y-2">
        <div className="rounded-xl border border-[#22c55e40] bg-[#22c55e08] p-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e15] flex items-center justify-center text-base">✈️</div>
            <div className="flex-1">
              <p className="text-white text-xs font-semibold">Viagem NYC</p>
              <p className="text-[#4b5563] text-[10px]">17 abr — 27 abr · 11d</p>
            </div>
            <p className="text-[#22c55e] text-xs font-bold">47d</p>
          </div>
          {/* Participants */}
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {['A', 'M', 'C'].map((l, i) => (
                <div key={i} className={`w-5 h-5 rounded-full border border-[#0a0a0a] flex items-center justify-center text-[9px] font-bold ${i === 0 ? 'bg-[#22c55e] text-black' : i === 1 ? 'bg-[#3b82f6] text-white' : 'bg-[#ec4899] text-white'}`}>{l}</div>
              ))}
            </div>
            <p className="text-[#4b5563] text-[10px]">Alex, Maria, Carlos</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f8717115] flex items-center justify-center text-base">🥊</div>
            <div className="flex-1">
              <p className="text-white text-xs font-semibold">UFC White House</p>
              <p className="text-[#4b5563] text-[10px]">4 jun 2026</p>
            </div>
            <p className="text-[#fbbf24] text-xs font-bold">95d</p>
          </div>
        </div>
      </div>
      <p className="text-[#4b5563] text-[10px] uppercase tracking-wider mt-3 mb-1.5">Memórias · 1/2</p>
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] p-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#ec489915] flex items-center justify-center text-base">🎉</div>
          <div className="flex-1">
            <p className="text-white text-xs font-semibold">Carnaval</p>
            <p className="text-[#4b5563] text-[10px]">1 mar — 5 mar</p>
          </div>
          <span className="text-lg">🤩</span>
        </div>
      </div>
    </div>
  );
}

function TARSMockup() {
  const msgs = [
    { r: 'bot', t: 'Olá Alex! Você completou 3 de 4 hábitos hoje. 🔥' },
    { r: 'user', t: 'Faltou a água hoje, esqueci.' },
    { r: 'bot', t: 'Tudo bem! Você mantém uma sequência incrível de 21 dias. Continue assim amanhã!' },
    { r: 'user', t: 'Qual é meu hábito mais consistente?' },
    { r: 'bot', t: '🏃 Corrida matinal — 12 dias seguidos! É sua maior força agora.' },
  ];
  return (
    <div className="rounded-2xl overflow-hidden border border-[#1f1f1f] bg-[#0a0a0a] p-3 text-left flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-[#3b82f622] flex items-center justify-center text-sm">🤖</div>
        <p className="text-white text-xs font-semibold">TARS</p>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-[10px] text-[#22c55e]">online</span>
        </div>
      </div>
      {msgs.map((m, i) => (
        <div key={i} className={`flex ${m.r === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] rounded-2xl px-2.5 py-1.5 text-[11px] ${m.r === 'user' ? 'rounded-br-sm bg-[#22c55e] text-black' : 'rounded-bl-sm bg-[#1f1f1f] text-[#e5e7eb]'}`}>
            {m.t}
          </div>
        </div>
      ))}
    </div>
  );
}

function SharedEventShowcase() {
  return (
    <div className="rounded-2xl border border-[#22c55e30] bg-[#0a0a0a] p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#22c55e] opacity-5 blur-3xl rounded-full" />
      <div className="relative">
        {/* Event card */}
        <div className="rounded-xl border border-[#22c55e40] bg-[#22c55e08] p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#22c55e15] flex items-center justify-center text-2xl border border-[#22c55e30]">✈️</div>
            <div className="flex-1">
              <p className="text-white font-semibold">Viagem para Nova York</p>
              <p className="text-[#6b7280] text-sm">17 abr — 27 abr · 11 dias</p>
            </div>
            <div className="text-right">
              <p className="text-[#22c55e] font-bold text-lg">47d</p>
              <p className="text-[#4b5563] text-xs">restantes</p>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {[
                { l: 'A', c: '#22c55e', name: 'Alex' },
                { l: 'M', c: '#3b82f6', name: 'Maria' },
                { l: 'C', c: '#ec4899', name: 'Carlos' },
              ].map((p, i) => (
                <div key={i} title={p.name}
                  className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-xs font-bold"
                  style={{ background: p.c, color: p.c === '#22c55e' ? '#000' : '#fff', zIndex: 3 - i }}>
                  {p.l}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-sm">Alex, Maria, Carlos</p>
              <p className="text-[#4b5563] text-xs">3 participantes</p>
            </div>
            <div className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: '#22c55e20', color: '#22c55e' }}>
              Sincronizado
            </div>
          </div>

          {/* Progress bar days */}
          <div className="flex gap-1">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < 3 ? '#22c55e' : '#1f1f1f' }} />
            ))}
          </div>
          <p className="text-[#4b5563] text-[10px] mt-1">3 de 11 dias planejados</p>
        </div>

        {/* Invite action */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#1f1f1f] bg-[#111]">
          <div className="w-9 h-9 rounded-full bg-[#374151] border border-dashed border-[#4b5563] flex items-center justify-center text-[#4b5563] text-lg">+</div>
          <div className="flex-1">
            <p className="text-white text-sm">Convidar mais amigos</p>
            <p className="text-[#4b5563] text-xs">Busque por nome de usuário</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#22c55e15] text-[#22c55e] border border-[#22c55e30]">
            Convidar
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const { t } = useLanguage();

  const features = [
    { icon: '✅', titleKey: 'landing.features.habits', descKey: 'landing.features.habitsDesc', color: '#22c55e' },
    { icon: '🔥', titleKey: 'landing.features.streaks', descKey: 'landing.features.streaksDesc', color: '#f97316' },
    { icon: '🤖', titleKey: 'landing.features.ai', descKey: 'landing.features.aiDesc', color: '#3b82f6' },
    { icon: '📊', titleKey: 'landing.features.statsTitle', descKey: 'landing.features.statsDesc', color: '#a855f7' },
    { icon: '👥', titleKey: 'landing.features.friendsTitle', descKey: 'landing.features.friendsDesc', color: '#ec4899' },
    { icon: '☁️', titleKey: 'landing.features.backupTitle', descKey: 'landing.features.backupDesc', color: '#06b6d4' },
  ];

  const testimonials = [
    { name: 'Mariana C.', country: 'Brasil', avatar: 'MC', color: '#ec4899', stars: 5, quote: 'Finalmente um app de hábitos que não abandono depois de 3 dias. O sistema de XP faz toda a diferença!' },
    { name: 'Pedro S.', country: 'Brasil', avatar: 'PS', color: '#3b82f6', stars: 5, quote: 'Uso com minha namorada para planejar viagens juntos. Os eventos compartilhados são incríveis!' },
    { name: 'Juliana F.', country: 'Portugal', avatar: 'JF', color: '#22c55e', stars: 5, quote: 'O assistente TARS me motivou a manter minha sequência de 30 dias de exercícios. Recomendo!' },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#22c55e10] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#22c55e] opacity-[0.03] blur-[120px] rounded-full" />

        <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <img src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png" alt="RoutineTracker" className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight">RoutineTracker</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelectorCompact />
            <button data-testid="nav-login-btn" onClick={onGetStarted}
              className="hidden sm:flex px-4 py-2.5 rounded-full text-sm font-medium text-[#9ca3af] hover:text-white transition-all items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {t('auth.login')}
            </button>
            <button data-testid="nav-get-started-btn" onClick={onGetStarted}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold bg-[#22c55e] text-black hover:bg-[#16a34a] transition-all active:scale-95">
              {t('landing.getStarted')}
            </button>
          </div>
        </nav>

        <div className="relative z-10 px-6 pt-12 pb-20 sm:pt-20 sm:pb-28 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22c55e15] border border-[#22c55e30] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[#22c55e] text-sm font-medium">{t('landing.badge')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            {t('landing.hero')}
            <span className="block text-[#22c55e]">✓</span>
          </h1>

          <p className="text-[#9ca3af] text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button data-testid="hero-get-started" onClick={onGetStarted}
              className="px-8 py-4 rounded-2xl text-base font-bold bg-[#22c55e] text-black hover:bg-[#16a34a] transition-all active:scale-95 flex items-center justify-center gap-2">
              {t('landing.getStarted')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-16 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">100+</p>
              <p className="text-[#6b7280] text-sm">{t('nav.habits')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-[#22c55e]">∞</p>
              <p className="text-[#6b7280] text-sm">{t('events.upcoming')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">{t('landing.free')}</p>
              <p className="text-[#6b7280] text-sm">{t('landing.forever')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── App Screenshots Showcase ── */}
      <section className="py-16 sm:py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-[#22c55e15] text-[#22c55e] text-xs font-semibold uppercase tracking-wider mb-4">
              Veja em uso
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tudo que você precisa, num só lugar</h2>
            <p className="text-[#6b7280] text-lg max-w-xl mx-auto">
              Hábitos, eventos, amigos e IA — integrados para transformar sua rotina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Dashboard */}
            <div className="group p-5 rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#22c55e40] transition-all">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#22c55e15] flex items-center justify-center">✅</div>
                <div>
                  <p className="text-white text-sm font-semibold">Dashboard de Hábitos</p>
                  <p className="text-[#4b5563] text-xs">Acompanhe seu progresso diário</p>
                </div>
              </div>
              <DashboardMockup />
            </div>

            {/* Events */}
            <div className="group p-5 rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#3b82f640] transition-all">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#3b82f615] flex items-center justify-center">✈️</div>
                <div>
                  <p className="text-white text-sm font-semibold">Eventos Compartilhados</p>
                  <p className="text-[#4b5563] text-xs">Planeje com seus amigos</p>
                </div>
              </div>
              <EventsMockup />
            </div>

            {/* TARS */}
            <div className="group p-5 rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#a855f740] transition-all">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#a855f715] flex items-center justify-center">🤖</div>
                <div>
                  <p className="text-white text-sm font-semibold">Assistente TARS</p>
                  <p className="text-[#4b5563] text-xs">IA que te conhece e motiva</p>
                </div>
              </div>
              <TARSMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('landing.everythingYouNeed')}</h2>
            <p className="text-[#6b7280] text-lg max-w-xl mx-auto">{t('landing.powerfulFeatures')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#333] transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}>
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{t(feature.titleKey)}</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shared Events Feature Section ── */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#22c55e15] text-[#22c55e] text-xs font-semibold uppercase tracking-wider mb-5">
                Novidade
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-5 leading-tight">
                Eventos que todo mundo
                <span className="text-[#22c55e]"> vê e planeja junto</span>
              </h2>
              <p className="text-[#9ca3af] text-lg leading-relaxed mb-6">
                Crie um evento, convide seus amigos pelo username e todos veêm automaticamente — sem precisar compartilhar nada manualmente.
              </p>

              <div className="space-y-4">
                {[
                  { icon: '👥', title: 'Convite por username', desc: 'Busque qualquer usuário e adicione com um clique.' },
                  { icon: '🔄', title: 'Sincronização em tempo real', desc: 'Qualquer atualização no evento aparece para todos os participantes.' },
                  { icon: '📋', title: 'Roteiro compartilhado', desc: 'Planejem atividades juntos com o assistente de IA integrado.' },
                  { icon: '📸', title: 'Memórias coletivas', desc: 'Registrem fotos e avaliações após o evento — cada um no seu ritmo.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                      style={{ background: '#22c55e15', border: '1px solid #22c55e30' }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{item.title}</p>
                      <p className="text-[#6b7280] text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={onGetStarted}
                className="mt-8 px-6 py-3 rounded-2xl font-semibold bg-[#22c55e] text-black hover:bg-[#16a34a] transition-all active:scale-95">
                Experimente grátis
              </button>
            </div>

            <div>
              <SharedEventShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Chart Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('landing.trackGrowth')}</h2>
            <p className="text-[#6b7280] text-lg">{t('landing.trackGrowthDesc')}</p>
          </div>
          <LandingChart accent="#22c55e" />
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('landing.howItWorks')}</h2>
            <p className="text-[#6b7280] text-lg">{t('landing.howItWorksDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', titleKey: 'landing.steps.create', descKey: 'landing.steps.createDesc', icon: '➕' },
              { step: '02', titleKey: 'landing.steps.track', descKey: 'landing.steps.trackDesc', icon: '✅' },
              { step: '03', titleKey: 'landing.steps.levelUp', descKey: 'landing.steps.levelUpDesc', icon: '🚀' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#22c55e15] border border-[#22c55e30] flex items-center justify-center text-3xl mx-auto mb-4">
                  {item.icon}
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-[#22c55e] text-xs font-bold">{item.step}</span>
                <h3 className="text-white font-bold text-lg mb-2">{t(item.titleKey)}</h3>
                <p className="text-[#6b7280] text-sm">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#a855f715] border border-[#a855f730] mb-6">
              <span className="text-[#a855f7]">🏆</span>
              <span className="text-[#a855f7] text-sm font-medium">{t('landing.gamified')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('landing.adventureTitle')}<br />
              <span className="text-[#22c55e]">{t('landing.adventureHighlight')}</span>
            </h2>
            <p className="text-[#6b7280] text-lg max-w-2xl mx-auto mb-12">{t('landing.adventureDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] flex flex-col gap-4">
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j} className="text-[#fbbf24] text-sm">★</span>
                  ))}
                </div>
                <p className="text-[#9ca3af] text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${t.color}20`, color: t.color, border: `1px solid ${t.color}30` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-[#4b5563] text-xs">{t.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl border border-[#1f1f1f] bg-gradient-to-br from-[#0f0f0f] to-[#080808] p-8 sm:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[#22c55e] opacity-[0.02]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e] opacity-10 blur-[100px] rounded-full" />

            <div className="relative z-10">
              <img src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png" alt="RoutineTracker" className="w-14 h-14 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('landing.readyTitle')}</h2>
              <p className="text-[#6b7280] text-lg mb-8 max-w-lg mx-auto">{t('landing.readyDesc')}</p>
              <button data-testid="cta-get-started" onClick={onGetStarted}
                className="px-10 py-4 rounded-2xl text-lg font-bold bg-[#22c55e] text-black hover:bg-[#16a34a] transition-all active:scale-95">
                {t('landing.getStartedNow')}
              </button>
              <p className="text-[#4b5563] text-sm mt-6">
                ✓ {t('landing.freeForever')} &nbsp; ✓ {t('landing.noCreditCard')} &nbsp; ✓ {t('landing.googleLoginLabel')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png" alt="RoutineTracker" className="w-6 h-6" />
            <span className="font-semibold">RoutineTracker</span>
          </div>
          <p className="text-[#4b5563] text-sm">© 2026 RoutineTracker. {t('nav.levelUpLife')}.</p>
        </div>
      </footer>
    </div>
  );
}
