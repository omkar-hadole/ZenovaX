import { useState, useEffect } from 'react';
import { X, Smartphone, Download, Share } from 'lucide-react';

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
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && navigator.userAgent.includes('Macintosh')))
  );
};

// Capture beforeinstallprompt at module scope immediately so it can't be
// missed if the event fires before the component mounts its listeners.
// The popup always shows after the delay; the captured event just makes the
// Install button actually trigger the browser's native install flow.
let deferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const timer = setTimeout(() => {
      if (!isMobile() || isStandalone()) return;
      setVisible(true);
    }, 9000);

    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
        setDismissed(true);
      }
    } catch (err) {
      console.error('Install prompt failed', err);
    } finally {
      deferredPrompt = null;
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
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
              Add to your home screen for faster access and a full-screen app experience.
            </p>
          </div>
        </div>

        {isIOS() ? (
          <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400">
            <p className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
              <Share className="w-4 h-4 text-[#5a59b5] dark:text-[#b3b1f0]" />
              How to install on iOS Safari:
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
              <li>Tap the <strong>Share</strong> button in Safari.</li>
              <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
            </ol>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-5 pb-5">
            <div className="flex gap-3">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 h-11 rounded-xl bg-[#C9C7F5] text-[#5a59b5] font-bold text-sm hover:bg-[#b8b6e5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {installing ? (
                  'Installing...'
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Install App
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="h-11 px-5 rounded-xl text-gray-500 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Not now
              </button>
            </div>
            {!deferredPrompt && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1">
                Tip: You can also install via your browser menu (e.g. three dots &rarr; Install app).
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
