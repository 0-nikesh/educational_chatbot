import type { Section } from './sectioner';
import { tfidfParagraphs, vectorizeQuery, cosine } from './search';
import { GeminiService, initializeGeminiService, getGeminiService } from './gemini';
import { useProjectStore } from '../state/useProjectStore';

// Global Gemini service instance
let geminiService: GeminiService | null = null;

/**
 * Initialize Gemini AI service
 */
function initializeGeminiAI(geminiApiKey: string): void {
  if (geminiApiKey.trim()) {
    initializeGeminiService(geminiApiKey.trim());
    geminiService = getGeminiService();
  } else {
    geminiService = null;
  }
}

/**
 * Public function to initialize AI services
 */
export function initializeAI(): void {
  const store = useProjectStore.getState();
  initializeGeminiAI(store.ui.geminiApiKey);
}

/**
 * Test AI service connection
 */
export async function testAIConnection(): Promise<{ gemini: boolean }> {
  const results = { gemini: false };
  
  if (geminiService) {
    try {
      results.gemini = await geminiService.testConnection();
    } catch (error) {
      console.error('Gemini test failed:', error);
    }
  }
  
  return results;
}

/**
 * Get Gemini AI service if available
 */
function getGeminiAIService(): GeminiService | null {
  const store = useProjectStore.getState();
  
  console.log('🔍 Getting Gemini AI Service:');
  console.log('- useGemini:', store.ui.useGemini);
  console.log('- geminiApiKey:', store.ui.geminiApiKey ? 'PRESENT' : 'MISSING');
  console.log('- geminiService instance:', geminiService ? 'PRESENT' : 'MISSING');
  
  // Auto-initialize if not done
  if (!geminiService && store.ui.geminiApiKey) {
    console.log('🔧 Auto-initializing Gemini service...');
    initializeGeminiAI(store.ui.geminiApiKey);
  }
  
  // Return Gemini if enabled and available
  if (store.ui.useGemini && geminiService) {
    console.log('✅ Returning Gemini service');
    return geminiService;
  }
  
  console.log('❌ Gemini service not available, using fallback');
  return null;
}

export async function demoAnswer(question: string, context: string, sections: Section[], activeId?: string) {
  if (!context || context.trim().length === 0) {
    return 'No content available. Please upload a PDF or select a chapter.';
  }

  // Clean the context by removing page markers and formatting
  const cleanContext = cleanContent(context);
  
  // Try to use Gemini AI service
  const aiService = getGeminiAIService();
  if (aiService) {
    try {
      console.log('Using Gemini AI for response');
      const response = await aiService.generateEducationalResponse(question, cleanContext);
      const source = getSourceInfo(sections, activeId);
      return `${response}\n\n*${source}*`;
    } catch (error) {
      console.error('Gemini AI failed, falling back to rule-based system:', error);
      // Fall through to rule-based system
    }
  }
  
  console.log('Using rule-based system - Gemini AI not available');
  // Fallback to rule-based system
  return await generateRuleBasedAnswer(question, cleanContext, sections, activeId);
}

/**
 * Rule-based answer generation (original system)
 */
async function generateRuleBasedAnswer(question: string, cleanContext: string, sections: Section[], activeId?: string) {
  // Check if this is an educational explanation request
  if (isEducationalExplanationRequest(question)) {
    return handleEducationalExplanation(question, cleanContext, sections, activeId);
  }
  
  // Split into meaningful paragraphs
  const paras = cleanContext.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 50);
  
  if (paras.length === 0) {
    return "I don't have enough content to answer your question. Please make sure you've selected a chapter with substantial content.";
  }

  const { vectors, vocabulary } = tfidfParagraphs(paras);
  const qvec = vectorizeQuery(question, vocabulary, paras.length);
  const scored = vectors.map((v, i) => ({ i, score: cosine(qvec, v) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const relevantParagraphs = scored
    .filter(s => s.score > 0.1) // Only include paragraphs with decent relevance
    .map(s => paras[s.i]);

  if (relevantParagraphs.length === 0) {
    return generateEnhancedFallback(question, cleanContext, sections, activeId);
  }

  // Generate a natural, conversational answer
  const answer = generateNaturalAnswer(question, relevantParagraphs);
  
  // Add source information
  const source = getSourceInfo(sections, activeId);
  
  return `${answer}\n\n*${source}*`;
}

/**
 * Check if the question is requesting educational explanation or simplification
 */
function isEducationalExplanationRequest(question: string): boolean {
  const explanationKeywords = [
    'explain', 'simpler', 'simple', 'basic', 'beginner', 'easy',
    'understand', 'clarify', 'elaborate', 'break down', 'in detail',
    'what does', 'how does', 'why does', 'what is', 'define',
    'meaning', 'concept', 'examples', 'illustrate'
  ];
  
  const lowerQuestion = question.toLowerCase();
  return explanationKeywords.some(keyword => lowerQuestion.includes(keyword));
}

/**
 * Handle educational explanation requests with helpful responses
 */
function handleEducationalExplanation(
  question: string, 
  context: string, 
  sections: Section[], 
  activeId?: string
): string {
  const lowerQuestion = question.toLowerCase();
  
  // Extract key terms from the question
  const keyTerms = extractKeyTerms(question);
  
  // Try to find relevant content using key terms
  const relevantContent = findRelevantContentByTerms(context, keyTerms);
  
  if (relevantContent.length > 0) {
    return generateEducationalResponse(question, relevantContent, keyTerms);
  }
  
  // If no specific content found, provide general educational guidance
  const source = getSourceInfo(sections, activeId);
  
  if (lowerQuestion.includes('simpler') || lowerQuestion.includes('simple')) {
    return `I'd be happy to explain this in simpler terms! However, I need more specific content to work with. 

Here are some suggestions:
• Try asking about a specific concept or term from the document
• Select a particular chapter that contains the topic you're interested in
• Upload a document that covers the subject you want explained

${source ? `Currently working with: *${source}*` : 'Please upload a PDF or select a chapter to get started.'}

What specific topic would you like me to explain?`;
  }
  
  if (lowerQuestion.includes('what is') || lowerQuestion.includes('define')) {
    return `I can help define concepts for you! To provide an accurate definition, I need to reference the relevant content from your documents.

Please try:
• Asking about terms that appear in the selected chapter
• Uploading a document that contains the concept you want defined
• Being more specific about which subject area you're exploring

${source ? `Currently working with: *${source}*` : 'Please upload a PDF or select a chapter to get started.'}

What term or concept would you like me to define?`;
  }
  
  return `I understand you're looking for an educational explanation. I'm designed to help explain concepts from your uploaded documents in a clear, accessible way.

To provide the best explanation:
• Make sure you have content selected from a chapter or document
• Ask about specific topics that appear in your materials
• I can break down complex concepts into simpler terms

${source ? `Currently working with: *${source}*` : 'Please upload a PDF or select a chapter to get started.'}

What would you like me to help explain?`;
}

/**
 * Extract key terms from the question for better content matching
 */
function extractKeyTerms(question: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'that', 'this',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'could', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
    'to', 'for', 'of', 'with', 'by', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'explain', 'simpler', 'simple'
  ]);
  
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5); // Limit to top 5 key terms
}

/**
 * Find relevant content based on key terms
 */
function findRelevantContentByTerms(context: string, keyTerms: string[]): string[] {
  if (keyTerms.length === 0) return [];
  
  const paragraphs = context.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 30);
  const relevantParagraphs: string[] = [];
  
  for (const paragraph of paragraphs) {
    const lowerParagraph = paragraph.toLowerCase();
    const matchCount = keyTerms.reduce((count, term) => 
      lowerParagraph.includes(term) ? count + 1 : count, 0
    );
    
    // Include paragraphs that mention at least one key term
    if (matchCount > 0) {
      relevantParagraphs.push(paragraph);
    }
  }
  
  return relevantParagraphs.slice(0, 3); // Limit to top 3 most relevant
}

/**
 * Generate educational response based on found content
 */
function generateEducationalResponse(question: string, content: string[], keyTerms: string[]): string {
  const lowerQuestion = question.toLowerCase();
  
  let response = '';
  
  if (lowerQuestion.includes('simpler') || lowerQuestion.includes('simple')) {
    response = `Let me break this down in simpler terms:\n\n`;
  } else if (lowerQuestion.includes('what is') || lowerQuestion.includes('define')) {
    response = `Here's what I found about this concept:\n\n`;
  } else {
    response = `Based on the content, here's an explanation:\n\n`;
  }
  
  // Summarize the content in an educational way
  const summary = content.join(' ').substring(0, 400);
  const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  response += sentences.slice(0, 3).map(sentence => sentence.trim()).join('. ');
  
  if (sentences.length > 3) {
    response += '...';
  }
  
  response += '\n\n';
  
  // Add helpful context
  if (keyTerms.length > 0) {
    response += `Key concepts mentioned: ${keyTerms.join(', ')}\n\n`;
  }
  
  response += 'Would you like me to elaborate on any specific aspect?';
  
  return response;
}

/**
 * Generate enhanced fallback response for educational queries
 */
function generateEnhancedFallback(
  question: string, 
  context: string, 
  sections: Section[], 
  activeId?: string
): string {
  const source = getSourceInfo(sections, activeId);
  
  // Check if it's an educational query
  if (isEducationalExplanationRequest(question)) {
    return handleEducationalExplanation(question, context, sections, activeId);
  }
  
  // For other queries, provide a more helpful fallback
  return `I couldn't find specific information directly addressing your question in the current content. 

Here are some suggestions:
• Try rephrasing your question with different keywords
• Check if you've selected the most relevant chapter or section
• Ask about topics that are explicitly mentioned in the document

${source ? `Currently working with: *${source}*` : 'Please upload a PDF or select a chapter to get started.'}

What specific aspect would you like to explore?`;
}

/**
 * Clean content by removing page markers and excessive formatting
 */
function cleanContent(content: string): string {
  return content
    // Remove page markers
    .replace(/\[\[PAGE:\d+\]\]/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove weird spacing around words
    .replace(/\s+([,.!?;:])/g, '$1')
    // Clean up hyphenated line breaks
    .replace(/(\w+)\s*-\s*(\w+)/g, '$1$2')
    // Remove extra spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Generate a natural, conversational answer
 */
function generateNaturalAnswer(question: string, paragraphs: string[]): string {
  const combinedText = paragraphs.join(' ').slice(0, 1000);
  
  // Extract key sentences that directly address the question
  const sentences = combinedText
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 20)
    .slice(0, 6);

  if (sentences.length === 0) {
    return "I found some related content, but it's difficult to extract a clear answer to your specific question.";
  }

  // Create a flowing narrative answer
  const answer = sentences
    .join(' ')
    // Clean up any remaining formatting issues
    .replace(/\s+/g, ' ')
    .trim();

  // Add natural introduction based on question type
  const intro = generateIntroPhrase(question);
  
  return `${intro}${answer}`;
}

/**
 * Generate appropriate introduction phrase based on question
 */
function generateIntroPhrase(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('what') || q.includes('explain')) {
    return '';
  } else if (q.includes('how')) {
    return 'According to the content, ';
  } else if (q.includes('why')) {
    return 'The document suggests that ';
  } else if (q.includes('when') || q.includes('where')) {
    return 'Based on the information, ';
  } else if (q.includes('who')) {
    return 'The text indicates that ';
  } else {
    return '';
  }
}

/**
 * Generate fallback answer when no relevant content is found
 */
function generateFallbackAnswer(question: string, context: string): string {
  const shortContext = context.slice(0, 500);
  
  return `I couldn't find specific information to answer "${question}" in this section. However, this chapter appears to discuss topics related to ${extractMainTopics(shortContext)}. You might want to try rephrasing your question or check if there's relevant information in other chapters.`;
}

/**
 * Extract main topics from content for fallback responses
 */
function extractMainTopics(text: string): string {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const frequency = new Map<string, number>();
  
  // Common words to ignore
  const stopWords = new Set(['that', 'this', 'with', 'have', 'been', 'were', 'they', 'from', 'such', 'also', 'more', 'when', 'what', 'than', 'only', 'some', 'time', 'very', 'like', 'into', 'over', 'after', 'through', 'during', 'before', 'under', 'while']);
  
  words.forEach(word => {
    if (!stopWords.has(word) && word.length > 3) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  });
  
  const topWords = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
  
  return topWords.length > 0 ? topWords.join(', ') : 'various topics';
}

/**
 * Get source information for citations
 */
function getSourceInfo(sections: Section[], activeId?: string): string {
  const sec = sections.find(s => s.id === activeId) || sections[0];
  
  if (!sec) {
    return 'Source information not available';
  }
  
  const pageInfo = sec.startPage && sec.endPage 
    ? `pages ${sec.startPage}-${sec.endPage}`
    : sec.startPage 
    ? `page ${sec.startPage}`
    : 'source document';
    
  return `Based on "${sec.title}" from ${pageInfo}`;
}
