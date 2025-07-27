# NotebookLM Lite (Frontend-only)

A **React + Tailwind** demo that mimics the NotebookLM flow — **Upload PDF → Chapters → Chat → Summarize → Podcast (TTS)** — running **entirely in the browser**. Now enhanced with **Lemongrass API integration** for professional podcast generation.

## Features
- In-browser PDF parsing via `pdfjs-dist`
- Auto chapter/section detection (headings heuristic + fallback)
- Chat answers based on retrieved paragraphs (TF‑IDF, cosine similarity)
- Extractive chapter summarizer (frequency/rarity scoring)
- **Enhanced Podcast Generation** via Lemongrass API with fallback to Web Speech API
- Local persistence via localStorage
- Clean three-column UI (Sidebar / Chat+Tools / Notes)

## Podcast Generation
- **Lemongrass API**: Professional AI-generated podcasts with natural voices
- **Fallback**: Browser's Web Speech API for basic text-to-speech
- **Easy Setup**: Add your Lemongrass API key in Settings

## Quick Start
```bash
npm install
npm run dev
```

Open http://localhost:5173 and upload a PDF or a .txt file.

### Lemongrass API Setup
1. Open the application
2. Click "Settings" in the header
3. Enter your Lemongrass API key: `FIMAaMZUihzi9im1UxSyhnFwLrSJzTnm`
4. Start generating professional podcasts from your content!

## Notes
- **Lemongrass Integration**: Professional podcast generation with natural AI voices
- **Privacy**: API keys are stored locally, never sent to our servers
- **Fallback**: Works without API key using browser TTS
- Optional on-device LLMs (e.g., `@xenova/transformers`) can be added, but are not required.
- If pdf worker fails to load, ensure Vite serves the `pdf.worker.min.mjs` (configured via `?url` import).

## Folder Structure
```
src/
  components/   # UI components (Sidebar, Chat, Tools, Notes, etc.)
  lib/          # pdf parsing, sectioning, search, summarize, tts, lemongrass API
  state/        # zustand store
public/
  sample.txt    # small sample text for instant testing
```
