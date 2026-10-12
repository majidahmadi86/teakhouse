"""
Trim the Chinese, Japanese and Korean faces to the characters the site uses.

The font scripts download each CJK face as ~120 unicode-range slices that
cover the whole language (tens of MB, stored again on every deployment).
Browsers only fetch the slices a page needs, so the guest never paid for that
weight, but the deployment did. This keeps the slice layout and, per slice:

  · drops it when none of its characters appear in the site's text
  · otherwise cuts it down to just those characters (fontTools subset, woff2)
    and narrows its unicode-range to match

Text outside the subset (a guest typing to the Butler, an owner's new copy)
still renders: the browser falls back to the system's own CJK face for those
characters. Re-run after the Chinese, Japanese or Korean copy changes, on
fresh full slices from the font script:

    python scripts/fonts/subset-cjk.py <holding-dir> [stylesheet ...]

With no stylesheets it trims public/fonts/{sc,jp,kr}.css. A stylesheet whose
name carries a content hash (name.<10 hex>.css) is written under a new hash
and the rename is printed, so its reference can be updated. Files no longer
referenced are moved to <holding-dir>, never deleted.
"""
import hashlib
import io
import os
import re
import shutil
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONTS = os.path.join(ROOT, "public", "fonts")
SCRIPTS = ["sc", "jp", "kr"]
SOURCES = ["lib", "app", "components", "src", "config", "prisma", "messages", "locales"]
EXT = (".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".prisma", ".sql")
# Always kept, whatever the copy says: ASCII, CJK punctuation and full-width forms.
BASE = set(range(0x20, 0x7F)) | set(range(0x3000, 0x3040)) | set(range(0xFF01, 0xFF5F))
FACE = re.compile(r"@font-face\{([^}]*)\}")
SRC = re.compile(r"url\((/fonts/[^)]+\.woff2)\)")
RANGE = re.compile(r"unicode-range:([^;}]+)")
HASHED_FONT = re.compile(r"([-.])([0-9a-f]{10})\.woff2$")
HASHED_CSS = re.compile(r"^(.*)\.([0-9a-f]{10})\.css$")


def used_codepoints():
    cps = set(BASE)
    for d in SOURCES:
        for dirpath, _, files in os.walk(os.path.join(ROOT, d)):
            for f in files:
                if f.endswith(EXT):
                    with open(os.path.join(dirpath, f), encoding="utf-8", errors="ignore") as fh:
                        cps.update(ord(c) for c in fh.read())
    return cps


def parse_range(text):
    out = set()
    for part in text.split(","):
        part = part.strip().upper().replace("U+", "")
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-")
            out.update(range(int(a, 16), int(b, 16) + 1))
        elif "?" in part:
            out.update(range(int(part.replace("?", "0"), 16), int(part.replace("?", "F"), 16) + 1))
        else:
            out.add(int(part, 16))
    return out


def format_range(cps):
    runs, start, prev = [], None, None
    for c in sorted(cps):
        if start is None:
            start = prev = c
        elif c == prev + 1:
            prev = c
        else:
            runs.append((start, prev))
            start = prev = c
    if start is not None:
        runs.append((start, prev))
    return ", ".join(f"U+{a:x}" if a == b else f"U+{a:x}-{b:x}" for a, b in runs)


def subset_woff2(path, unicodes):
    font = TTFont(path)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=sorted(unicodes))
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    return buf.getvalue()


def trim(css_path, holding, used):
    css_path = os.path.abspath(css_path)
    marker = os.sep + "public" + os.sep
    public = css_path[: css_path.rindex(marker) + len(marker) - 1]
    with open(css_path, encoding="utf-8") as fh:
        css = fh.read()
    stats = {"before": 0, "after": 0, "kept": 0, "dropped": 0}
    old_files, new_files = set(), set()

    def rewrite(m):
        body = m.group(1)
        src, rng = SRC.search(body), RANGE.search(body)
        if not src or not rng:
            return m.group(0)
        url = src.group(1)
        path = os.path.join(public, *url.strip("/").split("/"))
        old_files.add(path)
        stats["before"] += os.path.getsize(path)
        have = set(TTFont(path).getBestCmap() or {})
        want = parse_range(rng.group(1)) & used & have
        if not want:
            stats["dropped"] += 1
            return ""
        data = subset_woff2(path, want)
        folder, name = os.path.split(path)
        digest = hashlib.sha1(data).hexdigest()[:10]
        hashed = HASHED_FONT.search(name)
        new = HASHED_FONT.sub(lambda h: f"{h.group(1)}{digest}.woff2", name) if hashed else name.replace(".woff2", f"-{digest}.woff2")
        with open(os.path.join(folder, new), "wb") as out:
            out.write(data)
        new_files.add(os.path.join(folder, new))
        stats["after"] += len(data)
        stats["kept"] += 1
        body = body.replace(url, url[: url.rindex("/") + 1] + new)
        body = RANGE.sub("unicode-range:" + format_range(want), body)
        return "@font-face{" + body + "}"

    css = FACE.sub(rewrite, css)
    css = re.sub(r"\n{2,}", "\n", css)
    out_path = css_path
    hashed_css = HASHED_CSS.match(css_path)
    if hashed_css:
        out_path = f"{hashed_css.group(1)}.{hashlib.sha1(css.encode('utf-8')).hexdigest()[:10]}.css"
        os.makedirs(holding, exist_ok=True)
        shutil.move(css_path, os.path.join(holding, os.path.basename(css_path)))
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(css)
    # The full slices this stylesheet no longer names leave public/ (moved, never deleted).
    for f in old_files - new_files:
        if os.path.exists(f):
            dest = os.path.join(holding, os.path.relpath(f, public))
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.move(f, dest)
    rename = f" · renamed {os.path.basename(css_path)} -> {os.path.basename(out_path)}" if out_path != css_path else ""
    print(f"{os.path.basename(out_path)}: kept {stats['kept']} slices, dropped {stats['dropped']}, "
          f"{stats['before'] / 1e6:.1f} MB -> {stats['after'] / 1e6:.1f} MB{rename}")


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: python scripts/fonts/subset-cjk.py <holding-dir> [stylesheet ...]")
    holding = sys.argv[1]
    sheets = sys.argv[2:] or [os.path.join(FONTS, f"{s}.css") for s in SCRIPTS]
    used = used_codepoints()
    for sheet in sheets:
        trim(sheet, holding, used)


if __name__ == "__main__":
    main()
