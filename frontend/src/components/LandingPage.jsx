import { useState } from 'react';
import LandingChart from './LandingChart.jsx';

export default function LandingPage({ onGetStarted }) {
  const features = [
    {
      icon: '✅',
      title: 'Track Daily Habits',
      description: 'Build powerful routines with beautiful habit tracking',
      color: '#22c55e'
    },
    {
      icon: '🔥',
      title: 'Streak System',
      description: 'Stay motivated with streaks and never break the chain',
      color: '#f97316'
    },
    {
      icon: '📊',
      title: 'Detailed Stats',
      description: 'Visualize your progress with charts and insights',
      color: '#3b82f6'
    },
    {
      icon: '🏆',
      title: 'Achievements',
      description: 'Unlock medals and level up as you grow',
      color: '#a855f7'
    },
    {
      icon: '👥',
      title: 'Friends',
      description: 'Connect with friends and track progress together',
      color: '#ec4899'
    },
    {
      icon: '☁️',
      title: 'Cloud Sync',
      description: 'Your data synced securely across all devices',
      color: '#06b6d4'
    }
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#22c55e10] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#22c55e] opacity-[0.03] blur-[120px] rounded-full" />
        
        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-xl tracking-tight">RoutineTracker</span>
          </div>
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#22c55e] text-black hover:bg-[#16a34a] transition-all active:scale-95"
          >
            Get Started
          </button>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 px-6 pt-12 pb-20 sm:pt-20 sm:pb-28 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22c55e15] border border-[#22c55e30] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[#22c55e] text-sm font-medium">Level up your life</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Build habits that
            <span className="block text-[#22c55e]">actually stick</span>
          </h1>
          
          <p className="text-[#9ca3af] text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Transform your daily routines into a game. Track habits, earn XP, 
            level up, and compete with friends — all in one beautiful app.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              data-testid="hero-get-started"
              onClick={onGetStarted}
              className="px-8 py-4 rounded-2xl text-base font-bold bg-[#22c55e] text-black hover:bg-[#16a34a] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Start Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <a
              href="#features"
              className="px-8 py-4 rounded-2xl text-base font-semibold border border-[#1f1f1f] hover:border-[#333] hover:bg-[#111] transition-all flex items-center justify-center gap-2"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-16 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">100+</p>
              <p className="text-[#6b7280] text-sm">Daily habits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-[#22c55e]">∞</p>
              <p className="text-[#6b7280] text-sm">Possibilities</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">Free</p>
              <p className="text-[#6b7280] text-sm">Forever</p>
            </div>
          </div>
        </div>
      </header>

      {/* App Preview Section */}
      <section className="relative py-16 sm:py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f0f] to-[#080808]" />
        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Mock phone */}
          <div className="relative mx-auto max-w-[300px] sm:max-w-[340px]">
            <div className="absolute -inset-4 bg-[#22c55e] opacity-20 blur-3xl rounded-full" />
            <div className="relative rounded-[40px] border-4 border-[#1f1f1f] bg-[#0a0a0a] p-2 shadow-2xl">
              <div className="rounded-[32px] overflow-hidden bg-[#080808]">
                {/* Status bar mock */}
                <div className="flex items-center justify-between px-6 py-3 bg-[#0a0a0a]">
                  <span className="text-xs text-[#6b7280]">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-2 border border-[#6b7280] rounded-sm">
                      <div className="w-2/3 h-full bg-[#22c55e] rounded-sm" />
                    </div>
                  </div>
                </div>
                
                {/* App content preview */}
                <div className="px-4 py-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-[#3b82f622] flex items-center justify-center text-[#3b82f6] font-bold text-sm">A</div>
                      <div>
                        <p className="text-white text-sm font-semibold">Alex</p>
                        <p className="text-[#22c55e] text-xs">Lv.8 · 2,450 XP</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-lg font-bold">85%</p>
                      <p className="text-[#6b7280] text-[10px]">today</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-[#1f1f1f] rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full" style={{ width: '85%' }} />
                  </div>

                  {/* Mini Chart */}
                  <div className="mb-4 p-3 rounded-xl bg-[#111] border border-[#1f1f1f]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#6b7280] text-xs font-medium">Weekly Progress</span>
                      <span className="text-[#22c55e] text-xs font-bold">+12%</span>
                    </div>
                    <div className="flex items-end justify-between gap-1 h-12">
                      {[75, 85, 60, 90, 80, 95, 70].map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div 
                            className="w-full rounded-t transition-all"
                            style={{ 
                              height: `${val}%`,
                              background: i === 6 ? '#22c55e' : '#22c55e55',
                              minHeight: '4px'
                            }} 
                          />
                          <span className="text-[8px] text-[#4b5563]">{'MTWTFSS'[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Habit cards */}
                  <div className="space-y-2">
                    {[
                      { emoji: '🏃', name: 'Morning Run', streak: 12, done: true },
                      { emoji: '📚', name: 'Read 30min', streak: 8, done: true },
                      { emoji: '🧘', name: 'Meditate', streak: 5, done: false },
                      { emoji: '💧', name: 'Drink Water', streak: 21, done: true },
                    ].map((h, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a]">
                        <span className="text-base">{h.emoji}</span>
                        <span className="flex-1 text-xs text-white">{h.name}</span>
                        <span className="text-[10px] text-[#f97316] mr-1">🔥{h.streak}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${h.done ? 'bg-[#22c55e]' : 'bg-[#1f1f1f]'}`}>
                          {h.done && <span className="text-black text-[10px]">✓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="flex items-center justify-around py-3 border-t border-[#1f1f1f] mt-2">
                  {['🏠', '✅', '📊', '📖'].map((icon, i) => (
                    <div key={i} className={`p-1.5 rounded-lg ${i === 0 ? 'bg-[#22c55e22]' : ''}`}>
                      <span className={`text-sm ${i === 0 ? '' : 'opacity-50'}`}>{icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-[#6b7280] text-lg max-w-xl mx-auto">
              Powerful features to help you build lasting habits
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#333] transition-all hover:-translate-y-1"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Chart Section */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Track your growth</h2>
            <p className="text-[#6b7280] text-lg">Beautiful charts to visualize your progress</p>
          </div>

          {/* Real chart component */}
          <LandingChart accent="#22c55e" />
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-[#6b7280] text-lg">Get started in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Habits', desc: 'Add daily, weekly, or custom habits you want to build', icon: '➕' },
              { step: '02', title: 'Track Progress', desc: 'Check off habits daily and watch your streaks grow', icon: '✅' },
              { step: '03', title: 'Level Up', desc: 'Earn XP, unlock achievements, and become unstoppable', icon: '🚀' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#22c55e15] border border-[#22c55e30] flex items-center justify-center text-3xl mx-auto mb-4">
                  {item.icon}
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-[#22c55e] text-xs font-bold">{item.step}</span>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-[#6b7280] text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial/Social proof */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#a855f715] border border-[#a855f730] mb-8">
            <span className="text-[#a855f7]">🏆</span>
            <span className="text-[#a855f7] text-sm font-medium">Gamified habit tracking</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Turn your goals into<br />
            <span className="text-[#22c55e]">an adventure</span>
          </h2>
          
          <p className="text-[#6b7280] text-lg max-w-2xl mx-auto mb-10">
            Join others who are building better habits through gamification. 
            Every habit completed earns XP, every streak maintained unlocks achievements.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {['🎯 Goals', '💪 Fitness', '📚 Learning', '🧘 Mindfulness', '💼 Work', '❤️ Family'].map((tag, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-[#111] border border-[#1f1f1f] text-sm text-[#9ca3af]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl border border-[#1f1f1f] bg-gradient-to-br from-[#0f0f0f] to-[#080808] p-8 sm:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[#22c55e] opacity-[0.02]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e] opacity-10 blur-[100px] rounded-full" />
            
            <div className="relative z-10">
              <span className="text-5xl mb-6 block">⚡</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to level up?</h2>
              <p className="text-[#6b7280] text-lg mb-8 max-w-lg mx-auto">
                Start building habits that stick. Free forever, no credit card required.
              </p>
              
              <button
                data-testid="cta-get-started"
                onClick={onGetStarted}
                className="px-10 py-4 rounded-2xl text-lg font-bold bg-[#22c55e] text-black hover:bg-[#16a34a] transition-all active:scale-95"
              >
                Get Started Now
              </button>

              <p className="text-[#4b5563] text-sm mt-6">
                ✓ Free forever &nbsp; ✓ No credit card &nbsp; ✓ Google login
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-semibold">RoutineTracker</span>
          </div>
          <p className="text-[#4b5563] text-sm">
            © 2026 RoutineTracker. Level up your life.
          </p>
        </div>
      </footer>
    </div>
  );
}
