import React from 'react';
import { useProjectStore } from '../state/useProjectStore';

export function NotesPanel() {
  const { notes } = useProjectStore();
  return (
    <div className="h-full">
      <div className="font-semibold mb-3">Notes & Summaries</div>
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-sm text-gray-500">No notes yet.</div>
        ) : notes.map((n, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-3">
            <div className="text-sm font-medium mb-1">{n.title}</div>
            <div className="text-xs text-gray-500 mb-2">{new Date(n.timestamp).toLocaleString()}</div>
            <div className="text-sm whitespace-pre-wrap">{n.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
