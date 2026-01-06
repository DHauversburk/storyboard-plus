import { useState, useEffect } from 'react';

export interface WritingStreak {
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    lastWriteDate: string;
    todayWordCount: number;
}

const STORAGE_KEY = 'sb_writing_streak';

const getToday = () => new Date().toDateString();

const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString();
};

export const useWritingStreak = () => {
    const [streak, setStreak] = useState<WritingStreak>(() => {
        if (typeof window === 'undefined') return {
            currentStreak: 0,
            longestStreak: 0,
            totalDays: 0,
            lastWriteDate: '',
            todayWordCount: 0
        };

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (err) {
            console.error('Failed to load streak data:', err);
        }

        return {
            currentStreak: 0,
            longestStreak: 0,
            totalDays: 0,
            lastWriteDate: '',
            todayWordCount: 0
        };
    });

    // Update streak when user writes
    const recordWriting = (wordCount: number) => {
        const today = getToday();

        setStreak(prev => {
            const newStreak = { ...prev };

            // If this is a new day
            if (prev.lastWriteDate !== today) {
                const yesterday = getYesterday();

                // Check if streak continues
                if (prev.lastWriteDate === yesterday) {
                    newStreak.currentStreak = prev.currentStreak + 1;
                } else if (prev.lastWriteDate === '') {
                    // First time writing
                    newStreak.currentStreak = 1;
                } else {
                    // Streak broken
                    newStreak.currentStreak = 1;
                }

                newStreak.totalDays = prev.totalDays + 1;
                newStreak.lastWriteDate = today;
                newStreak.todayWordCount = wordCount;
            } else {
                // Same day, just update word count
                newStreak.todayWordCount = wordCount;
            }

            // Update longest streak
            newStreak.longestStreak = Math.max(newStreak.longestStreak, newStreak.currentStreak);

            // Save to localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newStreak));
            } catch (err) {
                console.error('Failed to save streak data:', err);
            }

            return newStreak;
        });
    };

    return { streak, recordWriting };
};
