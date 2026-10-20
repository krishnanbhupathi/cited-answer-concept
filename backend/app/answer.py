"""The demo answer: claims, each tied to the passages that back it.

The answer text is written by hand for this concept. In production the claims
and quotes would come from the model; the contract is the same, and every
quote goes through verify.check before the UI may call it verified.
"""

import json
from pathlib import Path

from .verify import check

PAPERS: dict[str, dict] = {p["pmid"]: p for p in json.loads((Path(__file__).parent / "papers.json").read_text())}

# Study details read from each abstract.
META = {
    "21315441": {"trial": "CHAMPION", "design": "RCT", "n": 550, "device": "Implanted PA sensor"},
    "34461042": {"trial": "GUIDE-HF", "design": "RCT", "n": 1000, "device": "Implanted PA sensor"},
    "37220768": {"trial": "MONITOR-HF", "design": "RCT", "n": 348, "device": "Implanted PA sensor"},
    "26857383": {"trial": "BEAT-HF", "design": "RCT", "n": 1437, "device": "Coaching calls + telemonitoring"},
    "21080835": {"trial": "Tele-HF", "design": "RCT", "n": 1653, "device": "Phone-based telemonitoring"},
}

QUESTION = "Does remote monitoring improve outcomes in heart failure?"

CLAIMS = [
    {
        "id": "c1",
        "section": "Bottom line",
        "text": "Implanted pulmonary-artery pressure sensors have the strongest randomised evidence: they reduced heart-failure hospitalisations in patients with class III heart failure.",
        "cites": [
            {"pmid": "21315441", "stance": "supports", "quote": "the treatment group had a 39% reduction in heart-failure-related hospitalisation compared with the control group"},
            {"pmid": "37220768", "stance": "supports", "quote": "Haemodynamic monitoring substantially improved quality of life and reduced heart failure hospitalisations"},
        ],
    },
    {
        "id": "c2",
        "section": "Bottom line",
        "text": "The largest of those trials was neutral overall, with a possible benefit only before COVID-19.",
        "cites": [
            {"pmid": "34461042", "stance": "mixed", "quote": "did not result in a lower composite endpoint rate of mortality and total heart failure events compared with the control group in the overall study analysis"},
        ],
    },
    {
        "id": "c3",
        "section": "Bottom line",
        "text": "Non-invasive telemonitoring after discharge did not reduce readmissions in two large trials.",
        "cites": [
            {"pmid": "26857383", "stance": "contradicts", "quote": "combined health coaching telephone calls and telemonitoring did not reduce 180-day readmissions"},
            {"pmid": "21080835", "stance": "contradicts", "quote": "Among patients recently hospitalized for heart failure, telemonitoring did not improve outcomes."},
        ],
    },
    {
        "id": "c4",
        "section": "What the evidence shows",
        "text": "In CHAMPION, hospitalisations fell from 0.44 to 0.31 per patient over six months.",
        "cites": [
            {"pmid": "21315441", "stance": "supports", "quote": "rate 0.31 vs 0.44, hazard ratio [HR] 0.70, 95% CI 0.60-0.84"},
        ],
    },
    {
        "id": "c5",
        "section": "What the evidence shows",
        "text": "MONITOR-HF also found better quality of life, about 7 points on the KCCQ at 12 months.",
        "cites": [
            {"pmid": "37220768", "stance": "supports", "quote": "The difference in mean change in KCCQ overall summary score at 12 months was 7·13"},
        ],
    },
    {
        "id": "c6",
        "section": "What the evidence shows",
        "text": "In GUIDE-HF's pre-pandemic period the event rate was lower with sensor-guided care.",
        "cites": [
            {"pmid": "34461042", "stance": "supports", "quote": "In the pre-COVID-19 impact analysis, there were 177 primary events (0·553 per patient-year) in the intervention group and 224 events (0·682 per patient-year) in the control group"},
        ],
    },
    {
        "id": "c7",
        "section": "What the evidence shows",
        "text": "BEAT-HF did not cut readmissions but did improve quality of life at 180 days.",
        "cites": [
            {"pmid": "26857383", "stance": "mixed", "quote": "there was a significant difference in 180-day quality of life between the intervention and usual care groups"},
        ],
    },
    {
        "id": "c8",
        "section": "What the evidence shows",
        "text": "Device complications were uncommon.",
        "cites": [
            # Deliberately not in the abstract: shows how an unverified quote is surfaced.
            {"pmid": "37220768", "stance": "supports", "quote": "complications occurred in fewer than 3% of patients"},
        ],
    },
]


def paper_card(pmid: str) -> dict:
    p = PAPERS[pmid]
    return {
        "pmid": pmid,
        "title": p["title"],
        "journal": p["journal"],
        "year": p["year"],
        "first": p["first"],
        "nauthors": p["nauthors"],
        "doi": p["doi"],
        "abstract": p["abstract"],
        **META[pmid],
    }


def build() -> dict:
    """The question, every cited paper, and each claim with its checked citations."""
    claims = []
    for c in CLAIMS:
        cites = [{**cite, **check(cite["quote"], PAPERS[cite["pmid"]])} for cite in c["cites"]]
        claims.append({**c, "cites": cites})
    return {"question": QUESTION, "papers": {pmid: paper_card(pmid) for pmid in PAPERS}, "claims": claims}
