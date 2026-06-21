import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LS_KEY = 'pwa_install_dismissed';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            setIsStandalone(true);
            return;
        }

        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(iOS);

        if (localStorage.getItem(LS_KEY)) return;

        if (iOS) {
            setShowPrompt(true);
            return;
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        const checkLateEvent = setTimeout(() => {
            if (!deferredPrompt && !showPrompt) {
                const anyDismissed = localStorage.getItem(LS_KEY);
                if (!anyDismissed) setShowPrompt(true);
            }
        }, 3000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(checkLateEvent);
        };
    }, []);

    const handleInstall = async () => {
        if (isIOS) {
            setShowPrompt(false);
            localStorage.setItem(LS_KEY, 'true');
            return;
        }
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setShowPrompt(false);
        if (outcome === 'accepted') {
            localStorage.setItem(LS_KEY, 'true');
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem(LS_KEY, 'true');
    };

    if (isStandalone || !showPrompt) return null;

    if (isIOS) {
        return (
            <AnimatePresence>
                {showPrompt && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-4 left-4 right-4 z-[100] sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
                    >
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-2xl">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Smartphone size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm">Install App</h3>
                                        <p className="text-[10px] text-muted-foreground">Add to Home Screen</p>
                                    </div>
                                </div>
                                <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-3 mb-3">
                                <ol className="text-xs text-muted-foreground space-y-2">
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                                        <span>Tap <strong>Share</strong> <Share2 size={12} className="inline text-blue-500" /> in Safari</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                                        <span>Scroll down & tap <strong>Add to Home Screen</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                                        <span>Tap <strong>Add</strong> on top right</span>
                                    </li>
                                </ol>
                            </div>
                            <button onClick={handleDismiss} className="w-full bg-primary text-primary-foreground text-xs font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
                                Got it
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-[100] sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
                >
                    <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                            <Download size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm">Install App</h3>
                            <p className="text-xs text-muted-foreground truncate">Get faster access & offline support</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleInstall}
                                className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap hover:bg-primary/90 transition-colors"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
