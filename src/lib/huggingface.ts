/**
 * Hugging Face API Integration for Enhanced Chat Responses
 * Provides intelligent, context-aware educational responses using AI models
 */

export interface HuggingFaceConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class HuggingFaceService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  private maxTokens: number;
  private temperature: number;

  constructor(config: HuggingFaceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'meta-llama/Llama-2-7b-hf'; // Match notebook model
    this.maxTokens = config.maxTokens || 512;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Generate educational response using Hugging Face model
   */
  async generateEducationalResponse(
    question: string,
    context: string,
    previousMessages: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Prepare the system prompt for educational responses
      const systemPrompt = this.createEducationalSystemPrompt();
      
      // Create conversation messages
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...previousMessages.slice(-3), // Keep last 3 messages for context
        {
          role: 'user',
          content: this.formatUserQuery(question, context)
        }
      ];

      // Try different models based on the query type
      const response = await this.callHuggingFaceAPI(messages);
      
      return this.postProcessResponse(response);
    } catch (error) {
      console.error('Hugging Face API error:', error);
      return this.getFallbackResponse(question, context);
    }
  }

  /**
   * Generate simple explanation using Hugging Face
   */
  async generateSimpleExplanation(
    concept: string,
    context: string
  ): Promise<string> {
    try {
      const prompt = `Explain this concept in simple, easy-to-understand terms suitable for beginners:

Concept: ${concept}

Context from document: ${context.slice(0, 800)}

Please provide a clear, educational explanation that:
- Uses simple language
- Includes relevant examples
- Breaks down complex ideas
- Is suitable for learning`;

      const response = await this.generateText(prompt);
      return this.postProcessResponse(response);
    } catch (error) {
      console.error('Simple explanation error:', error);
      return `I'd like to explain "${concept}" in simpler terms, but I'm having trouble connecting to the AI service right now. Based on the context available, this concept appears to be related to the topics discussed in your document. Please try again or ask about specific aspects you'd like clarified.`;
    }
  }

  /**
   * Generate definition using Hugging Face
   */
  async generateDefinition(
    term: string,
    context: string
  ): Promise<string> {
    try {
      const prompt = `Provide a clear, educational definition for this term based on the given context:

Term: ${term}

Context: ${context.slice(0, 800)}

Please provide:
- A concise but comprehensive definition
- How it relates to the broader context
- Any relevant examples or applications
- Why it's important to understand`;

      const response = await this.generateText(prompt);
      return this.postProcessResponse(response);
    } catch (error) {
      console.error('Definition generation error:', error);
      return `I can help define "${term}" for you. Based on the context in your document, this term appears to be an important concept. Please try again or let me know what specific aspect of this term you'd like me to clarify.`;
    }
  }

  /**
   * Call Hugging Face Inference API
   */
  private async callHuggingFaceAPI(messages: ChatMessage[]): Promise<string> {
    // Use text generation for most models as it's more widely supported
    return this.callTextGenerationAPI(messages);
  }

  /**
   * Call chat-based API
   */
  private async callChatAPI(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          past_user_inputs: messages
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .slice(-3),
          generated_responses: messages
            .filter(m => m.role === 'assistant')
            .map(m => m.content)
            .slice(-3),
          text: messages[messages.length - 1].content
        },
        parameters: {
          max_length: this.maxTokens,
          temperature: this.temperature,
          do_sample: true,
          pad_token_id: 50256
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.generated_text || data[0]?.generated_text || 'Unable to generate response';
  }

  /**
   * Call text generation API
   */
  private async callTextGenerationAPI(messages: ChatMessage[]): Promise<string> {
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n') + '\nassistant:';

    return this.generateText(conversationText);
  }

  /**
   * Generate text using Hugging Face model with Llama-specific handling
   */
  private async generateText(prompt: string): Promise<string> {
    // For Llama models, we might need to use a different approach
    if (this.model.includes('llama')) {
      return this.generateWithLlamaModel(prompt);
    }
    
    const response = await fetch(`${this.baseUrl}/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: this.maxTokens,
          temperature: this.temperature,
          do_sample: true,
          return_full_text: false
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${errorText}`);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data[0]?.generated_text || data.generated_text || 'Unable to generate response';
  }

  /**
   * Special handling for Llama models
   */
  private async generateWithLlamaModel(prompt: string): Promise<string> {
    console.log('Using Llama-specific request format...');
    
    // Try the standard Inference API first
    try {
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: this.maxTokens,
            temperature: this.temperature,
            do_sample: true,
            return_full_text: false,
            pad_token_id: 2 // EOS token for Llama
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Llama API Response:', data);
        return data[0]?.generated_text || data.generated_text || 'Response generated successfully';
      } else {
        const errorText = await response.text();
        console.error(`Llama API Error: ${response.status} - ${errorText}`);
        
        // Check if it's a model availability issue
        if (response.status === 404) {
          throw new Error(`Llama model not available via Inference API. Status: 404. You may need to use the model through a different endpoint or deploy it yourself.`);
        }
        
        if (response.status === 503) {
          throw new Error(`Llama model is loading. Please wait a few minutes and try again. Status: 503`);
        }
        
        throw new Error(`Llama API failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Llama model request failed:', error);
      // Try a simpler fallback approach for Llama
      return this.generateWithSimpleFormat(prompt);
    }
  }

  /**
   * Simplified request format as fallback
   */
  private async generateWithSimpleFormat(prompt: string): Promise<string> {
    console.log('Trying simplified request format...');
    
    const response = await fetch(`${this.baseUrl}/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: Math.min(this.maxTokens + prompt.length, 1024),
          temperature: this.temperature
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Simple format also failed: ${response.status} - ${errorText}`);
      throw new Error(`All request formats failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Simple format response:', data);
    return data[0]?.generated_text || data.generated_text || 'Generated response';
  }

  /**
   * Create educational system prompt
   */
  private createEducationalSystemPrompt(): string {
    return `You are an intelligent educational assistant designed to help students learn and understand complex concepts. Your role is to:

1. Provide clear, accurate, and educational responses
2. Break down complex ideas into understandable parts
3. Use simple language while maintaining accuracy
4. Provide relevant examples and context
5. Encourage further learning and curiosity
6. Admit when you don't have enough information

When responding:
- Be patient and supportive
- Use a friendly, professional tone
- Structure your answers clearly
- Provide actionable insights
- Suggest follow-up questions when appropriate

Remember: You're helping students learn, so focus on clarity and educational value.`;
  }

  /**
   * Format user query with context
   */
  private formatUserQuery(question: string, context: string): string {
    if (!context || context.trim().length === 0) {
      return `Question: ${question}

Note: No specific document context is available. Please provide a helpful educational response based on general knowledge, and suggest how the user might find more specific information.`;
    }

    return `Question: ${question}

Document context: ${context.slice(0, 1000)}

Please provide an educational response based on this context. If the context doesn't fully address the question, explain what you can based on the available information and suggest what additional information might be helpful.`;
  }

  /**
   * Post-process API response
   */
  private postProcessResponse(response: string): string {
    return response
      .trim()
      .replace(/^(assistant|bot|ai):\s*/i, '') // Remove any AI prefixes
      .replace(/\n{3,}/g, '\n\n') // Clean up excessive line breaks
      .replace(/\s+/g, ' ') // Clean up excessive spaces
      .trim();
  }

  /**
   * Fallback response when API fails
   */
  private getFallbackResponse(question: string, context: string): string {
    return `I'm experiencing some technical difficulties with the AI service right now. However, I can see you're asking about "${question}". 

Based on the available content, I can tell this relates to the material you're studying. While I work to resolve the connection issue, you might want to:

• Try rephrasing your question with more specific terms
• Check if there are related concepts in other sections
• Look for key definitions or examples in the current content

I'll do my best to help once the connection is restored!`;
  }

  /**
   * Test API connection with Llama-specific handling
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Hugging Face connection...');
      console.log('API Key:', this.apiKey.substring(0, 10) + '...');
      console.log('Model:', this.model);
      
      // For Llama models, check if they're available via Inference API
      if (this.model.includes('llama')) {
        console.log('Testing Llama model availability...');
        
        // First check if the model endpoint exists
        const checkResponse = await fetch(`${this.baseUrl}/${this.model}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });
        
        console.log('Model availability check:', checkResponse.status);
        
        if (checkResponse.status === 404) {
          console.error('❌ Llama model not available via Inference API');
          console.log('💡 Llama models might need to be deployed to use via API');
          console.log('🔄 Trying alternative models...');
          
          // Try Llama-2-7b-chat-hf as alternative
          this.model = 'meta-llama/Llama-2-7b-chat-hf';
          return this.testConnection();
        }
      }
      
      // Simple test with minimal parameters
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: "Hello world",
          parameters: {
            max_length: 50,
            do_sample: false
          }
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Try with a known working model as fallback
        if (this.model.includes('llama')) {
          console.log('🔄 Llama model failed, trying GPT-2 as fallback...');
          this.model = 'gpt2';
          return this.testConnection();
        }
        
        return false;
      }

      const data = await response.json();
      console.log('Test response data:', data);
      console.log('✅ Model working:', this.model);
      return true;
    } catch (error) {
      console.error('Hugging Face connection test failed:', error);
      
      // Auto-fallback for Llama issues
      if (this.model.includes('llama')) {
        console.log('🔄 Falling back to GPT-2 due to Llama connection issues...');
        this.model = 'gpt2';
        return this.testConnection();
      }
      
      return false;
    }
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Update model
   */
  updateModel(model: string): void {
    this.model = model;
  }
}
