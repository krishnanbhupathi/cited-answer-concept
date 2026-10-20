"""Find a quoted passage inside a paper's abstract.

A citation is only shown as verified when its quote appears in the source
text. Matching ignores case, runs of whitespace and the Lancet's middle-dot
decimals (0·31 and 0.31 match), and returns offsets into the original text so
the UI can highlight the exact span.
"""

import re
from difflib import SequenceMatcher


def _fold(ch: str) -> str:
    if ch == "·":
        return "."
    if ch in "‐‑‒–—":
        return "-"
    if ch in "‘’":
        return "'"
    if ch in "“”":
        return '"'
    return ch.lower()


def normalise(text: str) -> tuple[str, list[int]]:
    """Folded text, plus the original index of every folded character."""
    out: list[str] = []
    index: list[int] = []
    for i, ch in enumerate(text):
        if ch.isspace():
            if out and out[-1] != " ":
                out.append(" ")
                index.append(i)
            continue
        out.append(_fold(ch))
        index.append(i)
    while out and out[-1] == " ":
        out.pop()
        index.pop()
    return "".join(out), index


def locate(quote: str, paper: dict) -> dict | None:
    """The section and [start, end) span of the quote, or None."""
    needle, _ = normalise(quote)
    if not needle:
        return None
    for section in paper["abstract"]:
        hay, index = normalise(section["text"])
        at = hay.find(needle)
        if at >= 0:
            return {
                "section": section["label"],
                "start": index[at],
                "end": index[at + len(needle) - 1] + 1,
            }
    return None


_SENTENCE = re.compile(r"(?<=[.!?])\s+(?=[A-Z(])")


def sentences(text: str):
    """Yield (start, end) for each sentence in text."""
    pos = 0
    for m in _SENTENCE.finditer(text):
        yield pos, m.start()
        pos = m.end()
    if pos < len(text):
        yield pos, len(text)


def closest(quote: str, paper: dict) -> dict:
    """The sentence in the abstract most like the quote, for unverified citations."""
    needle, _ = normalise(quote)
    best = {"score": -1.0}
    for section in paper["abstract"]:
        for start, end in sentences(section["text"]):
            hay, _ = normalise(section["text"][start:end])
            score = SequenceMatcher(None, needle, hay).ratio()
            if score > best["score"]:
                best = {"section": section["label"], "start": start, "end": end, "score": round(score, 2)}
    return best


def check(quote: str, paper: dict) -> dict:
    found = locate(quote, paper)
    if found:
        return {"verified": True, **found}
    return {"verified": False, "closest": closest(quote, paper)}
