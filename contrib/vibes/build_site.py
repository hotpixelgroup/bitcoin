#!/usr/bin/env python3
"""Build the static Pages site from the same assets as the local console."""
import argparse
from pathlib import Path
import shutil
import sys

root = Path(__file__).resolve().parent
sys.path.insert(0, str(root))
from vibeslib import lessons  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument('--out', required=True)
args = parser.parse_args()
out = Path(args.out).resolve()
if out == root or root.is_relative_to(out):
    parser.error('Output must be a separate directory')
out.mkdir(parents=True, exist_ok=True)
shutil.copy2(root / 'site/index.html', out / 'index.html')
shutil.copy2(root / 'index.html', out / 'demo.html')
shutil.copytree(root / 'web', out / 'web', dirs_exist_ok=True)
# The console serves this from the lesson file at run time; the static site
# gets the same text written out, so the demo can never teach something else.
(out / 'web/lessons.js').write_text(lessons.as_script())
assets = root / 'site/assets'
if assets.exists():
    for path in assets.iterdir():
        shutil.copy2(path, out / path.name)
(out / '.nojekyll').touch()
print('Built static site:', out)
