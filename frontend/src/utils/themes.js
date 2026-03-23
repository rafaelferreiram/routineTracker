export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark',
    icon: '🌑',
    isLight: false,
    bgMain:   '#080808',
    bgCard:   '#111111',
    bgBorder: '#1f1f1f',
    bgSidebar:'#0a0a0a',
    bgNav:    'rgba(8,8,8,0.95)',
    bgInner:  '#0d0d0d',
    bgInnerBorder: '#1a1a1a',
    bgProgress: '#1f1f1f',
    bgSubtle:  'rgba(255,255,255,0.03)',
    borderSubtle: 'rgba(255,255,255,0.08)',
    textPrimary:   '#f1f5f9',
    textSecondary: '#9ca3af',
    textMuted:     '#6b7280',
    textSubtle:    '#4b5563',
    textDim:       '#3b3b3b',
    textFaded:     'rgba(255,255,255,0.18)',
    defaultAccent: '#22c55e',
  },
  light: {
    id: 'light',
    name: 'Light',
    icon: '☀️',
    isLight: true,
    bgMain:   '#f3f4f6',
    bgCard:   '#ffffff',
    bgBorder: '#e5e7eb',
    bgSidebar:'#ffffff',
    bgNav:    'rgba(255,255,255,0.95)',
    bgInner:  '#f9fafb',
    bgInnerBorder: '#e5e7eb',
    bgProgress: '#e5e7eb',
    bgSubtle:  'rgba(0,0,0,0.025)',
    borderSubtle: 'rgba(0,0,0,0.08)',
    textPrimary:   '#111827',
    textSecondary: '#374151',
    textMuted:     '#6b7280',
    textSubtle:    '#9ca3af',
    textDim:       '#c8cfd8',
    textFaded:     'rgba(0,0,0,0.2)',
    defaultAccent: '#22c55e',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    isLight: false,
    bgMain:   '#08111f',
    bgCard:   '#0d1e35',
    bgBorder: '#1a3050',
    bgSidebar:'#060e1a',
    bgNav:    'rgba(8,17,31,0.95)',
    bgInner:  '#081629',
    bgInnerBorder: '#163050',
    bgProgress: '#0f2540',
    bgSubtle:  'rgba(255,255,255,0.03)',
    borderSubtle: 'rgba(255,255,255,0.08)',
    textPrimary:   '#e0f0ff',
    textSecondary: '#7db8e0',
    textMuted:     '#4a7a9b',
    textSubtle:    '#2d5a78',
    textDim:       '#1e3f58',
    textFaded:     'rgba(224,240,255,0.18)',
    defaultAccent: '#06b6d4',
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    icon: '🌸',
    isLight: true,
    bgMain:   '#fdf2f8',
    bgCard:   '#fff5fa',
    bgBorder: '#fce7f3',
    bgSidebar:'#fef0f7',
    bgNav:    'rgba(253,242,248,0.97)',
    bgInner:  '#fce8f3',
    bgInnerBorder: '#f9d0e7',
    bgProgress: '#fce7f3',
    bgSubtle:  'rgba(0,0,0,0.025)',
    borderSubtle: 'rgba(0,0,0,0.07)',
    textPrimary:   '#3b0a28',
    textSecondary: '#78184a',
    textMuted:     '#9d4e74',
    textSubtle:    '#c084a0',
    textDim:       '#e8c0d4',
    textFaded:     'rgba(0,0,0,0.2)',
    defaultAccent: '#ec4899',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    icon: '🌿',
    isLight: true,
    bgMain:   '#f0fdf4',
    bgCard:   '#f7fff9',
    bgBorder: '#dcfce7',
    bgSidebar:'#ecfdf5',
    bgNav:    'rgba(240,253,244,0.97)',
    bgInner:  '#e8fdf0',
    bgInnerBorder: '#d0f5e0',
    bgProgress: '#dcfce7',
    bgSubtle:  'rgba(0,0,0,0.025)',
    borderSubtle: 'rgba(0,0,0,0.07)',
    textPrimary:   '#052e16',
    textSecondary: '#166534',
    textMuted:     '#4a7c59',
    textSubtle:    '#86b899',
    textDim:       '#b8d8c0',
    textFaded:     'rgba(0,0,0,0.2)',
    defaultAccent: '#16a34a',
  },
};

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.dark;
}

export function applyTheme(theme, accentColor) {
  const root = document.documentElement;
  const accent = accentColor || theme.defaultAccent;
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);

  root.setAttribute('data-theme', theme.id);
  root.style.setProperty('--bg-main',          theme.bgMain);
  root.style.setProperty('--bg-card',          theme.bgCard);
  root.style.setProperty('--bg-border',        theme.bgBorder);
  root.style.setProperty('--bg-sidebar',       theme.bgSidebar);
  root.style.setProperty('--bg-nav',           theme.bgNav);
  root.style.setProperty('--bg-inner',         theme.bgInner);
  root.style.setProperty('--bg-inner-border',  theme.bgInnerBorder);
  root.style.setProperty('--bg-progress',      theme.bgProgress);
  root.style.setProperty('--bg-subtle',         theme.bgSubtle);
  root.style.setProperty('--border-subtle',    theme.borderSubtle);
  root.style.setProperty('--text-primary',     theme.textPrimary);
  root.style.setProperty('--text-secondary',   theme.textSecondary);
  root.style.setProperty('--text-muted',       theme.textMuted);
  root.style.setProperty('--text-subtle',      theme.textSubtle);
  root.style.setProperty('--text-dim',         theme.textDim);
  root.style.setProperty('--text-faded',       theme.textFaded);
  root.style.setProperty('--accent',           accent);
  root.style.setProperty('--accent-rgb',       `${r} ${g} ${b}`);
  document.body.style.background = theme.bgMain;
  document.body.style.color = theme.textPrimary;
  
  // Update PWA theme-color meta tag for mobile status bar
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', theme.bgMain);
  }
  
  // Update apple status bar style
  const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleStatusBar) {
    appleStatusBar.setAttribute('content', theme.isLight ? 'default' : 'black-translucent');
  }
  
  // Update html background for iOS safe areas
  root.style.background = theme.bgMain;
}
