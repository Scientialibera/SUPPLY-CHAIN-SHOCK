from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {".css", ".html", ".js", ".json", ".md", ".py", ".toml", ".txt", ".yml", ".yaml", ".svg"}
RANGES = ((0x1F000, 0x1FAFF), (0x2600, 0x27BF), (0xFE0F, 0xFE0F))


def is_emoji(char: str) -> bool:
    cp = ord(char)
    return any(start <= cp <= end for start, end in RANGES)


def main() -> int:
    violations = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in {".git", ".venv", "__pycache__", ".pytest_cache"} for part in path.parts):
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {"Dockerfile", "Makefile"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for line_no, line in enumerate(text.splitlines(), 1):
            if any(is_emoji(char) for char in line):
                violations.append(f"{path.relative_to(ROOT)}:{line_no}")
    if violations:
        print("Emoji policy violations found:")
        print("\n".join(violations))
        return 1
    print("No emoji characters found in project text files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
