"use client";

import React, { useState, useEffect } from 'react';

interface OnboardingModalProps {
    onComplete: () => void;
    onConnectDrive: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onConnectDrive }) => {
    const [showModal, setShowModal] = useState(false);
    const [currentStep, setCurrentStep] = useState<'welcome' | 'drive-setup'>('welcome');

    useEffect(() => {
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem('sb_onboarding_complete');
        if (!hasSeenOnboarding) {
            setShowModal(true);
        }
    }, []);

    const handleSkip = () => {
        localStorage.setItem('sb_onboarding_complete', 'true');
        setShowModal(false);
        onComplete();
    };

    const handleConnectDrive = () => {
        localStorage.setItem('sb_onboarding_complete', 'true');
        setShowModal(false);
        onConnectDrive();
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
                {currentStep === 'welcome' && (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
                            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
                                <span className="text-5xl">📝</span>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Welcome to StoryBoard Plus!</h1>
                            <p className="text-white/80">Your AI-powered writing companion</p>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <h2 className="text-xl font-semibold text-white mb-6">How would you like to start?</h2>

                            <div className="space-y-4">
                                {/* Option 1: Start Writing */}
                                <button
                                    onClick={handleSkip}
                                    className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl transition-all group text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-2xl">✍️</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                                                Start Writing Now
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                Jump right in! All features work offline with local storage. No setup required.
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">✓ Works offline</span>
                                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">✓ Auto-save</span>
                                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">✓ All features</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Option 2: Google Drive */}
                                <button
                                    onClick={handleConnectDrive}
                                    className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl transition-all group text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-2xl">☁️</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                                Connect Google Drive
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                Sync your work to the cloud. Access from anywhere, collaborate, and never lose progress.
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">Cloud sync</span>
                                                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Multi-device</span>
                                                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">Optional</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Footer note */}
                            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-sm text-blue-300">
                                    💡 <strong>Pro tip:</strong> You can always connect Google Drive later from Settings. Start writing now and set it up when you're ready!
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
