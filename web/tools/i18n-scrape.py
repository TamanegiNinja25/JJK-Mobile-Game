#!/usr/bin/env python3
# Dev tool (not part of the game): collects the English strings in the source that can reach the screen,
# in the form i18n.tr() looks them up (numbers as {n}, inserted names as {s}). Prints JSON.
#   python3 -I tools/i18n-scrape.py src > strings.json
import json, os, re, sys

root = sys.argv[1]
NUMERIC = re.compile(r'(level|lv|\bn\b|count|Math|toFixed|pct\(|gold|secs|dmg|qty|price|cost|amount|hp|ce\b|time|ago|\+|\*|/|\d|length|size|total|loaded|left|min|max|days|run|seal|kills|got|seen|pay|best)', re.I)
lit = re.compile(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`((?:[^`\\]|\\.)*)`", re.S)
out = set()

def sub_expr(m):
    e = m.group(1)
    return '{n}' if NUMERIC.search(e) else '{s}'

def norm(s):
    s = s.replace("\\'", "'").replace('\\"', '"').replace('\\n', ' ')
    s = re.sub(r'\$\{((?:[^{}]|\{[^{}]*\})*)\}', sub_expr, s)
    s = re.sub(r'[+\-−]?\d[\d,]*(?:\.\d+)?', '{n}', s)
    s = re.sub(r'&amp;', '&', s); s = re.sub(r'&nbsp;', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def keep(s):
    if len(s) < 2 or not re.search(r'[A-Za-z]{2}', s): return False
    if re.fullmatch(r'[a-z][A-Za-z0-9_\-.:/#]*', s): return False       # identifiers, css classes, paths
    if re.fullmatch(r'[a-z\-]+(\s[a-z\-]+)*', s) and ' ' in s and len(s.split()) <= 3 and not s.endswith('.'): return False  # class lists
    if re.search(r'^(rgba?|#|url\(|data:|https?:|M\d|translate|calc)', s): return False
    if s.startswith('{') and s.endswith('}'): return False
    return True

for dp, _dn, fs in os.walk(root):
    for f in fs:
        if not f.endswith('.ts') or f in ('i18n.ts',): continue
        src = open(os.path.join(dp, f), encoding='utf8').read()
        src = re.sub(r'^\s*//.*$', '', src, flags=re.M)
        src = re.sub(r'/\*[\s\S]*?\*/', '', src)
        for m in lit.finditer(src):
            raw = next(g for g in m.groups() if g is not None)
            if m.group(3) is not None and '<' in raw:
                # an HTML template: its text nodes and labels
                t = re.sub(r'\$\{((?:[^{}`]|\{[^{}]*\}|`[^`]*`)*)\}', lambda mm: '\x00' + ('{n}' if NUMERIC.search(mm.group(1)) else '{s}') + '\x00', raw)
                for part in re.split(r'<[^>]*>', t):
                    for chunk in part.split('\x00{s}\x00') if False else [part]:
                        s = norm(chunk.replace('\x00', ''))
                        if keep(s) and not re.fullmatch(r'(\{[ns]\}\s*)+', s): out.add(s)
                for a in re.findall(r'(?:title|placeholder|aria-label)="([^"]+)"', t):
                    s = norm(a.replace('\x00', ''))
                    if keep(s): out.add(s)
                continue
            s = norm(raw)
            if keep(s) and (' ' in s or s[0].isupper()) and not re.fullmatch(r'(\{[ns]\}\s*)+', s): out.add(s)

print(json.dumps(sorted(out), ensure_ascii=False, indent=0))
