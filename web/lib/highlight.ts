export type Mark = { start: number; end: number; kind: 'quote' | 'closest' }
export type Piece = { text: string; kind?: Mark['kind'] }

/** Split text into plain and marked pieces. Overlapping marks are merged, first one wins. */
export function pieces(text: string, marks: Mark[]): Piece[] {
  const sorted = marks
    .filter(m => m.start < m.end && m.start >= 0 && m.end <= text.length)
    .sort((a, b) => a.start - b.start)
  const out: Piece[] = []
  let at = 0
  for (const m of sorted) {
    const start = Math.max(m.start, at)
    if (start >= m.end) continue
    if (start > at) out.push({ text: text.slice(at, start) })
    out.push({ text: text.slice(start, m.end), kind: m.kind })
    at = m.end
  }
  if (at < text.length) out.push({ text: text.slice(at) })
  return out
}

/** Sections that hold a mark come first, so the evidence is never below the fold. */
export function sectionOrder<T extends { label: string }>(sections: T[], marked: Set<string>): T[] {
  return [...sections.filter(s => marked.has(s.label)), ...sections.filter(s => !marked.has(s.label))]
}

const SENTENCE_END = /(?<=[.!?])\s+(?=[A-Z(])/g

/** The window of whole sentences that holds every mark, so long sections open on the evidence. */
export function excerpt(text: string, marks: Mark[]): { from: number; to: number } {
  if (!marks.length) return { from: 0, to: text.length }
  const starts = [0, ...[...text.matchAll(SENTENCE_END)].map(m => m.index! + m[0].length)]
  const first = Math.min(...marks.map(m => m.start))
  const last = Math.max(...marks.map(m => m.end))
  const from = Math.max(...starts.filter(s => s <= first))
  const after = starts.filter(s => s >= last)
  const to = after.length ? Math.min(...after) : text.length
  return { from, to: text.slice(0, to).trimEnd().length }
}
