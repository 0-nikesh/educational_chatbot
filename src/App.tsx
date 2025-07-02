import React, { useEffect } from 'react';
import { useProjectStore } from './state/useProjectStore';
import { initializeLemongrass } from './lib/lemongrass';
import { initializeAI } from './lib/chat';
import { Sidebar } from './components/Sidebar';
import { ChatPane } from './components/ChatPane';
import { NotesPanel } from './components/NotesPanel';
import { ChapterTools } from './components/ChapterTools';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const { loadFromStorage, ui } = useProjectStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Initialize AI services when settings change
  useEffect(() => {
    initializeAI();
  }, [ui.geminiApiKey, ui.useGemini]);

  // Initialize Lemongrass service when API key is available
  useEffect(() => {
    if (ui.lemongrassApiKey?.trim()) {
      initializeLemongrass(ui.lemongrassApiKey.trim());
    }
  }, [ui.lemongrassApiKey]);

  return (
    <div className="min-h-screen w-full bg-muted">
      <header className="sticky top-0 z-10 bg-panel border-b border-border">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-lg">NotebookLM Lite</div>
          <div className="flex items-center gap-2">
            <input
              className="rounded-xl border border-border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Search in sources..."
              value={ui.searchQuery}
              onChange={(e) => useProjectStore.getState().setSearchQuery(e.target.value)}
            />
            <button
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => useProjectStore.getState().clearProject()}
            >
              Clear Project
            </button>
            <button
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => useProjectStore.getState().setSettingsOpen(true)}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-[320px_1fr_360px] gap-4 p-4">
        <aside className="bg-panel rounded-2xl border border-border h-[calc(100vh-120px)] overflow-hidden">
          <Sidebar />
        </aside>

        <section className="flex flex-col gap-4 h-[calc(100vh-120px)]">
          <div className="bg-panel rounded-2xl border border-border p-4 flex-1 min-h-[320px] overflow-hidden">
            <ChatPane />
          </div>
          <div className="bg-panel rounded-2xl border border-border p-4">
            <ChapterTools />
          </div>
        </section>

        <aside className="bg-panel rounded-2xl border border-border p-4 h-[calc(100vh-120px)] overflow-auto">
          <NotesPanel />
        </aside>
      </main>

      <SettingsModal />
    </div>
  );
}
