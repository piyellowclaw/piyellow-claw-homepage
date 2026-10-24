"""Copy only the public website allowlist. No dependencies or hidden files."""
from pathlib import Path
import shutil
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public'
FILES = ['index.html', 'en.html', 'style.css', 'script.js', 'assets/icon.png', 'assets/room.jpg', 'assets/working.jpg']
OUT.mkdir(exist_ok=True)
for name in FILES:
    dest = OUT / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / name, dest)
actual = {str(f.relative_to(OUT)) for f in OUT.rglob('*') if f.is_file()}
assert actual == set(FILES), 'Unexpected public files; inspect before hosting'
print('PASS public/ contains only 7 allowlisted website files')
