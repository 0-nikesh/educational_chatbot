export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

export function tfidfParagraphs(paragraphs: string[]) {
  const docs = paragraphs.map(tokenize);
  const df = new Map<string, number>();
  for (const d of docs) {
    const seen = new Set(d);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  const N = docs.length;
  const vectors = docs.map(d => {
    const tf = new Map<string, number>();
    d.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    const vec = new Map<string, number>();
    tf.forEach((f, t) => {
      const idf = Math.log((N + 1) / ((df.get(t) || 0) + 1)) + 1;
      vec.set(t, f * idf);
    });
    return vec;
  });
  return { vectors, vocabulary: df };
}

export function vectorizeQuery(q: string, df: Map<string, number>, N: number) {
  const toks = tokenize(q);
  const tf = new Map<string, number>();
  toks.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
  const vec = new Map<string, number>();
  tf.forEach((f, t) => {
    const idf = Math.log((N + 1) / ((df.get(t) || 0) + 1)) + 1;
    vec.set(t, f * idf);
  });
  return vec;
}

export function cosine(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0, na = 0, nb = 0;
  a.forEach((va, k) => { dot += va * (b.get(k) || 0); na += va * va; });
  b.forEach(vb => { nb += vb * vb; });
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}
