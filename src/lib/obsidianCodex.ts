// Obsidian Codex Integration Library
// Provides shared access to Obsidian vault files across the application

export interface ObsidianFile {
    name: string;
    content: string;
    path: string;
}

export interface ParsedCharacter {
    id: string;
    name: string;
    role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
    archetype: string;
    description: string;
    traits: string[];
    goals: string;
    flaws: string;
    relationships: { characterId: string; relationship: string }[];
    notes: string;
    source: 'obsidian' | 'local';
    sourcePath?: string;
}

export interface ParsedWorldEntry {
    id: string;
    name: string;
    category: 'location' | 'culture' | 'magic' | 'technology' | 'history' | 'creature' | 'organization' | 'item' | 'other';
    description: string;
    details: { label: string; value: string }[];
    connections: { entryId: string; relationship: string }[];
    tags: string[];
    notes: string;
    source: 'obsidian' | 'local';
    sourcePath?: string;
}

// Storage keys
const OBSIDIAN_FILES_KEY = 'sb_obsidian_files';

// Save Obsidian files to localStorage for cross-page access
export const saveObsidianFiles = (files: ObsidianFile[]): void => {
    localStorage.setItem(OBSIDIAN_FILES_KEY, JSON.stringify(files));
    // Dispatch event so other pages can react
    window.dispatchEvent(new CustomEvent('obsidian-files-updated', { detail: files }));
};

// Load Obsidian files from localStorage
export const loadObsidianFiles = (): ObsidianFile[] => {
    try {
        const saved = localStorage.getItem(OBSIDIAN_FILES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

// Parse markdown frontmatter
const parseFrontmatter = (content: string): Record<string, string> => {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};

    const frontmatter: Record<string, string> = {};
    const lines = frontmatterMatch[1].split('\n');

    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim().toLowerCase();
            const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
            frontmatter[key] = value;
        }
    });

    return frontmatter;
};

// Get content without frontmatter
const getBodyContent = (content: string): string => {
    return content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
};

// Detect if a file is a character based on path, frontmatter, or content
const isCharacterFile = (file: ObsidianFile): boolean => {
    const pathLower = file.path.toLowerCase();
    const nameLower = file.name.toLowerCase();
    const contentLower = file.content.toLowerCase();
    const frontmatter = parseFrontmatter(file.content);

    // Check path patterns
    if (pathLower.includes('character') || pathLower.includes('npc') || pathLower.includes('cast')) return true;

    // Check frontmatter type
    if (frontmatter.type === 'character' || frontmatter.category === 'character') return true;

    // Check for character-like headings
    if (contentLower.includes('## traits') || contentLower.includes('## personality') ||
        contentLower.includes('## background') || contentLower.includes('## appearance')) return true;

    return false;
};

// Detect if a file is a world/lore entry
const isWorldEntry = (file: ObsidianFile): boolean => {
    const pathLower = file.path.toLowerCase();
    const frontmatter = parseFrontmatter(file.content);

    // Check path patterns
    if (pathLower.includes('world') || pathLower.includes('lore') || pathLower.includes('location') ||
        pathLower.includes('culture') || pathLower.includes('magic') || pathLower.includes('history') ||
        pathLower.includes('creature') || pathLower.includes('organization') || pathLower.includes('item') ||
        pathLower.includes('place') || pathLower.includes('faction')) return true;

    // Check frontmatter type
    const type = (frontmatter.type || frontmatter.category || '').toLowerCase();
    if (['location', 'place', 'world', 'lore', 'culture', 'magic', 'creature', 'organization', 'item', 'history', 'technology'].includes(type)) return true;

    return false;
};

// Detect character role from content
const detectRole = (content: string, frontmatter: Record<string, string>): ParsedCharacter['role'] => {
    const contentLower = content.toLowerCase();
    const role = (frontmatter.role || '').toLowerCase();

    if (role.includes('protagonist') || role.includes('hero') || role.includes('main')) return 'protagonist';
    if (role.includes('antagonist') || role.includes('villain')) return 'antagonist';
    if (role.includes('supporting') || role.includes('secondary')) return 'supporting';
    if (role.includes('minor') || role.includes('background')) return 'minor';

    // Content-based detection
    if (contentLower.includes('protagonist') || contentLower.includes('main character')) return 'protagonist';
    if (contentLower.includes('antagonist') || contentLower.includes('villain')) return 'antagonist';

    return 'supporting';
};

// Detect world entry category
const detectWorldCategory = (file: ObsidianFile, frontmatter: Record<string, string>): ParsedWorldEntry['category'] => {
    const pathLower = file.path.toLowerCase();
    const contentLower = file.content.toLowerCase();
    const category = (frontmatter.category || frontmatter.type || '').toLowerCase();

    // 1. Explicit Frontmatter (Highest Priority)
    if (category.includes('location') || category.includes('place') || category.includes('city') || category.includes('town') || category.includes('country') || category.includes('planet') || category.includes('realm')) return 'location';
    if (category.includes('virtual') || category.includes('simulation') || category.includes('vr world') || category.includes('server')) return 'location'; // VR Locations matches

    if (category.includes('culture') || category.includes('religion') || category.includes('society')) return 'culture';
    if (category.includes('magic') || category.includes('spell') || category.includes('mana')) return 'magic';
    if (category.includes('tech') || category.includes('device') || category.includes('gadget') || category.includes('hardware') || category.includes('software')) return 'technology';
    if (category.includes('history') || category.includes('event')) return 'history';
    if (category.includes('creature') || category.includes('monster') || category.includes('species') || category.includes('beast')) return 'creature';
    if (category.includes('org') || category.includes('faction') || category.includes('group') || category.includes('guild')) return 'organization';
    if (category.includes('item') || category.includes('artifact') || category.includes('weapon') || category.includes('tool')) return 'item';

    // 2. Path / Filename Keywords
    // Specific VR/Sci-Fi handling
    if (pathLower.includes('virtual reality') || pathLower.includes('simulation') || pathLower.includes('cyber') || pathLower.includes('vr')) {
        if (pathLower.includes('world') || pathLower.includes('space') || pathLower.includes('room') || pathLower.includes('level') || pathLower.includes('zone') || pathLower.includes('city')) return 'location';
        return 'technology'; // Default to tech
    }

    if (pathLower.includes('location') || pathLower.includes('place') || pathLower.includes('city') || pathLower.includes('map') || pathLower.includes('world') || pathLower.includes('realm') || pathLower.includes('planet')) return 'location';
    if (pathLower.includes('culture') || pathLower.includes('religion')) return 'culture';
    if (pathLower.includes('magic') || pathLower.includes('spell') || pathLower.includes('arcane')) return 'magic';
    if (pathLower.includes('tech') || pathLower.includes('sci-fi') || pathLower.includes('future')) return 'technology';
    if (pathLower.includes('history') || pathLower.includes('timeline')) return 'history';
    if (pathLower.includes('creature') || pathLower.includes('bestiary') || pathLower.includes('monster')) return 'creature';
    if (pathLower.includes('org') || pathLower.includes('faction') || pathLower.includes('guild')) return 'organization';
    if (pathLower.includes('item') || pathLower.includes('artifact') || pathLower.includes('object')) return 'item';

    // 3. Content Analysis
    if (contentLower.includes('population') || contentLower.includes('climate') || contentLower.includes('located in') || contentLower.includes('capital city') || contentLower.includes('coordinates')) return 'location';
    if (contentLower.includes('tradition') || contentLower.includes('customs') || contentLower.includes('belief')) return 'culture';
    if (contentLower.includes('casting time') || contentLower.includes('spell components') || contentLower.includes('mana cost')) return 'magic';
    if (contentLower.includes('software') || contentLower.includes('operating system') || contentLower.includes('user interface') || contentLower.includes('circuit')) return 'technology';

    return 'other';
};

// Extract traits from content
const extractTraits = (content: string): string[] => {
    const traits: string[] = [];

    // Look for traits section
    const traitsMatch = content.match(/##\s*(?:traits|personality)\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (traitsMatch) {
        const lines = traitsMatch[1].split('\n');
        lines.forEach(line => {
            const bulletMatch = line.match(/^[-*•]\s*(.+)/);
            if (bulletMatch) {
                traits.push(bulletMatch[1].trim());
            }
        });
    }

    // Also check frontmatter for tags
    const frontmatter = parseFrontmatter(content);
    if (frontmatter.traits) {
        frontmatter.traits.split(',').forEach(t => traits.push(t.trim()));
    }

    return traits.slice(0, 10); // Limit to 10 traits
};

// Extract tags from content
const extractTags = (content: string): string[] => {
    const tags: string[] = [];
    const frontmatter = parseFrontmatter(content);

    // From frontmatter
    if (frontmatter.tags) {
        frontmatter.tags.split(',').forEach(t => tags.push(t.trim()));
    }

    // From hashtags in content
    const hashtagMatches = content.match(/#[a-zA-Z][a-zA-Z0-9_-]*/g);
    if (hashtagMatches) {
        hashtagMatches.forEach(tag => {
            const cleaned = tag.slice(1);
            if (!tags.includes(cleaned)) tags.push(cleaned);
        });
    }

    return tags.slice(0, 10);
};

// Parse a file into a Character
export const parseCharacterFromFile = (file: ObsidianFile): ParsedCharacter => {
    const frontmatter = parseFrontmatter(file.content);
    const body = getBodyContent(file.content);
    const name = file.name.replace('.md', '');

    return {
        id: `obsidian_${file.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: frontmatter.name || frontmatter.title || name,
        role: detectRole(file.content, frontmatter),
        archetype: frontmatter.archetype || 'The Hero',
        description: body.split('\n\n')[0] || '',
        traits: extractTraits(file.content),
        goals: frontmatter.goals || frontmatter.motivation || '',
        flaws: frontmatter.flaws || frontmatter.weakness || '',
        relationships: [],
        notes: body,
        source: 'obsidian',
        sourcePath: file.path
    };
};

// Parse a file into a World Entry
export const parseWorldEntryFromFile = (file: ObsidianFile): ParsedWorldEntry => {
    const frontmatter = parseFrontmatter(file.content);
    const body = getBodyContent(file.content);
    const name = file.name.replace('.md', '');

    // Extract details from frontmatter
    const details: { label: string; value: string }[] = [];
    const excludeKeys = ['type', 'category', 'tags', 'name', 'title'];
    Object.entries(frontmatter).forEach(([key, value]) => {
        if (!excludeKeys.includes(key.toLowerCase()) && value) {
            details.push({ label: key.charAt(0).toUpperCase() + key.slice(1), value });
        }
    });

    return {
        id: `obsidian_${file.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: frontmatter.name || frontmatter.title || name,
        category: detectWorldCategory(file, frontmatter),
        description: body,
        details,
        connections: [],
        tags: extractTags(file.content),
        notes: '',
        source: 'obsidian',
        sourcePath: file.path
    };
};

// Get all characters from Obsidian files
export const getCharactersFromObsidian = (): ParsedCharacter[] => {
    const files = loadObsidianFiles();
    return files
        .filter(isCharacterFile)
        .map(parseCharacterFromFile);
};

// Get all world entries from Obsidian files
export const getWorldEntriesFromObsidian = (): ParsedWorldEntry[] => {
    const files = loadObsidianFiles();
    return files
        .filter(isWorldEntry)
        .map(parseWorldEntryFromFile);
};
