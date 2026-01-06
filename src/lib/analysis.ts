
// Helper to count syllables in a word
export const countSyllables = (word: string): number => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
};

export interface EditorInsight {
    type: 'warning' | 'suggestion' | 'praise';
    message: string;
    context: string;
}

// Expert Editor Logic
const COMMON_CLICHES = [
    "dark and stormy night", "better late than never", "actions speak louder than words", "at the end of the day",
    "bite the bullet", "break the ice", "clam up", "crystal clear", "cut to the chase", "easier said than done",
    "fit as a fiddle", "in a nutshell", "kiss and tell", "last but not least", "leave no stone unturned",
    "light at the end of the tunnel", "method to my madness", "needle in a haystack", "on cloud nine",
    "once in a blue moon", "piece of cake", "pulling my leg", "rule of thumb", "scared out of my wits",
    "second to none", "spill the beans", "the calm before the storm", "through thick and thin", "time flies",
    "under the weather", "ups and downs", "walking on eggshells", "when pigs fly", "wild goose chase",
    "written in stone", "read between the lines", "play it by ear", "hit the nail on the head",
    "let the cat out of the bag", "make a long story short", "miss the boat", "no pain, no gain",
    "on the ball", "see eye to eye", "sit on the fence", "speak of the devil",
    "take with a grain of salt", "taste of your own medicine", "to each his own"
];

export const generateEditorInsights = (text: string): EditorInsight[] => {
    const insights: EditorInsight[] = [];

    // 1. Weak Verbs / Adverbs
    const adverbs = (text.match(/\b\w+ly\b/gi) || []);
    if (adverbs.length > 5) {
        insights.push({
            type: 'warning',
            message: 'High usage of adverbs detected.',
            context: `Found ${adverbs.length} adverbs (e.g., "${adverbs[0]}"). Stronger verbs make for punchier prose.`
        });
    }

    // 2. Passive Voice
    const passiveMatches = text.match(/\b(was|were|is|are|been)\s+\w+ed\b/gi) || [];
    if (passiveMatches.length > 3) {
        insights.push({
            type: 'warning',
            message: 'Potential passive voice misuse.',
            context: `Examples: "${passiveMatches[0]}", "${passiveMatches[1] || '...'}". Active voice drives the action forward.`
        });
    }

    // 3. Sentence Variety
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
        const avgLen = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;
        if (avgLen > 25) {
            insights.push({
                type: 'suggestion',
                message: 'Sentences are very long on average.',
                context: 'Consider breaking up complex thoughts to improve pacing and readability.'
            });
        } else if (avgLen < 8 && sentences.length > 5) {
            insights.push({
                type: 'suggestion',
                message: 'Staccato pacing detected.',
                context: 'Many short sentences in a row. Good for action, but can feel choppy in exposition.'
            });
        }
    }

    // 4. Weasel Words
    const weasels = ['very', 'really', 'seems', 'almost', 'suddenly'];
    const foundWeasels = weasels.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(text));
    if (foundWeasels.length > 0) {
        insights.push({
            type: 'suggestion',
            message: 'Filler words detected.',
            context: `Review usage of: ${foundWeasels.join(', ')}.`
        });
    }

    // 5. Repetition/Echo Catcher - Find words appearing multiple times in close proximity
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 4); // Only check words > 4 chars
    const echoDistance = 50; // Words within this distance are considered "echoes"
    const wordPositions: { [key: string]: number[] } = {};

    words.forEach((word, idx) => {
        const cleanWord = word.replace(/[^a-z]/g, '');
        if (cleanWord.length > 4) {
            if (!wordPositions[cleanWord]) wordPositions[cleanWord] = [];
            wordPositions[cleanWord].push(idx);
        }
    });

    const echoes: string[] = [];
    Object.entries(wordPositions).forEach(([word, positions]) => {
        if (positions.length >= 2) {
            for (let i = 1; i < positions.length; i++) {
                if (positions[i] - positions[i - 1] < echoDistance) {
                    if (!echoes.includes(word)) echoes.push(word);
                }
            }
        }
    });

    if (echoes.length > 0 && echoes.length <= 5) {
        insights.push({
            type: 'suggestion',
            message: 'Word echoes detected.',
            context: `These words repeat in close proximity: "${echoes.slice(0, 3).join('", "')}". Consider varying vocabulary.`
        });
    } else if (echoes.length > 5) {
        insights.push({
            type: 'warning',
            message: 'Significant word repetition found.',
            context: `${echoes.length} words echo nearby. Top examples: "${echoes.slice(0, 4).join('", "')}".`
        });
    }

    // 6. Cliché Hunter
    const foundCliches = COMMON_CLICHES.filter(c => new RegExp(`\\b${c}\\b`, 'i').test(text));
    if (foundCliches.length > 0) {
        insights.push({
            type: 'warning',
            message: 'Clichés detected.',
            context: `Found ${foundCliches.length} clichés: "${foundCliches.slice(0, 3).join('", "')}"${foundCliches.length > 3 ? '...' : ''}. Try to rephrase for originality.`
        });
    }

    // 7. Sticky Sentence Analysis (Glue Words)
    const glueWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
        'it', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your',
        'his', 'her', 'its', 'our', 'their', 'and', 'but', 'or', 'so', 'if', 'when', 'than', 'then']);

    const allSentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let stickySentences = 0;

    allSentences.forEach(sentence => {
        const sentenceWords = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        if (sentenceWords.length < 5) return; // Skip very short sentences
        const glueCount = sentenceWords.filter(w => glueWords.has(w.replace(/[^a-z]/g, ''))).length;
        const glueRatio = glueCount / sentenceWords.length;
        if (glueRatio > 0.45) stickySentences++;
    });

    if (stickySentences >= 3) {
        insights.push({
            type: 'suggestion',
            message: `${stickySentences} sticky sentences found.`,
            context: 'These sentences have 45%+ glue words (the, is, to, etc.). They may feel sluggish to read.'
        });
    }



    // 8. Dialogue vs. Narrative Ratio
    const dialogueMatches = text.match(/"[^"]+"/g) || [];
    const dialogueWords = dialogueMatches.join(' ').split(/\s+/).filter(w => w.length > 0).length;
    const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;

    if (totalWords > 100) {
        const dialogueRatio = dialogueWords / totalWords;
        if (dialogueRatio < 0.1 && dialogueMatches.length > 0) {
            insights.push({
                type: 'suggestion',
                message: 'Low dialogue ratio.',
                context: `Only ${Math.round(dialogueRatio * 100)}% dialogue. Consider adding more character voice.`
            });
        } else if (dialogueRatio > 0.7) {
            insights.push({
                type: 'suggestion',
                message: 'High dialogue ratio.',
                context: `${Math.round(dialogueRatio * 100)}% dialogue. Balance with narrative description.`
            });
        }
    }

    // 9. Sensory Check - Analyze usage of sensory language
    const sensoryWords = {
        sight: ['see', 'saw', 'look', 'looked', 'watch', 'watched', 'gaze', 'gazed', 'stare', 'stared',
            'glimpse', 'glance', 'bright', 'dark', 'color', 'shadow', 'light', 'dim', 'gleam', 'sparkle'],
        sound: ['hear', 'heard', 'listen', 'listened', 'sound', 'noise', 'whisper', 'shout', 'scream',
            'echo', 'loud', 'quiet', 'silent', 'ring', 'buzz', 'crack', 'boom', 'hum', 'murmur', 'roar'],
        smell: ['smell', 'sniff', 'scent', 'aroma', 'stench', 'odor', 'fragrance', 'stink', 'whiff',
            'perfume', 'musty', 'fresh', 'pungent', 'foul', 'sweet-smelling'],
        taste: ['taste', 'tasted', 'flavor', 'sweet', 'sour', 'bitter', 'salty', 'savory', 'delicious',
            'bland', 'spicy', 'tangy', 'mouth-watering', 'swallow', 'chew'],
        touch: ['feel', 'felt', 'touch', 'touched', 'grip', 'gripped', 'soft', 'hard', 'rough', 'smooth',
            'cold', 'warm', 'hot', 'wet', 'dry', 'sharp', 'tender', 'prickly', 'silky', 'bumpy']
    };

    const textLower = text.toLowerCase();
    const sensoryUsage: { [key: string]: number } = {};
    let totalSensory = 0;

    Object.entries(sensoryWords).forEach(([sense, words]) => {
        let count = 0;
        words.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = textLower.match(regex);
            if (matches) count += matches.length;
        });
        sensoryUsage[sense] = count;
        totalSensory += count;
    });

    if (totalWords > 200 && totalSensory < 5) {
        insights.push({
            type: 'suggestion',
            message: 'Limited sensory language.',
            context: 'Consider adding more sight, sound, smell, taste, or touch words for immersion.'
        });
    } else if (totalWords > 200) {
        const missingSenses = Object.entries(sensoryUsage)
            .filter(([, count]) => count === 0)
            .map(([sense]) => sense);
        if (missingSenses.length >= 3) {
            insights.push({
                type: 'suggestion',
                message: 'Unbalanced sensory palette.',
                context: `Missing: ${missingSenses.join(', ')}. Try engaging more senses.`
            });
        }
    }

    // 10. POV (Point of View) Check - Detect potential head-hopping
    const firstPersonPronouns = ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves'];
    const secondPersonPronouns = ['you', 'your', 'yours', 'yourself', 'yourselves'];
    const thirdPersonPronouns = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
        'they', 'them', 'their', 'theirs', 'themselves'];

    const povWords = textLower.split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
    const firstPersonCount = povWords.filter(w => firstPersonPronouns.includes(w)).length;
    const secondPersonCount = povWords.filter(w => secondPersonPronouns.includes(w)).length;
    const thirdPersonCount = povWords.filter(w => thirdPersonPronouns.includes(w)).length;

    const povCounts = [
        { name: '1st person', count: firstPersonCount },
        { name: '2nd person', count: secondPersonCount },
        { name: '3rd person', count: thirdPersonCount }
    ].filter(p => p.count > 0).sort((a, b) => b.count - a.count);

    if (povCounts.length >= 2 && povCounts[1].count > 5) {
        insights.push({
            type: 'warning',
            message: 'Potential POV shift detected.',
            context: `Mixing ${povCounts[0].name} (${povCounts[0].count}) and ${povCounts[1].name} (${povCounts[1].count}) pronouns.`
        });
    }

    // 11. Punctuation Verification
    const punctuationIssues: string[] = [];

    // Check for dialogue ending without proper punctuation inside quotes
    const badDialogueEndings = text.match(/"[^"]*[a-zA-Z]"/g);
    if (badDialogueEndings && badDialogueEndings.length > 0) {
        punctuationIssues.push('dialogue missing end punctuation');
    }

    // Check for comma before dialogue tag (should be: "Hello," she said)
    const missedDialogueComma = text.match(/[a-zA-Z]"\s+(he|she|they|I|we|it)\s+(said|asked|replied|whispered|shouted)/gi);
    if (missedDialogueComma && missedDialogueComma.length > 0) {
        punctuationIssues.push('missing comma before dialogue tag');
    }

    // Check for potential run-on sentences (very long without commas)
    const longNoPunctuation = allSentences.filter(s => {
        const words = s.trim().split(/\s+/).length;
        const commas = (s.match(/,/g) || []).length;
        return words > 30 && commas === 0;
    });
    if (longNoPunctuation.length > 0) {
        punctuationIssues.push(`${longNoPunctuation.length} potential run-on sentence(s)`);
    }

    // Check for double spaces
    const doubleSpaces = (text.match(/  +/g) || []).length;
    if (doubleSpaces > 3) {
        punctuationIssues.push(`${doubleSpaces} double spaces`);
    }

    if (punctuationIssues.length > 0) {
        insights.push({
            type: 'suggestion',
            message: 'Punctuation issues detected.',
            context: punctuationIssues.slice(0, 3).join(', ') + '.'
        });
    }

    if (insights.length === 0 && text.length > 100) {
        insights.push({
            type: 'praise',
            message: 'Clean draft!',
            context: 'No obvious structural issues found in this pass.'
        });
    }

    return insights;
};

export interface ReadingStats {
    fkGrade: string;
    stdDev: string;
    pacingScore: number;
    wordCount: number;
    sentenceCount: number;
    adverbCount: number;
    passiveCount: number;
    readTimeMinutes: number;
}

export const calculateReadingStats = (text: string): ReadingStats | null => {
    if (!text) return null;

    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return null;

    const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

    // 1. Flesch-Kincaid Grade Level
    // Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
    const wordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const syllablesPerWord = words.length > 0 ? totalSyllables / words.length : 0;
    const fkGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

    // 2. Sentence Length Standard Deviation (Narratability)
    let stdDev = 0;
    if (sentences.length > 0) {
        const sentenceLengths = sentences.map((s) => s.split(' ').length);
        const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length;
        const variance = sentenceLengths.map((len) => Math.pow(len - avgSentenceLength, 2)).reduce((a, b) => a + b, 0) / sentences.length;
        stdDev = Math.sqrt(variance);
    }

    // 3. Pacing
    const pacingScore = words.length / (paragraphs.length || 1);

    const adverbs = words.filter((w) => w.endsWith('ly')).length;
    const passiveVoice = (text.match(/\b(am|are|is|was|were|be|been|being)\s+\w+ed\b/gi) || []).length;

    return {
        fkGrade: Math.max(0, fkGrade).toFixed(1),
        stdDev: stdDev.toFixed(1),
        pacingScore: Math.round(pacingScore),
        wordCount: words.length,
        sentenceCount: sentences.length,
        adverbCount: adverbs,
        passiveCount: passiveVoice,
        readTimeMinutes: Math.ceil(words.length / 250)
    };
};

export const findContextMatches = (text: string, files: { name: string, content: string }[]): { name: string, content: string }[] => {
    if (!files.length || !text) return [];

    const found: { name: string, content: string }[] = [];
    files.forEach(file => {
        const nameNoExt = file.name.replace('.md', '');
        if (new RegExp(`\\b${nameNoExt}\\b`, 'i').test(text)) {
            if (!found.find(f => f.name === file.name)) {
                found.push(file);
            }
        }
    });
    return found;
};

export const analyzeSentenceLengths = (text: string): number[] => {
    return text.split(/[.!?]+/)
        .map(s => s.trim().split(/\s+/).length)
        .filter(len => len > 0);
};

// Pacing analysis - returns word count per paragraph with metadata
export interface ParagraphPacing {
    words: number;
    sentences: number;
    avgSentenceLen: number;
    isDialogue: boolean; // > 50% dialogue
    intensity: 'slow' | 'medium' | 'fast'; // based on avg sentence length
}

export const analyzeParagraphPacing = (text: string): ParagraphPacing[] => {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

    return paragraphs.map(para => {
        const words = para.trim().split(/\s+/).filter(w => w.length > 0);
        const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLen = sentences.length > 0 ? words.length / sentences.length : words.length;

        // Check if mostly dialogue
        const dialogueMatches = para.match(/"[^"]+"/g) || [];
        const dialogueWords = dialogueMatches.join(' ').split(/\s+/).length;
        const isDialogue = words.length > 0 && (dialogueWords / words.length) > 0.5;

        // Intensity based on average sentence length
        let intensity: 'slow' | 'medium' | 'fast' = 'medium';
        if (avgSentenceLen < 10) intensity = 'fast';
        else if (avgSentenceLen > 20) intensity = 'slow';

        return {
            words: words.length,
            sentences: sentences.length,
            avgSentenceLen,
            isDialogue,
            intensity
        };
    });
};

// Built-in thesaurus for common overused words
const SYNONYM_MAP: Record<string, string[]> = {
    // Common "said" replacements
    said: ['replied', 'answered', 'responded', 'stated', 'declared', 'muttered', 'whispered', 'shouted', 'exclaimed', 'murmured'],
    asked: ['inquired', 'questioned', 'queried', 'wondered', 'probed', 'requested'],
    // Emotion words
    happy: ['joyful', 'elated', 'content', 'pleased', 'delighted', 'thrilled', 'cheerful', 'ecstatic'],
    sad: ['melancholy', 'sorrowful', 'dejected', 'gloomy', 'mournful', 'forlorn', 'downcast'],
    angry: ['furious', 'enraged', 'irate', 'livid', 'incensed', 'outraged', 'wrathful'],
    scared: ['terrified', 'frightened', 'petrified', 'alarmed', 'panicked', 'horrified'],
    // Movement words
    walked: ['strolled', 'ambled', 'paced', 'strode', 'trudged', 'marched', 'sauntered', 'wandered'],
    ran: ['sprinted', 'dashed', 'bolted', 'rushed', 'raced', 'hurried', 'fled'],
    looked: ['gazed', 'glanced', 'stared', 'peered', 'observed', 'scrutinized', 'examined'],
    // Descriptive words
    big: ['enormous', 'massive', 'immense', 'vast', 'huge', 'gigantic', 'colossal'],
    small: ['tiny', 'minute', 'petite', 'minuscule', 'compact', 'diminutive'],
    good: ['excellent', 'superb', 'outstanding', 'remarkable', 'exceptional', 'splendid'],
    bad: ['terrible', 'awful', 'dreadful', 'atrocious', 'horrendous', 'abysmal'],
    nice: ['pleasant', 'lovely', 'delightful', 'agreeable', 'charming', 'wonderful'],
    beautiful: ['gorgeous', 'stunning', 'breathtaking', 'exquisite', 'radiant', 'magnificent'],
    // Common weak words
    very: ['extremely', 'incredibly', 'remarkably', 'exceptionally', 'tremendously', 'immensely'],
    really: ['genuinely', 'truly', 'actually', 'absolutely', 'certainly', 'definitely'],
    just: ['simply', 'merely', 'only', 'exactly', 'precisely'],
    thing: ['object', 'item', 'matter', 'element', 'aspect', 'detail'],
    things: ['objects', 'items', 'matters', 'elements', 'aspects', 'details'],
    // Feeling/sensing
    felt: ['sensed', 'perceived', 'experienced', 'noticed', 'detected'],
    saw: ['witnessed', 'observed', 'noticed', 'spotted', 'glimpsed', 'perceived'],
    heard: ['detected', 'perceived', 'caught', 'discerned', 'distinguished']
};

export const getSynonyms = (word: string): string[] => {
    const lowerWord = word.toLowerCase().trim();
    return SYNONYM_MAP[lowerWord] || [];
};

export const getOverusedWords = (text: string): { word: string; count: number; synonyms: string[] }[] => {
    const words = text.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
    const wordCounts: Record<string, number> = {};

    words.forEach(word => {
        if (SYNONYM_MAP[word]) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    });

    return Object.entries(wordCounts)
        .filter(([, count]) => count >= 2)
        .map(([word, count]) => ({ word, count, synonyms: SYNONYM_MAP[word] }))
        .sort((a, b) => b.count - a.count);
};

// --- Sentiment Analysis ---

const POSITIVE_WORDS = new Set([
    'love', 'joy', 'happy', 'laugh', 'smile', 'hope', 'peace', 'warm', 'light', 'bright',
    'friend', 'good', 'great', 'excellent', 'success', 'win', 'triumph', 'safe', 'comfort',
    'beauty', 'beautiful', 'sweet', 'kind', 'gentle', 'strong', 'hero', 'brave', 'courage',
    'thrill', 'excite', 'delight', 'glad', 'calm', 'relax', 'easy', 'fun', 'play', 'kiss',
    'embrace', 'hug', 'honor', 'proud', 'wise', 'truth', 'pure', 'bless', 'glory', 'victory'
]);

const NEGATIVE_WORDS = new Set([
    'hate', 'sad', 'cry', 'tear', 'grief', 'pain', 'hurt', 'wound', 'bleed', 'blood',
    'kill', 'die', 'death', 'dead', 'murder', 'fear', 'afraid', 'scare', 'terror', 'dread',
    'dark', 'cold', 'shadow', 'night', 'evil', 'demon', 'monster', 'enemy', 'danger',
    'threat', 'loss', 'lose', 'fail', 'failure', 'broken', 'destroy', 'ruin', 'ugly',
    'nasty', 'awful', 'terrible', 'bad', 'wrong', 'lie', 'deceit', 'betray', 'angry',
    'furious', 'rage', 'wrath', 'fight', 'battle', 'war', 'sick', 'ill', 'weak', 'despair'
]);

export const analyzeSentiment = (text: string): { score: number, label: 'positive' | 'negative' | 'neutral', positiveWords: string[], negativeWords: string[] } => {
    const words = text.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
    let score = 0;
    const positiveFound: string[] = [];
    const negativeFound: string[] = [];

    words.forEach(word => {
        if (POSITIVE_WORDS.has(word)) {
            score++;
            positiveFound.push(word);
        } else if (NEGATIVE_WORDS.has(word)) {
            score--;
            negativeFound.push(word);
        }
    });

    // Normalize roughly between -1 and 1 based on length?
    // Or just raw count. Raw count is better for "intensity".
    // But for labels, we need threshold.

    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 2) label = 'positive';
    if (score < -2) label = 'negative';

    return { score, label, positiveWords: positiveFound.slice(0, 10), negativeWords: negativeFound.slice(0, 10) };
};

export interface SentimentPoint {
    chunk: number;
    score: number;
    text: string; // snippet
}

export const analyzeSentimentArc = (text: string, chunks = 10): SentimentPoint[] => {
    const words = text.trim().split(/\s+/);
    if (words.length < chunks) return [];

    const chunkSize = Math.ceil(words.length / chunks);
    const points: SentimentPoint[] = [];

    for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const chunkWords = words.slice(start, start + chunkSize);
        const chunkText = chunkWords.join(' ');
        const analysis = analyzeSentiment(chunkText);

        points.push({
            chunk: i + 1,
            score: analysis.score,
            text: chunkWords.slice(0, 5).join(' ') + '...'
        });
    }

    return points;
};

// --- Genre Benchmarking ---
export type GenreType = 'Thriller' | 'Fantasy' | 'Romance' | 'SciFi' | 'Mystery' | 'Literary';

export interface GenreProfile {
    name: GenreType;
    asl: [number, number]; // Avg Sentence Length (Min, Max)
    adverbsPer1k: number; // Max
    passivePct: number; // Max
    grade: [number, number]; // Ideal Readability
    dialoguePct: [number, number]; // Ideal Min/Max
}

export const GENRE_PROFILES: Record<GenreType, GenreProfile> = {
    Thriller: { name: 'Thriller', asl: [10, 15], adverbsPer1k: 15, passivePct: 3, grade: [6, 8], dialoguePct: [30, 60] },
    Fantasy: { name: 'Fantasy', asl: [15, 22], adverbsPer1k: 25, passivePct: 5, grade: [8, 12], dialoguePct: [20, 50] },
    Romance: { name: 'Romance', asl: [12, 18], adverbsPer1k: 20, passivePct: 4, grade: [6, 9], dialoguePct: [40, 70] },
    SciFi: { name: 'SciFi', asl: [15, 20], adverbsPer1k: 20, passivePct: 5, grade: [9, 12], dialoguePct: [20, 40] },
    Mystery: { name: 'Mystery', asl: [12, 18], adverbsPer1k: 18, passivePct: 4, grade: [7, 10], dialoguePct: [40, 60] },
    Literary: { name: 'Literary', asl: [20, 30], adverbsPer1k: 30, passivePct: 10, grade: [10, 16], dialoguePct: [10, 40] }
};

export interface BenchmarkResult {
    metric: string;
    yourValue: number;
    targetRange: [number, number] | number;
    status: 'good' | 'low' | 'high';
    advice: string;
}

export const benchmarkGenre = (
    text: string,
    genre: GenreType
): BenchmarkResult[] => {
    // 1. Calculate Stats
    const words = text.match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    if (wordCount < 100) return []; // Not enough text

    // ASL
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;
    const asl = sentenceCount ? wordCount / sentenceCount : 0;

    // Adverbs
    const adverbs = (text.match(/\b\w+ly\b/gi) || []).length;
    const adverbsPer1k = (adverbs / wordCount) * 1000;

    // Passive
    const passiveMatches = (text.match(/\b(was|were|is|are|been)\s+\w+ed\b/gi) || []).length;
    const passivePct = sentenceCount ? (passiveMatches / sentenceCount) * 100 : 0;

    // Readability (Flesch-Kincaid roughly)
    const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
    const aslScore = 0.39 * asl;
    const aswScore = 11.8 * (syllables / wordCount);
    const grade = (isNaN(aslScore) || isNaN(aswScore)) ? 0 : Math.max(0, aslScore + aswScore - 15.59);

    // Dialogue Ratio
    const dialogueChars = text.match(/"[^"]*"/g)?.join('').length || 0;
    const dialoguePct = (dialogueChars / text.length) * 100 || 0;

    // 2. Compare
    const profile = GENRE_PROFILES[genre];
    const results: BenchmarkResult[] = [];

    // ASL Check
    const [minAsl, maxAsl] = profile.asl;
    results.push({
        metric: 'Avg. Sentence Length',
        yourValue: parseFloat(asl.toFixed(1)),
        targetRange: profile.asl,
        status: asl < minAsl ? 'low' : asl > maxAsl ? 'high' : 'good',
        advice: asl < minAsl ? 'Prose feels choppy. Combine sentences.' : asl > maxAsl ? 'Sentences are too complex. Shorten them.' : 'Perfect rhythm.'
    });

    // Adverbs
    results.push({
        metric: 'Adverbs / 1k Words',
        yourValue: Math.round(adverbsPer1k),
        targetRange: profile.adverbsPer1k,
        status: adverbsPer1k > profile.adverbsPer1k ? 'high' : 'good',
        advice: adverbsPer1k > profile.adverbsPer1k ? 'Too many adverbs weaken prose. Use stronger verbs.' : 'Clean writing.'
    });

    // Passive
    results.push({
        metric: 'Passive Voice %',
        yourValue: parseFloat(passivePct.toFixed(1)),
        targetRange: profile.passivePct,
        status: passivePct > profile.passivePct ? 'high' : 'good',
        advice: passivePct > profile.passivePct ? 'Active voice is preferred. Recast sentences.' : 'Strong active voice.'
    });

    // Dialogue
    const [minDia, maxDia] = profile.dialoguePct;
    results.push({
        metric: 'Dialogue Ratio',
        yourValue: Math.round(dialoguePct),
        targetRange: profile.dialoguePct,
        status: dialoguePct < minDia ? 'low' : dialoguePct > maxDia ? 'high' : 'good',
        advice: dialoguePct < minDia ? 'More dialogue would liven up the scene.' : dialoguePct > maxDia ? 'Too much talking heads. Add action/description.' : 'Balanced.'
    });

    // Grade
    const [minGrade, maxGrade] = profile.grade;
    results.push({
        metric: 'Reading Grade',
        yourValue: parseFloat(grade.toFixed(1)),
        targetRange: profile.grade,
        status: grade < minGrade ? 'low' : grade > maxGrade ? 'high' : 'good',
        advice: grade < minGrade ? 'Simple writing. Consider more complex structures.' : grade > maxGrade ? 'Academic/Dense. Simplify for readability.' : 'Appropriate complexity.'
    });

    return results;
};
