import { useState, useRef, useEffect } from 'react';

export const useAudio = () => {
    const [volume, setVolume] = useState(0.5);
    const audioContext = useRef(null);
    const bgMusicRef = useRef(null);

    // Initialize Audio Context for fallback sounds
    useEffect(() => {
        // User interaction is usually required to resume AudioContext
        const initAudio = () => {
            if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContext.current.state === 'suspended') {
                audioContext.current.resume();
            }
        };
        window.addEventListener('click', initAudio, { once: true });
        return () => window.removeEventListener('click', initAudio);
    }, []);

    const playTone = (freq, type, duration) => {
        if (!audioContext.current) return;
        const ctx = audioContext.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.type = type;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
    };

    const playClick = () => {
        const audio = new Audio('/sounds/click.mp3');
        audio.volume = volume;
        audio.play().catch(() => {
            // Fallback: Digital "Select" sound
            playTone(800, 'sine', 0.1);
        });
    };

    const playHover = () => {
        const audio = new Audio('/sounds/hover.mp3');
        audio.volume = volume * 0.3; // Quieter hover
        audio.play().catch(() => {
            // Fallback: Subtle high pitch tick
            playTone(1200, 'triangle', 0.05);
        });
    };

    const playBack = () => {
        const audio = new Audio('/sounds/back.mp3');
        audio.volume = volume;
        audio.play().catch(() => playTone(300, 'square', 0.15));
    };

    const toggleBgMusic = (play) => {
        if (!bgMusicRef.current) {
            bgMusicRef.current = new Audio('/sounds/background.mp3');
            bgMusicRef.current.loop = true;
            bgMusicRef.current.volume = volume * 0.4;
        }

        if (play) {
            bgMusicRef.current.play().catch(e => console.log("Audio play failed (user interaction needed):", e));
        } else {
            bgMusicRef.current.pause();
        }
    };

    return { playClick, playHover, playBack, toggleBgMusic, volume, setVolume };
};
