import asyncio
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .answer import PAPERS, build, paper_card
from .verify import check

app = FastAPI(title="Cited answer concept")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])


@app.get("/papers/{pmid}")
def get_paper(pmid: str):
    if pmid not in PAPERS:
        raise HTTPException(404, "Unknown paper")
    return paper_card(pmid)


class Quote(BaseModel):
    pmid: str
    quote: str


@app.post("/verify")
def verify(q: Quote):
    if q.pmid not in PAPERS:
        raise HTTPException(404, "Unknown paper")
    return check(q.quote, PAPERS[q.pmid])


@app.get("/answer/stream")
async def stream(delay: float = 0.4):
    """NDJSON: one header line with the question and papers, then one line per claim."""
    data = build()

    async def lines():
        yield json.dumps({"type": "start", "question": data["question"], "papers": data["papers"]}) + "\n"
        for claim in data["claims"]:
            await asyncio.sleep(delay)
            yield json.dumps({"type": "claim", **claim}) + "\n"
        yield json.dumps({"type": "done"}) + "\n"

    return StreamingResponse(lines(), media_type="application/x-ndjson")
