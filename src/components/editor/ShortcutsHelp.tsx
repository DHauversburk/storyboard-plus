
import React from 'react';

interface ShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const shortcuts = [
        { key: 'Ctrl + B', action: 'Bold' },
        { key: 'Ctrl + I', action: 'Italic' },
        { key: 'Ctrl + U', action: 'Underline' },
        { key: 'Ctrl + K', action: 'Command Palette' },
        { key: 'Ctrl + Z', action: 'Undo' },
        { key: 'Ctrl + Shift + Z', action: 'Redo' },
        { key: 'Ctrl + Enter', action: 'Focus Mode Toggle' },
        { key: 'Alt + 1-9', action: 'Switch Tabs' },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        ⌨️ Keyboard Shortcuts
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-4 bg-card max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-2">
                        {shortcuts.map((s, i) => (
                            <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors">
                                <span className="text-gray-300 text-sm">{s.action}</span>
                                <kbd className="px-2 py-1 bg-black/40 border border-white/10 rounded text-xs font-mono text-gray-400 shadow-sm min-w-[3rem] text-center">
                                    {s.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-3 bg-black/20 text-center text-xs text-gray-500 border-t border-white/5">
                    Press <kbd className="font-mono text-gray-300">Esc</kbd> to close
                </div>
            </div>
        </div>
    );
};
