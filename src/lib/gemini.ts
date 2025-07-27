// Gemini AI API integration for chat functionality
export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class GeminiService {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-1.5-flash';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1024;
  }

  /**
   * Test the Gemini API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateContent('Hello, can you respond with just "OK" to test the connection?');
      return response.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens,
        topP: 0.8,
        topK: 10
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          return candidate.content.parts[0].text;
        }
      }
      
      throw new Error('No valid response from Gemini API');
    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  /**
   * Generate an educational response based on context
   */
  async generateEducationalResponse(question: string, context: string): Promise<string> {
    const prompt = `You are an expert educational assistant helping students understand academic content. 

Context from the document:
${context}

Student Question: ${question}

Please provide a comprehensive, educational response that:
1. Directly answers the student's question
2. Uses information from the provided context
3. Explains concepts in an easy-to-understand way
4. Provides examples when helpful
5. Encourages further learning
6. Is friendly and supportive

Keep the response informative but conversational, as if you're a knowledgeable tutor helping a student.`;

    return await this.generateContent(prompt);
  }

  /**
   * Generate a conversational response for general chat
   */
  async generateConversationalResponse(question: string, context?: string): Promise<string> {
    let prompt = `You are a helpful, friendly AI assistant. Please respond to the following question in a conversational and helpful manner.

Question: ${question}`;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    return await this.generateContent(prompt);
  }

  /**
   * Generate a summary of the provided content
   */
  async generateSummary(content: string): Promise<string> {
    const prompt = `Please provide a clear, concise summary of the following content. Focus on the key points and main ideas:

${content}

Summary:`;

    return await this.generateContent(prompt);
  }

  /**
   * Explain a concept in simple terms
   */
  async explainConcept(concept: string, context: string): Promise<string> {
    const prompt = `You are an expert teacher. Please explain the following concept in simple, easy-to-understand terms using the provided context.

Concept to explain: ${concept}

Context:
${context}

Please provide:
1. A clear definition
2. Why it's important
3. A simple example if possible
4. How it relates to the broader topic

Explanation:`;

    return await this.generateContent(prompt);
  }

  /**
   * Generate discussion questions based on content
   */
  async generateDiscussionQuestions(content: string): Promise<string[]> {
    const prompt = `Based on the following content, generate 5 thoughtful discussion questions that would help students think deeply about the material:

${content}

Please provide exactly 5 questions, one per line, starting each with a number (1., 2., etc.)`;

    try {
      const response = await this.generateContent(prompt);
      const questions = response
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(q => q.length > 0);
      
      return questions.slice(0, 5);
    } catch (error) {
      console.error('Failed to generate discussion questions:', error);
      return [];
    }
  }
}

// Global service instance
let geminiService: GeminiService | null = null;

/**
 * Initialize Gemini service
 */
export function initializeGeminiService(apiKey: string): void {
  if (apiKey.trim()) {
    geminiService = new GeminiService({
      apiKey: apiKey.trim(),
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 1024
    });
    console.log('Gemini service initialized successfully');
  } else {
    geminiService = null;
    console.warn('Gemini service disabled - no API key provided');
  }
}

/**
 * Get the current Gemini service instance
 */
export function getGeminiService(): GeminiService | null {
  return geminiService;
}

/**
 * Test Gemini connection
 */
export async function testGeminiConnection(): Promise<boolean> {
  return geminiService ? await geminiService.testConnection() : false;
}
