#!/usr/bin/env python3
"""Build the static Pages site from the same assets as the local console."""
import argparse
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent
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
assets = root / 'site/assets'
if assets.exists():
    for path in assets.iterdir():
        shutil.copy2(path, out / path.name)
(out / '.nojekyll').touch()
print('Built static site:', out)
