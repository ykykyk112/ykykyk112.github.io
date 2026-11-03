"""Generate the local preview index without Jekyll or third-party packages."""

import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent
    files = sorted(p.name for p in (root / "patterns").iterdir()
                   if p.is_file() and p.suffix.lower() == ".png")
    (root / "patterns.local.json").write_text(
        json.dumps({"files": files}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Indexed {len(files)} PNG files for local preview.")


if __name__ == "__main__":
    main()
