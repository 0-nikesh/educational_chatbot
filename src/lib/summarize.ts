import { GeminiService } from './gemini';
import { useProjectStore } from '../state/useProjectStore';

/**
 * Intelligent summarization using Gemini AI with fallback
 */
export async function summarizeDemo(text: string): Promise<string> {
  const store = useProjectStore.getState();
  
  console.log('📚 Summarize Demo called:');
  console.log('- useGemini:', store.ui.useGemini);
  console.log('- geminiApiKey:', store.ui.geminiApiKey ? 'PRESENT' : 'MISSING');
  console.log('- text length:', text.length);
  
  // Try AI-enhanced summarization first
  if (store.ui.useGemini && store.ui.geminiApiKey) {
    try {
      console.log('🤖 Generating AI-powered summary...');
      const aiSummary = await generateAISummary(text);
      console.log('✅ AI summary generated successfully');
      return aiSummary;
    } catch (error) {
      console.warn('❌ AI summarization failed, falling back to extractive method:', error);
      // Fall back to simple summarization
    }
  }
  
  console.log('📝 Using extractive summarization...');
  return generateExtractiveSummary(text);
}

/**
 * Generate AI-enhanced summary using Gemini
 */
async function generateAISummary(text: string): Promise<string> {
  const store = useProjectStore.getState();
  const gemini = new GeminiService({ apiKey: store.ui.geminiApiKey });
  
  const prompt = `
Please create a comprehensive but concise summary of the following text. 

REQUIREMENTS:
1. Capture the main ideas and key insights
2. Maintain important details and context
3. Use clear, educational language
4. Keep it engaging and informative
5. Length: Aim for 3-5 sentences that cover the essential points
6. Focus on what would be most valuable for a student or learner

TEXT TO SUMMARIZE:
${text}

Please provide just the summary without any additional commentary or formatting.
`;

  const summary = await gemini.generateContent(prompt);
  
  // Clean up the response (remove any unwanted formatting)
  return summary.trim()
    .replace(/^(Summary:|Here's a summary:|Here is a summary:)/i, '')
    .trim();
}

/**
 * Generate extractive summary (fallback method)
 */
function generateExtractiveSummary(text: string): string {
  // Simple extractive: score sentences by frequency of uncommon tokens
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  if (sentences.length <= 3) return text.trim();
  
  const freq = new Map<string, number>();
  const toks = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (const t of toks) freq.set(t, (freq.get(t) || 0) + 1);
  
  const scores = sentences.map((s, i) => {
    const st = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    let sc = 0;
    for (const w of st) sc += 1 / ((freq.get(w) || 1));
    return { i, sc };
  });
  
  scores.sort((a, b) => b.sc - a.sc);
  const pick = scores.slice(0, Math.min(6, Math.ceil(sentences.length * 0.25))).map(x => x.i).sort((a,b)=>a-b);
  const summary = pick.map(i => sentences[i]).join(' ');
  return summary;
}
