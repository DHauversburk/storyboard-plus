import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, PageNumber, TableOfContents } from "docx";
import { saveAs } from "file-saver";

interface Scene {
    id: string;
    title: string;
    content: string; // HTML
    order: number;
    status: string;
}

export interface FrontMatterOptions {
    includeTOC: boolean;
    includeCopyright: boolean;
    dedication?: string;
    subtitle?: string;
}

export interface DocxHeaderOptions {
    alignment: 'left' | 'center' | 'right';
    style: 'simple' | 'ornate' | 'modern' | 'bold';
    uppercase: boolean;
    showChapterNumber: boolean;
    customText?: string;
}

// Helper to convert HTML string to Docx Pargraphs
// This is a simplified parser handling <p>, <b>, <i>
const parseHtmlToParagraphs = (html: string): Paragraph[] => {
    // 1. Remove wrapper div or handle empty
    if (!html) return [];

    // Simple strategy: Split by </p> or <br> to get blocks
    // Then parse inline styles for each block
    // Note: This regex split is rudimentary. A DOMParser would be better but we are in browser.
    // We can use DOMParser!

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    const paragraphs: Paragraph[] = [];

    nodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName === 'P' || el.tagName === 'DIV' || el.tagName.startsWith('H')) {
                // Determine style based on tag? 
                // For manuscript, everything is standard paragraph usually.
                // Headings might be handled separately, but user content is usually just "Scene text".
                // We'll treat all blocks as indented paragraphs.

                const children = Array.from(el.childNodes);
                const runs: TextRun[] = [];

                children.forEach(child => {
                    const text = child.textContent || "";
                    if (!text) return;

                    let bold = false;
                    let italic = false;
                    let underline = false;

                    // Check Stylings of the child node or its parent (if simplistic)
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        const childEl = child as HTMLElement;
                        if (childEl.tagName === 'B' || childEl.tagName === 'STRONG') bold = true;
                        if (childEl.tagName === 'I' || childEl.tagName === 'EM') italic = true;
                        if (childEl.tagName === 'U') underline = true;
                        // Handle formatting of the node itself
                        // (If user nested <b><i>text</i></b>, this simplistic loop might miss it if we only look one level deep)
                    }

                    // Also check the block element's style if it applies to all? No.

                    runs.push(new TextRun({
                        text: text,
                        bold: bold,
                        italics: italic,
                        underline: underline ? {} : undefined,
                        font: "Times New Roman",
                        size: 24, // 12pt
                    }));
                });

                // Determine Heading Level
                let headingLevel: any = undefined;
                if (el.tagName === 'H1') headingLevel = HeadingLevel.HEADING_1;
                else if (el.tagName === 'H2') headingLevel = HeadingLevel.HEADING_2;
                else if (el.tagName === 'H3') headingLevel = HeadingLevel.HEADING_3;

                if (runs.length > 0) {
                    paragraphs.push(new Paragraph({
                        children: runs,
                        spacing: { line: 480, before: headingLevel ? 400 : 0, after: headingLevel ? 200 : 0 },
                        indent: headingLevel ? undefined : { firstLine: 720 },
                        heading: headingLevel,
                        alignment: headingLevel ? AlignmentType.CENTER : undefined,
                        widowControl: true,
                        keepNext: !!headingLevel
                    }));
                }
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            // Loose text not in P?
            const text = node.textContent?.trim();
            if (text) {
                paragraphs.push(new Paragraph({
                    children: [new TextRun({ text, font: "Times New Roman", size: 24 })],
                    spacing: { line: 480 },
                    indent: { firstLine: 720 },
                }));
            }
        }
    });

    return paragraphs;
};

export const exportManuscript = async (
    title: string,
    authorName: string,
    scenes: Scene[]
) => {
    // Filter out empty scenes or draft scenes? Maybe keep all for now.
    const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

    const docChildren: any[] = [];

    // --- 1. Title Page ---
    // Centered, Middle of page approx
    docChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: title.toUpperCase(),
                    bold: true,
                    font: "Times New Roman",
                    size: 48, // 24pt
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 4000 }, // Push down
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: `by ${authorName || "Author Name"}`,
                    font: "Times New Roman",
                    size: 24,
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 480 },
            pageBreakBefore: false,
        }),
        // Word Count
        new Paragraph({
            children: [
                new TextRun({
                    text: `Approx. ${sortedScenes.reduce((a, s) => a + (s.content.split(/\s+/).length || 0), 0)} words`,
                    font: "Times New Roman",
                    size: 24,
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 480 },
            pageBreakBefore: false,
        }),
        // Break to next page
        new Paragraph({
            text: "",
            pageBreakBefore: true,
        })
    );

    // --- 2. Scenes ---
    let currentChapter = 1;

    sortedScenes.forEach((scene, index) => {
        // Scene Title / Chapter Heading
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: scene.title || `Chapter ${currentChapter}`,
                        bold: true,
                        font: "Times New Roman",
                        size: 24,
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 1000, after: 480 }, // Spacing around Title
            })
        );

        // Content
        const bodyParagraphs = parseHtmlToParagraphs(scene.content);

        // Handle "No Indent" for first paragraph?
        if (bodyParagraphs.length > 0) {
            // Modify first paragraph to remove indent if desired style
            // bodyParagraphs[0] = new Paragraph({ ...bodyParagraphs[0], indent: { firstLine: 0 } });
        }

        docChildren.push(...bodyParagraphs);

        // Add separator or break?
        // Usually chapters start on new page
        // But if these are just "Scenes", maybe # separator?
        // Let's assume Scene = Chapter for now, or add PageBreak.
        // If it's the last scene, don't add break.
        if (index < sortedScenes.length - 1) {
            docChildren.push(new Paragraph({
                text: "",
                pageBreakBefore: true,
            }));
        }

        currentChapter++;
    });

    // Create Document
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440, // 1 inch (1440 twips)
                        bottom: 1440,
                        left: 1440,
                        right: 1440,
                    },
                },
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                    font: "Times New Roman",
                                    size: 24,
                                }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                    ],
                }),
            },
            children: docChildren,
        }],
    });

    // Generate and Download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/\s+/g, '_')}_Manuscript.docx`);
};

export interface PageOptions {
    size: 'Letter' | 'A4' | '6x9' | '5x8';
    margins: 'Normal' | 'Narrow' | 'Wide' | 'Mirrored';
}

const PAGE_SIZES = {
    'Letter': { width: 12240, height: 15840 }, // 8.5 x 11
    'A4': { width: 11906, height: 16838 },     // 8.27 x 11.69
    '6x9': { width: 8640, height: 12960 },     // 6 x 9 (Trade Paperback)
    '5x8': { width: 7200, height: 11520 },     // 5 x 8 (Pocket)
};

const MARGINS = {
    'Normal': { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch
    'Narrow': { top: 720, bottom: 720, left: 720, right: 720 },     // 0.5 inch
    'Wide': { top: 1440, bottom: 1440, left: 2880, right: 2880 },   // 2 inch sides
    'Mirrored': { top: 1440, bottom: 1440, left: 1440, right: 1152, mirrorMargins: true } // Inner larger? Docx requires specific mirror property
};

export const exportDocumentAsDocx = async (
    title: string,
    authorName: string,
    contentHtml: string,
    stats?: { words: number },
    headerOptions?: DocxHeaderOptions,
    frontMatter?: FrontMatterOptions,
    pageOptions: PageOptions = { size: 'Letter', margins: 'Normal' }
) => {
    const docChildren: any[] = [];

    // Title Page
    docChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: title.toUpperCase(),
                    bold: true,
                    font: "Times New Roman",
                    size: 48,
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 4000 },
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: `by ${authorName || "Author Name"}`,
                    font: "Times New Roman",
                    size: 24,
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 480 },
            pageBreakBefore: false,
        })
    );

    if (stats) {
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Approx. ${stats.words} words`,
                        font: "Times New Roman",
                        size: 24,
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 480 },
                pageBreakBefore: false,
            })
        );
    }

    // --- Front Matter ---
    // 1. Copyright
    if (frontMatter?.includeCopyright) {
        docChildren.push(new Paragraph({ text: "", pageBreakBefore: true })); // Break
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "Copyright © 2024 " + authorName, font: "Times New Roman", size: 24 }),
                    new TextRun({ text: "\nAll Rights Reserved.", font: "Times New Roman", size: 24 }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 4000 } // Middle of page
            })
        );
    }

    // 2. Dedication
    if (frontMatter?.dedication) {
        docChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
        docChildren.push(
            new Paragraph({
                children: [new TextRun({ text: frontMatter.dedication, font: "Times New Roman", size: 24, italics: true })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 4000 }
            })
        );
    }

    // 3. Table of Contents
    if (frontMatter?.includeTOC) {
        docChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
        docChildren.push(
            new Paragraph({
                children: [new TextRun({ text: "Table of Contents", font: "Times New Roman", size: 28, bold: true })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
            new TableOfContents("Summary", {
                hyperlink: true,
                headingStyleRange: "1-3",
            })
        );
    }

    // Page Break before Body
    docChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));

    // Custom Chapter Header
    if (headerOptions) {
        let text = headerOptions.customText || title;
        if (headerOptions.uppercase) text = text.toUpperCase();

        const runs: TextRun[] = [];

        // Ornament logic
        if (headerOptions.style === 'ornate') {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: "~ ❦ ~", font: "Times New Roman", size: 28 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 }
            }));
        }

        // Main Header Text
        const headerFont = headerOptions.style === 'modern' ? "Arial" : "Times New Roman";
        const headerSize = headerOptions.style === 'modern' ? 32 : 28; // 16pt vs 14pt

        if (headerOptions.showChapterNumber) {
            runs.push(
                new TextRun({ text: "CHAPTER 1", font: headerFont, size: 24, bold: true }),
                new TextRun({ text: "\n", font: headerFont, size: 24 })
            );
        }

        runs.push(new TextRun({
            text: text,
            font: headerFont,
            size: headerSize,
            bold: headerOptions.style !== 'simple',
        }));

        docChildren.push(new Paragraph({
            children: runs,
            alignment: headerOptions.alignment === 'left' ? AlignmentType.LEFT : headerOptions.alignment === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER,
            spacing: { after: 720, before: headerOptions.style === 'ornate' ? 0 : 240 },
            heading: HeadingLevel.HEADING_1
        }));
    } else {
        // Default Header if no options enabled
        docChildren.push(new Paragraph({
            children: [new TextRun({ text: title, font: "Times New Roman", size: 28, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 720 },
            heading: HeadingLevel.HEADING_1
        }));
    }

    // Content
    const bodyParagraphs = parseHtmlToParagraphs(contentHtml);
    docChildren.push(...bodyParagraphs);

    const pageSize = PAGE_SIZES[pageOptions.size || 'Letter'];
    const margins = MARGINS[pageOptions.margins || 'Normal'];

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        width: pageSize.width,
                        height: pageSize.height,
                    },
                    margin: {
                        top: margins.top,
                        bottom: margins.bottom,
                        left: margins.left,
                        right: margins.right
                    }
                }
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 24 })],
                            alignment: AlignmentType.RIGHT,
                        }),
                    ],
                }),
            },
            children: docChildren,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/\s+/g, '_')}.docx`);
};
