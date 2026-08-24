import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, X, Shield, Sparkles, WifiOff } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show banner if not previously dismissed recently
      const dismissed = localStorage.getItem('saban_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instruction for iOS / Safari
      alert('להתקנה ב-iPhone/iPad: לחץ על כפתור השיתוף (Share) ובחר "הוסף למסך הבית" (Add to Home Screen)');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('saban_pwa_dismissed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border-b border-emerald-500/40 text-white px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-emerald-300">התקן את SabanOS כאפליקציית מובייל</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md font-bold">PWA</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              גישה מהירה ממסך הבית, עבודה מלאה באופליין ללא קליטה, ותעודת זהות דיגיטלית בכיס
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black transition-transform active:scale-95 cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>התקן עכשיו</span>
          </button>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg text-xs"
            title="סגור"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
