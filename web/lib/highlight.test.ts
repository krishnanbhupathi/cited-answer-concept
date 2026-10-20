import { describe, expect, it } from 'vitest'
import { excerpt, pieces, sectionOrder } from './highlight'

describe('pieces', () => {
  it('returns the whole text when nothing is marked', () => {
    expect(pieces('abc', [])).toEqual([{ text: 'abc' }])
  })

  it('splits around a mark', () => {
    expect(pieces('hello world', [{ start: 6, end: 11, kind: 'quote' }])).toEqual([
      { text: 'hello ' },
      { text: 'world', kind: 'quote' },
    ])
  })

  it('keeps marks in order even when given out of order', () => {
    const p = pieces('a b c', [{ start: 4, end: 5, kind: 'quote' }, { start: 0, end: 1, kind: 'closest' }])
    expect(p.map(x => x.kind ?? '-')).toEqual(['closest', '-', 'quote'])
  })

  it('merges overlaps without repeating text', () => {
    const p = pieces('abcdef', [{ start: 0, end: 4, kind: 'quote' }, { start: 2, end: 6, kind: 'quote' }])
    expect(p.map(x => x.text).join('')).toBe('abcdef')
  })

  it('ignores marks outside the text', () => {
    expect(pieces('abc', [{ start: 2, end: 9, kind: 'quote' }])).toEqual([{ text: 'abc' }])
  })
})

describe('sectionOrder', () => {
  it('puts marked sections first and keeps the rest in order', () => {
    const s = [{ label: 'BACKGROUND' }, { label: 'METHODS' }, { label: 'FINDINGS' }]
    expect(sectionOrder(s, new Set(['FINDINGS'])).map(x => x.label)).toEqual(['FINDINGS', 'BACKGROUND', 'METHODS'])
  })
})

describe('excerpt', () => {
  const text = 'First one. Second has the quote here. Third one. Fourth.'
  it('returns the sentence holding the mark', () => {
    const at = text.indexOf('the quote')
    const { from, to } = excerpt(text, [{ start: at, end: at + 9, kind: 'quote' }])
    expect(text.slice(from, to)).toBe('Second has the quote here.')
  })
  it('spans from the first to the last marked sentence', () => {
    const a = text.indexOf('First'), b = text.indexOf('Third')
    const { from, to } = excerpt(text, [{ start: a, end: a + 5, kind: 'quote' }, { start: b, end: b + 5, kind: 'quote' }])
    expect(text.slice(from, to)).toBe('First one. Second has the quote here. Third one.')
  })
  it('returns everything when there are no marks', () => {
    expect(excerpt(text, [])).toEqual({ from: 0, to: text.length })
  })
})
