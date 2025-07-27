import React, { useRef } from 'react';
import { useProjectStore } from '../state/useProjectStore';
import { ChapterList } from './ChapterList';
import { FileDropZone } from './FileDropZone';

export function Sidebar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { sources, addFiles } = useProjectStore();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="font-semibold mb-2">Project</div>
        <div className="text-sm text-gray-600">Upload PDFs or text files.</div>
        <div className="mt-3 flex gap-2">
          <button
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => fileRef.current?.click()}
          >
            Add Source
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              addFiles(files);
              e.currentTarget.value = '';
            }}
          />
        </div>
      </div>

      <div className="p-4">
        <FileDropZone />
      </div>

      <div className="flex-1 overflow-auto px-2">
        {sources.length === 0 ? (
          <div className="text-sm text-gray-500 p-4">No sources yet.</div>
        ) : (
          sources.map((s) => (
            <div key={s.id} className="mb-4">
              <div className="font-semibold text-sm mb-2">{s.name}</div>
              <ChapterList sourceId={s.id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
