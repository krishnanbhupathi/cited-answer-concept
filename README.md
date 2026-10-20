# Every claim shows its evidence

A concept for claim-level citations in an AI research answer. Each claim carries its own citation; clicking one opens the exact sentence from the paper, highlighted. Before a citation is shown as verified, a small FastAPI service checks that the quote really appears in the source, and flags it with the closest real sentence if it doesn't.

Live demo: https://videos.bhupathi.dev/answerthis

Made by Krishna Bhupathi as a concept for the AnswerThis Product Engineer role. Not affiliated with AnswerThis.

## What's here

- `backend/`: FastAPI.
  - `app/verify.py` finds a quote in an abstract, ignoring case, whitespace and middle-dot decimals (`0·31` = `0.31`), and returns the character span in the original text, or the closest sentence when there's no match.
  - `app/answer.py` holds the demo answer: claims, each with its quotes, run through the checker.
  - `app/main.py` exposes `GET /answer/stream` (NDJSON, one claim per line), `POST /verify` and `GET /papers/{pmid}`.
  - 12 pytest tests.
- `web/`: Next.js, React, Tailwind.
  - Renders the answer as it streams. The evidence panel opens on the highlighted sentence, and `[` / `]` step through citations.
  - 9 Vitest tests on highlighting and excerpts.

## Data

The five trials (CHAMPION, GUIDE-HF, MONITOR-HF, BEAT-HF, Tele-HF) and their abstracts are real, fetched from PubMed. The answer text is hand-written for the demo. One quote (on device complications) is deliberately not in its source, to show how an unverified citation is surfaced.

## Run it

```sh
cd backend
uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/pytest
.venv/bin/uvicorn app.main:app --reload    # API on :8000
.venv/bin/python export.py                 # writes web/public/answer.json for the static demo

cd ../web
npm install && npm test && npm run dev     # http://localhost:3000/answerthis
```
