import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../state/useProjectStore';
import { demoAnswer } from '../lib/chat';

export function ChatPane() {
  const { chat, addChatTurn, activeSectionId, sections, ui } = useProjectStore();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  const ask = async () => {
    const scope = ui.scope; // 'all' | 'current'
    const context = scope === 'current'
      ? sections.find(s => s.id === activeSectionId)?.text || ''
      : sections.map(s => s.text).join('\n\n');
    if (!input.trim()) return;
    const q = input.trim();
    setInput('');
    addChatTurn({ role: 'user', content: q });
    const ans = await demoAnswer(q, context, sections, activeSectionId);
    addChatTurn({ role: 'assistant', content: ans });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto pr-2">
        <div className="space-y-3">
          {chat.map((m, i) => (
            <div key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.role === 'user' ? 'ml-auto bg-gray-800 text-white' : 'bg-gray-100'}`}>
              <div className="whitespace-pre-wrap text-sm">{m.content}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        {ui.useGemini && ui.geminiApiKey && (
          <div className="mb-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            AI-Powered Chat Enabled
          </div>
        )}
        <div className="flex items-center gap-2">
          <select
            className="rounded-xl border border-border bg-white px-2 py-2 text-sm"
            value={ui.scope}
            onChange={(e) => useProjectStore.getState().setScope(e.target.value as any)}
          >
            <option value="all">All Sources</option>
            <option value="current">Current Chapter</option>
          </select>
          <textarea
            rows={1}
            placeholder="Ask about the book..."
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
          />
          <button
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm hover:bg-gray-50"
            onClick={ask}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
