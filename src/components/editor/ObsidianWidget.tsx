"use client";

import React, { useState, useMemo } from 'react';

// Sub-component for Obsidian Widget 
export interface FileNode {
    name: string;
    type: 'file' | 'folder';
    content?: string;
    children?: FileNode[];
    path: string;
}

function buildFileTree(files: { name: string, content: string, path?: string }[]): FileNode[] {
    const root: FileNode[] = [];

    files.forEach(file => {
        // Default to name if path is missing, split by '/'
        const parts = (file.path || file.name).split('/');
        let currentLevel = root;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            let existingNode = currentLevel.find(n => n.name === part && n.type === (isFile ? 'file' : 'folder'));

            if (!existingNode) {
                existingNode = {
                    name: part,
                    type: isFile ? 'file' : 'folder',
                    path: parts.slice(0, index + 1).join('/'),
                    children: isFile ? undefined : [],
                    content: isFile ? file.content : undefined
                };
                // Sort folders first, then files alphabetically
                currentLevel.push(existingNode);
                currentLevel.sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name);
                    return a.type === 'folder' ? -1 : 1;
                });
            }

            if (!isFile && existingNode.children) {
                currentLevel = existingNode.children;
            }
        });
    });

    return root;
}

const FileTreeNode = ({ node, onPreview, depth = 0 }: { node: FileNode, onPreview: (f: { name: string, content: string }) => void, depth?: number }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (node.type === 'file') {
        return (
            <button
                onClick={() => node.content && onPreview({ name: node.name, content: node.content })}
                className="w-full text-left px-2 py-1 rounded hover:bg-white/5 group transition-colors flex items-center gap-2"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                <span className="text-gray-500 group-hover:text-purple-400">📄</span>
                <span className="text-[11px] text-gray-300 group-hover:text-white truncate">{node.name.replace('.md', '')}</span>
            </button>
        );
    }

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-2 py-1 rounded hover:bg-white/5 group transition-colors flex items-center gap-2"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                <span className="text-yellow-500/80 text-[10px] transform transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    ▶
                </span>
                <span className="text-yellow-500/80">📁</span>
                <span className="text-[11px] font-semibold text-gray-400 group-hover:text-white truncate">{node.name}</span>
            </button>
            {isOpen && node.children && (
                <div className="border-l border-white/5 ml-3">
                    {node.children.map(child => (
                        <FileTreeNode key={child.path} node={child} onPreview={onPreview} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export function ObsidianWidget({ files, onConnect, onPreview }: { files: { name: string, content: string, path?: string }[], onConnect: () => void, onPreview: (f: { name: string, content: string }) => void }) {
    const [search, setSearch] = useState("");

    // If searching, show flat list. If not, show Tree.
    const isSearching = search.length > 0;
    const filteredRequest = isSearching
        ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
        : [];

    const fileTree = useMemo(() => buildFileTree(files), [files]);

    return (
        <div className="bg-card rounded-xl border border-white/5 p-4 opacity-75 hover:opacity-100 transition-opacity flex flex-col max-h-[500px]">
            <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <span className="w-4 h-4 text-purple-400">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 3.5L18.5 20H5.5L12 5.5z" /></svg>
                </span>
                Obsidian Link
            </h3>

            {files.length === 0 ? (
                <>
                    <p className="text-xs text-gray-500 mb-3">
                        Connect a local vault to import notes.
                    </p>
                    <button
                        onClick={onConnect}
                        className="w-full py-1.5 border border-dashed border-gray-600 rounded text-xs text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
                    >
                        Select Vault Folder...
                    </button>
                </>
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center text-xs text-green-400 mb-2 flex-shrink-0">
                        <span>● Connected</span>
                        <span className="text-gray-500">{files.length} files</span>
                    </div>

                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder="Search vault..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 placeholder:text-gray-600 mb-2 outline-none focus:border-purple-500/50 transition-colors flex-shrink-0"
                    />

                    <div className="overflow-y-auto custom-scrollbar flex-1 -mr-2 pr-2">
                        {isSearching ? (
                            // Flat List for Search
                            <div className="space-y-1">
                                {filteredRequest.map((file, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onPreview(file)}
                                        className="w-full text-left px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 group transition-colors"
                                    >
                                        <div className="text-[10px] text-gray-300 font-medium truncate group-hover:text-purple-300">
                                            {file.name}
                                        </div>
                                        {file.path && (
                                            <div className="text-[9px] text-gray-600 truncate">
                                                {file.path}
                                            </div>
                                        )}
                                    </button>
                                ))}
                                {filteredRequest.length === 0 && (
                                    <div className="text-center py-4 text-xs text-gray-600">No matches</div>
                                )}
                            </div>
                        ) : (
                            // Tree View for Browsing
                            <div className="space-y-0.5">
                                {fileTree.map(node => (
                                    <FileTreeNode key={node.path} node={node} onPreview={onPreview} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
