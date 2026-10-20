"""Write the built answer to the web app's public folder for the static demo."""

import json
from pathlib import Path

from app.answer import build

out = Path(__file__).parent.parent / "web" / "public" / "answer.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(build(), ensure_ascii=False))
print(out, out.stat().st_size)
