import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

/**
 * Language Selector Component
 * Compact dropdown for selecting app language
 */
export default function LanguageSelector({ variant = 'default', showLabel = false }) {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages[language];

  const handleSelect = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  // Compact variant (just flag)
  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-lg bg-[#111] border border-[#1f1f1f] flex items-center justify-center hover:border-[#2a2a2a] transition-all"
          data-testid="language-selector-compact"
        >
          <span className="text-base">{currentLang?.flag}</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div 
              className="absolute top-full right-0 mt-2 w-40 rounded-xl overflow-hidden z-50 shadow-xl"
              style={{ background: '#111', border: '1px solid #1f1f1f' }}
            >
              {Object.values(languages).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full px-3 py-2.5 flex items-center gap-3 text-sm transition-all ${
                    language === lang.code 
                      ? 'bg-[#22c55e]/20 text-[#22c55e]' 
                      : 'text-[#9ca3af] hover:bg-[#1a1a1a]'
                  }`}
                  data-testid={`lang-option-${lang.code}`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.name}</span>
                  {language === lang.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default variant (with label)
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111] border border-[#1f1f1f] hover:border-[#2a2a2a] transition-all"
        data-testid="language-selector"
      >
        <Globe className="w-4 h-4 text-[#6b7280]" />
        <span className="text-base">{currentLang?.flag}</span>
        {showLabel && <span className="text-sm text-white">{currentLang?.name}</span>}
        <ChevronDown className={`w-4 h-4 text-[#6b7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div 
            className="absolute top-full left-0 mt-2 w-48 rounded-xl overflow-hidden z-50 shadow-xl"
            style={{ background: '#0d0d0d', border: '1px solid #1f1f1f' }}
          >
            {Object.values(languages).map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-sm transition-all ${
                  language === lang.code 
                    ? 'bg-[#22c55e]/20 text-[#22c55e]' 
                    : 'text-[#9ca3af] hover:bg-[#1a1a1a]'
                }`}
                data-testid={`lang-option-${lang.code}`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left font-medium">{lang.name}</span>
                {language === lang.code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Inline language selector for landing page
 */
export function LanguageSelectorInline() {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111] border border-[#1f1f1f]">
      {Object.values(languages).map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            language === lang.code 
              ? 'bg-[#22c55e]/20 ring-1 ring-[#22c55e]/50' 
              : 'hover:bg-[#1a1a1a]'
          }`}
          title={lang.name}
          data-testid={`lang-inline-${lang.code}`}
        >
          <span className="text-base">{lang.flag}</span>
        </button>
      ))}
    </div>
  );
}
