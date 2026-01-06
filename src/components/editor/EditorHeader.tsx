import React from 'react';
import { generateExport, downloadBlob } from '@/lib/simpleExporter';
import { exportDocumentAsDocx, type DocxHeaderOptions, type FrontMatterOptions, type PageOptions } from '@/lib/exporter';

interface EditorHeaderProps {
    isFocusMode: boolean;
    currentFolderName: string;
    activeFileName: string | null;
    saveStatus: 'saved' | 'saving' | 'error' | 'loading' | 'offline' | 'unsaved';
    showStructure: boolean;
    onToggleStructure: () => void;

    // Stats & Goals
    stats: any;
    goalEnabled: boolean;
    dailyGoal: number;
    sessionWordsWritten: number;
    goalProgress: number;

    // Actions
    onSetFocusMode: (val: boolean) => void;

    // Export State
    showExportMenu: boolean;
    onToggleExportMenu: () => void;
    exportContext: {
        content: string;
        fileName: string; // fallback to 'Untitled' inside
        stats: any;
        headerOptions: DocxHeaderOptions;
        frontMatterOptions: FrontMatterOptions;
        pageOptions: PageOptions;
        setPageOptions: React.Dispatch<React.SetStateAction<PageOptions>>;
    };

    // Tools
    isListening: boolean;
    onToggleDictation: () => void;

    isScanning: boolean;
    onRunAnalysis: () => void;

    showTools: boolean;
    onToggleTools: () => void;

    // Drive
    onSaveToDrive: () => void;

    // Tabs
    docStructure: { title: string, tabs: { id: string, title: string, content: string }[] } | null;
    onTabSelect: (content: string) => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
    isFocusMode,
    currentFolderName,
    activeFileName,
    saveStatus,
    showStructure,
    onToggleStructure,
    stats,
    goalEnabled,
    dailyGoal,
    sessionWordsWritten,
    goalProgress,
    onSetFocusMode,
    showExportMenu,
    onToggleExportMenu,
    exportContext,
    isListening,
    onToggleDictation,
    isScanning,
    onRunAnalysis,
    showTools,
    onToggleTools,
    onSaveToDrive,
    docStructure,
    onTabSelect
}) => {
    if (isFocusMode) return null;

    const fileName = activeFileName || 'New Scene';
    const displayFolderName = currentFolderName !== 'My Drive' ? currentFolderName : 'Untitled Project';

    return (
        <>
            {/* Header Row 1: Identity (Project & Scene Title) */}
            <div className="bg-gray-900/50 backdrop-blur-sm border-b border-white/5 py-3 flex items-center justify-center shadow-lg relative z-30">
                <div className="text-center">
                    <div className="text-[10px] text-purple-300 font-bold uppercase tracking-[0.2em] mb-1 opacity-80">
                        {displayFolderName}
                    </div>
                    <div className="text-2xl font-serif text-white font-bold tracking-wide flex items-center justify-center px-4">
                        <span className="truncate max-w-[500px] drop-shadow-md">{fileName.replace('.md', '')}</span>
                        {saveStatus === 'saving' && <span title="Syncing..." className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse ml-3 shadow-[0_0_8px_rgba(250,204,21,0.6)]" />}
                        {saveStatus === 'saved' && <span title="Saved to Cloud" className="w-2 h-2 rounded-full bg-green-500 ml-3 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                        {saveStatus === 'offline' && <span title="Saved Locally (Offline)" className="w-2 h-2 rounded-full bg-gray-500 ml-3 border border-white/20" />}
                    </div>
                </div>
            </div>

            {/* Header Row 2: Analytics & Controls (The "Grey Bar") */}
            <div className="flex border-b border-white/5 bg-white/5 relative z-20 shadow-sm items-center justify-between px-3 py-1.5 gap-4 overflow-x-auto custom-scrollbar">

                {/* Left Group: Nav + Core Stats */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button
                        onClick={onToggleStructure}
                        className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${showStructure ? 'text-purple-300 bg-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Toggle Project Explorer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>

                    <div className="h-6 w-px bg-white/10" />

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start leading-tight min-w-[3rem]">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Words</span>
                            <span className="text-sm font-bold font-mono text-gray-200">{stats?.wordCount || 0}</span>
                        </div>
                        <div className="flex flex-col items-start leading-tight min-w-[3rem] hidden sm:flex">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Time</span>
                            <span className="text-sm font-bold font-mono text-gray-200">{stats ? Math.ceil(stats.wordCount / 250) + 'm' : '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Center Group: Session Goal Progress (Flexible Width) */}
                {goalEnabled && (
                    <div className="flex-1 max-w-md mx-auto hidden md:flex flex-col items-center gap-0.5 px-4 min-w-[150px]">
                        <div className="flex items-center justify-between w-full text-[9px] font-bold uppercase tracking-wider text-gray-500">
                            <span>Session Goal</span>
                            <span className={goalProgress >= 100 ? 'text-green-400' : 'text-purple-300'}>
                                {sessionWordsWritten} / {dailyGoal}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden relative">
                            <div
                                className={`h-full transition-all duration-500 rounded-full absolute left-0 top-0 ${goalProgress >= 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                                style={{ width: `${Math.min(goalProgress, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Right Group: Advanced Stats + Actions */}
                <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
                    {/* Advanced Stats Pill (Hidden on mobile) */}
                    <div className="hidden lg:flex items-center gap-3 bg-black/20 rounded-lg px-3 py-1 border border-white/5">
                        <div className="flex flex-col items-end leading-none">
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Grade</span>
                            <span className={`text-xs font-mono font-bold ${Number(stats?.fkGrade) > 12 ? 'text-yellow-400' : 'text-gray-300'}`}>{stats?.fkGrade || '-'}</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex flex-col items-end leading-none">
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Narratability</span>
                            <span className={`text-xs font-mono font-bold ${Number(stats?.stdDev) > 5 ? 'text-green-400' : 'text-yellow-400'}`}>{stats?.stdDev || '-'}</span>
                        </div>
                        {isScanning && ( // Only show when analyzed
                            <>
                                <div className="w-px h-4 bg-white/10" />
                                <div className="flex flex-col items-end leading-none">
                                    <span className="text-[8px] text-gray-500 font-bold uppercase">Adverbs</span>
                                    <span className={`text-xs font-mono font-bold ${(stats?.adverbCount || 0) > 15 ? 'text-red-400' : 'text-gray-300'}`}>{stats?.adverbCount || 0}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="h-6 w-px bg-white/10 hidden sm:block" />

                    {/* Toolbar Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onSetFocusMode(true)}
                            title="Focus Mode"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all flex-shrink-0"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </button>

                        {/* Enhanced Save Status */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                            {saveStatus === 'saving' && (
                                <>
                                    <svg className="w-4 h-4 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-xs text-yellow-400">Saving...</span>
                                    <div role="status" aria-live="polite" className="sr-only">Saving document</div>
                                </>
                            )}
                            {saveStatus === 'saved' && (
                                <>
                                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs text-green-400">Saved</span>
                                    <div role="status" aria-live="polite" className="sr-only">Document saved successfully</div>
                                </>
                            )}
                            {saveStatus === 'unsaved' && (
                                <>
                                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs text-orange-400">Unsaved</span>
                                    <div role="status" aria-live="polite" className="sr-only">Document has unsaved changes</div>
                                </>
                            )}
                            {saveStatus === 'offline' && (
                                <>
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs text-gray-400">Offline</span>
                                    <div role="status" aria-live="polite" className="sr-only">Document saved locally, offline mode</div>
                                </>
                            )}
                            {saveStatus === 'error' && (
                                <>
                                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs text-red-400">Error</span>
                                    <div role="alert" aria-live="assertive" className="sr-only">Error saving document</div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={onSaveToDrive}
                            title="Manually sync to Google Drive"
                            aria-label="Manually sync document to Google Drive"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all flex-shrink-0"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v10m0-10l-3 3m3-3l3 3" /></svg>
                        </button>

                        <div className="relative">
                            <button
                                onClick={onToggleExportMenu}
                                title="Export"
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all flex-shrink-0"
                            >
                                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                            {/* Export Menu dropdown logic remains same, just ensuring parent relative is here */}
                            {showExportMenu && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl py-2 z-50">
                                    <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase">Export As</div>

                                    <button
                                        onClick={() => {
                                            const blob = generateExport(exportContext.content, {
                                                format: 'markdown',
                                                title: exportContext.fileName,
                                                author: 'Author',
                                                includeTitlePage: true,
                                                includeStats: true,
                                                stats: exportContext.stats ? { words: exportContext.stats.wordCount, chars: 0, readTime: exportContext.stats.readTimeMinutes || 0 } : undefined
                                            });
                                            downloadBlob(blob, `${exportContext.fileName}.md`);
                                            onToggleExportMenu();
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        📝 Markdown (.md)
                                    </button>

                                    <button
                                        onClick={async () => {
                                            const url = localStorage.getItem('webhook_url');
                                            if (!url) {
                                                alert('No Webhook URL configured! Go to Settings.');
                                                return;
                                            }

                                            try {
                                                const plainText = exportContext.content.replace(/<[^>]*>/g, ' ').trim();
                                                await fetch(url, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        event: 'scene_export',
                                                        title: exportContext.fileName,
                                                        content: plainText,
                                                        wordCount: exportContext.stats?.wordCount,
                                                        timestamp: new Date().toISOString()
                                                    })
                                                });
                                                alert('Successfully sent to Webhook!');
                                            } catch (err) {
                                                alert('Failed to send: ' + (err as Error).message);
                                            }
                                            onToggleExportMenu();
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-purple-300 hover:bg-purple-500/10 flex items-center gap-2"
                                    >
                                        🚀 Send to Webhook
                                    </button>

                                    <button
                                        onClick={() => {
                                            onSaveToDrive();
                                            onToggleExportMenu();
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-green-300 hover:bg-green-500/10 flex items-center gap-2"
                                    >
                                        💾 Save to Google Drive
                                    </button>

                                    <div className="px-3 py-2 bg-black/20 rounded mb-2 space-y-2 mt-2">
                                        <div className="text-[10px] uppercase font-bold text-gray-500">Print Layout</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                className="bg-black/40 text-xs text-gray-300 border border-white/10 rounded px-1 py-1 outline-none"
                                                value={exportContext.pageOptions.size}
                                                onChange={e => exportContext.setPageOptions(prev => ({ ...prev, size: e.target.value as any }))}
                                            >
                                                <option value="Letter">Letter</option>
                                                <option value="A4">A4</option>
                                                <option value="6x9">6x9</option>
                                                <option value="5x8">5x8</option>
                                            </select>
                                            <select
                                                className="bg-black/40 text-xs text-gray-300 border border-white/10 rounded px-1 py-1 outline-none"
                                                value={exportContext.pageOptions.margins}
                                                onChange={e => exportContext.setPageOptions(prev => ({ ...prev, margins: e.target.value as any }))}
                                            >
                                                <option value="Normal">Normal</option>
                                                <option value="Narrow">Narrow</option>
                                                <option value="Wide">Wide</option>
                                                <option value="Mirrored">Mirror</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            exportDocumentAsDocx(
                                                exportContext.fileName,
                                                'Author',
                                                exportContext.content,
                                                exportContext.stats ? { words: exportContext.stats.wordCount } : undefined,
                                                exportContext.headerOptions,
                                                exportContext.frontMatterOptions,
                                                exportContext.pageOptions
                                            );
                                            onToggleExportMenu();
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        📄 Word (.docx)
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onToggleDictation}
                            title={isListening ? "Stop Dictation" : "Start Dictation"}
                            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/30' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </button>

                        <button
                            onClick={onRunAnalysis}
                            title="Run Deep Analysis"
                            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 hover:text-white transition-all flex-shrink-0 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                        >
                            <svg className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </button>

                        <button
                            onClick={onToggleTools}
                            className={`p-1.5 rounded-lg transition-all ml-2 ${showTools ? 'text-purple-300 bg-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            title="Toggle Tools"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </div>
                </div>

                {/* Toolbar / Tabs Row */}
                <div className="flex items-center justify-between px-4 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                        {/* Doc Tabs (Acts/Chapters) */}
                        {docStructure && docStructure.tabs.length > 0 ? (
                            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap custom-scrollbar max-w-[50vw]">
                                {docStructure.tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabSelect(tab.content)}
                                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white border border-white/5 transition-colors"
                                    >
                                        {tab.title}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <span className="text-gray-600 italic pl-1">Main Document</span>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={`transition-colors duration-300 ${saveStatus === 'saving' ? 'text-yellow-500' : 'text-green-500/50'}`}>
                            {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
                        </span>
                        <span className="text-gray-600">
                            {stats?.wordCount || 0} words
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};
