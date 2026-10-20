import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_stream_sends_start_claims_then_done():
    r = client.get("/answer/stream", params={"delay": 0})
    lines = [json.loads(line) for line in r.text.splitlines()]
    assert lines[0]["type"] == "start"
    assert lines[-1]["type"] == "done"
    claims = [line for line in lines if line["type"] == "claim"]
    assert len(claims) == 8
    assert all(cite["pmid"] in lines[0]["papers"] for c in claims for cite in c["cites"])


def test_verify_endpoint():
    ok = client.post("/verify", json={"pmid": "21080835", "quote": "telemonitoring did not improve outcomes"})
    assert ok.json()["verified"] is True
    bad = client.post("/verify", json={"pmid": "21080835", "quote": "telemonitoring halved deaths"})
    assert bad.json()["verified"] is False


def test_unknown_paper_is_404():
    assert client.get("/papers/1").status_code == 404
    assert client.post("/verify", json={"pmid": "1", "quote": "x"}).status_code == 404
