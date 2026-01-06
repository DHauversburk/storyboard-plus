import { useEffect, useRef } from 'react';

interface SessionData {
    content: string;
    fileName: string | null;
    timestamp: number;
}

export const useSessionRecovery = (
    content: string,
    fileName: string | null,
    onRecover: (data: SessionData) => void
) => {
    const hasCheckedRecovery = useRef(false);

    // Save to sessionStorage periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (content) {
                sessionStorage.setItem('editor_recovery', JSON.stringify({
                    content,
                    fileName,
                    timestamp: Date.now()
                }));
            }
        }, 10000); // Every 10 seconds

        return () => clearInterval(interval);
    }, [content, fileName]);

    // Check for recovery on mount
    useEffect(() => {
        if (hasCheckedRecovery.current) return;
        hasCheckedRecovery.current = true;

        const recovery = sessionStorage.getItem('editor_recovery');
        if (!recovery) return;

        try {
            const data: SessionData = JSON.parse(recovery);
            const age = Date.now() - data.timestamp;

            // If less than 1 hour old and has content, offer recovery
            if (age < 3600000 && data.content && data.content.length > 10) {
                const timeAgo = Math.floor(age / 1000 / 60); // minutes
                const message = `Recover unsaved work from ${timeAgo} minute${timeAgo !== 1 ? 's' : ''} ago?\n\nFile: ${data.fileName || 'Untitled'}\nLength: ${data.content.length} characters`;

                if (confirm(message)) {
                    onRecover(data);
                }
            }

            // Clear recovery after check
            sessionStorage.removeItem('editor_recovery');
        } catch (err) {
            console.error('Failed to parse recovery data:', err);
            sessionStorage.removeItem('editor_recovery');
        }
    }, [onRecover]);

    return null;
};
