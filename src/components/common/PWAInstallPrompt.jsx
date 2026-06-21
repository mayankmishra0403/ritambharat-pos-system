import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show the prompt if the user hasn't seen it in this session
            const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the PWA install prompt');
        } else {
            console.log('User dismissed the PWA install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-24 left-4 right-4 z-[100] sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
                >
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 relative overflow-hidden">
                        {/* Glow background */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                            <Download size={24} />
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-white text-sm">Install Ritam Bharat POS</h3>
                            <p className="text-xs text-gray-400">Add to home screen for faster access and offline ordering.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleInstallClick}
                                className="bg-primary text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-gray-500 hover:text-white transition-colors"
                                aria-label="Dismiss"
                            >
                                <X size={16} className="mx-auto" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
