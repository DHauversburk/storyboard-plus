"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface TimelineEvent {
    id: string;
    title: string;
    date: string; // Display date/time string
    sortOrder: number; // Integer for sorting
    description: string;
    type: 'main' | 'subplot' | 'lore' | 'char';
    color?: string; // Custom color override
}

const EVENT_TYPES = {
    main: { label: 'Main Plot', color: 'bg-purple-500', border: 'border-purple-500' },
    subplot: { label: 'Subplot', color: 'bg-blue-500', border: 'border-blue-500' },
    lore: { label: 'World History', color: 'bg-amber-500', border: 'border-amber-500' },
    char: { label: 'Character Arc', color: 'bg-emerald-500', border: 'border-emerald-500' }
};

export default function TimelinePage() {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [scale, setScale] = useState(1); // Zoom level for spacing

    // Load Events
    useEffect(() => {
        const saved = localStorage.getItem('sb_timeline_events');
        if (saved) {
            setEvents(JSON.parse(saved).sort((a: any, b: any) => a.sortOrder - b.sortOrder));
        } else {
            // Seed mock data
            const seeds: TimelineEvent[] = [
                { id: '1', title: 'The Inciting Incident', date: 'Chapter 1', sortOrder: 10, description: 'Protagonist discovers the artifact.', type: 'main' },
                { id: '2', title: 'The Great War', date: '100 Years Ago', sortOrder: -100, description: 'The conflict that destroyed the old world.', type: 'lore' },
                { id: '3', title: 'Rivalry Begins', date: 'Chapter 3', sortOrder: 30, description: 'Antagonist challenges the hero.', type: 'char' }
            ];
            setEvents(seeds.sort((a, b) => a.sortOrder - b.sortOrder));
        }
    }, []);

    // Save Events
    useEffect(() => {
        if (events.length > 0) localStorage.setItem('sb_timeline_events', JSON.stringify(events));
    }, [events]);

    const addEvent = () => {
        const newEvent: TimelineEvent = {
            id: Date.now().toString(),
            title: 'New Event',
            date: 'TBD',
            sortOrder: (events.length > 0 ? events[events.length - 1].sortOrder + 10 : 0),
            description: '',
            type: 'main'
        };
        const updated = [...events, newEvent].sort((a, b) => a.sortOrder - b.sortOrder);
        setEvents(updated);
        setSelectedEvent(newEvent);
        setIsEditing(true);
    };

    const deleteEvent = (id: string) => {
        setEvents(events.filter(e => e.id !== id));
        setSelectedEvent(null);
    };

    const updateEvent = (updated: TimelineEvent) => {
        const newEvents = events.map(e => e.id === updated.id ? updated : e).sort((a, b) => a.sortOrder - b.sortOrder);
        setEvents(newEvents);
        setSelectedEvent(updated);
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col p-4 lg:p-6 max-w-[1800px] mx-auto gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between flex-shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Timeline</h1>
                    <p className="text-gray-400 text-sm">Chronological visualization of story events</p>
                </div>
                <div className="flex items-center gap-4 self-end lg:self-auto">
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                        <Button variant={scale === 0.5 ? 'primary' : 'secondary'} onClick={() => setScale(0.5)} className="text-xs px-2 py-1">Compact</Button>
                        <Button variant={scale === 1 ? 'primary' : 'secondary'} onClick={() => setScale(1)} className="text-xs px-2 py-1">Normal</Button>
                        <Button variant={scale === 2 ? 'primary' : 'secondary'} onClick={() => setScale(2)} className="text-xs px-2 py-1">Wide</Button>
                    </div>
                    <Button onClick={addEvent} variant="primary">+ Add Event</Button>
                </div>
            </div>

            {/* Timeline Viewport */}
            <div className="flex-1 bg-black/20 rounded-2xl border border-white/10 overflow-x-auto overflow-y-hidden custom-scrollbar relative select-none">

                {/* Center Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -mt-0.5 z-0" style={{ width: `${Math.max(100, events.length * 200 * scale)}px` }} />

                {/* Events Container */}
                <div
                    className="flex items-center h-full px-10 lg:px-20 gap-0 z-10 relative"
                    style={{
                        width: `${Math.max(100, events.length * 250 * scale + 400)}px`,
                        // Dynamic gap based on sorting distance could be cool, but fixed is easier for v1
                    }}
                >
                    {events.map((event, index) => {
                        const isSelected = selectedEvent?.id === event.id;
                        // Alternate up/down placement to save space
                        const isUp = index % 2 === 0;

                        return (
                            <div
                                key={event.id}
                                className="relative flex flex-col items-center group"
                                style={{ width: `${250 * scale}px` }}
                            >
                                {/* Dot on timeline */}
                                <div className={`absolute top-1/2 left-1/2 -mt-2 -ml-2 w-4 h-4 rounded-full border-2 transition-all z-20 ${isSelected ? 'bg-white border-purple-500 scale-125' : `${EVENT_TYPES[event.type].color} border-black`}`} />

                                {/* Connector Line */}
                                <div className={`absolute left-1/2 -ml-px w-0.5 bg-white/10 transition-all ${isUp ? 'bottom-1/2 top-20' : 'top-1/2 bottom-20'}`} />

                                {/* Card */}
                                <div
                                    onClick={() => setSelectedEvent(event)}
                                    className={`
                                        w-[220px] p-4 rounded-xl border backdrop-blur-sm transition-all cursor-pointer bg-black/40
                                        ${isUp ? '-translate-y-[calc(50%+40px)]' : 'translate-y-[calc(50%+40px)]'}
                                        ${isSelected ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-white/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
                                    `}
                                >
                                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-purple-300' : 'text-gray-500'}`}>
                                        {event.date}
                                    </div>
                                    <div className="font-bold text-white text-sm line-clamp-2 leading-snug mb-2">
                                        {event.title}
                                    </div>
                                    <div className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                                        {event.description || 'No description.'}
                                    </div>
                                    <div className={`mt-3 text-[10px] inline-block px-1.5 py-0.5 rounded border border-white/10 text-gray-400 uppercase ${EVENT_TYPES[event.type].border}`}>
                                        {EVENT_TYPES[event.type].label}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Panel (Drawer) */}
            {selectedEvent && (
                <div
                    className={`fixed right-0 top-0 h-full w-full lg:w-96 bg-black border-l border-white/10 shadow-2xl p-6 transition-transform z-50 transform ${selectedEvent ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white">Edit Event</h2>
                        <button onClick={() => setSelectedEvent(null)} className="p-2 -mr-2 text-gray-400 hover:text-white">✕</button>
                    </div>

                    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-100px)] pb-10">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Title</label>
                            <input
                                type="text"
                                value={selectedEvent.title}
                                onChange={(e) => updateEvent({ ...selectedEvent, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Date / Era</label>
                                <input
                                    type="text"
                                    value={selectedEvent.date}
                                    onChange={(e) => updateEvent({ ...selectedEvent, date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Sort Order</label>
                                <input
                                    type="number"
                                    value={selectedEvent.sortOrder}
                                    onChange={(e) => updateEvent({ ...selectedEvent, sortOrder: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(EVENT_TYPES).map(([key, info]) => (
                                    <button
                                        key={key}
                                        onClick={() => updateEvent({ ...selectedEvent, type: key as any })}
                                        className={`p-2 rounded border text-xs transition-all text-left ${selectedEvent.type === key ? `${info.color} text-black border-transparent font-bold` : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                                    >
                                        {info.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Description</label>
                            <textarea
                                value={selectedEvent.description}
                                onChange={(e) => updateEvent({ ...selectedEvent, description: e.target.value })}
                                rows={6}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500 resize-none"
                            />
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10">
                            <Button onClick={() => deleteEvent(selectedEvent.id)} variant="secondary" className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border-red-500/20">
                                Delete Event
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
