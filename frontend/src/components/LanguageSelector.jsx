import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Check } from 'lucide-react';

/**
 * Compact Language Selector — just a small flag button with dropdown
 * Used in: Landing page header, Login screen
 */
export function LanguageSelectorCompact() {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = languages[language];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-testid="language-selector-compact"
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
        title={currentLang?.name}
      >
        <span className="text-base">{currentLang?.flag}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute top-full right-0 mt-2 w-44 rounded-xl overflow-hidden z-50 shadow-2xl"
            style={{ background: '#111', border: '1px solid #1f1f1f', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
          >
            {Object.values(languages).map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                data-testid={`lang-option-${lang.code}`}
                className={`w-full px-3.5 py-2.5 flex items-center gap-3 text-sm transition-all ${
                  language === lang.code
                    ? 'bg-[#22c55e]/15 text-[#22c55e]'
                    : 'text-[#9ca3af] hover:bg-[#1a1a1a]'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1 text-left font-medium">{lang.name}</span>
                {language === lang.code && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Menu Language Selector — horizontal row for hamburger/drawer menus
 * Used in: Navbar drawer menu
 */
export function LanguageSelectorMenu() {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className="flex items-center gap-1.5">
      {Object.values(languages).map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          data-testid={`lang-menu-${lang.code}`}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            language === lang.code
              ? 'bg-[#22c55e]/15 ring-1 ring-[#22c55e]/40'
              : 'hover:bg-white/5'
          }`}
          title={lang.name}
        >
          <span className="text-base">{lang.flag}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Default export — dropdown with globe icon (for Customize panel)
 */
export default function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(languages).map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          data-testid={`lang-${lang.code}`}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            language === lang.code
              ? 'border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e]'
              : 'border-[#1f1f1f] bg-[#0f0f0f] text-[#9ca3af] hover:border-[#2a2a2a] hover:bg-[#111]'
          }`}
        >
          <span className="text-lg">{lang.flag}</span>
          <span>{lang.name}</span>
          {language === lang.code && <Check className="w-4 h-4 ml-1" />}
        </button>
      ))}
    </div>
  );
}
