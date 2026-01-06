"use client";

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';

interface CommandPaletteProps {
    onSetFocusMode: (val: boolean) => void;
    onRunAnalysis: () => void;
    onToggleExportMenu: () => void;
    onSaveToDrive: () => void;
    onOpenFromDrive: () => void;
    onToggleDictation: () => void;
    onToggleTools: () => void;
    onToggleStructure: () => void;
    isListening: boolean;
    showTools: boolean;
    showStructure: boolean;
    isFocusMode: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    onSetFocusMode,
    onRunAnalysis,
    onToggleExportMenu,
    onSaveToDrive,
    onOpenFromDrive,
    onToggleDictation,
    onToggleTools,
    onToggleStructure,
    isListening,
    showTools,
    showStructure,
    isFocusMode
}) => {
    const [open, setOpen] = useState(false);

    // Toggle with Ctrl+K or Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Command Menu"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[90vw] bg-gray-900 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
            <div className="flex items-center border-b border-white/10 px-4 py-3">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Command.Input
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-white/5 rounded border border-white/10">
                    <span className="text-xs">ESC</span>
                </kbd>
            </div>

            <Command.List className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                <Command.Empty className="py-6 text-center text-sm text-gray-500">
                    No results found.
                </Command.Empty>

                <Command.Group heading="Actions" className="text-xs text-gray-500 uppercase tracking-wider px-2 py-2 font-semibold">
                    <Command.Item
                        onSelect={() => runCommand(onRunAnalysis)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors aria-selected:bg-white/10 text-gray-300 hover:text-white"
                    >
                        <span className="text-lg">🔍</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium">Analyze Text</div>
                            <div className="text-xs text-gray-500">Run writing analysis</div>
                        </div>
                    </Command.Item>

                    <Command.Item
                        onSelect={() => runCommand(() => onSetFocusMode(!isFocusMode))}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors aria-selected:bg-white/10 text-gray-300 hover:text-white"
                    >
                        <span className="text-lg">{isFocusMode ? '👁️' : '🎯'}</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium">{isFocusMode ? 'Exit' : 'Enter'} Focus Mode</div>
                            <div className="text-xs text-gray-500">Distraction-free writing</div>
                        </div>
                        <kbd className="px-2 py-1 text-xs text-gray-400 bg-white/5 rounded border border-white/10">F11</kbd>
                    </Command.Item>

                    <Command.Item
                        onSelect={() => runCommand(onToggleExportMenu)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors aria-selected:bg-white/10 text-gray-300 hover:text-white"
                    >
                        <span className="text-lg">📤</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium">Export Document</div>
                            <div className="text-xs text-gray-500">Download as .docx or PDF</div>
                        </div>
                    </Command.Item>

                    <Command.Item
                        onSelect={() => runCommand(onSaveToDrive)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors aria-selected:bg-white/10 text-gray-300 hover:text-white"
                    >
                        <span className="text-lg">☁️</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium">Sync to Google Drive</div>
                            <div className="text-xs text-gray-500">Manually save to cloud</div>
                        </div>
                        <kbd className="px-2 py-1 text-xs text-gray-400 bg-white/5 rounded border border-white/10">Ctrl+S</kbd>
                    </Command.Item>

                    <Command.Item
                        onSelect={() => runCommand(() => onToggleDictation())}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors aria-selected:bg-white/10 text-gray-300 hover:text-white"
                    >
                        <span className="text-lg">{isListening ? '⏸️' : '🎤'}</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium">{isListening ? 'Stop' : 'Start'} Dictation</div>
                            <div className="text-xs text-gray-500">Voice-to-text input</div>
                        </div>
                    </Command.Item>
                </Command.Group>

                <Command.Separator className="h-px bg-white/10 my-2" />

                <Command.Group heading="View" className="text-xs text-gray-500 uppercase tracking-wider px-2 py-2 font-semibold">
                    <Command.Item
                        onSelect={() => runCommand(onToggleStructure)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors aria-selected:bg-white/10 text-gray-300 hover:text-white"
                    >
                        <span className="text-lg">📁</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium">{showStructure ? 'Hide' : 'Show'} Project Explorer</div>
                            <div className="text-xs text-gray-500">Toggle file browser</div>
                        </div>
                    </Command.Item>

                    <Command.Item
                        onSelect={() => runCommand(onToggleTools)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors aria-selected:bg-white/10 text-gray-300 hover:text-white"
                    >
                        <span className="text-lg">🛠️</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium">{showTools ? 'Hide' : 'Show'} Analysis Tools</div>
                            <div className="text-xs text-gray-500">Toggle insights panel</div>
                        </div>
                    </Command.Item>
                </Command.Group>

                <Command.Separator className="h-px bg-white/10 my-2" />

                <Command.Group heading="Navigation" className="text-xs text-gray-500 uppercase tracking-wider px-2 py-2 font-semibold">
                    <Command.Item
                        onSelect={() => runCommand(onOpenFromDrive)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors aria-selected:bg-white/10 text-gray-300 hover:text-white"
                    >
                        <span className="text-lg">📂</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium">Open from Drive</div>
                            <div className="text-xs text-gray-500">Browse cloud documents</div>
                        </div>
                    </Command.Item>
                </Command.Group>

                <div className="px-2 py-3 border-t border-white/10 mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">⌘K</kbd> or <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">Ctrl+K</kbd> to open</span>
                    </div>
                </div>
            </Command.List>
        </Command.Dialog>
    );
};
