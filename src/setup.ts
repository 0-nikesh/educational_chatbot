/**
 * Auto-setup script for NotebookLM Lite with user's API keys
 * This file automatically configures the application with the user's credentials
 */

import { initializeAI } from './lib/chat';
import { initializeLemongrass } from './lib/lemongrass';
import { testAIConnection } from './lib/chat';
import { useProjectStore } from './state/useProjectStore';

// User's API Keys - Gemini only configuration
const USER_CONFIG = {
  // Gemini API Key for AI-powered chat responses
  GEMINI_API_KEY: 'AIzaSyCHSfv29lW6RgKvxqnee9exiVsewW_8iOc',
  
  // Lemongrass API Key for enhanced podcast generation (if available)
  LEMONGRASS_API_KEY: 'FIMAaMZUihzi9im1UxSyhnFwLrSJzTnm'
};

/**
 * Initialize all services with user's API keys
 */
export function setupUserServices() {
  console.log('🚀 Initializing NotebookLM Lite with AI services...');
  
  try {
    // Initialize Gemini AI service
    if (USER_CONFIG.GEMINI_API_KEY) {
      // Update store with user's keys
      const store = useProjectStore.getState();
      
      store.setGeminiApiKey(USER_CONFIG.GEMINI_API_KEY);
      store.setUseGemini(true);
      
      initializeAI();
      console.log('✅ Gemini AI service initialized');
    }
    
    // Initialize Lemongrass podcast service
    if (USER_CONFIG.LEMONGRASS_API_KEY) {
      initializeLemongrass(USER_CONFIG.LEMONGRASS_API_KEY);
      console.log('✅ Lemongrass podcast service initialized');
    }
    
    console.log('🎉 All services initialized successfully!');
    
    // Show user notification
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        console.log('🤖 AI-Powered Educational Chatbot Ready!');
        console.log('💬 Your chatbot now uses Gemini AI for intelligent responses');
        console.log('🎙️ Enhanced podcast generation with conversational hosts available');
        
        // Run API tests
        console.log('🧪 Running AI integration tests...');
        testAIConnection().then(results => {
          console.log('AI Connection Results:', results);
        }).catch(error => {
          console.error('AI test failed:', error);
        });
      }, 1000);
    }
    
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    console.log('🔄 Services will fallback to default configurations');
  }
}

/**
 * Validate API keys
 */
export function validateApiKeys() {
  const validation = {
    gemini: USER_CONFIG.GEMINI_API_KEY?.startsWith('AIza'),
    lemongrass: USER_CONFIG.LEMONGRASS_API_KEY?.length > 10
  };
  
  console.log('🔐 API Key Validation:', validation);
  return validation;
}

// Auto-run setup when this module is imported
if (typeof window !== 'undefined') {
  // Run after a short delay to ensure other modules are loaded
  setTimeout(() => {
    setupUserServices();
    validateApiKeys();
  }, 100);
}

export default USER_CONFIG;
