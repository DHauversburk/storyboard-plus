"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getCharactersFromObsidian, ParsedCharacter } from '@/lib/obsidianCodex';

interface Character {
    id: string;
    name: string;
    role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
    archetype: string;
    description: string;
    traits: string[];
    goals: string;
    flaws: string;
    psychology?: string;
    voice?: string;
    relationships: { characterId: string; relationship: string }[];
    notes: string;
    imageUrl?: string;
    color?: string; // Custom theme color
    source?: 'obsidian' | 'local';
    sourcePath?: string;
}

const ROLE_COLORS = {
    protagonist: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    antagonist: 'from-red-500/20 to-red-600/10 border-red-500/30',
    supporting: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    minor: 'from-gray-500/20 to-gray-600/10 border-gray-500/30'
};

const ROLE_LABELS = {
    protagonist: { label: 'Protagonist', icon: '⭐', desc: 'The main character driving the story forward. Readers experience the plot through their eyes.' },
    antagonist: { label: 'Antagonist', icon: '💀', desc: 'The opposing force creating conflict. Not always a villain—can be a rival, nature, or society.' },
    supporting: { label: 'Supporting', icon: '🤝', desc: 'Characters who help or hinder the protagonist. They have their own goals and arcs.' },
    minor: { label: 'Minor', icon: '👤', desc: 'Background characters who add depth and realism. They appear briefly but serve a purpose.' }
};

const ARCHETYPES = [
    'The Hero', 'The Mentor', 'The Threshold Guardian', 'The Herald',
    'The Shapeshifter', 'The Shadow', 'The Ally', 'The Trickster',
    'The Innocent', 'The Orphan', 'The Warrior', 'The Caregiver',
    'The Seeker', 'The Destroyer', 'The Lover', 'The Creator',
    'The Ruler', 'The Magician', 'The Sage', 'The Jester'
];

export default function CharactersPage() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<'all' | 'obsidian' | 'local'>('all');

    // Load from localStorage and merge with Obsidian characters
    useEffect(() => {
        const loadCharacters = () => {
            // Load local characters
            const saved = localStorage.getItem('sb_characters');
            const localChars: Character[] = saved ? JSON.parse(saved) : [];

            // Load Obsidian characters
            const obsidianChars = getCharactersFromObsidian() as Character[];

            // Merge: local characters take priority (by ID), then add Obsidian ones
            const localIds = new Set(localChars.map(c => c.id));
            const merged = [
                ...localChars,
                ...obsidianChars.filter(c => !localIds.has(c.id))
            ];

            setCharacters(merged);
        };

        loadCharacters();

        // Listen for Obsidian file updates
        const handleObsidianUpdate = () => loadCharacters();
        window.addEventListener('obsidian-files-updated', handleObsidianUpdate);
        return () => window.removeEventListener('obsidian-files-updated', handleObsidianUpdate);
    }, []);

    // Save ONLY local characters to localStorage
    useEffect(() => {
        const localOnly = characters.filter(c => c.source !== 'obsidian');
        localStorage.setItem('sb_characters', JSON.stringify(localOnly));
    }, [characters]);

    const createNewCharacter = () => {
        const newChar: Character = {
            id: Date.now().toString(),
            name: 'New Character',
            role: 'supporting',
            archetype: 'The Hero',
            description: '',
            traits: [],
            goals: '',
            flaws: '',
            psychology: '',
            voice: '',
            relationships: [],
            notes: '',
            color: '#3b82f6' // Default blue
        };
        setCharacters([...characters, newChar]);
        setSelectedCharacter(newChar);
        setIsEditing(true);
    };

    const updateCharacter = (updated: Character) => {
        setCharacters(characters.map(c => c.id === updated.id ? updated : c));
        setSelectedCharacter(updated);
    };

    const deleteCharacter = (id: string) => {
        if (confirm('Delete this character?')) {
            setCharacters(characters.filter(c => c.id !== id));
            setSelectedCharacter(null);
        }
    };

    const filteredCharacters = characters.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || c.role === filterRole;
        const matchesSource = filterSource === 'all' ||
            (filterSource === 'obsidian' && c.source === 'obsidian') ||
            (filterSource === 'local' && c.source !== 'obsidian');
        return matchesSearch && matchesRole && matchesSource;
    });

    const obsidianCount = characters.filter(c => c.source === 'obsidian').length;
    const localCount = characters.filter(c => c.source !== 'obsidian').length;

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6 p-8 max-w-[1800px] mx-auto">
            {/* Left Panel - Character List */}
            <div className="w-80 flex flex-col gap-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Characters</h1>
                    <Button onClick={createNewCharacter} variant="primary" className="px-3 py-2">
                        + New
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="Search characters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50"
                    />
                    <div className="flex gap-1">
                        {['all', 'protagonist', 'antagonist', 'supporting', 'minor'].map(role => {
                            const roleInfo = role === 'all' ? null : ROLE_LABELS[role as keyof typeof ROLE_LABELS];
                            const tooltip = role === 'all'
                                ? 'Show all characters'
                                : `${roleInfo?.label}: ${roleInfo?.desc}`;
                            return (
                                <button
                                    key={role}
                                    onClick={() => setFilterRole(role)}
                                    title={tooltip}
                                    className={`flex-1 py-1 text-[10px] uppercase rounded transition-colors cursor-help ${filterRole === role
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {role === 'all' ? 'All' : role.slice(0, 4)}
                                </button>
                            );
                        })}
                    </div>
                    {/* Source Filter */}
                    <div className="flex gap-1 pt-1">
                        <button
                            onClick={() => setFilterSource('all')}
                            className={`flex-1 py-1 text-[10px] rounded transition-colors ${filterSource === 'all'
                                ? 'bg-gray-600 text-white'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                }`}
                        >
                            All ({characters.length})
                        </button>
                        <button
                            onClick={() => setFilterSource('obsidian')}
                            title="Characters imported from your Obsidian vault"
                            className={`flex-1 py-1 text-[10px] rounded transition-colors flex items-center justify-center gap-1 ${filterSource === 'obsidian'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                }`}
                        >
                            <span>🔮</span> Vault ({obsidianCount})
                        </button>
                        <button
                            onClick={() => setFilterSource('local')}
                            title="Characters created directly in StoryBoard Plus"
                            className={`flex-1 py-1 text-[10px] rounded transition-colors flex items-center justify-center gap-1 ${filterSource === 'local'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                }`}
                        >
                            <span>✏️</span> Local ({localCount})
                        </button>
                    </div>
                </div>

                {/* Character Cards */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredCharacters.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">👤</div>
                            <p className="text-sm">No characters yet</p>
                            <p className="text-xs">Click "+ New" to create one</p>
                        </div>
                    ) : (
                        filteredCharacters.map(char => (
                            <button
                                key={char.id}
                                onClick={() => { setSelectedCharacter(char); setIsEditing(false); }}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedCharacter?.id === char.id
                                    ? 'bg-white/10 border-purple-500/50 shadow-lg'
                                    : `bg-gradient-to-br ${ROLE_COLORS[char.role]} hover:bg-white/5`
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
                                        {ROLE_LABELS[char.role].icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-white truncate">{char.name}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                            {ROLE_LABELS[char.role].label} • {char.archetype}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Character Detail */}
            <div className="flex-1 overflow-y-auto">
                {!selectedCharacter ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <div className="text-6xl mb-4">🎭</div>
                            <h2 className="text-xl font-semibold text-gray-300">Select a Character</h2>
                            <p className="text-sm mt-2">Choose from the list or create a new character</p>
                        </div>
                    </div>
                ) : isEditing ? (
                    <CharacterEditor
                        character={selectedCharacter}
                        allCharacters={characters}
                        onSave={(updated) => { updateCharacter(updated); setIsEditing(false); }}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <CharacterView
                        character={selectedCharacter}
                        allCharacters={characters}
                        onEdit={() => setIsEditing(true)}
                        onDelete={() => deleteCharacter(selectedCharacter.id)}
                    />
                )}
            </div>
        </div>
    );
}

// Character View Component
function CharacterView({ character, allCharacters, onEdit, onDelete }: {
    character: Character;
    allCharacters: Character[];
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div
                className={`p-6 rounded-2xl border transition-all ${!character.color ? `bg-gradient-to-br ${ROLE_COLORS[character.role]}` : 'bg-white/5 border-white/10'}`}
                style={character.color ? {
                    background: `linear-gradient(135deg, ${character.color}40, ${character.color}10)`,
                    borderColor: `${character.color}50`
                } : undefined}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl border-2 border-white/20">
                            {ROLE_LABELS[character.role].icon}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{character.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{ROLE_LABELS[character.role].label}</span>
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{character.archetype}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onEdit}>Edit</Button>
                        <Button variant="secondary" onClick={onDelete} className="text-red-400 hover:text-red-300">Delete</Button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Description */}
                <Card>
                    <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-gray-300 leading-relaxed">{character.description || <span className="text-gray-600 italic">No description yet...</span>}</p>
                    </CardContent>
                </Card>

                {/* Traits */}
                <Card>
                    <CardHeader><CardTitle>Character Traits</CardTitle></CardHeader>
                    <CardContent>
                        {character.traits.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {character.traits.map((trait, i) => (
                                    <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">{trait}</span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 italic">No traits defined...</p>
                        )}
                    </CardContent>
                </Card>

                {/* Goals */}
                <Card>
                    <CardHeader><CardTitle>Goals & Motivations</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-gray-300 leading-relaxed">{character.goals || <span className="text-gray-600 italic">No goals defined...</span>}</p>
                    </CardContent>
                </Card>

                {/* Flaws */}
                <Card>
                    <CardHeader><CardTitle>Flaws & Weaknesses</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-gray-300 leading-relaxed">{character.flaws || <span className="text-gray-600 italic">No flaws defined...</span>}</p>
                    </CardContent>
                </Card>

                {/* Relationships */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Relationships</CardTitle></CardHeader>
                    <CardContent>
                        {character.relationships.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {character.relationships.map((rel, i) => {
                                    const other = allCharacters.find(c => c.id === rel.characterId);
                                    return (
                                        <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                            <div className="font-semibold text-white">{other?.name || 'Unknown'}</div>
                                            <div className="text-sm text-gray-400">{rel.relationship}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-600 italic">No relationships defined...</p>
                        )}
                    </CardContent>
                </Card>

                {/* Psychology & Voice */}
                {(character.psychology || character.voice) && (
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Psychology & Voice</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {character.psychology && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Psychology</h4>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{character.psychology}</p>
                                </div>
                            )}
                            {character.voice && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Voice & Dialogue</h4>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{character.voice}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Notes */}
                {character.notes && (
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{character.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

// Character Editor Component
function CharacterEditor({ character, allCharacters, onSave, onCancel }: {
    character: Character;
    allCharacters: Character[];
    onSave: (char: Character) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState(character);
    const [activeTab, setActiveTab] = useState<'general' | 'depth' | 'relationships' | 'notes'>('general');
    const [newTrait, setNewTrait] = useState('');

    // Relationship State
    const [relCharId, setRelCharId] = useState('');
    const [relType, setRelType] = useState('');

    const addTrait = () => {
        if (newTrait.trim()) {
            setForm({ ...form, traits: [...form.traits, newTrait.trim()] });
            setNewTrait('');
        }
    };

    const removeTrait = (index: number) => {
        setForm({ ...form, traits: form.traits.filter((_, i) => i !== index) });
    };

    const addRelationship = () => {
        if (relCharId && relType) {
            setForm({
                ...form,
                relationships: [
                    ...form.relationships,
                    { characterId: relCharId, relationship: relType }
                ]
            });
            setRelCharId('');
            setRelType('');
        }
    };

    const removeRelationship = (index: number) => {
        setForm({ ...form, relationships: form.relationships.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Edit Character</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" onClick={() => onSave(form)}>Save</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 gap-1 overflow-x-auto">
                {['general', 'depth', 'relationships', 'notes'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="pt-2">
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-bold outline-none focus:border-purple-500/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Role</label>
                                        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50">
                                            <option value="protagonist">Protagonist</option>
                                            <option value="antagonist">Antagonist</option>
                                            <option value="supporting">Supporting</option>
                                            <option value="minor">Minor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Archetype</label>
                                        <select value={form.archetype} onChange={e => setForm({ ...form, archetype: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50">
                                            {ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Theme Color</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative overflow-hidden w-10 h-10 rounded-full border border-white/20">
                                            <input type="color" value={form.color || '#3b82f6'} onChange={e => setForm({ ...form, color: e.target.value })} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0" />
                                        </div>
                                        <span className="text-xs font-mono text-gray-500">{form.color || '#3b82f6'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card>
                            <CardHeader><CardTitle>Appearance & Background</CardTitle></CardHeader>
                            <CardContent>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={8} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 resize-none" placeholder="Physical description, age, origin..." />
                            </CardContent>
                        </Card>

                        {/* Traits */}
                        <Card className="lg:col-span-2">
                            <CardHeader><CardTitle>Traits</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-3">
                                    <input type="text" value={newTrait} onChange={e => setNewTrait(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTrait()} className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50" placeholder="Add a trait (e.g. Brave, Cynical)..." />
                                    <Button variant="secondary" onClick={addTrait}>Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {form.traits.map((t, i) => (
                                        <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2">
                                            {t}
                                            <button onClick={() => removeTrait(i)} className="hover:text-white ml-1 font-bold">×</button>
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'depth' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Goals & Motivations</CardTitle></CardHeader>
                            <CardContent>
                                <textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} rows={5} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50 resize-none" placeholder="What drives them? What do they want most?" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Flaws & Weaknesses</CardTitle></CardHeader>
                            <CardContent>
                                <textarea value={form.flaws} onChange={e => setForm({ ...form, flaws: e.target.value })} rows={5} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50 resize-none" placeholder="What holds them back? What is their fatal flaw?" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Psychology</CardTitle></CardHeader>
                            <CardContent>
                                <textarea value={form.psychology || ''} onChange={e => setForm({ ...form, psychology: e.target.value })} rows={5} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50 resize-none" placeholder="Fears, beliefs, inner conflicts, mental state..." />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Voice & Dialogue</CardTitle></CardHeader>
                            <CardContent>
                                <textarea value={form.voice || ''} onChange={e => setForm({ ...form, voice: e.target.value })} rows={5} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50 resize-none" placeholder="Speech patterns, catchphrases, tone, accent..." />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'relationships' && (
                    <Card>
                        <CardHeader><CardTitle>Relationships</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Add Relationship</h4>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-400 mb-1">Character</label>
                                        <select value={relCharId} onChange={e => setRelCharId(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50">
                                            <option value="">Select Character...</option>
                                            {allCharacters.filter(c => c.id !== character.id).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-400 mb-1">Relationship Type</label>
                                        <input type="text" value={relType} onChange={e => setRelType(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50" placeholder="e.g. Rival, Sibling, Friend..." />
                                    </div>
                                    <Button variant="secondary" onClick={addRelationship}>Add</Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase">Existing Relationships</h4>
                                {form.relationships.length === 0 ? (
                                    <p className="text-sm text-gray-600 italic">No relationships defined.</p>
                                ) : (
                                    form.relationships.map((rel, i) => {
                                        const other = allCharacters.find(c => c.id === rel.characterId);
                                        return (
                                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10 group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                                                        {other ? ROLE_LABELS[other.role].icon : '?'}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-white block leading-tight">{other?.name || 'Unknown'}</span>
                                                        <span className="text-xs text-purple-300">{rel.relationship}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeRelationship(i)} className="text-gray-500 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity p-2">Remove</button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'notes' && (
                    <Card>
                        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                        <CardContent>
                            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={15} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-purple-500/50 resize-none font-mono text-sm" placeholder="Private notes..." />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
