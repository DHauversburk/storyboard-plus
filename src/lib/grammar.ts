
export interface GrammarIssue {
    id: string;
    type: 'grammar' | 'style' | 'consistency' | 'typo';
    message: string;
    context: string;
    suggestion?: string;
    severity: 'critical' | 'warning' | 'info';
    index: number; // Character index in text
    length: number;
}

// --- Common Confused Words Rules ---
const CONFUSED_WORDS = [
    { pattern: /\b(should|could|would)\s+of\b/gi, suggestion: '$1 have', message: 'Did you mean "have"? "Of" is incorrect here.' },
    { pattern: /\b(a)\s+lot\b/gi, suggestion: 'a lot', message: '"Alot" is not a word.' }, // handled by spellcheck usually but good to catch
    { pattern: /\balot\b/gi, suggestion: 'a lot', message: '"Alot" is not a word.' },
    { pattern: /\birregardless\b/gi, suggestion: 'regardless', message: '"Irregardless" is non-standard. Use "regardless".' },
    { pattern: /\b(loose)\b/gi, check: (ctx: string) => ctx.match(/win or loose/i), message: 'Did you mean "lose" (opposite of win)?' },
    { pattern: /\b(affect|effect)\b/gi, message: 'Check usage: "Affect" is usually a verb, "Effect" is usually a noun.' }, // Context-free warning
    { pattern: /\b(their|there|they're)\b/gi, message: 'Double-check homophone usage.' }, // Generic warning for now
];

// --- US vs UK Pairs ---
const US_UK_PAIRS: [string, string][] = [
    ['color', 'colour'],
    ['flavor', 'flavour'],
    ['honor', 'honour'],
    ['neighbor', 'neighbour'],
    ['meter', 'metre'],
    ['theater', 'theatre'],
    ['defense', 'defence'],
    ['offense', 'offence'],
    ['realize', 'realise'],
    ['organize', 'organise'],
    ['analyze', 'analyse'],
    ['gray', 'grey'],
    ['license', 'licence'] // US noun/verb same, UK noun c verb s
];

export const checkGrammarAndMechanics = (text: string): GrammarIssue[] => {
    const issues: GrammarIssue[] = [];

    // 1. Confused Words / Common Errors
    CONFUSED_WORDS.forEach(rule => {
        let match;
        // Reset regex state if global
        const regex = new RegExp(rule.pattern);
        while ((match = regex.exec(text)) !== null) {
            // Optional context check function
            if (rule.check && !rule.check(text.substring(Math.max(0, match.index - 10), Math.min(text.length, match.index + 20)))) {
                continue;
            }

            issues.push({
                id: `confused-${match.index}`,
                type: 'grammar',
                message: rule.message,
                context: match[0],
                suggestion: typeof rule.suggestion === 'string' ? match[0].replace(regex, rule.suggestion) : undefined,
                severity: 'warning',
                index: match.index,
                length: match[0].length
            });
        }
    });

    // 2. Consistency Checks (US vs UK)
    let usCount = 0;
    let ukCount = 0;
    const foundUS: string[] = [];
    const foundUK: string[] = [];

    US_UK_PAIRS.forEach(([us, uk]) => {
        const usMatches = text.match(new RegExp(`\\b${us}\\b`, 'gi'));
        const ukMatches = text.match(new RegExp(`\\b${uk}\\b`, 'gi'));

        if (usMatches) {
            usCount += usMatches.length;
            if (!foundUS.includes(us)) foundUS.push(us);
        }
        if (ukMatches) {
            ukCount += ukMatches.length;
            if (!foundUK.includes(uk)) foundUK.push(uk);
        }
    });

    if (usCount > 0 && ukCount > 0) {
        // Mixed usage detected
        const dominant = usCount > ukCount ? 'US' : 'UK';
        const minority = usCount > ukCount ? foundUK : foundUS;

        issues.push({
            id: 'consistency-us-uk',
            type: 'consistency',
            message: `Mixed spelling standards detected (mostly ${dominant}).`,
            context: `Found: ${minority.slice(0, 3).join(', ')} vs ${dominant === 'US' ? foundUS.slice(0, 3).join(', ') : foundUK.slice(0, 3).join(', ')}`,
            severity: 'info',
            index: 0,
            length: 0
        });
    }

    // 3. Punctuation Mechanics
    // Double spaces
    const doubleSpaces = text.match(/\.  /g);
    if (doubleSpaces && doubleSpaces.length > 0) {
        issues.push({
            id: 'mech-double-space',
            type: 'style',
            message: `Found ${doubleSpaces.length} instances of double spaces after periods. Standard is single space.`,
            context: '.  ',
            suggestion: '. ',
            severity: 'info',
            index: 0,
            length: 0
        });
    }

    // Space before punctuation
    const spaceBeforePunc = text.match(/\s+[.,?!]/g);
    if (spaceBeforePunc) {
        issues.push({
            id: 'mech-space-before',
            type: 'typo',
            message: 'Remove space before punctuation.',
            context: spaceBeforePunc[0],
            severity: 'warning',
            index: 0,
            length: 0
        });
    }

    // 4. Repeated Words (Stuttering)
    const stutterRegex = /\b(\w+)\s+\1\b/gi;
    let stutterMatch;
    while ((stutterMatch = stutterRegex.exec(text)) !== null) {
        // Ignore "had had", "that that" which can be valid
        const word = stutterMatch[1].toLowerCase();
        if (word !== 'had' && word !== 'that') {
            issues.push({
                id: `stutter-${stutterMatch.index}`,
                type: 'typo',
                message: 'Repeated word.',
                context: stutterMatch[0],
                suggestion: stutterMatch[1], // Suggest keeping just one
                severity: 'warning',
                index: stutterMatch.index,
                length: stutterMatch[0].length
            });
        }
    }

    return issues;
};
