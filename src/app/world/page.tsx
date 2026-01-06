"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getWorldEntriesFromObsidian, ParsedWorldEntry } from '@/lib/obsidianCodex';

interface WorldEntry {
    id: string;
    name: string;
    category: 'location' | 'culture' | 'magic' | 'technology' | 'history' | 'creature' | 'organization' | 'item' | 'other';
    description: string;
    details: { label: string; value: string }[];
    connections: { entryId: string; relationship: string }[];
    tags: string[];
    notes: string;
    imageUrl?: string;
    source?: 'obsidian' | 'local';
    sourcePath?: string;
}

const CATEGORY_CONFIG = {
    location: { label: 'Location', icon: '🏰', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
    culture: { label: 'Culture', icon: '🎭', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30' },
    magic: { label: 'Magic System', icon: '✨', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
    technology: { label: 'Technology', icon: '⚙️', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
    history: { label: 'History', icon: '📜', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30' },
    creature: { label: 'Creature', icon: '🐉', color: 'from-red-500/20 to-red-600/10 border-red-500/30' },
    organization: { label: 'Organization', icon: '👥', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' },
    item: { label: 'Item', icon: '⚔️', color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30' },
    other: { label: 'Other', icon: '📌', color: 'from-gray-500/20 to-gray-600/10 border-gray-500/30' }
};

export default function WorldBiblePage() {
    const [entries, setEntries] = useState<WorldEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<WorldEntry | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<'all' | 'obsidian' | 'local'>('all');

    // Load from localStorage and merge with Obsidian entries
    useEffect(() => {
        const loadEntries = () => {
            // Load local entries
            const saved = localStorage.getItem('sb_world_bible');
            const localEntries: WorldEntry[] = saved ? JSON.parse(saved) : [];

            // Load Obsidian entries
            const obsidianEntries = getWorldEntriesFromObsidian() as WorldEntry[];

            // Merge: local entries take priority (by ID), then add Obsidian ones
            const localIds = new Set(localEntries.map(e => e.id));
            const merged = [
                ...localEntries,
                ...obsidianEntries.filter(e => !localIds.has(e.id))
            ];

            setEntries(merged);
        };

        loadEntries();

        // Listen for Obsidian file updates
        const handleObsidianUpdate = () => loadEntries();
        window.addEventListener('obsidian-files-updated', handleObsidianUpdate);
        return () => window.removeEventListener('obsidian-files-updated', handleObsidianUpdate);
    }, []);

    // Save ONLY local entries to localStorage
    useEffect(() => {
        const localOnly = entries.filter(e => e.source !== 'obsidian');
        localStorage.setItem('sb_world_bible', JSON.stringify(localOnly));
    }, [entries]);

    const createNewEntry = () => {
        const newEntry: WorldEntry = {
            id: Date.now().toString(),
            name: 'New Entry',
            category: 'location',
            description: '',
            details: [],
            connections: [],
            tags: [],
            notes: ''
        };
        setEntries([...entries, newEntry]);
        setSelectedEntry(newEntry);
        setIsEditing(true);
    };

    const updateEntry = (updated: WorldEntry) => {
        setEntries(entries.map(e => e.id === updated.id ? updated : e));
        setSelectedEntry(updated);
    };

    const deleteEntry = (id: string) => {
        if (confirm('Delete this world entry?')) {
            setEntries(entries.filter(e => e.id !== id));
            setSelectedEntry(null);
        }
    };

    const filteredEntries = entries.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
        const matchesSource = filterSource === 'all' ||
            (filterSource === 'obsidian' && e.source === 'obsidian') ||
            (filterSource === 'local' && e.source !== 'obsidian');
        return matchesSearch && matchesCategory && matchesSource;
    });

    const obsidianCount = entries.filter(e => e.source === 'obsidian').length;
    const localCount = entries.filter(e => e.source !== 'obsidian').length;

    // Group entries by category
    const groupedEntries = filteredEntries.reduce((acc, entry) => {
        if (!acc[entry.category]) acc[entry.category] = [];
        acc[entry.category].push(entry);
        return acc;
    }, {} as Record<string, WorldEntry[]>);

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6 p-8 max-w-[1800px] mx-auto">
            {/* Left Panel - Entry List */}
            <div className="w-80 flex flex-col gap-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">World Bible</h1>
                    <Button onClick={createNewEntry} variant="primary" className="px-3 py-2">
                        + New
                    </Button>
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search world entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50"
                />

                {/* Category Filter */}
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => setFilterCategory('all')}
                        className={`px-2 py-1 text-[10px] uppercase rounded transition-colors ${filterCategory === 'all'
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        All
                    </button>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setFilterCategory(key)}
                            className={`px-2 py-1 text-[10px] rounded transition-colors ${filterCategory === key
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                            title={config.label}
                        >
                            {config.icon}
                        </button>
                    ))}
                </div>

                {/* Source Filter */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setFilterSource('all')}
                        className={`flex-1 py-1 text-[10px] rounded transition-colors ${filterSource === 'all'
                            ? 'bg-gray-600 text-white'
                            : 'bg-white/5 text-gray-500 hover:bg-white/10'
                            }`}
                    >
                        All ({entries.length})
                    </button>
                    <button
                        onClick={() => setFilterSource('obsidian')}
                        title="Entries imported from your Obsidian vault"
                        className={`flex-1 py-1 text-[10px] rounded transition-colors flex items-center justify-center gap-1 ${filterSource === 'obsidian'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-gray-500 hover:bg-white/10'
                            }`}
                    >
                        <span>🔮</span> Vault ({obsidianCount})
                    </button>
                    <button
                        onClick={() => setFilterSource('local')}
                        title="Entries created directly in StoryBoard Plus"
                        className={`flex-1 py-1 text-[10px] rounded transition-colors flex items-center justify-center gap-1 ${filterSource === 'local'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/5 text-gray-500 hover:bg-white/10'
                            }`}
                    >
                        <span>✏️</span> Local ({localCount})
                    </button>
                </div>

                {/* Entry List - Grouped */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                    {Object.keys(groupedEntries).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">🌍</div>
                            <p className="text-sm">No world entries yet</p>
                            <p className="text-xs">Click "+ New" to create one</p>
                        </div>
                    ) : (
                        Object.entries(groupedEntries).map(([category, categoryEntries]) => (
                            <div key={category}>
                                <div className="text-[10px] uppercase text-gray-500 font-bold mb-2 flex items-center gap-2">
                                    <span>{CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].icon}</span>
                                    <span>{CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].label}</span>
                                    <span className="text-gray-600">({categoryEntries.length})</span>
                                </div>
                                <div className="space-y-1">
                                    {categoryEntries.map(entry => (
                                        <button
                                            key={entry.id}
                                            onClick={() => { setSelectedEntry(entry); setIsEditing(false); }}
                                            className={`w-full text-left p-2 rounded-lg border transition-all ${selectedEntry?.id === entry.id
                                                ? 'bg-white/10 border-purple-500/50'
                                                : `bg-gradient-to-br ${CATEGORY_CONFIG[entry.category].color} hover:bg-white/5`
                                                }`}
                                        >
                                            <div className="font-semibold text-white text-sm truncate">{entry.name}</div>
                                            {entry.tags.length > 0 && (
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {entry.tags.slice(0, 3).map((tag, i) => (
                                                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded text-gray-400">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {entry.tags.length > 3 && (
                                                        <span className="text-[9px] text-gray-500">+{entry.tags.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Stats */}
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-2">World Stats</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div className="text-lg font-bold text-white">{entries.length}</div>
                            <div className="text-[9px] text-gray-500">Entries</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white">{new Set(entries.map(e => e.category)).size}</div>
                            <div className="text-[9px] text-gray-500">Categories</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white">{entries.reduce((acc, e) => acc + e.connections.length, 0)}</div>
                            <div className="text-[9px] text-gray-500">Connections</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Entry Detail */}
            <div className="flex-1 overflow-y-auto">
                {!selectedEntry ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <div className="text-6xl mb-4">🌍</div>
                            <h2 className="text-xl font-semibold text-gray-300">Select a World Entry</h2>
                            <p className="text-sm mt-2">Choose from the list or create a new entry</p>
                        </div>
                    </div>
                ) : isEditing ? (
                    <WorldEntryEditor
                        entry={selectedEntry}
                        allEntries={entries}
                        onSave={(updated) => { updateEntry(updated); setIsEditing(false); }}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <WorldEntryView
                        entry={selectedEntry}
                        allEntries={entries}
                        onEdit={() => setIsEditing(true)}
                        onDelete={() => deleteEntry(selectedEntry.id)}
                    />
                )}
            </div>
        </div>
    );
}

// World Entry View Component
function WorldEntryView({ entry, allEntries, onEdit, onDelete }: {
    entry: WorldEntry;
    allEntries: WorldEntry[];
    onEdit: () => void;
    onDelete: () => void;
}) {
    const config = CATEGORY_CONFIG[entry.category];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`p-6 rounded-2xl bg-gradient-to-br ${config.color} border`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl border-2 border-white/20">
                            {config.icon}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{entry.name}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{config.label}</span>
                                {entry.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onEdit}>Edit</Button>
                        <Button variant="secondary" onClick={onDelete} className="text-red-400 hover:text-red-300">Delete</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Description */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {entry.description || <span className="text-gray-600 italic">No description yet...</span>}
                        </p>
                    </CardContent>
                </Card>

                {/* Details */}
                {entry.details.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                        <CardContent>
                            <dl className="space-y-3">
                                {entry.details.map((detail, i) => (
                                    <div key={i} className="flex flex-col">
                                        <dt className="text-xs text-gray-500 uppercase tracking-wide">{detail.label}</dt>
                                        <dd className="text-gray-300">{detail.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>
                )}

                {/* Connections */}
                {entry.connections.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Connections</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {entry.connections.map((conn, i) => {
                                    const other = allEntries.find(e => e.id === conn.entryId);
                                    if (!other) return null;
                                    return (
                                        <div key={i} className="p-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3">
                                            <span className="text-xl">{CATEGORY_CONFIG[other.category].icon}</span>
                                            <div>
                                                <div className="font-semibold text-white text-sm">{other.name}</div>
                                                <div className="text-xs text-gray-400">{conn.relationship}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notes */}
                {entry.notes && (
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

// World Entry Editor Component
function WorldEntryEditor({ entry, allEntries, onSave, onCancel }: {
    entry: WorldEntry;
    allEntries: WorldEntry[];
    onSave: (e: WorldEntry) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState(entry);
    const [newTag, setNewTag] = useState('');
    const [newDetailLabel, setNewDetailLabel] = useState('');
    const [newDetailValue, setNewDetailValue] = useState('');

    const addTag = () => {
        if (newTag.trim() && !form.tags.includes(newTag.trim())) {
            setForm({ ...form, tags: [...form.tags, newTag.trim()] });
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
    };

    const addDetail = () => {
        if (newDetailLabel.trim() && newDetailValue.trim()) {
            setForm({ ...form, details: [...form.details, { label: newDetailLabel.trim(), value: newDetailValue.trim() }] });
            setNewDetailLabel('');
            setNewDetailValue('');
        }
    };

    const removeDetail = (index: number) => {
        setForm({ ...form, details: form.details.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Edit World Entry</h1>
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
                            <label className="block text-xs text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Category</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value as WorldEntry['category'] })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50"
                            >
                                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.icon} {config.label}</option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                    <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                placeholder="Add a tag..."
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                            />
                            <Button variant="secondary" onClick={addTag}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.tags.map((tag, i) => (
                                <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-white">×</button>
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                    <CardContent>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe this world element..."
                            rows={6}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 resize-none"
                        />
                    </CardContent>
                </Card>

                {/* Custom Details */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Custom Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newDetailLabel}
                                onChange={(e) => setNewDetailLabel(e.target.value)}
                                placeholder="Label (e.g., Population)"
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                            />
                            <input
                                type="text"
                                value={newDetailValue}
                                onChange={(e) => setNewDetailValue(e.target.value)}
                                placeholder="Value (e.g., 50,000)"
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                            />
                            <Button variant="secondary" onClick={addDetail}>Add</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {form.details.map((detail, i) => (
                                <div key={i} className="p-2 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-gray-500">{detail.label}</div>
                                        <div className="text-sm text-white">{detail.value}</div>
                                    </div>
                                    <button onClick={() => removeDetail(i)} className="text-red-400 hover:text-red-300">×</button>
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
