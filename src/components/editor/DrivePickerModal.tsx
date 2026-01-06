import React, { useState, useEffect } from 'react';
import { listFilesAndFolders } from '@/lib/googleDrive';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface DrivePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (folderId: string, folderName: string) => void;
    initialFolderId?: string;
}

export function DrivePickerModal({ isOpen, onClose, onSelect, initialFolderId = 'root' }: DrivePickerModalProps) {
    const [currentFolder, setCurrentFolder] = useState<string>(initialFolderId);
    const [folderName, setFolderName] = useState<string>('My Drive');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'My Drive' }]);

    useEffect(() => {
        if (isOpen) {
            loadFolder(currentFolder);
        }
    }, [isOpen, currentFolder]);

    const loadFolder = async (folderId: string) => {
        setLoading(true);
        try {
            const files = await listFilesAndFolders(folderId);
            // Sort: Folders first
            const sorted = files.sort((a: any, b: any) => {
                if (a.mimeType === 'application/vnd.google-apps.folder' && b.mimeType !== 'application/vnd.google-apps.folder') return -1;
                if (a.mimeType !== 'application/vnd.google-apps.folder' && b.mimeType === 'application/vnd.google-apps.folder') return 1;
                return a.name.localeCompare(b.name);
            });
            setItems(sorted);
        } catch (error) {
            console.error("Failed to load folder", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folderId: string, name: string) => {
        setCurrentFolder(folderId);
        setFolderName(name);

        // Update breadcrumbs
        const index = breadcrumbs.findIndex(b => b.id === folderId);
        if (index >= 0) {
            setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        } else {
            setBreadcrumbs([...breadcrumbs, { id: folderId, name }]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl h-[80vh] flex flex-col bg-gray-900 border-gray-800">
                <CardHeader className="border-b border-gray-800 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>Select a Folder</CardTitle>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
                    </div>
                </CardHeader>

                <div className="p-4 border-b border-gray-800 bg-black/20 flex items-center gap-2 overflow-x-auto">
                    {breadcrumbs.map((crumb, idx) => (
                        <div key={crumb.id} className="flex items-center text-sm whitespace-nowrap">
                            {idx > 0 && <span className="mx-2 text-gray-600">/</span>}
                            <button
                                onClick={() => handleNavigate(crumb.id, crumb.name)}
                                className={`hover:text-purple-400 ${crumb.id === currentFolder ? 'text-white' : 'text-gray-400'}`}
                            >
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>

                <CardContent className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
                    ) : items.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">Empty folder</div>
                    ) : (
                        <div className="space-y-1">
                            {items.map((item) => {
                                const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => isFolder ? handleNavigate(item.id, item.name) : null}
                                        disabled={!isFolder}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${isFolder
                                                ? 'hover:bg-white/10 text-gray-200 cursor-pointer'
                                                : 'opacity-50 text-gray-500 cursor-default'
                                            }`}
                                    >
                                        <span className="text-xl">{isFolder ? '📁' : '📄'}</span>
                                        <span className="truncate flex-1">{item.name}</span>
                                        {isFolder && <span className="text-gray-500 text-xs">Folder</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>

                <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-black/20">
                    <div className="text-sm text-gray-400">
                        Current: <span className="text-white font-semibold">{folderName}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={() => onSelect(currentFolder, folderName)}
                        >
                            Select This Folder
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
