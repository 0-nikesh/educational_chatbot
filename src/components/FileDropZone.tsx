import React from 'react';
import { useProjectStore } from '../state/useProjectStore';

export function FileDropZone() {
  const { addFiles } = useProjectStore();

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => /\.(pdf|txt)$/i.test(f.name));
    addFiles(files);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="rounded-2xl border-2 border-dashed border-border bg-white p-6 text-center text-sm text-gray-600"
    >
      Drag & drop PDF/TXT here
    </div>
  );
}
