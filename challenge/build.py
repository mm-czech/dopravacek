"""Regenerate the isolated challenge bundle from the untouched original bundle.

Run from the repository root: python challenge/build.py
The source game in index.html is intentionally never rewritten.
"""

from pathlib import Path
from hashlib import sha256

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
js = html.split('<script type="module" crossorigin>', 1)[1].split('</script>', 1)[0]
css = html.split('<style rel="stylesheet" crossorigin>', 1)[1].split('</style>', 1)[0]
assert sha256(js.encode()).hexdigest() == '387655cebe34b55208891125b04c5b5ee59bba72dd03cb314ac8b117b317bb89', 'The original game bundle changed'
assert sha256(css.encode()).hexdigest() == '2d90a5497fdea071acde65d9ee0caa3aaa1d6c9813475b7e5f2e571ec0498957', 'The original game styles changed'

assert js.endswith('vL();'), "Original boot sequence changed: inspect before rebuilding"
replacements = {
    'n&&NS(a,n)': 'n&&(!e.challenge||expeditionTownPowered(e,n.townId))&&NS(a,n)',
    't.lamp&&(t.railMask?oA(a,n,r,t.railMask):$k(a,n,r,t.roadMask))':
        't.lamp&&(!e.challenge||expeditionPoweredTile(e,n,r))&&'
        '(t.railMask?oA(a,n,r,t.railMask):$k(a,n,r,t.roadMask))',
}
for old, new in replacements.items():
    assert js.count(old) == 1, f"Expected exactly one light hook: {old}"
    js = js.replace(old, new)

logic = (ROOT / "challenge/logic.js").read_text(encoding="utf-8")
(ROOT / "challenge/game.js").write_text(js[:-len('vL();')] + '\n' + logic + '\nvL();\n', encoding="utf-8")
(ROOT / "challenge/base.css").write_text(css, encoding="utf-8")
