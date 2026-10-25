"""Dependency-free structural and sensitive-data sanity checks."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import re

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.items = []; self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.items.append((tag, dict(attrs)))

for name, lang in [('index.html', 'zh-Hant'), ('en.html', 'en')]:
    source = (ROOT / name).read_text(encoding='utf-8')
    page = Page(source); items = page.items
    ids = [a['id'] for _, a in items if 'id' in a]
    assert len(ids) == len(set(ids)), 'Duplicate ID'
    assert next(a['lang'] for t, a in items if t == 'html') == lang
    assert sum(t == 'h1' for t, _ in items) == 1
    assert sum(t == 'main' for t, _ in items) == 1
    assert len([a for _, a in items if a.get('data-language')]) == 2
    assert len([a for _, a in items if a.get('aria-current') == 'page']) == 1
    assert '<title>' in source and 'name="description"' in source
    for tag, a in items:
        if tag == 'img': assert a.get('alt') and a.get('width') and a.get('height')
        for ref in a.get('aria-labelledby', '').split(): assert ref in ids
        value = a.get('src') or a.get('href')
        if not value: continue
        url = urlsplit(value)
        if url.scheme: continue
        if url.path: assert (ROOT / url.path).is_file(), value
        if url.fragment and not url.path: assert url.fragment in ids, value
        if tag in ['img', 'script']: assert not url.scheme
    for url in ['mailto:piyellowclaw@gmail.com', 'mailto:newyellow2@gmail.com', 'https://github.com/piyellowclaw', 'https://newyellow.xyz/']:
        assert url in source
    assert not re.search(r'(?:/Users/|192\.168\.|10\.0\.|gh[pousr]_[A-Za-z0-9]{20}|BEGIN .*PRIVATE KEY)', source)
    print('PASS', name, lang, 'links/assets/headings/labels/contacts/privacy sanity')
for f in ['style.css', 'script.js']:
    source = (ROOT / f).read_text(encoding='utf-8')
    assert not re.search(r'(?:https?://|/Users/|gh[pousr]_[A-Za-z0-9]{20})', source)
assert 'prefers-reduced-motion' in (ROOT / 'style.css').read_text()
assert ':focus-visible' in (ROOT / 'style.css').read_text()
assert 'localStorage' in (ROOT / 'script.js').read_text()
print('PASS reduced motion / keyboard focus / language preference / no remote dependencies')

# Redesign contract: equivalent native controls and explanatory fallbacks.
control_sets = []
for name in ['index.html', 'en.html']:
    source = (ROOT / name).read_text()
    items = Page(source).items
    controls = {a['id']: (t, a) for t, a in items if a.get('id') in
                ['portrait', 'regenerate', 'motion', 'density', 'density-value', 'sketch-status']}
    assert len(controls) == 6
    assert controls['regenerate'][0] == controls['motion'][0] == 'button'
    assert controls['motion'][1]['aria-pressed'] == 'false'
    assert controls['density'][1]['type'] == 'range'
    assert controls['density'][1]['min'] == '24' and controls['density'][1]['max'] == '72'
    assert controls['sketch-status'][1]['role'] == 'status'
    assert controls['portrait'][1]['aria-hidden'] == 'true'
    assert '<noscript>' in source and 'id="sketch-description"' in source
    for asset in ['working.jpg', 'room.jpg', 'icon.png']:
        assert 'assets/' + asset in source
    control_sets.append(set(controls))
assert control_sets[0] == control_sets[1]
script = (ROOT / 'script.js').read_text()
for feature in ['IntersectionObserver', 'ResizeObserver', 'document.hidden',
                'cancelAnimationFrame', 'prefers-reduced-motion', 'pointerType',
                'Math.imul', 'getContext(\'2d\')']:
    assert feature in script, feature
assert 'preventDefault' not in script, 'Pointer interaction must preserve scrolling'
assert 'setInterval' not in script
assert 'MIT' in (ROOT / 'LICENSE').read_text()
assert 'does not cover artwork' in (ROOT / 'assets/NOTICE.md').read_text()
print('PASS bilingual sketch controls / fallback / artwork / motion lifecycle safeguards')
