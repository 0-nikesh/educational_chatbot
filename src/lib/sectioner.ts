export type Section = {
  id: string;
  sourceId: string;
  title: string;
  startPage?: number;
  endPage?: number;
  text: string;
  tokensEstimated?: number;
};

function estimateTokens(s: string) {
  return Math.ceil(s.length / 4);
}

function cleanTextContent(text: string): string {
  return text
    // Fix hyphenated line breaks (common in PDFs)
    .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
    // Fix spacing around words
    .replace(/\s+([,.!?;:])/g, '$1')
    // Remove excessive whitespace
    .replace(/\s{2,}/g, ' ')
    // Clean up line breaks
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

export function splitChapters(rawPages: string[], sourceId: string): Section[] {
  const all = rawPages.map((t, i) => `[[PAGE:${i+1}]]\n` + t).join('\n\n');
  const blocks = all.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

  const sections: Section[] = [];
  let current: { title: string; startPage: number; text: string[] } | null = null;
  let autoIndex = 1;
  
  // Enhanced patterns for better chapter detection
  const chapterPatterns = [
    /^(chapter|section|part|unit)\s+([ivxlcdm]+|\d+)[\s\.:]+(.+)$/i,  // Chapter 1: Title
    /^(\d+[\.\)]\s+.+)$/,                                              // 1. Title or 1) Title
    /^([A-Z][A-Z\s:'\-]{10,80})$/,                                     // ALL CAPS TITLES (longer)
    /^#{1,3}\s+(.+)$/,                                                 // Markdown headers
    /^(.+)\s+\.{3,}\s*\d+$/,                                          // Title with dots and page number
    /^([A-Z][a-z\s:]+[A-Z][a-z\s:]{5,})$/,                           // Title Case Headers
    /^(introduction|conclusion|summary|abstract|preface|acknowledgments?)$/i, // Common sections
  ];
  
  // Patterns that indicate content (not headers)
  const contentPatterns = [
    /^\s*\d+\s*$/,           // Just page numbers
    /^[\s\.\-_]{3,}$/,       // Decorative lines
    /^\[\[PAGE:\d+\]\]$/,    // Page markers
  ];

  const flush = (endPage?: number) => {
    if (!current) return;
    const rawText = current.text.join('\n\n');
    const cleanedText = cleanTextContent(rawText);
    if (cleanedText.length > 50) { // Only create sections with substantial content
      sections.push({
        id: crypto.randomUUID(),
        sourceId,
        title: current.title,
        startPage: current.startPage,
        endPage,
        text: cleanedText,
        tokensEstimated: estimateTokens(cleanedText),
      });
    }
    current = null;
  };

  const firstPageOf = (textBlock: string) => {
    const m = textBlock.match(/\[\[PAGE:(\d+)\]\]/);
    return m ? parseInt(m[1], 10) : undefined;
  };

  const isLikelyHeader = (line: string): { isHeader: boolean; title?: string } => {
    const trimmed = line.trim();
    
    // Skip obvious non-headers
    if (contentPatterns.some(pattern => pattern.test(trimmed))) {
      return { isHeader: false };
    }
    
    // Check each pattern
    for (const pattern of chapterPatterns) {
      const match = pattern.exec(trimmed);
      if (match) {
        // Extract title from match
        let title = match[3] || match[1] || trimmed;
        title = title.replace(/^#+\s*/, '').trim(); // Remove markdown markers
        return { isHeader: true, title };
      }
    }
    
    // Additional heuristics for headers
    if (trimmed.length > 5 && trimmed.length < 100) {
      // Check if it looks like a title (proper case, not too long)
      if (/^[A-Z]/.test(trimmed) && !/[.!?]$/.test(trimmed)) {
        // Count capital letters - titles often have multiple capitals
        const capitals = (trimmed.match(/[A-Z]/g) || []).length;
        const ratio = capitals / trimmed.length;
        if (ratio > 0.1 && ratio < 0.8) { // Between 10% and 80% capitals
          return { isHeader: true, title: trimmed };
        }
      }
    }
    
    return { isHeader: false };
  };

  // Process blocks and identify sections
  for (const b of blocks) {
    const lines = b.split(/\n/).filter(line => line.trim());
    if (lines.length === 0) continue;
    
    const firstLine = lines[0]?.trim() ?? '';
    const headerCheck = isLikelyHeader(firstLine);
    
    if (headerCheck.isHeader && headerCheck.title) {
      // Close previous section
      flush(firstPageOf(b) ? firstPageOf(b)! - 1 : undefined);
      
      // Start new section
      current = {
        title: headerCheck.title,
        startPage: firstPageOf(b) ?? undefined,
        text: [b],
      };
    } else {
      // Add to current section or create default section
      if (!current) {
        current = { 
          title: `Section ${autoIndex++}`, 
          startPage: firstPageOf(b) ?? 1, 
          text: [] 
        };
      }
      current.text.push(b);
    }
  }
  
  // Flush the last section
  flush(rawPages.length);

  if (sections.length === 0) {
    // Fallback to fixed-size windows of ~8 pages
    const chunk = 8;
    for (let i = 0; i < rawPages.length; i += chunk) {
      const pages = rawPages.slice(i, i + chunk);
      const rawText = pages.map((p, k) => `[[PAGE:${i+k+1}]]\n${p}`).join('\n\n');
      const cleanedText = cleanTextContent(rawText);
      sections.push({
        id: crypto.randomUUID(),
        sourceId,
        title: `Section ${Math.floor(i / chunk) + 1}`,
        startPage: i + 1,
        endPage: Math.min(i + chunk, rawPages.length),
        text: cleanedText,
        tokensEstimated: estimateTokens(cleanedText),
      });
    }
  }

  return sections;
}
