import Demo from './demo'

const REPO = 'https://github.com/krishnanbhupathi/cited-answer-concept'

export default function Page() {
  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-24 sm:px-6">
      <header className="pt-14 pb-8 sm:pt-20">
        <p className="text-[14px] text-mute">A concept for AnswerThis, from Krishna Bhupathi</p>
        <h1 className="mt-3 max-w-[18ch] text-[clamp(32px,5vw,52px)] leading-[1.05] font-semibold tracking-[-0.02em] text-balance">
          Every claim shows its evidence
        </h1>
        <p className="mt-5 max-w-[62ch] text-[18px] leading-relaxed">
          Each claim carries its own citation. Click one and the exact sentence from the paper is highlighted beside it. A small FastAPI service checks every quote against the
          source, so a quote that isn’t really there gets flagged before a researcher copies it into a thesis.
        </p>
      </header>

      <Demo />

      <section className="mt-20">
        <div>
          <h2 className="text-[26px] leading-tight font-semibold tracking-[-0.01em]">What I saw in the product today</h2>
          <p className="mt-3 max-w-[60ch] leading-relaxed">
            I signed up on October 21 and asked about remote monitoring in heart failure. The answer was good: 259 papers found, 6 cited. Then I clicked [1] to check a claim.
          </p>
          <ul className="mt-4 max-w-[60ch] list-disc space-y-2 pl-5 leading-relaxed">
            <li>The three citations sit at the end of a paragraph with three claims, so I couldn’t tell which source backs which claim.</li>
            <li>
              Clicking [1] highlights a Relevant Extract cell that is cut off at the panel’s edge, with the arrow buttons over the text. The sentence I was checking isn’t highlighted.
            </li>
            <li>The first paper’s Abstract cell is empty.</li>
          </ul>
          <p className="mt-4 max-w-[60ch] text-[14px] text-mute">Tested on a 13-inch laptop window. A wider screen shows more of the table, but the claim-to-source link stays loose.</p>
        </div>
        <figure className="mt-8">
          <img src="/answerthis/before.jpg" alt="AnswerThis today: citations [1] [2] [3] at the end of a paragraph, and the Relevant Extract column cut off at the right edge." className="rounded-xl border border-line" />
          <figcaption className="mt-2 text-[13px] text-mute">AnswerThis on October 21, 2026, after clicking [1].</figcaption>
        </figure>
      </section>

      <section className="mt-20 max-w-[68ch]">
        <h2 className="text-[26px] leading-tight font-semibold tracking-[-0.01em]">How it’s built</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            <b className="font-semibold">FastAPI</b> streams the answer as NDJSON, one claim per line, each with its citations. Before a citation is sent, the checker looks for the quote in the
            abstract, ignoring case, spacing and the Lancet’s 0·31 decimals, and returns the exact character span. If the quote isn’t there, it returns the closest sentence instead.
          </li>
          <li>
            <b className="font-semibold">Next.js, React and Tailwind</b> render the answer as it arrives. The panel opens on the sentence that matters, not a table, and a reader can step
            through every citation with the [ and ] keys.
          </li>
          <li>12 pytest tests on the checker and API, 9 Vitest tests on highlighting and excerpts.</li>
          <li>
            The five trials and their abstracts are real, fetched from PubMed. I wrote the answer text by hand for the demo, and one quote is deliberately wrong to show the flag.
          </li>
        </ul>
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-medium">
          <a className="underline underline-offset-4" href={REPO}>
            Read the code
          </a>
          <a className="underline underline-offset-4" href="https://design.bhupathi.dev">
            Design portfolio
          </a>
          <a className="underline underline-offset-4" href="https://bhupathi.dev">
            Shipped products
          </a>
        </p>
      </section>

      <footer className="mt-20 max-w-[68ch] border-t border-line pt-6 text-[13px] text-mute">
        I’m Krishna, a design engineer in India. Made as a concept for the AnswerThis Product Engineer role. Not affiliated with AnswerThis.
      </footer>
    </main>
  )
}
