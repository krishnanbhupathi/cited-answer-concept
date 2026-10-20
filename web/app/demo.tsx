'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { excerpt, pieces, sectionOrder, type Mark } from '@/lib/highlight'
import type { Answer, Cite, Claim, Paper } from '@/lib/types'

type Sel = { kind: 'cite'; claim: string; idx: number } | { kind: 'paper'; pmid: string } | null

const STANCE = {
  supports: { label: 'Supports', cls: 'bg-okbg text-ok' },
  mixed: { label: 'Mixed', cls: 'bg-well text-mute' },
  contradicts: { label: 'Finds no benefit', cls: 'bg-rosebg text-rose' },
} as const

const STEP = 650

export default function Demo() {
  const [data, setData] = useState<Answer | null>(null)
  const [shown, setShown] = useState(0)
  const [checked, setChecked] = useState(0)
  const [sel, setSel] = useState<Sel>(null)
  const timers = useRef<number[]>([])
  const panel = useRef<HTMLElement>(null)

  useEffect(() => {
    fetch('/answerthis/answer.json').then(r => r.json()).then(setData)
  }, [])

  const play = useCallback(() => {
    if (!data) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    setSel(null)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const n = data.claims.length
    if (reduce) {
      setShown(n)
      setChecked(n)
      return
    }
    setShown(0)
    setChecked(0)
    for (let i = 1; i <= n; i++) {
      timers.current.push(window.setTimeout(() => setShown(i), STEP * i))
      timers.current.push(window.setTimeout(() => setChecked(i), STEP * i + 380))
    }
  }, [data])

  useEffect(() => {
    play()
    return () => timers.current.forEach(clearTimeout)
  }, [play])

  const flat = useMemo(
    () => (data ? data.claims.flatMap(c => c.cites.map((_, idx) => ({ claim: c.id, idx }))) : []),
    [data],
  )

  const select = useCallback((next: Sel) => {
    setSel(next)
    if (next && window.innerWidth < 1024) panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input,textarea')) return
      if (e.key === 'Escape') setSel(null)
      if (e.key !== ']' && e.key !== '[') return
      if (!flat.length || checked < (data?.claims.length ?? 0)) return
      const at = sel?.kind === 'cite' ? flat.findIndex(f => f.claim === sel.claim && f.idx === sel.idx) : -1
      const next = e.key === ']' ? (at + 1) % flat.length : (at - 1 + flat.length) % flat.length
      setSel({ kind: 'cite', ...flat[next] })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flat, sel, checked, data])

  if (!data) return <div className="h-[560px] rounded-xl border border-line bg-white" />

  const done = checked === data.claims.length
  const allCites = data.claims.flatMap(c => c.cites)
  const found = allCites.filter(c => c.verified).length
  const sections = [...new Set(data.claims.map(c => c.section))]

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_0_rgba(0,0,0,.03)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-[13px] text-mute">
        <span>Concept · research answer with claim-level citations</span>
        <button onClick={play} className="rounded-md px-2 py-1 hover:bg-well focus-visible:outline-2 focus-visible:outline-rose">
          Replay
        </button>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 px-5 py-6 sm:px-8">
          <div className="ml-auto max-w-md rounded-2xl bg-well px-4 py-3 text-[15px]">{data.question}</div>

          <p className="mt-6 text-[13px] text-mute" aria-live="polite">
            {done
              ? `${data.claims.length} claims · ${allCites.length} quotes · ${found} found word for word in the source · ${allCites.length - found} needs checking`
              : 'Writing the answer and checking each quote against its source…'}
          </p>

          {sections.map(section => {
            const claims = data.claims.slice(0, shown).filter(c => c.section === section)
            if (!claims.length) return null
            const list = section !== 'Bottom line'
            return (
              <section key={section} className="mt-5">
                <h3 className="text-[15px] font-semibold">{section}</h3>
                {list ? (
                  <ul className="mt-2 list-disc space-y-2 pl-5 font-serif text-[17px] leading-[1.65]">
                    {claims.map(c => (
                      <li key={c.id} className="rise">
                        <ClaimText claim={c} data={data} sel={sel} checked={data.claims.indexOf(c) < checked} onPick={select} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 font-serif text-[17px] leading-[1.7]">
                    {claims.map(c => (
                      <span key={c.id} className="rise">
                        <ClaimText claim={c} data={data} sel={sel} checked={data.claims.indexOf(c) < checked} onPick={select} />{' '}
                      </span>
                    ))}
                  </p>
                )}
              </section>
            )
          })}

          {done && (
            <p className="mt-8 hidden text-[12.5px] text-mute lg:block">
              Tip: press <kbd className="rounded border border-line px-1">]</kbd> and <kbd className="rounded border border-line px-1">[</kbd> to step through every citation.
            </p>
          )}
        </div>

        <aside
          ref={panel}
          className="min-w-0 scroll-mt-4 border-t border-line bg-paper lg:sticky lg:top-0 lg:max-h-[760px] lg:overflow-y-auto lg:border-t-0 lg:border-l"
          aria-label="Evidence"
        >
          {sel?.kind === 'cite' ? (
            <ClaimEvidence claim={data.claims.find(c => c.id === sel.claim)!} focus={sel.idx} data={data} onBack={() => setSel(null)} />
          ) : sel?.kind === 'paper' ? (
            <PaperEvidence pmid={sel.pmid} data={data} onBack={() => setSel(null)} />
          ) : (
            <Overview data={data} onPick={pmid => select({ kind: 'paper', pmid })} />
          )}
        </aside>
      </div>
    </div>
  )
}

function ClaimText({ claim, data, sel, checked, onPick }: { claim: Claim; data: Answer; sel: Sel; checked: boolean; onPick: (s: Sel) => void }) {
  const active = sel?.kind === 'cite' && sel.claim === claim.id
  return (
    <>
      <span className={active ? 'rounded-[3px] bg-rosebg shadow-[0_0_0_3px_var(--color-rosebg)]' : ''}>{claim.text}</span>
      {claim.cites.map((cite, idx) => (
        <Chip
          key={idx}
          cite={cite}
          paper={data.papers[cite.pmid]}
          checked={checked}
          pressed={active && sel?.kind === 'cite' && sel.idx === idx}
          onClick={() => onPick({ kind: 'cite', claim: claim.id, idx })}
        />
      ))}
    </>
  )
}

function Chip({ cite, paper, checked, pressed, onClick }: { cite: Cite; paper: Paper; checked: boolean; pressed: boolean; onClick: () => void }) {
  const state = !checked ? 'checking' : cite.verified ? 'ok' : 'missing'
  const cls = {
    checking: 'border-line text-mute',
    ok: pressed ? 'border-rose bg-rose text-white' : 'border-[#e3c6d0] bg-rosebg text-rose hover:border-rose',
    missing: pressed ? 'border-warn bg-warn text-white' : 'border-dashed border-warn bg-warnbg text-warn',
  }[state]
  return (
    <span className="group relative ml-1 inline-block align-[1px]">
      <button
        type="button"
        disabled={!checked}
        aria-pressed={pressed}
        onClick={onClick}
        aria-label={`${paper.trial}${state === 'missing' ? ', quote not found in source' : ''}`}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-[1px] font-sans text-[11.5px] font-medium leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose ${cls}`}
      >
        {paper.trial}
        {state === 'checking' && <span className="animate-pulse">·</span>}
        {state === 'ok' && <span aria-hidden>✓</span>}
        {state === 'missing' && <span aria-hidden>?</span>}
      </button>
      {checked && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-72 -translate-x-1/2 rounded-lg border border-line bg-white p-3 font-sans text-[12.5px] leading-snug text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block"
        >
          <span className="block text-mute">{cite.verified ? 'Quote from the abstract' : 'Not found in the abstract'}</span>
          <span className="mt-1 block">“{cite.quote}”</span>
        </span>
      )}
    </span>
  )
}

function Overview({ data, onPick }: { data: Answer; onPick: (pmid: string) => void }) {
  const uses = (pmid: string) => data.claims.flatMap(c => c.cites).filter(c => c.pmid === pmid).length
  return (
    <div className="p-5">
      <h3 className="text-[15px] font-semibold">Sources</h3>
      <p className="mt-1 text-[13px] text-mute">Click a citation in the answer to see the exact sentence behind it.</p>
      <ul className="mt-4 space-y-2">
        {[...new Set(data.claims.flatMap(c => c.cites.map(x => x.pmid)))].map(pmid => data.papers[pmid]).map(p => (
          <li key={p.pmid}>
            <button
              onClick={() => onPick(p.pmid)}
              className="w-full rounded-lg border border-line bg-white p-3 text-left hover:border-[#d9cfc8] focus-visible:outline-2 focus-visible:outline-rose"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{p.trial}</span>
                <span className="text-[12px] text-mute">{uses(p.pmid)} quoted</span>
              </span>
              <span className="mt-0.5 block text-[13px] text-mute">
                {p.journal} {p.year} · {p.design}, n={p.n.toLocaleString()} · {p.device}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ClaimEvidence({ claim, focus, data, onBack }: { claim: Claim; focus: number; data: Answer; onBack: () => void }) {
  const order = [focus, ...claim.cites.map((_, i) => i).filter(i => i !== focus)]
  return (
    <div className="p-5">
      <Back onBack={onBack} />
      <p className="mt-3 text-[12.5px] text-mute">Evidence for</p>
      <p className="mt-1 font-serif text-[15.5px] leading-snug">{claim.text}</p>
      <div className="mt-4 space-y-3">
        {order.map(i => (
          <PaperCard key={i} paper={data.papers[claim.cites[i].pmid]} cites={[claim.cites[i]]} focused={i === focus} />
        ))}
      </div>
    </div>
  )
}

function PaperEvidence({ pmid, data, onBack }: { pmid: string; data: Answer; onBack: () => void }) {
  const cites = data.claims.flatMap(c => c.cites).filter(c => c.pmid === pmid)
  return (
    <div className="p-5">
      <Back onBack={onBack} />
      <div className="mt-3">
        <PaperCard paper={data.papers[pmid]} cites={cites} focused />
      </div>
    </div>
  )
}

function Back({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} className="rounded-md px-1.5 py-0.5 text-[13px] text-mute hover:bg-well focus-visible:outline-2 focus-visible:outline-rose">
      ← All sources
    </button>
  )
}

function PaperCard({ paper, cites, focused }: { paper: Paper; cites: Cite[]; focused: boolean }) {
  const [open, setOpen] = useState(false)
  const marks: Record<string, Mark[]> = {}
  for (const c of cites) {
    const span = c.verified ? c : c.closest
    ;(marks[span.section] ??= []).push({ start: span.start, end: span.end, kind: c.verified ? 'quote' : 'closest' })
  }
  const ordered = sectionOrder(paper.abstract, new Set(Object.keys(marks)))
  const visible = open ? ordered : ordered.filter(s => marks[s.label])
  const missing = cites.filter(c => !c.verified)
  const stance = cites.length === 1 && !missing.length ? STANCE[cites[0].stance] : null

  return (
    <article className={`rise rounded-xl border bg-white p-4 ${focused ? 'border-[#d9b8c4]' : 'border-line'}`}>
      <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
        <span className="mr-1 text-[14px] font-semibold">{paper.trial}</span>
        {stance && <span className={`rounded-full px-2 py-0.5 ${stance.cls}`}>{stance.label}</span>}
        {missing.length ? (
          <span className="rounded-full bg-warnbg px-2 py-0.5 text-warn">Quote not in abstract</span>
        ) : (
          <span className="rounded-full bg-okbg px-2 py-0.5 text-ok">Found in abstract</span>
        )}
      </div>
      <h4 className="mt-2 font-serif text-[15px] leading-snug">{paper.title}</h4>
      <p className="mt-1 text-[12.5px] text-mute">
        {paper.journal} · {paper.year} · {paper.first} et al. · {paper.design}, n={paper.n.toLocaleString()}
      </p>

      {missing.map((c, i) => (
        <div key={i} className="mt-3 rounded-lg bg-warnbg p-3 text-[13px] leading-snug text-[#6b3a12]">
          <b className="font-semibold">Don’t cite this as written.</b> The answer quotes “{c.quote}”, which isn’t in the abstract. The closest sentence is underlined below.
        </div>
      ))}

      <div className="mt-3 space-y-3">
        {visible.map(s => {
          const m = marks[s.label] ?? []
          const { from, to } = open ? { from: 0, to: s.text.length } : excerpt(s.text, m)
          const shifted = m.map(x => ({ ...x, start: x.start - from, end: x.end - from }))
          return (
          <div key={s.label}>
            {s.label && <p className="text-[11px] font-medium tracking-wide text-mute">{s.label.charAt(0) + s.label.slice(1).toLowerCase()}</p>}
            <p className="mt-0.5 text-[13.5px] leading-relaxed">
              {from > 0 && <span className="text-mute">… </span>}
              {pieces(s.text.slice(from, to), shifted).map((p, i) =>
                p.kind ? (
                  <mark key={i} className={p.kind}>
                    {p.text}
                  </mark>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
              {to < s.text.length && <span className="text-mute"> …</span>}
            </p>
          </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
        <button onClick={() => setOpen(!open)} className="text-rose underline-offset-2 hover:underline">
          {open ? 'Show less' : 'Full abstract'}
        </button>
        <a className="text-rose underline-offset-2 hover:underline" href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`} target="_blank" rel="noreferrer">
          PubMed
        </a>
        <a className="text-rose underline-offset-2 hover:underline" href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer">
          DOI
        </a>
      </div>
    </article>
  )
}
