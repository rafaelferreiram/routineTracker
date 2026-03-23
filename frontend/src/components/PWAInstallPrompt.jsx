import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function PWAInstallPrompt({ onClose }) {
  const { t } = useLanguage();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useState(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('pwa_installed', 'true');
      }
      setInstallPrompt(null);
      onClose();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={handleDismiss}
    >
      <div 
        className="w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden animate-slide-up"
        style={{ 
          background: 'var(--bg-card, #111111)', 
          border: '1px solid var(--bg-border, #1f1f1f)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.4)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with app icon */}
        <div className="p-5 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png" 
              alt="RoutineTracker" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <h2 className="text-white text-lg font-bold mb-1">
            {t('pwa.addToHome')}
          </h2>
          <p className="text-[#9ca3af] text-sm">
            {t('pwa.quickAccess')}
          </p>
        </div>

        {/* iOS Instructions */}
        {isIOS && (
          <div className="px-5 pb-4">
            <div className="rounded-xl p-4" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
              <p className="text-white text-sm font-medium mb-3">{t('pwa.inSafari')}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[#9ca3af] text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs">1</span>
                  <span>{t('pwa.iosStep1')} (↑)</span>
                </div>
                <div className="flex items-center gap-3 text-[#9ca3af] text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs">2</span>
                  <span>{t('pwa.iosStep2')}</span>
                </div>
                <div className="flex items-center gap-3 text-[#9ca3af] text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs">3</span>
                  <span>{t('pwa.iosStep3')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-4 flex gap-3" style={{ borderTop: '1px solid var(--bg-border, #1f1f1f)' }}>
          <button
            onClick={handleDismiss}
            className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: '#1a1a1a', color: '#9ca3af' }}
            data-testid="pwa-install-no"
          >
            {t('pwa.notNow')}
          </button>
          {isIOS ? (
            <button
              onClick={handleDismiss}
              className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{ background: '#22c55e', color: '#000' }}
              data-testid="pwa-install-ok"
            >
              {t('pwa.gotIt')}
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{ background: '#22c55e', color: '#000' }}
              data-testid="pwa-install-yes"
            >
              {t('pwa.install')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
