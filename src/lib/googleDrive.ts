import { supabase } from '@/lib/supabase';

// Types for the Google libraries
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

export const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents.readonly';
export const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/docs/v1/rest'
];

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// 1. Load the scripts
export const loadGoogleScripts = () => {
    return new Promise<void>((resolve) => {
        const script1 = document.createElement('script');
        script1.src = 'https://apis.google.com/js/api.js';
        script1.onload = () => {
            window.gapi.load('client', async () => {
                // We don't init client here yet because we need the dynamic keys from storage
                gapiInited = true;
                if (gisInited) resolve();
            });
        };
        document.body.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.onload = () => {
            gisInited = true;
            if (gapiInited) resolve();
        };
        document.body.appendChild(script2);
    });
};

// 2. Initialize the libraries with the User's Keys
export const initializeGoogleApi = async (apiKey: string, clientId: string) => {
    if (!gapiInited || !gisInited) throw new Error("Scripts not loaded");

    await window.gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: DISCOVERY_DOCS,
    });

    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: any) => {
            if (response.error !== undefined) {
                throw (response);
            }
            console.log("Google Auth Success!", response);
            // Token is auto-stored in gapi.client
        },
    });

    return true;
};

// 3. Trigger Login
export const handleGoogleLogin = () => {
    if (!tokenClient) throw new Error("Google API not initialized. Check your settings.");

    // Request an access token
    tokenClient.requestAccessToken({ prompt: 'consent' });
};

// 4. Drive Operations
export const listFilesAndFolders = async (folderId: string = 'root') => {
    try {
        const response = await window.gapi.client.drive.files.list({
            'pageSize': 1000,
            'fields': "nextPageToken, files(id, name, mimeType, modifiedTime)",
            'q': `'${folderId}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/vnd.google-apps.document') and trashed = false`,
            'orderBy': 'folder, name' // Alphabetical is easier to browse than modified time
        });
        return response.result.files;
    } catch (err) {
        console.error("Error listing files", err);
        return [];
    }
};

// Keep legacy for compatibility if needed, but wrapper to root
export const listDocuments = async () => {
    return listFilesAndFolders('root');
};


// --- HTML Extraction Helpers ---

const getTextRunHtml = (textRun: any) => {
    let text = textRun.content || "";
    const style = textRun.textStyle;

    // Sanitize basic chars to prevent HTML injection from the doc text itself
    text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Replace newlines with <br> if strictly needed, but textRun.content usually ends with \n. 
    // We strip the trailing \n as the block tag handles the break.
    text = text.replace(/\n$/, "");

    if (style) {
        if (style.bold) text = `<strong>${text}</strong>`;
        if (style.italic) text = `<em>${text}</em>`;
        if (style.underline) text = `<u>${text}</u>`;
        if (style.strikethrough) text = `<s>${text}</s>`;
        if (style.link && style.link.url) text = `<a href="${style.link.url}" target="_blank">${text}</a>`;
    }
    return text;
};

const getParagraphHtml = (paragraph: any) => {
    let innerHtml = "";

    // 1. Compile inner text with styles
    paragraph.elements.forEach((el: any) => {
        if (el.textRun) {
            innerHtml += getTextRunHtml(el.textRun);
        } else if (el.pageBreak) {
            innerHtml += "<br class='page-break' />";
        } else if (el.inlineObjectElement) {
            // Placeholder for images
            innerHtml += "<span class='image-placeholder'>[Image]</span>";
        }
    });

    // 2. Wrap in proper tag based on style logic
    const styleType = paragraph.paragraphStyle?.namedStyleType;
    let tag = "p";
    let className = "";
    let style = "";

    switch (styleType) {
        case 'TITLE': tag = "h1"; className = "doc-title"; break;
        case 'SUBTITLE': tag = "p"; className = "doc-subtitle"; break;
        case 'HEADING_1': tag = "h1"; break;
        case 'HEADING_2': tag = "h2"; break;
        case 'HEADING_3': tag = "h3"; break;
        case 'HEADING_4': tag = "h4"; break;
        case 'HEADING_5': tag = "h5"; break;
        case 'HEADING_6': tag = "h6"; break;
        // Map NORMAL_TEXT to p
        default: tag = "p";
    }

    // Handle Lists (Basic)
    if (paragraph.bullet) {
        // Use a styled P to simulate list item for simplicity in contentEditable without complex nesting
        className += " list-item";
        style += `margin-left: ${(paragraph.bullet.nestingLevel || 0) * 20}px;`;
        innerHtml = `• ${innerHtml}`;
    }

    const styleAttr = style ? ` style="${style}"` : "";
    const classAttr = className ? ` class="${className.trim()}"` : "";

    return `<${tag}${classAttr}${styleAttr}>${innerHtml}</${tag}>`;
};

const getTableHtml = (table: any) => {
    let rowsHtml = "";
    table.tableRows.forEach((row: any) => {
        let cellsHtml = "";
        row.tableCells.forEach((cell: any) => {
            cellsHtml += `<td style="border: 1px solid #444; padding: 4px;">${extractHtmlFromContent(cell.content)}</td>`;
        });
        rowsHtml += `<tr>${cellsHtml}</tr>`;
    });
    return `<table style="border-collapse: collapse; width: 100%; border: 1px solid #444; margin: 10px 0;"><tbody>${rowsHtml}</tbody></table>`;
};

// Helper to extract HTML from a structural element list
const extractHtmlFromContent = (content: any[]) => {
    let html = "";
    if (content) {
        content.forEach((element: any) => {
            if (element.paragraph) {
                html += getParagraphHtml(element.paragraph);
            } else if (element.table) {
                html += getTableHtml(element.table);
            } else if (element.sectionBreak) {
                // Ignore or add divider
                html += "<hr class='section-break' />";
            }
        });
    }
    return html;
};

export const readDocumentContent = async (docId: string) => {
    try {
        const response = await window.gapi.client.docs.documents.get({
            documentId: docId,
        });
        const doc = response.result;

        // Handle Google Doc Tabs
        if (doc.tabs && doc.tabs.length > 0) {
            const tabs = doc.tabs.map((tab: any) => ({
                id: tab.tabProperties.tabId,
                title: tab.tabProperties.title,
                content: extractHtmlFromContent(tab.documentTab.body.content)
            }));
            return {
                title: doc.title,
                isTabs: true,
                tabs: tabs,
                content: tabs[0].content // Default to first tab
            };
        }

        // Standard Doc (No Tabs)
        return {
            title: doc.title,
            revisionId: doc.revisionId,
            isTabs: false,
            tabs: [{ id: 'default', title: 'Main', content: extractHtmlFromContent(doc.body.content) }],
            content: extractHtmlFromContent(doc.body.content)
        };

    } catch (err) {
        console.error("Error reading doc", err);
        throw err;
    }
};

// Deprecated local parser, functionality moved to extractHtmlFromContent
const parseGoogleDocContent = (doc: any) => {
    return extractHtmlFromContent(doc.body.content);
};

// ... existing createDocument ...
export const createDocument = async (title: string, content: string) => {
    // 1. Create file 
    const fileMetadata = {
        name: title,
        mimeType: 'application/vnd.google-apps.document'
    };

    // Note: Creating with content requires a multipart upload or create then update.
    // For simplicity v3, we create blank then update is better, but 'create' supports basic.
    try {
        const file = await window.gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });

        // 2. Insert content using Docs API
        if (file.result.id) {
            const requests = [{
                insertText: {
                    text: content,
                    location: {
                        index: 1, // Start of doc
                    },
                },
            }];

            await window.gapi.client.docs.documents.batchUpdate({
                documentId: file.result.id,
                resource: { requests },
            });

            return file.result.id;
        }
    } catch (err) {
        console.error("Failed to create doc", err);
        throw err;
    }
};

export const updateDocument = async (docId: string, content: string, lastKnownRevisionId?: string) => {
    try {
        console.log(`[Drive] Updating ${docId}, lastKnownRev: ${lastKnownRevisionId}`);

        // 1. Fetch current state to get range and current Revision
        const doc = await window.gapi.client.docs.documents.get({
            documentId: docId,
            fields: 'body(content), revisionId'
        });

        const currentRevisionId = doc.result.revisionId;
        const bodyContent = doc.result.body.content;
        const contentLength = bodyContent[bodyContent.length - 1].endIndex;

        // 2. CONFLICT CHECK
        // If we provided a lastKnownRevisionId, and it doesn't match the server, STOP.
        if (lastKnownRevisionId && lastKnownRevisionId !== currentRevisionId) {
            console.warn(`[Drive Conflict] Local Rev: ${lastKnownRevisionId} vs Server Rev: ${currentRevisionId}`);
            throw new Error(`CONFLICT: The document has been modified on the server (Rev ${currentRevisionId}) since you opened it (Rev ${lastKnownRevisionId}). Please copy your changes and refresh.`);
        }

        // 3. Prepare Update
        // Warning: This is a DESTRUCTIVE update (Replace All)
        const requests = [];

        // Only delete if there is content (index > 2 because index 1 is start, usually small)
        if (contentLength > 2) {
            requests.push({
                deleteContentRange: {
                    range: {
                        startIndex: 1,
                        endIndex: contentLength - 1,
                    }
                }
            });
        }

        requests.push({
            insertText: {
                text: content,
                location: {
                    index: 1,
                },
            },
        });

        const updateResponse = await window.gapi.client.docs.documents.batchUpdate({
            documentId: docId,
            resource: {
                requests,
                // Optional: We can enforce strict write control here too
                writeControl: lastKnownRevisionId ? { requiredRevisionId: lastKnownRevisionId } : undefined
            },
        });

        console.log(`[Drive] Update Success. New Rev: ${updateResponse.result.revisionId}`);
        return updateResponse.result.revisionId; // Return new rev ID for local state update

    } catch (err: any) {
        console.error("Failed to update doc", err);
        throw err;
    }
};

// Get Config Helper
export const getDriveConfig = () => {
    return {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id') || '',
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || localStorage.getItem('google_api_key') || '',
    };
};
