import { useState, useEffect } from 'react';
import { X, Smartphone, Download } from 'lucide-react';

const isMobile = () => {
  return (
    (typeof window !== 'undefined' &&
      /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024)
  );
};

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true
  );
};

const isIOS = () => {
  return (
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
};

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setDismissed(true);
      localStorage.setItem('zenovax-install-dismissed', '1');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (dismissed || localStorage.getItem('zenovax-install-dismissed') === '1') return;

    const timer = setTimeout(() => {
      if (!isMobile() || isStandalone()) return;
      setVisible(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setVisible(false);
          setDismissed(true);
          localStorage.setItem('zenovax-install-dismissed', '1');
        }
      } catch (err) {
        console.error('Install prompt failed', err);
      } finally {
        setDeferredPrompt(null);
        setInstalling(false);
      }
    } else if (isIOS()) {
      // iOS Safari has no beforeinstallprompt — instruct via Share -> Add to Home Screen.
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('zenovax-install-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px] z-[80] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close install prompt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-[#C9C7F5]/20 dark:bg-[#C9C7F5]/10 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-[#5a59b5] dark:text-[#b3b1f0]" />
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-snug">
              Install ZenovaX
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {isIOS() && !deferredPrompt
                ? 'Tap Share then "Add to Home Screen" for the full app experience.'
                : 'Add to your home screen for faster access and a full-screen app experience.'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 h-11 rounded-xl bg-[#C9C7F5] text-[#5a59b5] font-bold text-sm hover:bg-[#b8b6e5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {installing ? 'Installing...' : 'Install App'}
          </button>
          <button
            onClick={handleDismiss}
            className="h-11 px-5 rounded-xl text-gray-500 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
