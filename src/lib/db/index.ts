import Dexie, { type EntityTable } from 'dexie';
import { supabase } from '@/lib/supabase';

export interface SceneDraft {
    id: string; // UUID
    projectId: string;
    chapterId: string;
    title: string;
    content: string;
    notes?: string;
    lastModified: number; // timestamp
    version: number;
    googleDocId?: string; // Link to Google Doc
}

const db = new Dexie('StoryBoardDatabase') as Dexie & {
    drafts: EntityTable<SceneDraft, 'id'>;
};

// Schema registration
db.version(1).stores({
    drafts: 'id, projectId, chapterId, lastModified'
});

// Update schema for Google Docs support
db.version(2).stores({
    drafts: 'id, projectId, chapterId, lastModified, googleDocId'
});

export { db };

// Helper to auto-save and Sync
export async function saveDraft(draft: SceneDraft) {
    try {
        // 1. Save Local (Dexie)
        await db.drafts.put(draft);
        console.log(`[Local] Saved draft: ${draft.id}`);

        // 1b. Sync with sb_scenes (LocalStorage) for Manuscript View consistency
        try {
            const sbScenes = localStorage.getItem('sb_scenes');
            if (sbScenes) {
                const scenes = JSON.parse(sbScenes);
                const sceneIdx = scenes.findIndex((s: any) => s.id === draft.id);
                if (sceneIdx >= 0) {
                    // Update existing scene content/title
                    scenes[sceneIdx].content = draft.content;
                    scenes[sceneIdx].title = draft.title; // Optional: Sync title if editor changes it
                    scenes[sceneIdx].wordCount = draft.content.trim().split(/\s+/).length;
                    scenes[sceneIdx].lastModified = Date.now();
                    localStorage.setItem('sb_scenes', JSON.stringify(scenes));
                }
            }
        } catch (e) {
            console.warn("Failed to sync with sb_scenes localStorage", e);
        }

        // 2. Save Cloud (Async)
        // We don't await this strictly to keep UI snappy, but for now we'll do it 
        // to ensure data safety before confirming "Safe".
        const payload: any = {
            id: draft.id,
            project_id: draft.projectId,
            chapter_id: draft.chapterId,
            title: draft.title,
            content: draft.content,
            notes: draft.notes,
            last_modified: draft.lastModified,
            version: draft.version
        };

        if (draft.googleDocId) payload.google_doc_id = draft.googleDocId;

        const { error } = await supabase.from('drafts').upsert(payload);

        if (error) {
            console.error("[Cloud] Sync failed:", error);
            return false; // Or user specific error handling
        } else {
            console.log(`[Cloud] Synced draft: ${draft.id}`);
        }

        return true;
    } catch (error) {
        console.error("Failed to auto-save draft:", error);
        return false;
    }
}

export async function getDraft(id: string) {
    // 1. Try local Dexie
    let local = await db.drafts.get(id);

    // 1b. If not in Dexie, check sb_scenes (LocalStorage)
    // This allows seamless opening of scenes created in Manuscript View
    if (!local) {
        try {
            const sbScenes = localStorage.getItem('sb_scenes');
            if (sbScenes) {
                const scenes = JSON.parse(sbScenes);
                const scene = scenes.find((s: any) => s.id === id);
                if (scene) {
                    console.log("[Local] Found scene in sb_scenes, hydrating draft.");
                    local = {
                        id: scene.id,
                        projectId: 'default',
                        chapterId: 'default',
                        title: scene.title,
                        content: scene.content || '',
                        notes: scene.note || '',
                        lastModified: scene.lastModified || Date.now(),
                        version: 1
                    };
                    // Save to Dexie for future ease
                    await db.drafts.put(local);
                }
            }
        } catch (e) {
            console.warn("Failed to check sb_scenes", e);
        }
    }

    // 2. If nothing local, try cloud (New Device Scenario)
    if (!local) {
        console.log("[Local] Cache miss, checking cloud...");
        const { data, error } = await supabase
            .from('drafts')
            .select('*')
            .eq('id', id)
            .single();

        if (data && !error) {
            console.log("[Cloud] Found data, hydrating local cache.");
            // Transform back to camelCase if needed, or straightforward mapping
            const cloudDraft: SceneDraft = {
                id: data.id,
                projectId: data.project_id,
                chapterId: data.chapter_id,
                title: data.title,
                content: data.content,
                notes: data.notes,
                lastModified: data.last_modified,
                version: data.version,
                googleDocId: data.google_doc_id
            };
            // Hydrate local
            await db.drafts.put(cloudDraft);
            return cloudDraft;
        }
    }

    return local;
}
