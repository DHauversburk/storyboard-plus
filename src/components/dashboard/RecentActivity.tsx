import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export function RecentActivity() {
    const activities = [
        { id: 1, type: 'edited', target: 'Chapter 4: The Revelation', time: '10 mins ago', user: 'You' },
        { id: 2, type: 'created', target: 'Character: Elandor', time: '2 hours ago', user: 'AI Assistant' },
        { id: 3, type: 'commented', target: 'Scene 12 - Draft', time: '5 hours ago', user: 'You' },
        { id: 4, type: 'optimized', target: 'World Bible - Magic System', time: 'Yesterday', user: 'Genkit' },
    ];

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Recent Activity</CardTitle>
                    <span className="text-xs text-primary cursor-pointer hover:underline">View All</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.map((activity, i) => (
                        <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                            <div className={`mt-1 w-2 h-2 rounded-full ${activity.type === 'created' ? 'bg-green-500' : activity.type === 'optimized' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-200">{activity.target}</p>
                                <p className="text-xs text-gray-500">
                                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} by <span className={activity.user.includes('AI') || activity.user === 'Genkit' ? 'text-primary' : ''}>{activity.user}</span> • {activity.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
