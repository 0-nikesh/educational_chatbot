import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
// Vite-friendly worker URL
// @ts-ignore - Vite query param ?url returns a string URL
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractTextByPage(file: File): Promise<{ pages: string[], numPages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => (it.str ?? ''));
    pages.push(strings.join(' '));
  }
  return { pages, numPages: pdf.numPages };
}
