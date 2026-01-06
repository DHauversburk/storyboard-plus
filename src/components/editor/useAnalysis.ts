import { useState, useEffect, useRef } from 'react';
import { type BenchmarkResult, type ReadingStats, type ParagraphPacing, type SentimentPoint, type EditorInsight } from '@/lib/analysis';

export interface AnalysisResults {
    stats: ReadingStats | null;
    genreResults: BenchmarkResult[];
    pacing: ParagraphPacing[];
    sentenceLengths: number[];
    sentimentArc: SentimentPoint[];
    overused: { word: string; count: number; synonyms: string[] }[];
    insights: EditorInsight[];
    contextMatches: { name: string; content: string }[];
}

export function useAnalysis(content: string, genre: string, contextFiles: { name: string; content: string }[] = []) {
    const [results, setResults] = useState<AnalysisResults | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize Worker
        try {
            workerRef.current = new Worker(new URL('./analysis.worker.ts', import.meta.url));
            workerRef.current.onmessage = (e) => {
                const { type, payload } = e.data;
                if (type === 'RESULTS') {
                    setResults(payload);
                    setIsAnalyzing(false);
                }
            };
        } catch (err) {
            console.error("Failed to start analysis worker:", err);
        }

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        if (!workerRef.current) return;

        setIsAnalyzing(true);
        workerRef.current.postMessage({
            type: 'ANALYZE_FULL',
            payload: { content, genre, contextFiles }
        });

    }, [content, genre, contextFiles]);

    return { results, isAnalyzing };
}
