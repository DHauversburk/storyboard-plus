"use client";
import React, { useEffect, useState } from 'react';

export const EnterpriseSplash = () => {
    const [mounted, setMounted] = useState(true);
    const [logs, setLogs] = useState<string[]>([]);
    const [showAccessGranted, setShowAccessGranted] = useState(false);
    const [fading, setFading] = useState(false);

    const logMessages = [
        "INITIALIZING SECURE ENVIRONMENT...",
        "VERIFYING ENCRYPTION KEYS...",
        "ESTABLISHING DATABASE UPLINK...",
        "SYNCING ASSETS...",
        "LOADING NEURAL MODULES...",
        "CALIBRATING WORKSPACE...",
        "SYSTEM PREPARED."
    ];

    useEffect(() => {
        // Check if already shown
        const hasShown = sessionStorage.getItem('splash_shown');
        if (hasShown) {
            setMounted(false);
            return;
        }

        let currentDelay = 0;

        // Queue logs
        logMessages.forEach((msg, i) => {
            currentDelay += 400; // Consistent fast pace
            setTimeout(() => {
                setLogs(prev => [...prev, msg]);
            }, currentDelay);
        });

        // Show Access Granted
        const grantedTime = currentDelay + 600;
        setTimeout(() => {
            setShowAccessGranted(true);
        }, grantedTime);

        // Start Exiting
        const exitTime = grantedTime + 2000;
        setTimeout(() => {
            setFading(true);
        }, exitTime);

        // Removing
        setTimeout(() => {
            setMounted(false);
            sessionStorage.setItem('splash_shown', 'true');
        }, exitTime + 1000);

    }, []);

    if (!mounted) return null;

    return (
        <div className={`fixed inset-0 z-[100] bg-black font-mono flex flex-col items-center justify-center transition-opacity duration-1000 ${fading ? 'opacity-0' : 'opacity-100'} cursor-wait select-none`}>

            {/* Background Grid - Subtle */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none" />

            {!showAccessGranted ? (
                <div className="flex flex-col justify-start w-full max-w-lg px-8 h-[300px] overflow-hidden relative">
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[10px] w-full animate-[scan_2s_linear_infinite] pointer-events-none" />

                    {logs.map((log, i) => (
                        <div
                            key={i}
                            className="text-xs sm:text-sm tracking-[0.15em] py-1 transition-all duration-500"
                            style={{
                                color: i === logs.length - 1 ? '#a855f7' : '#22c55e', // Latest = Purple, History = Green
                                opacity: Math.max(0.3, 1 - (logs.length - 1 - i) * 0.15),
                                textShadow: i === logs.length - 1 ? '0 0 8px rgba(168,85,247,0.6)' : 'none'
                            }}
                        >
                            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                            {`> ${log}`}
                        </div>
                    ))}
                    <div className="w-2 h-4 bg-purple-500 animate-pulse mt-2 ml-2" />
                </div>
            ) : (
                <div className="relative flex flex-col items-center justify-center animate-[scaleUp_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                    {/* Ring Burst */}
                    <div className="absolute inset-0 rounded-full border border-purple-500/50 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]" />

                    <div className="text-5xl sm:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-[0_0_25px_rgba(255,255,255,0.8)] border-y-2 border-white/20 py-2">
                        ACCESS GRANTED
                    </div>
                    <div className="text-xl sm:text-2xl text-purple-400 tracking-[0.4em] uppercase font-bold text-center animate-pulse">
                        Welcome Creator
                    </div>
                </div>
            )}

            {/* Static Footer */}
            <div className={`absolute bottom-8 transition-all duration-500 ${showAccessGranted ? 'scale-110 opacity-100' : 'opacity-50'}`}>
                <div className="flex items-center gap-2 text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${showAccessGranted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]' : 'bg-yellow-500 animate-pulse'}`} />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-sans">
                        {showAccessGranted ? 'Secure Environment Active' : 'System Initializing...'}
                    </span>
                </div>
            </div>
        </div>
    );
};
