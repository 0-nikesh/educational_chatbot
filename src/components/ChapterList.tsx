import React from 'react';
import { useProjectStore } from '../state/useProjectStore';

export function ChapterList({ sourceId }: { sourceId: string }) {
  const { sections, activeSectionId, setActiveSection, ui } = useProjectStore();
  const list = sections.filter(s => s.sourceId === sourceId && (ui.searchQuery === '' || s.title.toLowerCase().includes(ui.searchQuery.toLowerCase()) || s.text.toLowerCase().includes(ui.searchQuery.toLowerCase())));

  return (
    <div className="space-y-1">
      {list.map(sec => (
        <button
          key={sec.id}
          className={`w-full text-left px-3 py-2 rounded-xl border ${activeSectionId === sec.id ? 'bg-gray-100 border-gray-300' : 'bg-white border-border hover:bg-gray-50'}`}
          onClick={() => setActiveSection(sec.id)}
          title={`${sec.tokensEstimated ?? ''} tokens`}
        >
          <div className="text-sm font-medium truncate">{sec.title}</div>
          <div className="text-[11px] text-gray-500">pp. {sec.startPage ?? '?'} – {sec.endPage ?? '?'}</div>
        </button>
      ))}
    </div>
  );
}
