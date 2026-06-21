import { useEffect, useCallback, useState } from 'react';

const SOUND_PROFILES = {
    'new-order': {
        frequencies: [880, 1320],
        times: [0, 0.12],
        gain: 0.3,
        duration: 0.35,
    },
    'waiter-call': {
        frequencies: [660, 880, 1100],
        times: [0, 0.15, 0.3],
        gain: 0.4,
        duration: 0.5,
    },
};

const playSound = (profile = 'new-order') => {
    try {
        const config = SOUND_PROFILES[profile] || SOUND_PROFILES['new-order'];
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        config.frequencies.forEach((freq, i) => {
            osc.frequency.setValueAtTime(freq, ctx.currentTime + config.times[i]);
        });
        gain.gain.setValueAtTime(config.gain, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + config.duration);
    } catch (e) {}
};

export const useSoundAlert = (socket, restaurantId, { event, soundProfile = 'new-order', onAlert } = {}) => {
    const storageKey = `soundAlert:${soundProfile}`;
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem(storageKey) !== 'false';
    });

    const handleSetEnabled = useCallback((val) => {
        setSoundEnabled(val);
        localStorage.setItem(storageKey, val.toString());
    }, [storageKey]);

    useEffect(() => {
        if (!socket || !event || !restaurantId) return;

        const handler = (data) => {
            if (!soundEnabled) return;
            playSound(soundProfile);
            if (navigator.vibrate) navigator.vibrate(200);
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(
                    soundProfile === 'waiter-call' ? 'Customer Request' : 'New Order',
                    { body: data?.message || '', silent: true }
                );
            }
            if (onAlert) onAlert(data);
        };

        socket.on(event, handler);
        return () => socket.off(event, handler);
    }, [socket, event, restaurantId, soundEnabled, soundProfile, onAlert]);

    return { soundEnabled, setSoundEnabled: handleSetEnabled };
};
