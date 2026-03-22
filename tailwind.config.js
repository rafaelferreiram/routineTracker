/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          light: '#8B5CF6',
          lighter: '#A78BFA',
          dark: '#6D28D9',
        },
        accent: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          lighter: '#86efac',
          dark: '#16a34a',
          darker: '#14532d',
        },
        dark: {
          bg: '#080808',
          card: '#111111',
          surface: '#0f0f0f',
          border: '#1f1f1f',
          text: '#E2E8F0',
          muted: '#6b7280',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-app': 'linear-gradient(135deg, #080808 0%, #0a0a0a 50%, #0f0f0f 100%)',
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-glow-green': 'pulseGlowGreen 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'confetti-fall': 'confettiFall 1s ease-in forwards',
        'pop': 'pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shimmer': 'shimmer 2s linear infinite',
        'ring-fill': 'ringFill 1s ease-out forwards',
        'toast-in': 'toastIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'toast-out': 'toastOut 0.3s ease-in forwards',
        'xp-fill': 'xpFill 1s ease-out forwards',
        'star-burst': 'starBurst 0.6s ease-out forwards',
        'wobble': 'wobble 0.5s ease-in-out',
        'level-up': 'levelUp 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.8), 0 0 40px rgba(124, 58, 237, 0.4)' },
        },
        pulseGlowGreen: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(34, 197, 94, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.7), 0 0 40px rgba(34, 197, 94, 0.3)' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ringFill: {
          '0%': { strokeDashoffset: '251.2' },
          '100%': { strokeDashoffset: 'var(--dash-offset)' },
        },
        toastIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        toastOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        xpFill: {
          '0%': { width: 'var(--xp-start)' },
          '100%': { width: 'var(--xp-end)' },
        },
        starBurst: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.5) rotate(180deg)', opacity: '0.8' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '0' },
        },
        wobble: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px) rotate(-3deg)' },
          '75%': { transform: 'translateX(5px) rotate(3deg)' },
        },
        levelUp: {
          '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
