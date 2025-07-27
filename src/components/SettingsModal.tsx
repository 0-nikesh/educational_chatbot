import React, { useState } from 'react';
import { useProjectStore } from '../state/useProjectStore';
import { initializeLemongrass } from '../lib/lemongrass';
import { initializeAI, testAIConnection } from '../lib/chat';

export function SettingsModal() {
  const { 
    ui, 
    setSettingsOpen, 
    setTheme, 
    setLemongrassApiKey, 
    setGeminiApiKey,
    setUseGemini 
  } = useProjectStore();

  const [aiConnectionStatus, setAiConnectionStatus] = useState<{
    gemini: 'idle' | 'testing' | 'success' | 'error';
  }>({ gemini: 'idle' });

  const handleLemongrassApiKeyChange = (key: string) => {
    setLemongrassApiKey(key);
    if (key.trim()) {
      initializeLemongrass(key.trim());
    }
  };

  const handleGeminiApiKeyChange = async (key: string) => {
    setGeminiApiKey(key);
    // Auto-enable Gemini when API key is provided
    if (key.trim() && !ui.useGemini) {
      setUseGemini(true);
    }

    // Test connection when API key is entered
    if (key.trim()) {
      setAiConnectionStatus(prev => ({ ...prev, gemini: 'testing' }));
      try {
        initializeAI();
        const results = await testAIConnection();
        setAiConnectionStatus(prev => ({ 
          ...prev, 
          gemini: results.gemini ? 'success' : 'error' 
        }));
        
        // Reset status after 3 seconds
        setTimeout(() => setAiConnectionStatus(prev => ({ ...prev, gemini: 'idle' })), 3000);
      } catch (error) {
        setAiConnectionStatus(prev => ({ ...prev, gemini: 'error' }));
        setTimeout(() => setAiConnectionStatus(prev => ({ ...prev, gemini: 'idle' })), 3000);
      }
    } else {
      setAiConnectionStatus(prev => ({ ...prev, gemini: 'idle' }));
    }
  };

  if (!ui.settingsOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[520px] max-w-[95vw] rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Settings</div>
          <button className="text-sm text-gray-600" onClick={() => setSettingsOpen(false)}>Close</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">Theme</div>
            <select
              className="rounded-xl border border-border bg-white px-2 py-2 text-sm"
              value={ui.theme}
              onChange={(e) => setTheme(e.target.value as any)}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Lemongrass API Key</div>
            <input
              type="password"
              placeholder="Enter your Lemongrass API key"
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={ui.lemongrassApiKey}
              onChange={(e) => handleLemongrassApiKeyChange(e.target.value)}
            />
            <div className="text-xs text-gray-500">
              Required for enhanced podcast generation. Leave empty to use browser TTS fallback.
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-4">
            {/* Gemini AI Section */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Enable Gemini AI Chat</div>
                <div className="text-xs text-gray-500">Use Google's Gemini AI for intelligent responses</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={ui.useGemini}
                  onChange={(e) => setUseGemini(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {ui.useGemini && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Gemini API Key</div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter your Gemini API key"
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={ui.geminiApiKey}
                    onChange={(e) => handleGeminiApiKeyChange(e.target.value)}
                  />
                  {aiConnectionStatus.gemini === 'testing' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {aiConnectionStatus.gemini === 'success' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                      ✓
                    </div>
                  )}
                  {aiConnectionStatus.gemini === 'error' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600">
                      ✗
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Get your free API key from{' '}
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google AI Studio
                  </a>
                  {aiConnectionStatus.gemini === 'testing' && (
                    <span className="block text-blue-600 mt-1">Testing connection...</span>
                  )}
                  {aiConnectionStatus.gemini === 'success' && (
                    <span className="block text-green-600 mt-1">✓ Connection successful!</span>
                  )}
                  {aiConnectionStatus.gemini === 'error' && (
                    <span className="block text-red-600 mt-1">✗ Connection failed. Please check your API key.</span>
                  )}
                </div>
              </div>
            )}

            {ui.geminiApiKey && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-800 font-medium">🤖 Gemini AI Enabled</div>
                <div className="text-xs text-green-700 mt-1">
                  Your chatbot will use Google's Gemini AI for intelligent, contextual responses to your questions.
                </div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            This demo runs fully in the browser. API keys are stored locally and never sent to our servers.
          </div>
        </div>
      </div>
    </div>
  );
}
