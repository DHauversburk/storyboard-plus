"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { saveDraft, getDraft } from '@/lib/db';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useDictation } from '@/lib/hooks/useDictation';
import { useSessionRecovery } from '@/lib/hooks/useSessionRecovery';
import { useEditorHistory } from '@/lib/hooks/useEditorHistory';
import { useWritingStreak } from '@/lib/hooks/useWritingStreak';
import { checkGrammarAndMechanics, GrammarIssue } from '@/lib/grammar';
import { getDriveConfig, loadGoogleScripts, initializeGoogleApi, handleGoogleLogin, listFilesAndFolders, readDocumentContent, createDocument } from '@/lib/googleDrive';
import { GENRE_PROFILES, GenreType, BenchmarkResult } from '@/lib/analysis';
import { ObsidianWidget } from './ObsidianWidget';
import { saveObsidianFiles, loadObsidianFiles, ObsidianFile } from '@/lib/obsidianCodex';
import { ProjectExplorer } from './ProjectExplorer';
import { EditorHeader } from './EditorHeader';
import { StartScreen } from './StartScreen';
import { OnboardingModal } from './OnboardingModal';
import { DrivePickerModal } from './DrivePickerModal';
import { CommandPalette } from './CommandPalette';
import { StreakWidget } from './StreakWidget';
import { useAnalysis } from './useAnalysis';
import { generateExport, downloadBlob } from '@/lib/simpleExporter';
import { exportDocumentAsDocx, type DocxHeaderOptions, type FrontMatterOptions, type PageOptions } from '@/lib/exporter';

interface SmartEditorProps {
    initialContent?: string;
    sceneId?: string;
}

export function SmartEditor({ initialContent = "", sceneId }: SmartEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [notes, setNotes] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [detectedEntities, setDetectedEntities] = useState<string[]>([]);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'loading' | 'offline' | 'unsaved'>('loading');
    const [draftId, setDraftId] = useState(sceneId || uuidv4());
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [driveFiles, setDriveFiles] = useState<any[]>([]);
    const [showDrivePicker, setShowDrivePicker] = useState(false);
    const [currentDriveFolder, setCurrentDriveFolder] = useState('root');
    const [currentFolderName, setCurrentFolderName] = useState('My Drive'); // New state for folder name
    const [activeFileName, setActiveFileName] = useState<string | null>(null); // New state for file name
    const [driveBreadcrumbs, setDriveBreadcrumbs] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'My Drive' }]);
    const [showStartScreen, setShowStartScreen] = useState(!initialContent);

    // Debounce content and notes
    const debouncedContent = useDebounce(content, 1500);
    const debouncedNotes = useDebounce(notes, 1500);

    // New Features: Session Recovery, History, Streak
    const { addToHistory, undo, redo, canUndo, canRedo } = useEditorHistory(initialContent);
    const { streak, recordWriting } = useWritingStreak();

    // Session recovery
    useSessionRecovery(content, activeFileName, (data) => {
        setContent(data.content);
        setActiveFileName(data.fileName);
        setSaveStatus('unsaved');
    });

    // Listen for undo/redo events from keyboard shortcuts
    useEffect(() => {
        const handleUndo = (e: CustomEvent) => {
            if (editorRef.current) {
                editorRef.current.innerHTML = e.detail.content;
                setContent(e.detail.content);
            }
        };
        const handleRedo = (e: CustomEvent) => {
            if (editorRef.current) {
                editorRef.current.innerHTML = e.detail.content;
                setContent(e.detail.content);
            }
        };

        window.addEventListener('editor:undo' as any, handleUndo as EventListener);
        window.addEventListener('editor:redo' as any, handleRedo as EventListener);

        return () => {
            window.removeEventListener('editor:undo' as any, handleUndo as EventListener);
            window.removeEventListener('editor:redo' as any, handleRedo as EventListener);
        };
    }, []);

    // Add to history when content changes (debounced)
    useEffect(() => {
        if (debouncedContent && !isLoading) {
            addToHistory(debouncedContent);
        }
    }, [debouncedContent, isLoading, addToHistory]);

    // Initial Google Setup
    useEffect(() => {
        loadGoogleScripts().then(async () => {
            const { apiKey, clientId } = getDriveConfig();
            if (apiKey && clientId) {
                try {
                    await initializeGoogleApi(apiKey, clientId);
                    // If we are initialized, we are "ready" to connect, but not necessarily signed in.
                } catch (err) {
                    console.warn("Failed to init Google API", err);
                }
            }
        });
    }, []);

    const handleDriveConnect = () => {
        const { apiKey, clientId } = getDriveConfig();
        if (!apiKey || !clientId) {
            alert("Please configure Google API Keys in Settings first!");
            return;
        }

        try {
            // Force re-auth to get new scopes if we changed them
            handleGoogleLogin();
            setIsGoogleConnected(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenFromDrive = async () => {
        if (!isGoogleConnected) return;
        setIsLoading(true);

        let startFolderId = 'root';
        let startFolderName = 'My Drive';

        try {
            const saved = localStorage.getItem('last_drive_folder');
            if (saved) {
                const parsed = JSON.parse(saved);
                startFolderId = parsed.id;
                startFolderName = parsed.name;
            }
        } catch (e) {
            console.warn("Failed to parse saved folder", e);
        }

        setCurrentFolderName(startFolderName); // Set initial folder name
        // ... rest of init logic checks breadcrumbs ...

        if (startFolderId !== 'root') {
            setDriveBreadcrumbs([{ id: 'root', name: 'My Drive' }, { id: startFolderId, name: startFolderName }]);
        } else {
            setDriveBreadcrumbs([{ id: 'root', name: 'My Drive' }]);
        }

        const files = await listFilesAndFolders(startFolderId);
        setDriveFiles(files || []);
        setCurrentDriveFolder(startFolderId);
        setIsLoading(false);
        setShowStructure(true); // Open the Sidebar instead of Modal
    };

    const handleNavigateFolder = async (folderId: string, folderName: string) => {
        setIsLoading(true);
        const files = await listFilesAndFolders(folderId);
        setDriveFiles(files || []);

        setCurrentFolderName(folderName); // Update title

        // Save logic
        localStorage.setItem('last_drive_folder', JSON.stringify({ id: folderId, name: folderName }));

        // Update breadcrumbs logic
        const newBreadcrumbs = [...driveBreadcrumbs];
        const existingIndex = newBreadcrumbs.findIndex(b => b.id === folderId);

        if (existingIndex >= 0) {
            setDriveBreadcrumbs(newBreadcrumbs.slice(0, existingIndex + 1));
        } else {
            setDriveBreadcrumbs([...newBreadcrumbs, { id: folderId, name: folderName }]);
        }

        setCurrentDriveFolder(folderId);
        setIsLoading(false);
    };

    const [showStructure, setShowStructure] = useState(true); // Default open
    const [showTools, setShowTools] = useState(true); // Default open
    const [isFocusMode, setIsFocusMode] = useState(false); // Distraction Free
    const [docStructure, setDocStructure] = useState<{ title: string, tabs: { id: string, title: string, content: string }[] } | null>(null);
    const [docRevision, setDocRevision] = useState<string | undefined>(undefined); // Google Drive Revision ID

    // --- Appearance State ---
    const [fontSize, setFontSize] = useState(18);
    const [fontFamily, setFontFamily] = useState('Merriweather');
    const [deviceMode, setDeviceMode] = useState<'none' | 'mobile' | 'tablet' | 'ereader'>('none');
    const [headerOptions, setHeaderOptions] = useState<DocxHeaderOptions>({
        style: 'simple',
        alignment: 'center',
        uppercase: true,
        showChapterNumber: false,
        customText: ''
    });
    const [frontMatterOptions, setFrontMatterOptions] = useState<FrontMatterOptions>({
        includeTOC: false,
        includeCopyright: false,
        dedication: ''
    });
    const [pageOptions, setPageOptions] = useState<PageOptions>({
        size: 'Letter',
        margins: 'Normal'
    });
    const editorRef = React.useRef<HTMLDivElement>(null);

    // --- Goal Tracking State ---
    const [dailyGoal, setDailyGoal] = useState(500); // Words per session goal
    const [sessionStartWords, setSessionStartWords] = useState(0); // Words at session start
    const [goalEnabled, setGoalEnabled] = useState(true);

    // Load goal preferences from localStorage
    useEffect(() => {
        const savedGoal = localStorage.getItem('sb_dailyGoal');
        const savedEnabled = localStorage.getItem('sb_goalEnabled');
        if (savedGoal) setDailyGoal(parseInt(savedGoal, 10));
        if (savedEnabled !== null) setGoalEnabled(savedEnabled === 'true');
    }, []);

    // Save goal preferences to localStorage
    useEffect(() => {
        localStorage.setItem('sb_dailyGoal', String(dailyGoal));
        localStorage.setItem('sb_goalEnabled', String(goalEnabled));
    }, [dailyGoal, goalEnabled]);

    // Session tracking moved after stats declaration

    const sessionInitialized = React.useRef(false);

    // --- Typewriter Scrolling ---
    const [typewriterMode, setTypewriterMode] = useState(false);

    // --- Export ---
    const [showExportMenu, setShowExportMenu] = useState(false);

    // --- Genre Analysis ---
    const [selectedGenre, setSelectedGenre] = useState<GenreType>('Thriller');
    // Hook moved below obsidianFiles definition
    const [genreResults, setGenreResults] = useState<BenchmarkResult[]>([]); // Temp placeholder, will replace



    // --- Dictation ---
    const { isListening, transcript, resetTranscript, startListening, stopListening } = useDictation();

    // --- Grammar Analysis ---
    const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([]);

    // Check grammar on content change
    useEffect(() => {
        if (!debouncedContent) return;
        const plainText = debouncedContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        // Run lightly - keeping grammar on main thread for now as it's separate logic
        const issues = checkGrammarAndMechanics(plainText);
        setGrammarIssues(issues);
    }, [debouncedContent]);

    // Effect to insert dictated text
    useEffect(() => {
        if (transcript && editorRef.current) {
            editorRef.current.focus();
            // Use execCommand to insert at cursor position - deprecated but reliable for this
            document.execCommand('insertText', false, transcript + ' ');
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    // (Removed manual genre benchmark effect - handled by worker)

    // Load typewriter preference from localStorage
    useEffect(() => {
        const savedTypewriter = localStorage.getItem('sb_typewriterMode');
        if (savedTypewriter !== null) setTypewriterMode(savedTypewriter === 'true');
    }, []);

    // Save typewriter preference
    useEffect(() => {
        localStorage.setItem('sb_typewriterMode', String(typewriterMode));
    }, [typewriterMode]);

    // Scroll to keep cursor centered when typewriter mode is on
    const scrollToCursor = useCallback(() => {
        if (!typewriterMode || !editorRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();

        // Calculate the target scroll position to center the cursor
        const centerOffset = editorRect.height / 2;
        const cursorRelativeTop = rect.top - editorRect.top + editorRef.current.scrollTop;
        const targetScroll = cursorRelativeTop - centerOffset;

        editorRef.current.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
        });
    }, [typewriterMode]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
                e.preventDefault();
                document.execCommand('bold', false);
            } else if (e.key === 'i') {
                e.preventDefault();
                document.execCommand('italic', false);
            } else if (e.key === 'u') {
                e.preventDefault();
                document.execCommand('underline', false);
            }
        }
    };

    const handleEditorInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            // Convert HTML to plain text for stats/analysis (strip tags), but store the HTML
            setContent(html);
            if (saveStatus === 'saved') setSaveStatus('saving');
            // Typewriter scroll
            scrollToCursor();
        }
    };

    // Sync content to editor when loaded from external source (Drive, Draft)
    // Use a ref to track if we're the source of the change
    const isExternalUpdate = React.useRef(false);

    useEffect(() => {
        // Only update the editor DOM if the content was NOT changed by user typing
        // (i.e., when loading a file or switching files)
        if (editorRef.current && isExternalUpdate.current) {
            editorRef.current.innerHTML = content || '';
            isExternalUpdate.current = false;
        }
    }, [content]);

    // Helper to set content from external sources
    const setContentExternal = useCallback((newContent: string) => {
        isExternalUpdate.current = true;
        setContent(newContent);
    }, []);

    // ... (rest of useEffects)

    const [obsidianFiles, setObsidianFiles] = useState<ObsidianFile[]>([]);
    const [viewingLore, setViewingLore] = useState<{ name: string, content: string } | null>(null);

    // Worker Analysis Hook
    const { results: analysisResults, isAnalyzing: isWorkerAnalyzing } = useAnalysis(debouncedContent, selectedGenre, obsidianFiles);
    // Sync hook results to local state for now if needed, or just usage direct
    useEffect(() => {
        if (analysisResults?.genreResults) {
            setGenreResults(analysisResults.genreResults);
        }
    }, [analysisResults?.genreResults]);

    // Load saved Obsidian files on mount
    useEffect(() => {
        const savedFiles = loadObsidianFiles();
        if (savedFiles.length > 0) {
            setObsidianFiles(savedFiles);
        }
    }, []);

    const handleObsidianConnect = async () => {
        try {
            // @ts-ignore - File System Access API
            const dirHandle = await window.showDirectoryPicker();

            const files: { name: string, content: string, path?: string }[] = [];

            // Recursive scanner function
            // @ts-ignore
            async function scanDir(handle, path = "") {
                // @ts-ignore
                for await (const entry of handle.values()) {
                    const currentPath = path ? `${path}/${entry.name}` : entry.name;

                    if (entry.kind === 'file' && entry.name.endsWith('.md')) {
                        const file = await entry.getFile();
                        const text = await file.text();
                        // Store path for better display
                        files.push({ name: entry.name, content: text, path: currentPath });
                    } else if (entry.kind === 'directory') {
                        // Recurse up to limit - increased to 500
                        if (files.length < 500) await scanDir(entry, currentPath);
                    }
                }
            }

            // @ts-ignore
            await scanDir(dirHandle);

            setObsidianFiles(files as ObsidianFile[]);
            saveObsidianFiles(files as ObsidianFile[]); // Save to localStorage for cross-page access
            alert(`Connected! Found ${files.length} markdown notes. Characters and World Bible will auto-populate.`);

        } catch (err) {
            console.warn("Vault connection cancelled or failed", err);
        }
    };

    const handleSelectDriveFile = async (fileId: string, fileName: string) => {
        try {
            setShowStartScreen(false);
            setIsLoading(true);
            setActiveFileId(fileId);
            setDraftId(fileId); // This triggers the useEffect below to load Notes for this file
            setActiveFileName(fileName);

            console.log(`[SmartEditor] Opening Drive File: ${fileName} (${fileId})`);

            // 1. Fetch content using our library function
            // This function handles the Google API internals
            const result: any = await readDocumentContent(fileId);

            let loadedContent = "";

            // Handle potential return types (string or object with tabs)
            if (typeof result === 'object' && result.content) {
                loadedContent = result.content;
                setDocRevision(result.revisionId); // Store the revision ID

                // If the API helper found tabs, use them
                if (result.tabs && result.tabs.length > 0) {
                    setDocStructure({ title: result.title || fileName, tabs: result.tabs });
                }
            } else if (typeof result === 'string') {
                loadedContent = result;
                // revisionId missing from string return, assume unsafe
            }

            setContentExternal(loadedContent);

            // --- AUTO-DETECT STRUCTURE (Fallback) ---
            // If the API didn't give us tabs, try to parse headings manually
            if ((!docStructure || !docStructure.tabs || docStructure.tabs.length === 0) && loadedContent) {
                // Regex: Look for lines starting with "Chapter", "Act", "Part", or "Book" followed by a number or title
                const structureRegex = /^(Chapter|Act|Part|Book)\s+\d+/gim;
                const lines = loadedContent.split('\n');
                const tabs: { id: string, title: string, content: string }[] = [];

                let currentTab = { id: 'main', title: 'Main', content: '' };
                let buffer = '';

                lines.forEach((line) => {
                    const match = line.match(structureRegex);
                    // If we hit a new section and the buffer has substantial content
                    if (match && buffer.length > 50) {
                        // Save previous
                        tabs.push({ ...currentTab, content: buffer });

                        // Start new
                        buffer = line + '\n';
                        currentTab = {
                            id: uuidv4(),
                            title: match[0].trim().substring(0, 20), // Truncate title
                            content: ''
                        };
                    } else {
                        buffer += line + '\n';
                    }
                });

                // Push final
                tabs.push({ ...currentTab, content: buffer });

                if (tabs.length > 1) {
                    setDocStructure({ title: fileName, tabs });
                    setShowStructure(true); // Open the left sidebar to show context if desired, or just rely on top tabs
                }
            }

            setShowDrivePicker(false);
        } catch (error) {
            console.error("Error opening file:", error);
            // Fallback for demo if API fails entirely
            setContentExternal(`# Error Loading File\n\nCould not fetch content for ${fileName}. Ensure you are logged in.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Load draft when draftId changes (switching files)
    useEffect(() => {
        const load = async () => {
            try {
                // 1. Try Loading from Manuscript Scenes (Priority 1)
                const savedScenes = localStorage.getItem('sb_scenes');
                if (savedScenes) {
                    const scenes = JSON.parse(savedScenes);
                    const scene = scenes.find((s: any) => s.id === draftId);
                    if (scene) {
                        console.log(`[SmartEditor] Loaded Scene: ${scene.title}`);
                        setContentExternal(scene.content || "");
                        setActiveFileName(scene.title);
                        setNotes(""); // Scenes might store notes separately later
                        setSaveStatus('saved');
                        setIsLoading(false);
                        return;
                    }
                }

                // 2. Fallback to IndexedDB Drafts
                const draft = await getDraft(draftId);
                // If we found a local draft for this specific ID, load its notes 
                if (draft) {
                    console.log(`[SmartEditor] Loaded notes for draft: ${draft.id}`);
                    setNotes(draft.notes || "");

                    // Only overwrite content from local DB if we are NOT in "Connected Mode" (activeFileId is null)
                    if (!activeFileId && draft.content) {
                        setContentExternal(draft.content);
                    }
                } else {
                    setNotes("");
                }
            } catch (err) {
                console.error("Failed to load draft", err);
            } finally {
                if (!activeFileId) setIsLoading(false);
                setSaveStatus('saved');
            }
        };
        load();
    }, [draftId]); // Depend on draftId changes

    // Auto-save effect
    useEffect(() => {
        // Check if NOT loading to prevent overwriting with empty state
        if (!isLoading) {
            const performSave = async () => {
                setSaveStatus('saving');

                // 1. Save to IndexedDB & Cloud (Hybrid)
                const isSynced = await saveDraft({
                    id: draftId,
                    projectId: 'project-alpha',
                    chapterId: 'chapter-1',
                    title: activeFileName || 'Untitled Scene',
                    content: debouncedContent,
                    notes: debouncedNotes,
                    lastModified: Date.now(),
                    version: 1,
                });

                // 2. Sync to Manuscript Scenes (Main Storage)
                const savedScenes = localStorage.getItem('sb_scenes');
                if (savedScenes) {
                    const scenes = JSON.parse(savedScenes);
                    const sceneIdx = scenes.findIndex((s: any) => s.id === draftId);
                    if (sceneIdx !== -1) {
                        const plainText = debouncedContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                        scenes[sceneIdx].content = debouncedContent;
                        scenes[sceneIdx].wordCount = plainText.length > 0 ? plainText.split(/\s+/).length : 0;
                        scenes[sceneIdx].lastModified = Date.now();
                        localStorage.setItem('sb_scenes', JSON.stringify(scenes));
                    }
                }

                setTimeout(() => setSaveStatus(isSynced ? 'saved' : 'offline'), 500);
            };
            performSave();
        }
    }, [debouncedContent, debouncedNotes, draftId, isLoading, activeFileName]);

    // --- Helper for Loading Folder ---
    const handleLoadFolder = async () => {
        // Filter adaptable files
        const validFiles = driveFiles.filter(f =>
            f.mimeType !== 'application/vnd.google-apps.folder' &&
            !f.name.endsWith('.pdf') // Exclude PDFs for now as they might not be editable text
        ); // Closing parenthesis for filter
        if (validFiles.length > 0) {
            // Open the first file immediately
            await handleSelectDriveFile(validFiles[0].id, validFiles[0].name);
            // In a real app, we might also batch-fetch the content of others here 
            // to populate 'projectFiles' state for analysis.
        }
    };

    // --- Expert Editor State ---
    // Use worker results
    const editorInsights = analysisResults?.insights || [];
    // Use worker results for context
    const activeContext = analysisResults?.contextMatches || [];

    const handleScan = () => {
        // Analysis is auto-running in worker via useAnalysis hook
        if (!showTools) setShowTools(true);
        // Visual feedback
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 500);
    };

    // Helper to strip HTML for analysis
    const getPlainText = useCallback((html: string) => {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }, []);

    const stats = analysisResults?.stats || null;

    // Track session start word count (set once when content first loads with words)
    useEffect(() => {
        if (!sessionInitialized.current && stats?.wordCount && stats.wordCount > 0) {
            setSessionStartWords(stats.wordCount);
            sessionInitialized.current = true;
        }
    }, [stats?.wordCount]);

    // Record writing streak
    useEffect(() => {
        if (stats?.wordCount && stats.wordCount > 0) {
            recordWriting(stats.wordCount);
        }
    }, [stats?.wordCount, recordWriting]);

    // Calculate session progress
    const sessionWordsWritten = (stats?.wordCount || 0) - sessionStartWords;
    const goalProgress = goalEnabled && dailyGoal > 0 ? Math.min(100, (sessionWordsWritten / dailyGoal) * 100) : 0;

    // (Removed manual context scan effect - handled by worker)

    const handleSaveToDrive = async () => {
        if (!isGoogleConnected) {
            alert('Please connect to Google Drive first (Folders Icon -> Connect).');
            return;
        }

        try {
            setSaveStatus('saving');
            const plainText = debouncedContent.replace(/<[^>]*>/g, ' ').trim();
            const { createDocument, updateDocument } = await import('@/lib/googleDrive');

            if (activeFileId) {
                // Pass the known revision ID to prevent overwriting others' work
                const newRevisionId = await updateDocument(activeFileId, plainText, docRevision);
                // Update our local state to the new revision, so next save works
                if (newRevisionId) {
                    setDocRevision(newRevisionId);
                }
                setSaveStatus('saved');
                console.log(`[SmartEditor] Synced to Google Drive: ${activeFileId}`);
            } else {
                const newId = await createDocument(activeFileName || 'Untitled Draft', plainText);
                if (newId) {
                    setActiveFileId(newId);
                    setSaveStatus('saved');
                    alert(`Created new Google Doc: "${activeFileName || 'Untitled Draft'}"`);
                }
            }

        } catch (err: any) {
            console.error("Google Drive Save Failed", err);
            setSaveStatus('error');

            // Handle Conflict specifically
            if (err.message && err.message.includes('CONFLICT')) {
                const userChoice = confirm("⚠️ SYNC CONFLICT DETECTED!\n\nThe file on Google Drive has been modified by someone else (or a different session).\n\n• OK: Overwrite server changes with YOUR version.\n• Cancel: Keep server changes (your edits will stay unsaved here).");

                if (userChoice) {
                    // User chose to overwrite (Force Save)
                    try {
                        setSaveStatus('saving');
                        const plainText = debouncedContent.replace(/<[^>]*>/g, ' ').trim();
                        const { updateDocument } = await import('@/lib/googleDrive');
                        const newRevisionId = await updateDocument(activeFileId!, plainText); // No rev ID = Force
                        setDocRevision(newRevisionId);
                        setSaveStatus('saved');
                        alert("File overwritten successfully.");
                    } catch (retryErr) {
                        alert("Force save failed: " + (retryErr as Error).message);
                    }
                } else {
                    alert("Save cancelled. Please refresh/reload the file to see the latest version.");
                }
            } else {
                alert('Failed to save to Drive: ' + (err.message || "Unknown error"));
            }
        }
    };

    // --- Local File Import ---
    const fileImportRef = React.useRef<HTMLInputElement>(null);
    const triggerFileImport = () => {
        if (fileImportRef.current) fileImportRef.current.click();
    };

    const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { parseDocx } = await import('@/lib/docxImporter');
            const { html, messages } = await parseDocx(file);

            if (messages.length > 0) {
                console.warn("Import Warnings:", messages);
            }

            setContentExternal(html);
            setActiveFileName(file.name.replace(/\.docx$/i, ''));
            setActiveFileId(null);
            setDocStructure(null);
            setSaveStatus('unsaved');
            setShowStartScreen(false);

            // alert(`Imported "${file.name}".`); 

        } catch (err) {
            alert("Failed to import: " + (err as Error).message);
        } finally {
            if (e.target) e.target.value = '';
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden relative">

            {/* --- LEFT COLUMN: Project Explorer --- */}
            <ProjectExplorer
                isVisible={showStructure}
                isFocusMode={isFocusMode}
                isLoading={isLoading}
                driveFiles={driveFiles}
                activeFileId={activeFileId}
                currentDriveFolder={currentDriveFolder}
                currentFolderName={currentFolderName}
                driveBreadcrumbs={driveBreadcrumbs}
                onNavigateFolder={handleNavigateFolder}
                onSelectFile={handleSelectDriveFile}
                onLoadFolder={handleNavigateFolder.bind(null, currentDriveFolder, currentFolderName)} // Re-trigger load
                onOpenPicker={() => setShowDrivePicker(true)}
                onTriggerImport={triggerFileImport}
                isConnected={isGoogleConnected}
                onConnect={handleDriveConnect}
            />
            {/* Hidden Input for Local Imports */}
            <input
                type="file"
                ref={fileImportRef}
                onChange={handleLocalFileChange}
                accept=".docx"
                className="hidden"
                style={{ display: 'none' }} // Extra safe
            />

            {/* --- MIDDLE COLUMN: Main Writing Area --- */}
            <div className="flex-1 flex flex-col h-full bg-card relative overflow-hidden">

                {/* Header Row 1 & 2: Replaced by EditorHeader */}
                <EditorHeader
                    isFocusMode={isFocusMode}
                    currentFolderName={currentFolderName}
                    activeFileName={activeFileName}
                    saveStatus={saveStatus}
                    showStructure={showStructure}
                    onToggleStructure={() => setShowStructure(!showStructure)}
                    stats={stats}
                    goalEnabled={goalEnabled}
                    dailyGoal={dailyGoal}
                    sessionWordsWritten={sessionWordsWritten}
                    goalProgress={goalProgress}
                    onSetFocusMode={setIsFocusMode}
                    showExportMenu={showExportMenu}
                    onToggleExportMenu={() => setShowExportMenu(!showExportMenu)}
                    exportContext={{
                        content: debouncedContent,
                        fileName: activeFileName || 'Untitled',
                        stats: stats,
                        headerOptions,
                        frontMatterOptions,
                        pageOptions,
                        setPageOptions
                    }}
                    isListening={isListening}
                    onToggleDictation={isListening ? stopListening : startListening}
                    isScanning={isScanning}
                    onRunAnalysis={handleScan}
                    showTools={showTools}
                    onToggleTools={() => setShowTools(!showTools)}
                    onSaveToDrive={handleSaveToDrive}
                    docStructure={docStructure}
                    onTabSelect={setContentExternal}
                />


                {/* Editor Textarea Wrapper */}
                <div className="flex-1 relative group overflow-hidden">
                    {/* Floating Exit Focus Button */}
                    {isFocusMode && (
                        <button
                            onClick={() => setIsFocusMode(false)}
                            className="absolute top-4 right-8 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-gray-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm shadow-xl border border-white/10"
                            title="Exit Focus Mode"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}

                    {/* Scrollable Container */}
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            className="w-full min-h-full bg-transparent p-6 md:p-8 outline-none text-gray-200 max-w-6xl mx-auto block leading-relaxed transition-all"
                            onKeyDown={handleKeyDown}
                            onInput={handleEditorInput}
                            spellCheck={true}
                            data-placeholder="Start writing your masterpiece..."
                            style={{
                                fontSize: `${fontSize}px`,
                                fontFamily: fontFamily.includes(' ') ? `"${fontFamily}", serif` : `${fontFamily}, serif`,
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                maxWidth: deviceMode === 'none' ? undefined : deviceMode === 'mobile' ? '375px' : deviceMode === 'tablet' ? '768px' : '550px',
                                backgroundColor: deviceMode === 'ereader' ? '#fdf6e3' : deviceMode !== 'none' ? '#1e1e1e' : undefined,
                                color: deviceMode === 'ereader' ? '#333' : undefined,
                                border: deviceMode !== 'none' ? '12px solid #333' : undefined,
                                borderRadius: deviceMode !== 'none' ? '24px' : undefined,
                                padding: deviceMode !== 'none' ? '2rem 1.5rem' : undefined,
                                margin: deviceMode !== 'none' ? '2rem auto' : '0 auto',
                                boxShadow: deviceMode !== 'none' ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : undefined
                            }}
                        />
                    </div>
                </div>

                {showStartScreen && (
                    <StartScreen
                        onCreateNew={() => setShowStartScreen(false)}
                        onImportLocal={triggerFileImport}
                        onConnectDrive={handleDriveConnect}
                        isDriveConnected={isGoogleConnected}
                    />
                )}
            </div>

            {/* --- RIGHT COLUMN: Tools & Context --- */}
            <div
                className={`flex-shrink-0 bg-card border-l border-white/5 flex flex-col transition-all duration-300 ease-in-out ${showTools ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}
            >
                <div className="p-4 flex flex-col gap-4 overflow-y-auto h-full pr-2 custom-scrollbar min-w-[20rem]">

                    {/* Writing Streak Widget */}
                    <StreakWidget streak={streak} />

                    {/* Appearance Widget */}
                    <div className="bg-card rounded-xl border border-white/5 flex flex-col overflow-hidden shadow-sm flex-shrink-0">
                        <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                                <span className="text-lg">Aa</span>
                                Appearance
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Font Family */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Font Face</label>
                                <div className="flex p-1 bg-black/20 rounded-lg">
                                    {['Merriweather', 'Inter', 'Courier New'].map(font => (
                                        <button
                                            key={font}
                                            onClick={() => setFontFamily(font)}
                                            className={`flex-1 py-1.5 text-xs rounded-md transition-all ${fontFamily === font ? 'bg-purple-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                            title={font}
                                        >
                                            {font === 'Merriweather' ? 'Serif' : font === 'Inter' ? 'Sans' : 'Mono'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex justify-between">
                                    <span>Font Size</span>
                                    <span className="text-gray-300">{fontSize}px</span>
                                </label>
                                <input
                                    type="range"
                                    min="14"
                                    max="32"
                                    step="1"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                                    <span>A-</span>
                                    <span>A+</span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-2" />

                            {/* Device Preview */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Device Preview</label>
                                <div className="grid grid-cols-4 gap-1 p-1 bg-black/20 rounded-lg">
                                    {[
                                        { id: 'none', icon: '💻', label: 'None' },
                                        { id: 'mobile', icon: '📱', label: 'Phone' },
                                        { id: 'tablet', icon: '📟', label: 'Tablet' },
                                        { id: 'ereader', icon: '📖', label: 'E-Ink' }
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setDeviceMode(mode.id as 'none' | 'mobile' | 'tablet' | 'ereader')}
                                            className={`p-1.5 rounded-lg transition-all flex items-center justify-center relative group ${deviceMode === mode.id ? 'bg-purple-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                                            title={mode.label}
                                        >
                                            <span className="text-base">{mode.icon}</span>
                                            {deviceMode === mode.id && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-2" />

                            {/* Publishing Settings */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Chapter Headers (Export)</label>

                                {/* Style Style */}
                                <div className="grid grid-cols-4 gap-1 p-1 bg-black/20 rounded-lg mb-2">
                                    {[
                                        { id: 'simple', label: 'Simple' },
                                        { id: 'bold', label: 'Bold' },
                                        { id: 'modern', label: 'Mod' },
                                        { id: 'ornate', label: 'Ornate' }
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setHeaderOptions(prev => ({ ...prev, style: s.id as any }))}
                                            className={`py-1 text-[10px] rounded transition-all ${headerOptions.style === s.id ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Align & Toggles */}
                                <div className="flex gap-2">
                                    <div className="flex bg-black/20 rounded-lg p-1">
                                        {['left', 'center', 'right'].map(align => (
                                            <button
                                                key={align}
                                                onClick={() => setHeaderOptions(prev => ({ ...prev, alignment: align as any }))}
                                                className={`p-1.5 rounded transition-all ${headerOptions.alignment === align ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setHeaderOptions(prev => ({ ...prev, uppercase: !prev.uppercase }))}
                                        className={`flex-1 rounded p-1 text-[10px] border ${headerOptions.uppercase ? 'border-purple-500/50 text-purple-300 bg-purple-500/10' : 'border-white/5 text-gray-500'}`}
                                    >
                                        AB
                                    </button>
                                    <button
                                        onClick={() => setHeaderOptions(prev => ({ ...prev, showChapterNumber: !prev.showChapterNumber }))}
                                        className={`flex-1 rounded p-1 text-[10px] border ${headerOptions.showChapterNumber ? 'border-purple-500/50 text-purple-300 bg-purple-500/10' : 'border-white/5 text-gray-500'}`}
                                    >
                                        #1
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-2" />

                            {/* Front Matter (Export) */}
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Front Matter (Export)</label>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-300">Table of Contents</span>
                                        <button
                                            onClick={() => setFrontMatterOptions(prev => ({ ...prev, includeTOC: !prev.includeTOC }))}
                                            className={`w-8 h-4 rounded-full transition-all ${frontMatterOptions.includeTOC ? 'bg-purple-500' : 'bg-white/10'} relative`}
                                        >
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${frontMatterOptions.includeTOC ? 'left-4' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-300">Copyright Page</span>
                                        <button
                                            onClick={() => setFrontMatterOptions(prev => ({ ...prev, includeCopyright: !prev.includeCopyright }))}
                                            className={`w-8 h-4 rounded-full transition-all ${frontMatterOptions.includeCopyright ? 'bg-purple-500' : 'bg-white/10'} relative`}
                                        >
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${frontMatterOptions.includeCopyright ? 'left-4' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className="pt-1">
                                        <input
                                            type="text"
                                            placeholder="Dedication (e.g. To Mom...)"
                                            value={frontMatterOptions.dedication || ''}
                                            onChange={(e) => setFrontMatterOptions(prev => ({ ...prev, dedication: e.target.value }))}
                                            className="w-full bg-black/20 text-gray-300 text-xs rounded-lg p-2 border border-white/5 outline-none focus:border-purple-500/50 placeholder-gray-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-2" />

                            {/* Genre Benchmarking Widget */}
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Genre Targets</label>
                                <select
                                    value={selectedGenre}
                                    onChange={(e) => setSelectedGenre(e.target.value as GenreType)}
                                    className="w-full bg-black/20 text-gray-300 text-xs rounded-lg p-2 border border-white/5 outline-none focus:border-purple-500/50 appearance-none"
                                >
                                    {Object.keys(GENRE_PROFILES).map(g => (
                                        <option key={g} value={g} className="bg-gray-900 text-gray-200">{g}</option>
                                    ))}
                                </select>

                                {genreResults.length > 0 ? (
                                    <div className="space-y-3 mt-1">
                                        {genreResults.map((res, i) => (
                                            <div key={i} className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-400">{res.metric}</span>
                                                    <span className={`font-mono font-bold ${res.status === 'good' ? 'text-green-400' :
                                                        res.status === 'low' ? 'text-blue-400' : 'text-red-400'
                                                        }`}>
                                                        {res.yourValue}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                                                    {/* Target Range Indicator could be complex, simple color bar for now */}
                                                    <div className={`h-full w-full ${res.status === 'good' ? 'bg-green-500/50' : 'bg-red-500/50'}`} />
                                                </div>
                                                {res.status !== 'good' && (
                                                    <p className="text-[10px] text-gray-500 italic leading-tight">{res.advice}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-600 italic">Write more (100+ words) to see analysis.</p>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-2" />

                            {/* Grammar Widget */}
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Grammar & Mechanics</label>
                                {grammarIssues.length === 0 ? (
                                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                                        <span className="text-xl block mb-1">✨</span>
                                        <span className="text-xs text-green-400">All clear!</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {grammarIssues.slice(0, 5).map(issue => (
                                            <div key={issue.id} className="p-2 rounded bg-white/5 border border-white/10 text-xs">
                                                <div className="flex justify-between mb-1">
                                                    <span className={`font-bold ${issue.severity === 'info' ? 'text-blue-400' : 'text-yellow-400'}`}>
                                                        {issue.type === 'consistency' ? 'Consistency' : issue.type === 'typo' ? 'Typo' : 'Grammar'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 mb-1">{issue.message}</p>
                                                <p className="font-mono text-[10px] text-gray-500 bg-black/20 p-1 rounded">"{issue.context}"</p>
                                                {issue.suggestion && (
                                                    <div className="mt-1 text-green-400 text-[10px]">
                                                        ➜ {issue.suggestion}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {grammarIssues.length > 5 && (
                                            <div className="text-center text-[10px] text-gray-500">
                                                +{grammarIssues.length - 5} more issues
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-2" />

                            {/* Session Goal */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Session Goal</label>
                                    <button
                                        onClick={() => setGoalEnabled(!goalEnabled)}
                                        className={`w-8 h-4 rounded-full transition-all ${goalEnabled ? 'bg-purple-500' : 'bg-white/20'} relative`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${goalEnabled ? 'left-4' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                {goalEnabled && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-gray-400">Daily Target</span>
                                            <span className="text-xs font-bold text-purple-300 font-mono">{dailyGoal} words</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="100"
                                            max="3000"
                                            step="50"
                                            value={dailyGoal}
                                            onChange={(e) => setDailyGoal(Number(e.target.value))}
                                            className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                                            <span>100</span>
                                            <span>1500</span>
                                            <span>3000</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSessionStartWords(stats?.wordCount || 0);
                                                sessionInitialized.current = true;
                                            }}
                                            className="mt-1 text-[10px] text-gray-400 hover:text-white underline decoration-dotted transition-colors"
                                        >
                                            Reset session counter
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 my-2" />

                            {/* Typewriter Mode */}
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Typewriter Mode</label>
                                    <span className="text-[9px] text-gray-600">Keeps cursor centered</span>
                                </div>
                                <button
                                    onClick={() => setTypewriterMode(!typewriterMode)}
                                    className={`w-8 h-4 rounded-full transition-all ${typewriterMode ? 'bg-purple-500' : 'bg-white/20'} relative`}
                                >
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${typewriterMode ? 'left-4' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Scratchpad Widget */}
                    <div className="bg-card rounded-xl border border-white/5 flex flex-col overflow-hidden shadow-sm flex-shrink-0">
                        <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                                <span className="text-lg">💡</span>
                                Scratchpad
                            </h3>
                            {saveStatus === 'saving' && <span className="text-[10px] text-yellow-500 animate-pulse">Syncing...</span>}
                        </div>
                        {activeFileName && (
                            <div className="px-3 py-1 text-[10px] text-gray-500 bg-white/5 border-b border-white/5 truncate">
                                Context: <span className="text-gray-300">{activeFileName}</span>
                            </div>
                        )}
                        <textarea
                            key={draftId} // Force re-render on file switch
                            className="w-full h-32 bg-transparent p-3 text-sm text-gray-300 placeholder:text-gray-600 resize-none outline-none font-mono"
                            placeholder="Jot down quick ideas..."
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                if (saveStatus === 'saved') setSaveStatus('saving');
                            }}
                        />
                    </div>

                    {/* Context Hints (Lore) */}
                    {activeContext.length > 0 && (
                        <div className="bg-card rounded-xl border border-white/5 p-4 flex-shrink-0 animate-in fade-in">
                            <h3 className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide flex items-center gap-2">
                                <span>✦ Context Detected</span>
                            </h3>
                            <div className="space-y-2">
                                {activeContext.map((file, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setViewingLore(file)}
                                        className="w-full text-left p-2 rounded bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors group"
                                    >
                                        <div className="text-xs font-bold text-purple-200 group-hover:text-white flex items-center gap-2">
                                            {file.name.replace('.md', '')}
                                            <span className="text-[10px] opacity-50">↗</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 line-clamp-2 mt-1">
                                            {file.content.substring(0, 100)}...
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expert Editor Insights */}
                    {editorInsights.length > 0 && (
                        <div className="bg-card rounded-xl border border-white/5 p-4 flex-shrink-0 animate-in fade-in">
                            <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex justify-between items-center">
                                <span>Editor Feedback</span>
                            </h3>
                            <div className="space-y-3">
                                {editorInsights.map((insight, i) => (
                                    <div key={i} className={`p-3 rounded-lg border flex flex-col gap-1 ${insight.type === 'warning' ? 'bg-red-500/10 border-red-500/20' :
                                        insight.type === 'suggestion' ? 'bg-blue-500/10 border-blue-500/20' :
                                            'bg-green-500/10 border-green-500/20'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${insight.type === 'warning' ? 'text-red-400' :
                                                insight.type === 'suggestion' ? 'text-blue-400' :
                                                    'text-green-400'
                                                }`}>{insight.type}</span>
                                        </div>
                                        <p className="text-sm text-gray-200 font-medium">{insight.message}</p>
                                        <p className="text-xs text-gray-500 italic border-t border-white/5 pt-1 mt-1">{insight.context}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sentence Flow (Pacing) */}
                    <div className="bg-card rounded-xl border border-white/5 p-4 flex-shrink-0">
                        <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                            Sentence Flow (Last 20)
                        </h3>
                        <div className="flex items-end gap-[2px] h-16 w-full border-b border-white/10 pb-1">
                            {(() => {
                                const lengths = analysisResults?.sentenceLengths || [];
                                // Take last 20
                                const last20 = lengths.slice(-20);
                                if (last20.length === 0) return <div className="text-xs text-gray-600 w-full text-center self-center">Start writing...</div>;

                                return last20.map((len, idx) => {
                                    // Height percentage relative to max in this window, capped at 100%
                                    const h = Math.min(100, (len / 40) * 100);
                                    let color = 'bg-blue-500/50';
                                    if (len < 8) color = 'bg-green-500/50'; // Short
                                    if (len > 25) color = 'bg-pink-500/50'; // Long
                                    if (len > 40) color = 'bg-red-500/80';  // Very Long

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex-1 rounded-t-sm transition-all hover:opacity-100 opacity-80 ${color}`}
                                            style={{ height: `${h}%` }}
                                            title={`${len} words`}
                                        />
                                    );
                                });
                            })()}
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-600 mt-1 font-mono uppercase">
                            <span>Oldest</span>
                            <span>Newest</span>
                        </div>
                    </div>

                    {/* Pacing Graph (Paragraph Density) */}
                    <div className="bg-card rounded-xl border border-white/5 p-4 flex-shrink-0">
                        <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center justify-between">
                            <span>Pacing Graph</span>
                            <span className="text-[9px] font-normal normal-case text-gray-600">by paragraph</span>
                        </h3>
                        <div className="flex flex-col gap-1">
                            {(() => {
                                const pacing = analysisResults?.pacing || [];

                                if (pacing.length === 0) return <div className="text-xs text-gray-600 text-center py-4">Add paragraphs to see pacing...</div>;

                                // Show last 10 paragraphs
                                const display = pacing.slice(-10);
                                const maxWords = Math.max(...display.map(p => p.words), 1);

                                return display.map((para, idx) => {
                                    const widthPercent = (para.words / maxWords) * 100;
                                    let barColor = 'bg-blue-500/60';
                                    if (para.intensity === 'fast') barColor = 'bg-green-500/60';
                                    if (para.intensity === 'slow') barColor = 'bg-orange-500/60';
                                    if (para.isDialogue) barColor = 'bg-purple-500/60';

                                    return (
                                        <div key={idx} className="flex items-center gap-2 group">
                                            <div className="w-6 text-[9px] text-gray-600 text-right font-mono">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 h-3 bg-white/5 rounded-sm overflow-hidden">
                                                <div
                                                    className={`h-full rounded-sm transition-all ${barColor}`}
                                                    style={{ width: `${widthPercent}%` }}
                                                    title={`${para.words} words, ${para.sentences} sentences, ${para.intensity} pace${para.isDialogue ? ', dialogue' : ''}`}
                                                />
                                            </div>
                                            <div className="w-8 text-[9px] text-gray-500 font-mono">
                                                {para.words}w
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        <div className="flex justify-center gap-3 mt-3 text-[8px] text-gray-600">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/60"></span> Fast</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/60"></span> Medium</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-500/60"></span> Slow</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-500/60"></span> Dialogue</span>
                        </div>
                    </div>

                    {/* Sentiment Arc */}
                    <div className="bg-card rounded-xl border border-white/5 p-4 flex-shrink-0">
                        <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center justify-between">
                            <span>Sentiment Arc</span>
                            <span className="text-[9px] font-normal normal-case text-gray-600">Emotional tone over time</span>
                        </h3>
                        {(() => {
                            const points = analysisResults?.sentimentArc || [];

                            if (points.length === 0) return <div className="text-xs text-gray-600 text-center py-4">Write more to see sentiment data...</div>;

                            return (
                                <div>
                                    <div className="h-24 flex gap-0.5 w-full relative">
                                        {/* Zero Line */}
                                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 z-0" />

                                        {points.map((p, i) => {
                                            // Scale: Assume max score ~5 per chunk for normalization. Cap at 10.
                                            const intensity = Math.min(100, Math.abs(p.score) * 20); // * 20 means score of 5 hits 100%

                                            // Tooltip context
                                            const tip = `Chunk ${p.chunk}: ${p.score > 0 ? '+' : ''}${p.score} (${p.score > 0 ? 'Pos' : p.score < 0 ? 'Neg' : 'Neut'})\n"${p.text}..."`;

                                            return (
                                                <div key={i} className="flex-1 flex flex-col h-full z-10 group relative" title={tip}>
                                                    {/* Positive Half */}
                                                    <div className="h-1/2 flex items-end justify-center w-full">
                                                        {p.score > 0 && (
                                                            <div
                                                                className="w-full bg-emerald-500/60 rounded-t-sm transition-all group-hover:bg-emerald-400"
                                                                style={{ height: `${intensity}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                    {/* Negative Half */}
                                                    <div className="h-1/2 flex items-start justify-center w-full">
                                                        {p.score < 0 && (
                                                            <div
                                                                className="w-full bg-rose-500/60 rounded-b-sm transition-all group-hover:bg-rose-400"
                                                                style={{ height: `${intensity}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between text-[8px] text-gray-600 mt-2 font-mono uppercase px-1">
                                        <span>Start</span>
                                        <span>Story Progress</span>
                                        <span>End</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Word Explorer (Thesaurus) */}
                    <div className="bg-card rounded-xl border border-white/5 p-4 flex-shrink-0">
                        <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <span>📚</span> Word Explorer
                        </h3>
                        <div className="space-y-2">
                            {(() => {
                                const overused = analysisResults?.overused || [];

                                if (overused.length === 0) {
                                    return <div className="text-xs text-gray-600 text-center py-2">No overused words detected</div>;
                                }

                                return overused.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="p-2 bg-white/5 rounded-lg border border-white/10">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-amber-300 text-sm">"{item.word}"</span>
                                            <span className="text-[10px] text-gray-500">×{item.count}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {item.synonyms.slice(0, 4).map((syn, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded cursor-pointer hover:bg-purple-500/40 transition-colors"
                                                    title={`Click to copy: ${syn}`}
                                                    onClick={() => navigator.clipboard.writeText(syn)}
                                                >
                                                    {syn}
                                                </span>
                                            ))}
                                            {item.synonyms.length > 4 && (
                                                <span className="text-[10px] text-gray-500">+{item.synonyms.length - 4}</span>
                                            )}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Obsidian Sync Widget */}
                    <ObsidianWidget
                        files={obsidianFiles}
                        onConnect={handleObsidianConnect}
                        onPreview={(file) => setViewingLore(file)}
                    />

                    {/* Google Drive Status (Minimal) */}
                    <div className="bg-card rounded-xl border border-white/5 p-4 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <span className="w-4 h-4 text-green-500">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.784 14l.42-2.184L8.7 11h6.6l.5 2.5.5 2.5h-9.5z" fill="#00AC47" /><path d="M8.7 11V8.5H5.8L4.35 11h4.35zM5.8 8.5H13.6L12.35 11H8.7V8.5z" fill="#0066DA" /><path d="M12.35 11l2.9-5h-5.8l-1.45 2.5 1.45 2.5h2.9z" fill="#EA4335" /><path d="M12.35 11L13.6 8.5h4.6l1.45 2.5-1.45 2.5H13.6l-1.25-2.5z" fill="#FFBA00" /><path d="M7.784 14H4.35l4.35 7.5L12.35 16l-4.566-2z" fill="#00AC47" /><path d="M13.6 16l4.35-7.5h-5.6l-2.9 5 2.9 5h4.6l-3.35-2.5z" fill="#2684FC" /></svg>
                                </span>
                                Cloud Status
                            </h3>
                            {isGoogleConnected ? (
                                <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Connected</span>
                            ) : (
                                <button onClick={handleDriveConnect} className="text-[10px] text-blue-400 hover:underline">Connect</button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Lore Preview Modal (Toast-like) */}
            {
                viewingLore && (
                    <div className="fixed bottom-6 right-6 w-96 max-h-[80vh] bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 z-50">
                        <div className="p-3 bg-purple-900/20 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-purple-300 truncate pr-2">
                                {viewingLore.name.replace('.md', '')}
                            </h3>
                            <button
                                onClick={() => setViewingLore(null)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto text-sm text-gray-300 leading-relaxed font-serif whitespace-pre-wrap custom-scrollbar">
                            {viewingLore.content}
                        </div>
                        <div className="p-2 bg-black/20 border-t border-white/5 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setNotes(prev => prev + `\n\n--- ${viewingLore.name} ---\n` + viewingLore.content);
                                    setViewingLore(null);
                                }}
                                className="text-[10px] text-gray-500 hover:text-white"
                            >
                                Append to Notes
                            </button>
                        </div>
                    </div>
                )
            }
            {/* Command Palette */}
            <CommandPalette
                onSetFocusMode={setIsFocusMode}
                onRunAnalysis={handleScan}
                onToggleExportMenu={() => setShowExportMenu(!showExportMenu)}
                onSaveToDrive={handleSaveToDrive}
                onOpenFromDrive={() => setShowDrivePicker(true)}
                onToggleDictation={() => isListening ? stopListening() : startListening()}
                onToggleTools={() => setShowTools(!showTools)}
                onToggleStructure={() => setShowStructure(!showStructure)}
                isListening={isListening}
                showTools={showTools}
                showStructure={showStructure}
                isFocusMode={isFocusMode}
            />

            {/* Drive Picker Modal */}
            <DrivePickerModal
                isOpen={showDrivePicker}
                onClose={() => setShowDrivePicker(false)}
                onSelect={(folderId, folderName) => {
                    handleNavigateFolder(folderId, folderName);
                    setShowDrivePicker(false);
                }}
                initialFolderId={currentDriveFolder}
            />

            {/* Onboarding Modal - First time user experience */}
            <OnboardingModal
                onComplete={() => setShowStartScreen(false)}
                onConnectDrive={() => {
                    setShowStartScreen(false);
                    handleDriveConnect();
                }}
            />
        </div >
    );
}




