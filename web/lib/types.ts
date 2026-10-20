export type Section = { label: string; text: string }

export type Paper = {
  pmid: string
  title: string
  journal: string
  year: string
  first: string
  nauthors: number
  doi: string
  abstract: Section[]
  trial: string
  design: string
  n: number
  device: string
}

export type Span = { section: string; start: number; end: number }

export type Cite = {
  pmid: string
  stance: 'supports' | 'mixed' | 'contradicts'
  quote: string
} & ({ verified: true } & Span | { verified: false; closest: Span & { score: number } })

export type Claim = { id: string; section: string; text: string; cites: Cite[] }

export type Answer = { question: string; papers: Record<string, Paper>; claims: Claim[] }
