
import {
    calculateReadingStats,
    benchmarkGenre,
    analyzeParagraphPacing,
    analyzeSentenceLengths,
    analyzeSentimentArc,
    getOverusedWords,
    generateEditorInsights,
    findContextMatches,
    type GenreType
} from '@/lib/analysis';

// Listen for messages from the main thread
self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data;

    if (type === 'ANALYZE_FULL') {
        const { content, genre, contextFiles } = payload;
        // Basic plain text extraction
        const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        if (!plainText) {
            self.postMessage({ type: 'RESULTS', payload: null });
            return;
        }

        // Run heavy analysis tasks off-thread
        const stats = calculateReadingStats(plainText);
        const genreResults = benchmarkGenre(plainText, genre as GenreType);
        const pacing = analyzeParagraphPacing(plainText);
        const sentenceLengths = analyzeSentenceLengths(plainText);
        const sentimentArc = analyzeSentimentArc(plainText);
        const overused = getOverusedWords(plainText);
        const insights = generateEditorInsights(plainText);

        // Context matching (World Bible / Lore)
        const contextMatches = contextFiles ? findContextMatches(plainText, contextFiles) : [];

        self.postMessage({
            type: 'RESULTS',
            payload: {
                stats,
                genreResults,
                pacing,
                sentenceLengths,
                sentimentArc,
                overused,
                insights,
                contextMatches
            }
        });
    }
};
