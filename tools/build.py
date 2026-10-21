"""Rebuild the deployment bundle from the sequential source chunks. Run: python tools/build.py"""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
chunks=sorted((root/'src').glob('*.js'))
assert chunks, 'Missing source files'
combined=''.join(p.read_text(encoding='utf-8') for p in chunks)
(root/'js/game.js').write_text(combined, encoding='utf-8')
print(f'Bundled {len(chunks)} source files into js/game.js')
