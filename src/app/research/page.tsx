"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// --- Types ---
interface ResearchItem {
    id: string;
    title: string;
    type: 'image' | 'link' | 'note' | 'pdf';
    content: string; // URL or text content
    tags: string[];
    category: string; // The "Binder" name
    createdAt: number;
}

// --- Constants ---
const ITEM_TYPES = {
    image: { label: 'Image', icon: '🖼️', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    link: { label: 'Link', icon: '🔗', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
    note: { label: 'Note', icon: '📝', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    pdf: { label: 'PDF', icon: '📄', color: 'bg-red-500/20 text-red-300 border-red-500/30' }
};

export default function ResearchPage() {
    const [items, setItems] = useState<ResearchItem[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [filterType, setFilterType] = useState<string>('All');

    // Form State
    const [newItem, setNewItem] = useState<Partial<ResearchItem>>({
        type: 'note',
        category: 'General',
        tags: []
    });

    // Load Data
    useEffect(() => {
        const saved = localStorage.getItem('sb_research_items');
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load research items", e);
            }
        }
    }, []);

    // Save Data
    useEffect(() => {
        localStorage.setItem('sb_research_items', JSON.stringify(items));
    }, [items]);

    // Helpers
    const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))].sort();

    const filteredItems = items.filter(item => {
        if (filterCategory !== 'All' && item.category !== filterCategory) return false;
        if (filterType !== 'All' && item.type !== filterType) return false;
        return true;
    });

    const handleAddItem = () => {
        if (!newItem.title || !newItem.content) return;

        const item: ResearchItem = {
            id: Date.now().toString(),
            title: newItem.title,
            type: newItem.type as any,
            content: newItem.content,
            category: newItem.category || 'General',
            tags: newItem.tags || [],
            createdAt: Date.now()
        };

        setItems([item, ...items]);
        setIsAdding(false);
        setNewItem({ type: 'note', category: 'General', tags: [] });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0f12] text-gray-200 p-8 font-sans">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Research Binders
                    </h1>
                    <p className="text-gray-400 mt-1">Organize your world-building assets, references, and inspirations.</p>
                </div>
                <Button variant="primary" onClick={() => setIsAdding(true)}>
                    + Add Resource
                </Button>
            </header>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
                {/* Detailed Category Filter usually goes in sidebar, but top bar is fine for now */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <span className="text-xs font-bold text-gray-500 uppercase mr-2">Binders:</span>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterCategory === cat
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <Card key={item.id} className="group hover:border-blue-500/30 transition-all flex flex-col h-full">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${ITEM_TYPES[item.type].color}`}>
                                    {ITEM_TYPES[item.type].icon} {ITEM_TYPES[item.type].label}
                                </div>
                                <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ×
                                </button>
                            </div>
                            <CardTitle className="text-lg leading-tight mt-2">{item.title}</CardTitle>
                            <div className="text-xs text-gray-500 mt-1">{item.category}</div>
                        </CardHeader>

                        <CardContent className="flex-1 min-h-[150px] flex flex-col">
                            {/* Preview Area */}
                            <div className="flex-1 bg-black/20 rounded-lg p-2 mb-3 overflow-hidden border border-white/5 relative">
                                {item.type === 'image' ? (
                                    <div className="w-full h-40 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${item.content})` }} />
                                ) : item.type === 'note' ? (
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.content}</p>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                                        <div className="text-4xl opacity-50">{ITEM_TYPES[item.type].icon}</div>
                                        <a
                                            href={item.content}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-400 hover:underline truncate max-w-full px-4"
                                        >
                                            {item.content}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between text-[10px] text-gray-600">
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                <div className="flex gap-1">
                                    {item.tags?.map(tag => (
                                        <span key={tag} className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <div className="text-6xl mb-4">🗂️</div>
                    <h2 className="text-xl font-semibold">No items found</h2>
                    <p className="text-sm mt-2">Create a new binder entry to get started.</p>
                </div>
            )}

            {/* Add Item Modal (Simple overlay for now) */}
            {isAdding && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Add Resource</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold">Title</label>
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                    value={newItem.title || ''}
                                    onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                    placeholder="e.g. Victorian Mansion Reference"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs uppercase text-gray-500 font-bold">Type</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                        value={newItem.type}
                                        onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}
                                    >
                                        <option value="note">Note</option>
                                        <option value="image">Image URL</option>
                                        <option value="link">Web Link</option>
                                        <option value="pdf">PDF Link</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase text-gray-500 font-bold">Binder (Category)</label>
                                    <input
                                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                        value={newItem.category || ''}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                        list="category-suggestions"
                                    />
                                    <datalist id="category-suggestions">
                                        {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold">Content / URL</label>
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500 min-h-[100px]"
                                    value={newItem.content || ''}
                                    onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                                    placeholder={newItem.type === 'note' ? "Type your notes directly..." : "https://example.com/image.jpg"}
                                />
                            </div>

                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold">Tags (comma separated)</label>
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                    placeholder="history, architecture, idea"
                                    onBlur={e => setNewItem({ ...newItem, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 justify-end">
                            <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleAddItem}>Create Asset</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
