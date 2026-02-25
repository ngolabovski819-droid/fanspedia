import glob

files = glob.glob('*.html') + glob.glob('es/*.html')

replacements = [
    ('<a href="#" onclick="alert(\'Coming soon!\'); return false;">Blog</a>', '<a href="/blog/">Blog</a>'),
    ('<a href="#" onclick="alert(\'\u00a1Pr\u00f3ximamente!\'); return false;">Blog</a>', '<a href="/blog/">Blog</a>'),
    ('<a href="#" onclick="alert(\'\u00a1Proximamente!\'); return false;">Blog</a>', '<a href="/blog/">Blog</a>'),
]

for f in files:
    content = open(f, encoding='utf-8').read()
    new = content
    for old, repl in replacements:
        new = new.replace(old, repl)
    if new != content:
        open(f, 'w', encoding='utf-8').write(new)
        count = sum(content.count(old) for old, _ in replacements)
        print(f'  {f}: {count} replaced')

print('Done')
