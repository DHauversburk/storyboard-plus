"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { exportManuscript } from '@/lib/exporter';

// --- Types ---
interface Scene {
    id: string;
    title: string;
    content: string;
    wordCount: number;
    status: 'draft' | 'review' | 'done';
    order: number;
    lastModified: number;
    note?: string;
}

const STATUS_COLORS = {
    draft: 'bg-gray-500',
    review: 'bg-yellow-500',
    done: 'bg-green-500'
};

export default function ManuscriptPage() {
    const router = useRouter();
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [draggedScene, setDraggedScene] = useState<string | null>(null);

    // Load Data
    useEffect(() => {
        const saved = localStorage.getItem('sb_scenes');
        if (saved) {
            try {
                setScenes(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load scenes", e);
            }
        } else {
            // Initial seed?
            setScenes([
                { id: '1', title: 'Chapter 1: The Beginning', content: '', wordCount: 0, status: 'draft', order: 0, lastModified: Date.now() }
            ]);
        }
    }, []);

    // Save Data
    useEffect(() => {
        if (scenes.length > 0) {
            localStorage.setItem('sb_scenes', JSON.stringify(scenes));
        }
    }, [scenes]);

    // Drag & Drop Handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedScene(id);
        e.dataTransfer.effectAllowed = 'move';
        // Add minimal data for compatibility
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedScene || draggedScene === targetId) return;

        const draggingIdx = scenes.findIndex(s => s.id === draggedScene);
        const targetIdx = scenes.findIndex(s => s.id === targetId);

        if (draggingIdx === -1 || targetIdx === -1) return;

        const newScenes = [...scenes];
        const [moved] = newScenes.splice(draggingIdx, 1);
        newScenes.splice(targetIdx, 0, moved);

        // Update orders
        const reordered = newScenes.map((s, idx) => ({ ...s, order: idx }));
        setScenes(reordered);
    };

    const handleDragEnd = () => {
        setDraggedScene(null);
    };

    const handleAddScene = () => {
        const newScene: Scene = {
            id: Date.now().toString(),
            title: `New Scene ${scenes.length + 1}`,
            content: '',
            wordCount: 0,
            status: 'draft',
            order: scenes.length,
            lastModified: Date.now()
        };
        setScenes([...scenes, newScene]);
    };

    const handleDeleteScene = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this scene? Content will be lost.')) {
            setScenes(scenes.filter(s => s.id !== id));
        }
    };

    const handleOpenScene = (id: string) => {
        router.push(`/write?sceneId=${id}`);
    };

    const handleExport = async () => {
        const title = prompt("Manuscript Title:", "Untitled Draft");
        if (!title) return;
        const author = prompt("Author Name:", "Me");

        try {
            await exportManuscript(title, author || "Author", scenes);
        } catch (e) {
            console.error("Export failed", e);
            alert("Export failed. See console.");
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0f12] text-gray-200 p-8 font-sans">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                        Manuscript Board
                    </h1>
                    <p className="text-gray-400 mt-1">Arrange your scenes. Drag and drop to reorder.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 transition-colors flex items-center gap-2"
                    >
                        <span>📄</span> Export to Word
                    </button>
                    <Button variant="primary" onClick={handleAddScene}>
                        + New Scene
                    </Button>
                </div>
            </header>

            {/* Scene Grid (Vertical List really, to resemble a manuscript spine) */}
            <div className="max-w-3xl mx-auto space-y-4 pb-20">
                {scenes.length === 0 && (
                    <div className="text-center py-10 opacity-50 border-2 border-dashed border-white/10 rounded-xl">
                        Start your story by adding a scene.
                    </div>
                )}

                {scenes.map((scene, index) => (
                    <div
                        key={scene.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, scene.id)}
                        onDragOver={(e) => handleDragOver(e, scene.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleOpenScene(scene.id)}
                        className={`group relative flex items-center gap-4 bg-gray-900 border border-white/5 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-white/20 transition-all ${draggedScene === scene.id ? 'opacity-50 scale-95' : 'opacity-100'}`}
                    >
                        {/* Index Number */}
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-mono text-gray-500 flex-shrink-0">
                            {index + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-200 truncate pr-8 group-hover:text-primary transition-colors">
                                {scene.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[scene.status]}`} />
                                <span className="uppercase">{scene.status}</span>
                                <span>•</span>
                                <span>{scene.wordCount} words</span>
                                <span>•</span>
                                <span>{new Date(scene.lastModified).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Actions (Delete) */}
                        <button
                            onClick={(e) => handleDeleteScene(e, scene.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-400 transition-all"
                            title="Delete Scene"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>

                        {/* Drag Handle Indicator */}
                        <div className="absolute right-0 top-0 bottom-0 w-2 rounded-r-xl bg-white/5 opacity-0 group-hover:opacity-100" />
                    </div>
                ))}
            </div>

            {/* Total Stats Footer */}
            <div className="fixed bottom-0 left-64 right-0 p-4 bg-gray-950/80 backdrop-blur border-t border-white/5 flex justify-center gap-8 text-sm text-gray-400">
                <span>Total Scenes: <strong>{scenes.length}</strong></span>
                <span>Total Words: <strong>{scenes.reduce((acc, s) => acc + s.wordCount, 0).toLocaleString()}</strong></span>
            </div>
        </div>
    );
}
