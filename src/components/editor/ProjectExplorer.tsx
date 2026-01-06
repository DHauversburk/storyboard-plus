import React from 'react';
import { FileListSkeleton } from '../ui/Skeleton';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
}

interface ProjectExplorerProps {
    isVisible: boolean;
    isFocusMode: boolean;
    isLoading: boolean;
    driveFiles: DriveFile[];
    activeFileId: string | null;
    currentDriveFolder: string;
    currentFolderName: string;
    driveBreadcrumbs: { id: string, name: string }[];
    onNavigateFolder: (id: string, name: string) => void;
    onSelectFile: (id: string, name: string) => void;
    onLoadFolder: () => void;
    onOpenPicker: () => void;
    onTriggerImport: () => void;

    // Auth
    isConnected: boolean;
    onConnect: () => void;
}

export const ProjectExplorerComponent: React.FC<ProjectExplorerProps> = ({
    isVisible,
    isFocusMode,
    isLoading,
    driveFiles,
    activeFileId,
    currentDriveFolder,
    currentFolderName, // Unused in UI usually but might be needed
    driveBreadcrumbs, // Unused in UI currently? Ah, breadcrumbs are not fully rendered in the snippet I saw, but logic exists.
    onNavigateFolder,
    onSelectFile,
    onLoadFolder,
    onOpenPicker,
    onTriggerImport,
    isConnected,
    onConnect
}) => {
    return (
        <nav
            aria-label="Project navigation"
            className={`flex-shrink-0 bg-gray-900/95 border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out ${!isFocusMode && isVisible ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}
        >
            <div className="px-3 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between text-[11px] min-w-[18rem]">
                <div className="flex items-center gap-2 flex-1 mr-2 overflow-hidden">
                    <button
                        onClick={() => onNavigateFolder('root', 'My Drive')}
                        className="text-gray-400 hover:text-white flex-shrink-0"
                        title="Go to My Drive"
                        aria-label="Navigate to My Drive root folder"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                    </button>
                    <div className="flex-1 truncate text-gray-400 font-mono">
                        {/* Simple Breadcrumb Display */}
                        {driveBreadcrumbs.length > 2
                            ? `... / ${driveBreadcrumbs[driveBreadcrumbs.length - 1].name}`
                            : driveBreadcrumbs.map(b => b.name).join(' / ')
                        }
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onOpenPicker}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Change Project Folder"
                        aria-label="Open folder picker to change project directory"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    </button>
                    <button
                        onClick={() => onNavigateFolder(currentDriveFolder, currentFolderName)} // passing current name logic
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Refresh Folder"
                        aria-label="Refresh current folder contents"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    {currentDriveFolder !== 'root' && (
                        <button
                            onClick={onLoadFolder}
                            className="bg-primary/20 hover:bg-primary/30 text-primary hover:text-white px-2 py-1 rounded transition-colors text-[10px] font-semibold tracking-wide flex items-center gap-1.5 flex-shrink-0 border border-primary/20 ml-1"
                            title="Load all files in this folder"
                            aria-label="Load all files from current folder into editor"
                        >
                            <span>OPEN</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-0.5 min-w-[18rem]">
                {!isConnected ? (
                    <div className="flex flex-col items-center justify-center h-48 p-4 text-center space-y-3" role="status">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl" aria-hidden="true">
                            🔐
                        </div>
                        <div className="text-gray-400 text-xs">
                            Sign in to access your projects.
                        </div>
                        <button
                            onClick={onConnect}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 px-4 rounded shadow-lg transition-all"
                            aria-label="Sign in with Google to access cloud storage"
                        >
                            Sign In with Google
                        </button>
                    </div>
                ) : (
                    <>
                        {isLoading && <FileListSkeleton />}

                        {/* Import Utils */}
                        <div className="px-2 pb-2">
                            <button
                                onClick={onTriggerImport}
                                className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs py-1.5 rounded flex items-center justify-center gap-2 transition-all border border-dashed border-white/10 hover:border-white/20"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Import .docx
                            </button>
                        </div>

                        {!isLoading && driveFiles.map(f => (
                            <button
                                key={f.id}
                                onClick={() => {
                                    if (f.mimeType === 'application/vnd.google-apps.folder') {
                                        onNavigateFolder(f.id, f.name);
                                    } else {
                                        onSelectFile(f.id, f.name);
                                    }
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded hover:bg-white/5 group flex items-center gap-2 transition-all ${activeFileId === f.id ? 'bg-primary/20 hover:bg-primary/30' : ''}`}
                            >
                                <span className="text-base opacity-70 group-hover:opacity-100 transition-all">
                                    {f.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-medium truncate ${activeFileId === f.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                        {f.name}
                                    </div>
                                </div>
                            </button>
                        ))}
                        {!isLoading && driveFiles.length === 0 && (
                            <div className="text-center py-8 text-xs text-gray-600">
                                Empty folder
                            </div>
                        )}
                    </>
                )}
            </div>
        </nav>
    );
};

// Memoize to prevent unnecessary re-renders (especially with large file lists)
const MemoizedProjectExplorer = React.memo(ProjectExplorerComponent);
export { MemoizedProjectExplorer as ProjectExplorer };
