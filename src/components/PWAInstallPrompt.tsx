import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show if user dismissed recently in local storage
      const dismissedTime = localStorage.getItem('novenutri_pwa_dismissed');
      if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 7 * 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    // Online/Offline listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] Usuário aceitou a instalação');
    } else {
      console.log('[PWA] Usuário recusou a instalação');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('novenutri_pwa_dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Offline Status Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium shadow-md flex items-center justify-center gap-2 animate-fadeIn">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Você está no modo offline. Algumas funcionalidades podem requerer conexão.</span>
        </div>
      )}

      {/* Installed Toast Notification */}
      {installedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-slideUp border border-emerald-500/30">
          <div className="p-1.5 bg-white/20 rounded-xl">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">NoveNutri instalado!</p>
            <p className="text-xs text-emerald-100">O app foi adicionado à sua tela inicial.</p>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showPrompt && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/60 animate-slideUp">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/40">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-100">Instalar NoveNutri App</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Acesso rápido direto da tela inicial, com suporte a modo offline.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 flex items-center justify-end gap-2.5">
            <button
              onClick={handleDismiss}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              Agora não
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar App
            </button>
          </div>
        </div>
      )}
    </>
  );
};
