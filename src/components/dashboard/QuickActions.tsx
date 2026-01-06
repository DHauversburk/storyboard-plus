"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function QuickActions() {
    const router = useRouter();

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Draft, design, and create instantly.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                    variant="secondary"
                    className="w-full justify-start gap-3 h-auto py-3 group"
                    onClick={() => router.push('/characters')}
                >
                    <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">+</span>
                    <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm">New Character</span>
                        <span className="text-[10px] text-gray-500">Add to roster</span>
                    </div>
                </Button>
                <Button
                    variant="secondary"
                    className="w-full justify-start gap-3 h-auto py-3 group"
                    onClick={() => router.push('/write')}
                >
                    <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">📝</span>
                    <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm">New Scene</span>
                        <span className="text-[10px] text-gray-500">Start writing</span>
                    </div>
                </Button>
                <Button
                    variant="secondary"
                    className="w-full justify-start gap-3 h-auto py-3 group"
                    onClick={() => router.push('/world')}
                >
                    <span className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">🌍</span>
                    <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm">World Entry</span>
                        <span className="text-[10px] text-gray-500">Expand lore</span>
                    </div>
                </Button>
                <Button
                    variant="secondary"
                    className="w-full justify-start gap-3 h-auto py-3 group"
                    onClick={() => router.push('/plots')}
                >
                    <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">📊</span>
                    <div className="flex flex-col items-start text-left">
                        <span className="font-semibold text-sm">New Plotline</span>
                        <span className="text-[10px] text-gray-500">Track story arcs</span>
                    </div>
                </Button>
            </CardContent>
        </Card>
    )
}
