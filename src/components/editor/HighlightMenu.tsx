
import React, { useEffect, useState } from 'react';

interface CodexEntry {
    name: string;
    content: string;
}

interface HighlightMenuProps {
    position: { top: number; left: number } | null;
    selectedText: string;
    onClose: () => void;
    synonyms: string[]; // local synonyms passed from parent
    codexEntry: CodexEntry | null;
    onReplace: (original: string, replacement: string) => void;
    onViewCodex: (entry: CodexEntry) => void;
}

type MenuMode = 'menu' | 'synonyms' | 'definition' | 'codex';

export const HighlightMenu: React.FC<HighlightMenuProps> = ({
    position,
    selectedText,
    onClose,
    synonyms: localSynonyms,
    codexEntry,
    onReplace,
    onViewCodex
}) => {
    const [mode, setMode] = useState<MenuMode>('menu');
    const [fetchedSynonyms, setFetchedSynonyms] = useState<string[]>([]);
    const [definition, setDefinition] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMode('menu');
        setFetchedSynonyms([]);
        setDefinition(null);
    }, [selectedText]);

    const handleFetchSynonyms = async () => {
        setMode('synonyms');
        if (localSynonyms.length > 0) {
            setFetchedSynonyms(localSynonyms);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(selectedText)}&max=10`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setFetchedSynonyms(data.map((d: { word: string }) => d.word));
            }
        } catch {
            // console.error('Failed to fetch synonyms', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDefine = async () => {
        setMode('definition');
        setLoading(true);
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(selectedText)}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const firstDef = data[0].meanings[0]?.definitions[0]?.definition;
                if (firstDef) {
                    setDefinition(firstDef);
                    return;
                }
            }
            setDefinition("No definition found.");
        } catch {
            setDefinition("Could not fetch definition.");
        } finally {
            setLoading(false);
        }
    };

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
            <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden min-w-[180px] max-w-[300px]">

                {/* Main Menu Mode */}
                {mode === 'menu' && (
                    <div className="flex items-center p-1 gap-0.5">
                        {/* Define / Search */}
                        <button
                            onClick={handleDefine}
                            className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors text-xs font-medium px-2 flex items-center gap-1"
                            title="Quick Define"
                        >
                            <span>📖</span> Define
                        </button>

                        <div className="w-px h-3 bg-white/10 mx-1" />

                        {/* Synonyms Trigger */}
                        <button
                            onClick={handleFetchSynonyms}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors text-xs font-medium px-2 flex items-center gap-1 text-gray-300 hover:text-white"
                            title="Find Synonyms"
                        >
                            <span>📚</span> Synonyms
                        </button>

                        {/* Codex Trigger (if match) */}
                        {codexEntry && (
                            <>
                                <div className="w-px h-3 bg-white/10 mx-1" />
                                <button
                                    onClick={() => setMode('codex')}
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
                    <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between p-2 border-b border-white/5 bg-white/5">
                            <span className="text-[10px] uppercase font-bold text-gray-500">Synonyms for &quot;{selectedText}&quot;</span>
                            <button onClick={() => setMode('menu')} className="text-gray-500 hover:text-white text-xs">← Back</button>
                        </div>
                        <div className="p-1 max-h-40 overflow-y-auto custom-scrollbar w-full">
                            {loading ? (
                                <div className="p-3 text-center text-xs text-gray-500 animate-pulse">Searching lexicon...</div>
                            ) : fetchedSynonyms.length > 0 ? (
                                fetchedSynonyms.map((syn, i) => (
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
                                ))
                            ) : (
                                <div className="p-3 text-center text-xs text-gray-600">No synonyms found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Definition Mode */}
                {mode === 'definition' && (
                    <div className="flex flex-col w-full p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-bold text-gray-500">Definition</span>
                            <button onClick={() => setMode('menu')} className="text-gray-500 hover:text-white text-xs">← Back</button>
                        </div>
                        {loading ? (
                            <div className="text-xs text-gray-500 animate-pulse">Looking up definition...</div>
                        ) : (
                            <div className="text-sm text-gray-200 leading-relaxed">
                                {definition}
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => window.open(`https://www.google.com/search?q=define+${encodeURIComponent(selectedText)}`, '_blank')}
                                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        More on Google ↗
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Codex Mode */}
                {mode === 'codex' && codexEntry && (
                    <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between p-2 border-b border-white/5 bg-white/5">
                            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                <span className="text-purple-400">✦</span>
                                {codexEntry.name.replace('.md', '')}
                            </span>
                            <button onClick={() => setMode('menu')} className="text-gray-500 hover:text-white text-xs">← Back</button>
                        </div>
                        <div className="p-3 max-h-60 overflow-y-auto custom-scrollbar">
                            <div className="text-xs text-gray-300 leading-relaxed font-serif whitespace-pre-wrap">
                                {codexEntry.content.length > 300
                                    ? codexEntry.content.substring(0, 300) + '...'
                                    : codexEntry.content}
                            </div>
                            <div className="mt-3 pt-2 border-t border-white/5">
                                <button
                                    onClick={() => onViewCodex(codexEntry)}
                                    className="w-full py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded text-xs text-purple-300 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    Open Full Entry ↗
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Arrow */}
            <div className="w-3 h-3 bg-gray-900 border-r border-b border-white/10 transform rotate-45 -mt-1.5" />
        </div>
    );
};
