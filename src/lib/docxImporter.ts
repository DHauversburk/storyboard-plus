import mammoth from 'mammoth';

export interface ImportResult {
    html: string;
    messages: { type: string, message: string }[];
}

/**
 * Parses a .docx file and returns sanitary HTML suitable for the editor.
 */
export const parseDocx = async (file: File): Promise<ImportResult> => {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Mammoth options to map Word styles to our Semantic HTML
        const options = {
            styleMap: [
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
                "p[style-name='Title'] => h1.doc-title:fresh",
                "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
                "p[style-name='Quote'] => blockquote:fresh",

                // Map emphasis
                "b => strong",
                "i => em",
                "u => u",
                "strike => s",

                // Ignore weird spacing/indentation to let our CSS handle it
                // forcing paragraphs to be just <p>
                "p => p"
            ],
            includeDefaultStyleMap: true // Keep standard mappings as fallback
        };

        const result = await mammoth.convertToHtml({ arrayBuffer }, options);

        let html = result.value;

        // Post-Processing for StoryBoard Plus themes:

        // 1. Remove empty paragraphs often left by Word
        html = html.replace(/<p>\s*<\/p>/g, "");

        // 2. Ensure images have a placeholder (Mammoth might strip them or inline base64)
        // Mammoth creates <img src="data:..."> by default which is heavy but works.
        // We might want to warn if the file is massive.

        return {
            html: html,
            messages: result.messages
        };

    } catch (error) {
        console.error("Docx Parse Error", error);
        throw new Error("Failed to parse .docx file. Ensure it is not password protected.");
    }
};
