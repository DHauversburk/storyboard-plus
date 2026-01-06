import { useState, useCallback, useEffect } from 'react';

interface HistoryState {
    content: string;
    timestamp: number;
}

export const useEditorHistory = (initialContent: string) => {
    const [history, setHistory] = useState<HistoryState[]>([
        { content: initialContent, timestamp: Date.now() }
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isUndoing, setIsUndoing] = useState(false);

    // Add to history (debounced to avoid too many states)
    const addToHistory = useCallback((content: string) => {
        if (isUndoing) {
            setIsUndoing(false);
            return;
        }

        setHistory(prev => {
            // Remove any forward history when adding new content
            const newHistory = prev.slice(0, currentIndex + 1);

            // Don't add if content is the same as current
            if (newHistory[newHistory.length - 1]?.content === content) {
                return prev;
            }

            // Add new state
            newHistory.push({ content, timestamp: Date.now() });

            // Keep only last 50 states to prevent memory issues
            if (newHistory.length > 50) {
                newHistory.shift();
                setCurrentIndex(prev => Math.max(0, prev - 1));
                return newHistory;
            }

            setCurrentIndex(newHistory.length - 1);
            return newHistory;
        });
    }, [currentIndex, isUndoing]);

    // Undo
    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setIsUndoing(true);
            setCurrentIndex(prev => prev - 1);
            return history[currentIndex - 1].content;
        }
        return null;
    }, [currentIndex, history]);

    // Redo
    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setIsUndoing(true);
            setCurrentIndex(prev => prev + 1);
            return history[currentIndex + 1].content;
        }
        return null;
    }, [currentIndex, history]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                const content = undo();
                if (content !== null) {
                    // Emit custom event for editor to update
                    window.dispatchEvent(new CustomEvent('editor:undo', { detail: { content } }));
                }
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                const content = redo();
                if (content !== null) {
                    // Emit custom event for editor to update
                    window.dispatchEvent(new CustomEvent('editor:redo', { detail: { content } }));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return {
        addToHistory,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        historyLength: history.length,
        currentIndex
    };
};
