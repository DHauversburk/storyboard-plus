import React, { useEffect, useState } from 'react';

interface StartScreenProps {
    onCreateNew: () => void;
    onImportLocal: () => void;
    onConnectDrive: () => void;
    isDriveConnected: boolean;
    recentFiles?: { id: string, name: string, date: string }[];
    onOpenRecent?: (id: string, name: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
    onCreateNew,
    onImportLocal,
    onConnectDrive,
    isDriveConnected,
    recentFiles = [],
    onOpenRecent
}) => {
    return (
        <div className="absolute inset-0 z-10 bg-card flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="max-w-2xl w-full space-y-12">

                {/* Hero */}
                <div className="space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-purple-900/50">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            StoryBoard Plus
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            Where masterpieces are forged.
                        </p>
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={onCreateNew}
                        className="group relative p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:border-purple-500/30 flex flex-col items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 group-hover:bg-purple-500/40 flex items-center justify-center text-purple-300 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-gray-200">New Draft</h3>
                            <p className="text-xs text-gray-500">Start from a blank page</p>
                        </div>
                    </button>

                    <button
                        onClick={onImportLocal}
                        className="group relative p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-500/30 flex flex-col items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 group-hover:bg-blue-500/40 flex items-center justify-center text-blue-300 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-gray-200">Import .docx</h3>
                            <p className="text-xs text-gray-500">Convert from Word</p>
                        </div>
                    </button>

                    <button
                        onClick={onConnectDrive}
                        disabled={isDriveConnected}
                        className={`group relative p-6 border rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col items-center gap-4 
                        ${isDriveConnected
                                ? 'bg-green-500/5 border-green-500/20 cursor-default opacity-50'
                                : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-green-500/30'}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                            ${isDriveConnected ? 'bg-green-500/20 text-green-400' : 'bg-green-500/20 group-hover:bg-green-500/40 text-green-300'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-gray-200">{isDriveConnected ? 'Drive Connected' : 'Connect Drive'}</h3>
                            <p className="text-xs text-gray-500">
                                {isDriveConnected ? 'Access files in sidebar' : 'Sync your cloud library'}
                            </p>
                        </div>
                    </button>
                </div>

                {/* Footer / Tip */}
                <div className="pt-8 border-t border-white/5">
                    <p className="text-sm text-gray-500 italic">
                        "Writing is 10% inspiration and 90% perspiration."
                    </p>
                </div>
            </div>
        </div>
    );
};
