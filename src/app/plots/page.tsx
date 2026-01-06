"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Plotline {
    id: string;
    title: string;
    type: 'main' | 'subplot' | 'character_arc' | 'mystery' | 'romance';
    status: 'planning' | 'in_progress' | 'resolved';
    description: string;
    beats: PlotBeat[];
    characters: string[]; // Character IDs
    notes: string;
    color?: string; // Custom color for storyboard
}

interface PlotBeat {
    id: string;
    title: string;
    description: string;
    chapter?: string;
    scene?: string;
    completed: boolean;
    order: number;
    tension?: 'low' | 'medium' | 'high' | 'climax'; // Tension level
    wordTarget?: number; // Target word count for this beat
    pov?: string; // Point of view character
    location?: string;
    notes?: string;
}

const PLOT_TYPE_COLORS = {
    main: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    subplot: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    character_arc: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    mystery: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    romance: 'from-pink-500/20 to-pink-600/10 border-pink-500/30'
};

const PLOT_TYPE_LABELS = {
    main: { label: 'Main Plot', icon: '📖', desc: 'The central storyline driving your narrative. The primary conflict readers follow.' },
    subplot: { label: 'Subplot', icon: '📑', desc: 'Secondary storylines that enrich the main plot. They often mirror or contrast themes.' },
    character_arc: { label: 'Character Arc', icon: '🎭', desc: 'A character\'s internal journey of growth, change, or revelation over the story.' },
    mystery: { label: 'Mystery', icon: '🔍', desc: 'A puzzle or question that creates suspense. Reveals are strategically timed.' },
    romance: { label: 'Romance', icon: '💕', desc: 'Romantic relationship development between characters. Can be main or subplot.' }
};

const STATUS_INFO = {
    planning: { color: 'bg-gray-500', desc: 'Outlining and brainstorming. No scenes written yet.' },
    in_progress: { color: 'bg-yellow-500', desc: 'Actively being written. Some scenes complete.' },
    resolved: { color: 'bg-green-500', desc: 'This plotline has reached its conclusion in the manuscript.' }
};

const STATUS_COLORS = {
    planning: 'bg-gray-500',
    in_progress: 'bg-yellow-500',
    resolved: 'bg-green-500'
};

const TENSION_COLORS = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    climax: 'bg-red-500'
};

export default function PlotlinesPage() {
    const [plotlines, setPlotlines] = useState<Plotline[]>([]);
    const [selectedPlot, setSelectedPlot] = useState<Plotline | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'kanban'>('list');

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sb_plotlines');
        if (saved) {
            setPlotlines(JSON.parse(saved));
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('sb_plotlines', JSON.stringify(plotlines));
    }, [plotlines]);

    const createNewPlotline = () => {
        const newPlot: Plotline = {
            id: Date.now().toString(),
            title: 'New Plotline',
            type: 'main',
            status: 'planning',
            description: '',
            beats: [],
            characters: [],
            notes: ''
        };
        setPlotlines([...plotlines, newPlot]);
        setSelectedPlot(newPlot);
        setIsEditing(true);
    };

    const updatePlotline = (updated: Plotline) => {
        setPlotlines(plotlines.map(p => p.id === updated.id ? updated : p));
        setSelectedPlot(updated);
    };

    const deletePlotline = (id: string) => {
        if (confirm('Delete this plotline?')) {
            setPlotlines(plotlines.filter(p => p.id !== id));
            setSelectedPlot(null);
        }
    };

    // Calculate overall progress
    const getProgress = (plot: Plotline) => {
        if (plot.beats.length === 0) return 0;
        return Math.round((plot.beats.filter(b => b.completed).length / plot.beats.length) * 100);
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6 p-8 max-w-[1800px] mx-auto">
            {/* Left Panel - Plotline List */}
            <div className="w-80 flex flex-col gap-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Plotlines</h1>
                    <Button onClick={createNewPlotline} variant="primary" className="px-3 py-2">
                        + New
                    </Button>
                </div>

                {/* View Toggle */}
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 py-1.5 text-xs rounded transition-colors ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}
                    >
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`flex-1 py-1.5 text-xs rounded transition-colors ${viewMode === 'timeline' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}
                    >
                        Timeline
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`flex-1 py-1.5 text-xs rounded transition-colors ${viewMode === 'kanban' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}
                    >
                        Board
                    </button>
                </div>

                {/* Plotline Cards */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {plotlines.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">📊</div>
                            <p className="text-sm">No plotlines yet</p>
                            <p className="text-xs">Click "+ New" to create one</p>
                        </div>
                    ) : (
                        plotlines.map(plot => (
                            <button
                                key={plot.id}
                                onClick={() => { setSelectedPlot(plot); setIsEditing(false); }}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedPlot?.id === plot.id
                                    ? 'bg-white/10 border-purple-500/50 shadow-lg'
                                    : `bg-gradient-to-br ${PLOT_TYPE_COLORS[plot.type]} hover:bg-white/5`
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl cursor-help"
                                        title={`${PLOT_TYPE_LABELS[plot.type].label}: ${PLOT_TYPE_LABELS[plot.type].desc}`}
                                    >
                                        {PLOT_TYPE_LABELS[plot.type].icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-white truncate">{plot.title}</div>
                                        <div
                                            className="flex items-center gap-2 mt-1 cursor-help"
                                            title={STATUS_INFO[plot.status].desc}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[plot.status]}`} />
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                                {plot.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white">{getProgress(plot)}%</div>
                                        <div className="text-[9px] text-gray-500">{plot.beats.length} beats</div>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                        style={{ width: `${getProgress(plot)}%` }}
                                    />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Plotline Detail */}
            <div className="flex-1 overflow-y-auto">
                {viewMode === 'timeline' ? (
                    <MasterTimeline
                        plotlines={plotlines}
                        onUpdate={updatePlotline}
                        onSelect={setSelectedPlot}
                        selectedId={selectedPlot?.id}
                    />
                ) : !selectedPlot ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <div className="text-6xl mb-4">📊</div>
                            <h2 className="text-xl font-semibold text-gray-300">Select a Plotline</h2>
                            <p className="text-sm mt-2">Choose from the list or create a new plotline</p>
                        </div>
                    </div>
                ) : isEditing ? (
                    <PlotlineEditor
                        plotline={selectedPlot}
                        onSave={(updated) => { updatePlotline(updated); setIsEditing(false); }}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : viewMode === 'kanban' ? (
                    <PlotlineKanban
                        plotline={selectedPlot}
                        onUpdate={updatePlotline}
                        onEdit={() => setIsEditing(true)}
                        onDelete={() => deletePlotline(selectedPlot.id)}
                    />
                ) : (
                    <PlotlineView
                        plotline={selectedPlot}
                        onUpdate={updatePlotline}
                        onEdit={() => setIsEditing(true)}
                        onDelete={() => deletePlotline(selectedPlot.id)}
                    />
                )}
            </div>
        </div>
    );
}

// Plotline View Component
function PlotlineView({ plotline, onUpdate, onEdit, onDelete }: {
    plotline: Plotline;
    onUpdate: (p: Plotline) => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const toggleBeat = (beatId: string) => {
        const updated = {
            ...plotline,
            beats: plotline.beats.map(b => b.id === beatId ? { ...b, completed: !b.completed } : b)
        };
        onUpdate(updated);
    };

    const getProgress = () => {
        if (plotline.beats.length === 0) return 0;
        return Math.round((plotline.beats.filter(b => b.completed).length / plotline.beats.length) * 100);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`p-6 rounded-2xl bg-gradient-to-br ${PLOT_TYPE_COLORS[plotline.type]} border`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl border-2 border-white/20">
                            {PLOT_TYPE_LABELS[plotline.type].icon}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{plotline.title}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{PLOT_TYPE_LABELS[plotline.type].label}</span>
                                <span className={`px-2 py-0.5 rounded-full ${STATUS_COLORS[plotline.status]} text-xs text-black`}>
                                    {plotline.status.replace('_', ' ')}
                                </span>
                                <span className="text-sm text-gray-300">{getProgress()}% complete</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onEdit}>Edit</Button>
                        <Button variant="secondary" onClick={onDelete} className="text-red-400 hover:text-red-300">Delete</Button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${getProgress()}%` }}
                    />
                </div>
            </div>

            {/* Description */}
            <Card>
                <CardHeader><CardTitle>Synopsis</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-gray-300 leading-relaxed">{plotline.description || <span className="text-gray-600 italic">No synopsis yet...</span>}</p>
                </CardContent>
            </Card>

            {/* Plot Beats Checklist */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Plot Beats</span>
                        <span className="text-sm font-normal text-gray-400">
                            {plotline.beats.filter(b => b.completed).length} / {plotline.beats.length} completed
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {plotline.beats.length === 0 ? (
                        <p className="text-gray-600 italic text-center py-4">No plot beats defined. Edit to add some!</p>
                    ) : (
                        <div className="space-y-2">
                            {plotline.beats.sort((a, b) => a.order - b.order).map((beat) => (
                                <div
                                    key={beat.id}
                                    className={`p-3 rounded-lg border transition-all ${beat.completed
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-white/5 border-white/10'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleBeat(beat.id)}
                                            className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${beat.completed
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-500 hover:border-green-500'
                                                }`}
                                        >
                                            {beat.completed && '✓'}
                                        </button>
                                        <div className="flex-1">
                                            <div className={`font-semibold ${beat.completed ? 'text-green-300 line-through' : 'text-white'}`}>
                                                {beat.title}
                                            </div>
                                            {beat.description && (
                                                <p className="text-sm text-gray-400 mt-1">{beat.description}</p>
                                            )}
                                            {beat.chapter && (
                                                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-gray-400">
                                                    Chapter {beat.chapter}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notes */}
            {plotline.notes && (
                <Card>
                    <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{plotline.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Master Parallel Timeline Component
function MasterTimeline({ plotlines, onUpdate, onSelect, selectedId }: {
    plotlines: Plotline[];
    onUpdate: (p: Plotline) => void;
    onSelect: (p: Plotline) => void;
    selectedId?: string;
}) {
    // 1. Extract all chapters
    const getAllChapters = () => {
        const chapters = new Set<number>();
        plotlines.forEach(p => {
            p.beats.forEach(b => {
                if (b.chapter) {
                    const num = parseInt(b.chapter);
                    if (!isNaN(num)) chapters.add(num);
                }
            });
        });
        return Array.from(chapters).sort((a, b) => a - b);
    };

    const chapters = getAllChapters();
    const maxChapter = chapters.length > 0 ? chapters[chapters.length - 1] : 0;
    // Ensure we have at least chapters 1-3 or up to max
    const displayChapters = Array.from({ length: Math.max(3, maxChapter + 1) }, (_, i) => i + 1);

    return (
        <div className="h-full flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white">Story Timeline</h1>
                    <p className="text-gray-400 text-sm">Parallel view of all story arcs by chapter.</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto border border-white/10 rounded-xl bg-gray-900/50 relative custom-scrollbar">
                <div className="min-w-max">
                    {/* Header Row (Chapters) */}
                    <div className="flex border-b border-white/10 sticky top-0 bg-gray-900 z-10">
                        <div className="w-48 flex-shrink-0 p-3 border-r border-white/10 bg-gray-900 font-bold text-gray-400 text-sm sticky left-0 z-20">
                            Plotline
                        </div>
                        {displayChapters.map(ch => (
                            <div key={ch} className="w-64 flex-shrink-0 p-3 border-r border-white/5 text-center text-sm font-semibold text-gray-300">
                                Chapter {ch}
                            </div>
                        ))}
                        <div className="w-64 flex-shrink-0 p-3 text-center text-sm text-gray-500 italic">
                            Unscheduled
                        </div>
                    </div>

                    {/* Swimlanes */}
                    {plotlines.map(plot => (
                        <div
                            key={plot.id}
                            className={`flex border-b border-white/5 hover:bg-white/5 transition-colors ${selectedId === plot.id ? 'bg-white/5' : ''}`}
                            onClick={() => onSelect(plot)}
                        >
                            {/* Plot Header */}
                            <div className="w-48 flex-shrink-0 p-4 border-r border-white/10 sticky left-0 bg-gray-900 z-10 flex flex-col justify-center group cursor-pointer">
                                <div className={`font-bold text-sm ${selectedId === plot.id ? 'text-purple-300' : 'text-white'}`}>
                                    {plot.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[plot.status]}`} />
                                    {PLOT_TYPE_LABELS[plot.type].label}
                                </div>
                            </div>

                            {/* Chapter Cells */}
                            {displayChapters.map(ch => {
                                // Find beats in this chapter
                                const beats = plot.beats.filter(b => parseInt(b.chapter || '0') === ch).sort((a, b) => a.order - b.order);

                                return (
                                    <div key={ch} className="w-64 flex-shrink-0 p-2 border-r border-white/5 min-h-[120px] bg-black/20">
                                        <div className="space-y-2">
                                            {beats.map(beat => (
                                                <div
                                                    key={beat.id}
                                                    className={`p-2 rounded border text-xs relative group ${beat.completed ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800 border-white/10 hover:border-purple-500/50'}`}
                                                >
                                                    {beat.tension && (
                                                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full m-1 ${TENSION_COLORS[beat.tension]}`} title={`Tension: ${beat.tension}`} />
                                                    )}
                                                    <div className="font-semibold text-gray-200 pr-2">{beat.title}</div>
                                                    {beat.scene && <div className="text-[10px] text-gray-500 mt-0.5">Sc {beat.scene}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Unscheduled Cell */}
                            <div className="w-64 flex-shrink-0 p-2 min-h-[120px] bg-black/40">
                                <div className="space-y-2">
                                    {plot.beats.filter(b => !b.chapter || isNaN(parseInt(b.chapter))).map(beat => (
                                        <div key={beat.id} className="p-2 rounded border border-white/10 bg-gray-800 text-xs text-gray-400 opacity-75">
                                            {beat.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Plotline Kanban Board Component
function PlotlineKanban({ plotline, onUpdate, onEdit, onDelete }: {
    plotline: Plotline;
    onUpdate: (p: Plotline) => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [draggedBeatId, setDraggedBeatId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedBeatId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedBeatId || draggedBeatId === targetId) return;

        const beats = [...plotline.beats].sort((a, b) => a.order - b.order);
        const sourceIndex = beats.findIndex(b => b.id === draggedBeatId);
        const targetIndex = beats.findIndex(b => b.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        // Reorder
        const temp = beats[sourceIndex];
        beats.splice(sourceIndex, 1);
        beats.splice(targetIndex, 0, temp);

        // Update orders
        const updatedBeats = beats.map((b, i) => ({ ...b, order: i }));
        onUpdate({ ...plotline, beats: updatedBeats });
    };

    const updateBeatTension = (beatId: string, tension: PlotBeat['tension']) => {
        const updated = plotline.beats.map(b => b.id === beatId ? { ...b, tension } : b);
        onUpdate({ ...plotline, beats: updated });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{plotline.title} - Story Board</h1>
                    <p className="text-gray-400 text-sm">Drag and drop cards to reorder scenes.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onEdit}>Edit Details</Button>
                    <Button variant="secondary" onClick={onDelete} className="text-red-400">Delete</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {plotline.beats.sort((a, b) => a.order - b.order).map((beat, idx) => (
                    <div
                        key={beat.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, beat.id)}
                        onDragOver={(e) => handleDragOver(e, beat.id)}
                        onDragEnd={() => setDraggedBeatId(null)}
                        className={`p-4 rounded-xl border bg-white/5 border-white/10 group cursor-move hover:border-purple-500/50 transition-all ${draggedBeatId === beat.id ? 'opacity-50' : 'opacity-100'}`}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2">
                            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center text-gray-400">
                                {idx + 1}
                            </span>
                            <select
                                value={beat.tension || 'medium'}
                                onChange={(e) => updateBeatTension(beat.id, e.target.value as any)}
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border-none outline-none cursor-pointer ${TENSION_COLORS[beat.tension || 'medium']} text-black`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="low">Low Tension</option>
                                <option value="medium">Medium Tension</option>
                                <option value="high">High Tension</option>
                                <option value="climax">Climax</option>
                            </select>
                        </div>

                        <div className="font-bold text-lg text-white mb-2">{beat.title}</div>
                        <p className="text-sm text-gray-400 line-clamp-3 mb-4">{beat.description || "No description."}</p>

                        <div className="flex gap-2 text-xs text-gray-500 mt-auto">
                            {beat.chapter && (
                                <span className="px-2 py-1 bg-white/5 rounded">Ch {beat.chapter}</span>
                            )}
                            {beat.scene && (
                                <span className="px-2 py-1 bg-white/5 rounded">Sc {beat.scene}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Plotline Editor Component
function PlotlineEditor({ plotline, onSave, onCancel }: {
    plotline: Plotline;
    onSave: (p: Plotline) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState(plotline);
    const [newBeatTitle, setNewBeatTitle] = useState('');

    const addBeat = () => {
        if (newBeatTitle.trim()) {
            const newBeat: PlotBeat = {
                id: Date.now().toString(),
                title: newBeatTitle.trim(),
                description: '',
                completed: false,
                order: form.beats.length
            };
            setForm({ ...form, beats: [...form.beats, newBeat] });
            setNewBeatTitle('');
        }
    };

    const removeBeat = (id: string) => {
        setForm({ ...form, beats: form.beats.filter(b => b.id !== id) });
    };

    const updateBeat = (id: string, updates: Partial<PlotBeat>) => {
        setForm({
            ...form,
            beats: form.beats.map(b => b.id === id ? { ...b, ...updates } : b)
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Edit Plotline</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" onClick={() => onSave(form)}>Save</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Title</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value as Plotline['type'] })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50"
                            >
                                <option value="main">Main Plot</option>
                                <option value="subplot">Subplot</option>
                                <option value="character_arc">Character Arc</option>
                                <option value="mystery">Mystery</option>
                                <option value="romance">Romance</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Status</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as Plotline['status'] })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50"
                            >
                                <option value="planning">Planning</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <Card>
                    <CardHeader><CardTitle>Synopsis</CardTitle></CardHeader>
                    <CardContent>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe this plotline..."
                            rows={6}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 resize-none"
                        />
                    </CardContent>
                </Card>

                {/* Plot Beats */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Plot Beats</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newBeatTitle}
                                onChange={(e) => setNewBeatTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addBeat()}
                                placeholder="Add a plot beat..."
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                            />
                            <Button variant="secondary" onClick={addBeat}>Add Beat</Button>
                        </div>

                        <div className="space-y-2">
                            {form.beats.map((beat, idx) => (
                                <div key={beat.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs flex-shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={beat.title}
                                                onChange={(e) => updateBeat(beat.id, { title: e.target.value })}
                                                className="w-full px-2 py-1 bg-transparent border-b border-white/10 text-white outline-none focus:border-purple-500/50"
                                            />
                                            <input
                                                type="text"
                                                value={beat.description}
                                                onChange={(e) => updateBeat(beat.id, { description: e.target.value })}
                                                placeholder="Description (optional)"
                                                className="w-full px-2 py-1 bg-transparent border-b border-white/10 text-gray-400 text-sm outline-none focus:border-purple-500/50"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={beat.chapter || ''}
                                                    onChange={(e) => updateBeat(beat.id, { chapter: e.target.value })}
                                                    placeholder="Ch #"
                                                    className="w-16 px-2 py-1 bg-white/5 rounded text-xs text-gray-400 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={beat.scene || ''}
                                                    onChange={(e) => updateBeat(beat.id, { scene: e.target.value })}
                                                    placeholder="Sc #"
                                                    className="w-16 px-2 py-1 bg-white/5 rounded text-xs text-gray-400 outline-none"
                                                />
                                                <select
                                                    value={beat.tension || 'medium'}
                                                    onChange={(e) => updateBeat(beat.id, { tension: e.target.value as any })}
                                                    className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400 outline-none"
                                                >
                                                    <option value="low">Low Tension</option>
                                                    <option value="medium">Medium Tension</option>
                                                    <option value="high">High Tension</option>
                                                    <option value="climax">Climax</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={beat.location || ''}
                                                    onChange={(e) => updateBeat(beat.id, { location: e.target.value })}
                                                    placeholder="Location"
                                                    className="flex-1 px-2 py-1 bg-white/5 rounded text-xs text-gray-400 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={beat.pov || ''}
                                                    onChange={(e) => updateBeat(beat.id, { pov: e.target.value })}
                                                    placeholder="POV"
                                                    className="w-20 px-2 py-1 bg-white/5 rounded text-xs text-gray-400 outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    value={beat.wordTarget || ''}
                                                    onChange={(e) => updateBeat(beat.id, { wordTarget: parseInt(e.target.value) || undefined })}
                                                    placeholder="Words"
                                                    className="w-20 px-2 py-1 bg-white/5 rounded text-xs text-gray-400 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeBeat(beat.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                    <CardContent>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Any additional notes..."
                            rows={4}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 resize-none"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
