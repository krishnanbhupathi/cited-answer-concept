from app.answer import CLAIMS, PAPERS, build
from app.verify import check, closest, locate, normalise

MONITOR = PAPERS["37220768"]
CHAMPION = PAPERS["21315441"]


def test_normalise_folds_case_space_and_middle_dot():
    text, index = normalise("Rate  0·31\nvs 0.44")
    assert text == "rate 0.31 vs 0.44"
    assert len(index) == len(text)


def test_locate_returns_span_in_original_text():
    quote = "rate 0.31 vs 0.44"  # abstract writes 0·31
    hit = locate(quote, CHAMPION)
    assert hit is not None
    section = next(s for s in CHAMPION["abstract"] if s["label"] == hit["section"])
    assert section["text"][hit["start"]:hit["end"]] == "rate 0·31 vs 0·44"


def test_locate_ignores_case_and_line_breaks():
    assert locate("HAEMODYNAMIC MONITORING\n substantially improved", MONITOR)


def test_missing_quote_is_not_verified():
    result = check("complications occurred in fewer than 3% of patients", MONITOR)
    assert result["verified"] is False
    assert "start" not in result


def test_closest_points_at_the_complications_sentence():
    best = closest("complications occurred in fewer than 3% of patients", MONITOR)
    section = next(s for s in MONITOR["abstract"] if s["label"] == best["section"])
    assert "device-related or system-related complications" in section["text"][best["start"]:best["end"]]


def test_empty_quote_never_verifies():
    assert locate("   ", MONITOR) is None


def test_every_claim_quote_except_the_demo_one_verifies():
    data = build()
    unverified = [(c["id"], cite["pmid"]) for c in data["claims"] for cite in c["cites"] if not cite["verified"]]
    assert unverified == [("c8", "37220768")]


def test_verified_spans_contain_the_quote_words():
    for claim in build()["claims"]:
        for cite in claim["cites"]:
            if not cite["verified"]:
                continue
            section = next(s for s in PAPERS[cite["pmid"]]["abstract"] if s["label"] == cite["section"])
            span = section["text"][cite["start"]:cite["end"]]
            assert normalise(span)[0] == normalise(cite["quote"])[0]


def test_every_cited_paper_is_known():
    assert {cite["pmid"] for c in CLAIMS for cite in c["cites"]} <= set(PAPERS)
