'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker in production / browser
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.debug('ServiceWorker registration skipped or failed:', err);
      });
    }

    // 2. Check standalone mode (already running as installed app)
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      return isDisplayStandalone || isIosStandalone;
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);
    if (standalone) return;

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isAppleDevice);

    // 4. Check if user dismissed prompt recently
    const dismissedUntil = localStorage.getItem('n5exam_pwa_dismissed_until');
    const isDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

    // 5. Chromium / Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        // Small delay so user sees page first
        setTimeout(() => setShowBanner(true), 1500);
      }
    };

    // 6. Listen for installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    // 7. Global custom event to open manual install prompt
    const handleManualOpen = () => {
      if (checkStandalone()) {
        alert('Ứng dụng N5Exam đã được cài đặt và đang chạy ở chế độ app!');
        return;
      }
      if (isAppleDevice) {
        setShowIosModal(true);
      } else if (deferredPrompt) {
        triggerInstall();
      } else {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-pwa-install', handleManualOpen);

    // If on iOS and not dismissed and mobile screen, show banner
    if (isAppleDevice && !isDismissed && window.innerWidth <= 768) {
      setTimeout(() => setShowBanner(true), 2500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install', handleManualOpen);
    };
  }, [deferredPrompt]);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 3 days
    const threeDaysMs = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('n5exam_pwa_dismissed_until', threeDaysMs.toString());
  };

  if (isStandalone || isInstalled) {
    return null;
  }

  return (
    <>
      {/* Floating PWA Banner (Positioned above bottom nav bar on mobile) */}
      {showBanner && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-100 p-4 text-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                N5
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-900 truncate">Cài đặt Ứng dụng N5Exam</h4>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Sparkles className="w-3 h-3 text-indigo-600" /> App
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Lưu về màn hình chính để mở toàn màn hình, mượt mà và làm bài thi tiện lợi.
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={triggerInstall}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isIos ? 'Xem cách lưu app' : 'Cài đặt ngay'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Để sau
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-100"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Instruction Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
                  N5
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Cài đặt trên iPhone / iPad</h3>
                  <p className="text-xs text-slate-500">Lưu ra Màn hình chính qua Safari</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 flex items-center gap-1">
                    Nhấn vào nút Chia sẻ (Share) <Share className="w-3.5 h-3.5 text-indigo-600 inline" />
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Nút có biểu tượng hình vuông có mũi tên hướng lên ở thanh công cụ phía dưới cùng của Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 flex items-center gap-1">
                    Chọn "Thêm vào MH chính" <PlusSquare className="w-3.5 h-3.5 text-indigo-600 inline" />
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Cuộn xuống danh sách tùy chọn và chọn <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">
                    Nhấn "Thêm" (Add) ở góc trên bên phải
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Biểu tượng ứng dụng <strong>N5Exam</strong> sẽ xuất hiện trực tiếp trên màn hình chính của bạn.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setShowIosModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Đã hiểu, tôi sẽ làm ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
