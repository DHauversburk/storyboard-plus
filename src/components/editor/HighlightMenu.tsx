
import React, { useEffect, useState } from 'react';

interface CodexEntry {
    name: string;
    content: string;
}

interface HighlightMenuProps {
    position: { top: number; left: number } | null;
    selectedText: string;
    onClose: () => void;
    synonyms: string[];
    codexEntry: CodexEntry | null;
    onReplace: (original: string, replacement: string) => void;
    onViewCodex: (entry: CodexEntry) => void;
}

export const HighlightMenu: React.FC<HighlightMenuProps> = ({
    position,
    selectedText,
    onClose,
    synonyms,
    codexEntry,
    onReplace,
    onViewCodex
}) => {
    const [mode, setMode] = useState<'menu' | 'synonyms'>('menu');

    useEffect(() => {
        setMode('menu');
    }, [selectedText]);

    if (!position) return null;

    return (
        <div
            className="fixed z-50 flex flex-col items-center animate-in zoom-in-95 duration-100"
            style={{
                top: position.top - 10,
                left: position.left,
                transform: 'translate(-50%, -100%)'
            }}
        >
            <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden min-w-[150px] max-w-[250px]">

                {/* Main Menu Mode */}
                {mode === 'menu' && (
                    <div className="flex items-center p-1 gap-0.5">
                        {/* Define / Search */}
                        <button
                            onClick={() => window.open(`https://www.google.com/search?q=define+${encodeURIComponent(selectedText)}`, '_blank')}
                            className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors text-xs font-medium px-2 flex items-center gap-1"
                            title="Search Definition"
                        >
                            <span>🔍</span> Define
                        </button>

                        <div className="w-px h-3 bg-white/10 mx-1" />

                        {/* Synonyms Trigger */}
                        <button
                            onClick={() => setMode('synonyms')}
                            className={`p-1.5 hover:bg-white/10 rounded transition-colors text-xs font-medium px-2 flex items-center gap-1 ${synonyms.length > 0 ? 'text-gray-300 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
                            disabled={synonyms.length === 0}
                            title={synonyms.length > 0 ? "View Synonyms" : "No synonyms found"}
                        >
                            <span>📚</span> Synonyms
                        </button>

                        {/* Codex Trigger (if match) */}
                        {codexEntry && (
                            <>
                                <div className="w-px h-3 bg-white/10 mx-1" />
                                <button
                                    onClick={() => onViewCodex(codexEntry)}
                                    className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300 hover:text-purple-200 transition-colors text-xs font-bold px-2 flex items-center gap-1"
                                    title={`Open Codex: ${codexEntry.name}`}
                                >
                                    <span>✦</span> Codex
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Synonyms Mode */}
                {mode === 'synonyms' && (
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between p-2 border-b border-white/5 bg-white/5">
                            <span className="text-[10px] uppercase font-bold text-gray-500">Synonyms for "{selectedText}"</span>
                            <button onClick={() => setMode('menu')} className="text-gray-500 hover:text-white text-xs">← Back</button>
                        </div>
                        <div className="p-1 max-h-40 overflow-y-auto custom-scrollbar">
                            {synonyms.map((syn, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        onReplace(selectedText, syn);
                                        onClose();
                                    }}
                                    className="w-full text-left px-2 py-1.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded transition-colors"
                                >
                                    {syn}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Arrow */}
            <div className="w-3 h-3 bg-gray-900 border-r border-b border-white/10 transform rotate-45 -mt-1.5" />
        </div>
    );
};
