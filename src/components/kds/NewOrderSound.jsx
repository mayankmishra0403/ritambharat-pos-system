import { useEffect, useRef } from 'react';

const NewOrderSound = ({ play }) => {
    const audioContextRef = useRef(null);

    useEffect(() => {
        if (!play) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        const ctx = audioContextRef.current;

        const playChime = () => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.connect(gain);
            gain.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.35);
        };

        playChime();
    }, [play]);

    return null;
};

export default NewOrderSound;
