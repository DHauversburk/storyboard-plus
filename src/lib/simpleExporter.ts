
export interface ExportOptions {
    format: 'markdown' | 'html' | 'txt';
    title: string;
    author: string;
    includeTitlePage: boolean;
    includeStats: boolean;
    stats?: {
        words: number;
        chars: number;
        readTime: number;
    };
}

export const generateExport = (contentHtml: string, options: ExportOptions): Blob => {
    let finalContent = '';

    // Pre-process HTML to text
    // Replace block tags with newlines
    const plainText = contentHtml
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Collapse multiple newlines
        .trim();

    switch (options.format) {
        case 'markdown':
            if (options.includeTitlePage) {
                finalContent += `# ${options.title}\nBy ${options.author}\n\n---\n\n`;
            }
            if (options.includeStats && options.stats) {
                finalContent += `> Word Count: ${options.stats.words} | Read Time: ${Math.ceil(options.stats.readTime)} min\n\n`;
            }

            // Convert HTML to simple Markdown
            let md = contentHtml
                .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
                .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
                .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
                .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
                .replace(/<b>(.*?)<\/b>/gi, '**$1**')
                .replace(/<em>(.*?)<\/em>/gi, '*$1*')
                .replace(/<i>(.*?)<\/i>/gi, '*$1*')
                .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, ''); // Strip remaining tags

            finalContent += md;
            return new Blob([finalContent], { type: 'text/markdown;charset=utf-8' });

        case 'txt':
            if (options.includeTitlePage) {
                finalContent += `${options.title.toUpperCase()}\nBy ${options.author}\n\n====================================\n\n`;
            }
            if (options.includeStats && options.stats) {
                finalContent += `Words: ${options.stats.words} | Time: ${Math.ceil(options.stats.readTime)} min\n\n`;
            }
            finalContent += plainText;
            return new Blob([finalContent], { type: 'text/plain;charset=utf-8' });

        case 'html':
        default:
            finalContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title}</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #1a1a1a;
            background: #fdfdfd;
        }
        h1, h2, h3 { color: #333; margin-top: 1.5em; }
        .title-page {
            text-align: center;
            margin-bottom: 4rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #eee;
            margin-top: 20vh;
        }
        .title-page h1 { font-size: 3rem; margin-bottom: 0.5rem; }
        .stat-block { font-size: 0.9rem; color: #666; font-style: italic; margin-top: 2rem;}
        p { margin-bottom: 1.2rem; text-indent: 1.5em; }
        p.no-indent { text-indent: 0; }
    </style>
</head>
<body>
    ${options.includeTitlePage ? `
    <div class="title-page">
        <h1>${options.title}</h1>
        <h3>by ${options.author}</h3>
        ${options.includeStats && options.stats ? `
        <div class="stat-block">
            Word Count: ${options.stats.words.toLocaleString()} • Read Time: ${Math.ceil(options.stats.readTime)} min
        </div>
        ` : ''}
    </div>
    <div style="page-break-after: always;"></div>
    ` : ''}
    
    <div class="content">
        ${contentHtml}
    </div>
</body>
</html>`;
            return new Blob([finalContent], { type: 'text/html;charset=utf-8' });
    }
};

export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
