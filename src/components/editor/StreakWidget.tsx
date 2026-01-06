import React from 'react';
import { WritingStreak } from '@/lib/hooks/useWritingStreak';

interface StreakWidgetProps {
    streak: WritingStreak;
}

const StreakWidgetComponent: React.FC<StreakWidgetProps> = ({ streak }) => {
    if (streak.currentStreak === 0) return null;

    return (
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 rounded-xl border border-orange-500/30 shadow-lg">
            <div className="flex items-center gap-3">
                <span className="text-4xl" aria-hidden="true">🔥</span>
                <div className="flex-1">
                    <div className="text-2xl font-bold text-orange-400">
                        {streak.currentStreak} Day Streak!
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        {streak.todayWordCount > 0 && (
                            <span>{streak.todayWordCount.toLocaleString()} words today • </span>
                        )}
                        Best: {streak.longestStreak} days
                    </div>
                </div>
            </div>

            {streak.currentStreak >= 7 && (
                <div className="mt-3 pt-3 border-t border-orange-500/20">
                    <div className="flex items-center gap-2 text-xs text-orange-300">
                        <span>🏆</span>
                        <span className="font-semibold">
                            {streak.currentStreak >= 30 ? 'Legendary Writer!' :
                                streak.currentStreak >= 14 ? 'On Fire!' :
                                    'Building Momentum!'}
                        </span>
                    </div>
                </div>
            )}

            <div className="mt-2 text-xs text-gray-500 italic">
                Keep writing daily to maintain your streak!
            </div>
        </div>
    );
};

// Memoize to prevent unnecessary re-renders
export const StreakWidget = React.memo(StreakWidgetComponent);
