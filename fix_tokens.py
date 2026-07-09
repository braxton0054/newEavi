import re, pathlib

ROOT = pathlib.Path("src")
files = list(ROOT.rglob("*.tsx")) + list(ROOT.rglob("*.ts"))

# (pattern, replacement) in order
rules = [
    # emerald -> green (spec uses green-* for status)
    (r"emerald-(\d+)", r"green-\1"),
    # font weight: spec = font-medium everywhere
    (r"font-semibold", "font-medium"),
    (r"font-bold", "font-medium"),
    # gray-* -> zinc-* (spec forbids gray, demands zinc)
    (r"(?P<pre>(?:dark:)?(?:hover:)?(?:focus:)?(?:bg|text|border|ring|from|to|via|fill|stroke|placeholder|divide|outline)-)gray-(?P<num>\d+)",
     r"\g<pre>zinc-\g<num>"),
    # custom green hex -> spec blue accent (forgot-password page)
    (r"bg-\[#2d8a4e\]", "bg-blue-700"),
    (r"hover:bg-\[#23743f\]", "hover:bg-blue-800"),
    (r"focus:ring-\[#2d8a4e\]/25", "focus:ring-blue-500/20"),
    (r"focus:border-\[#2d8a4e\]", "focus:border-blue-700"),
    # avatar gradient -> solid blue-50
    (r"bg-gradient-to-br from-blue-50 to-blue-100", "bg-blue-50"),
    # active filter pill: spec = blue-700 (not zinc-900)
    (r"bg-zinc-900 text-white shadow-sm", "bg-blue-700 text-white"),
    # remove forbidden utility classes (spacing/weight/shadow)
    (r" shadow-sm", ""),
    (r"shadow-sm ", ""),
    (r" shadow-md", ""),
    (r"shadow-md ", ""),
    (r" uppercase", ""),
    (r"uppercase ", ""),
    (r" tracking-wider", ""),
    (r"tracking-wider ", ""),
    (r" tracking-wide", ""),
    (r"tracking-wide ", ""),
]

count = 0
for f in files:
    txt = f.read_text()
    orig = txt
    for pat, rep in rules:
        txt = re.sub(pat, rep, txt)
    # collapse double spaces left inside className strings
    txt = re.sub(r'("(?:[^"]*))  +', lambda m: m.group(1) + '"' if False else m.group(0), txt)
    txt = re.sub(r' className=" +', ' className="', txt)
    txt = re.sub(r'" +"', '""', txt)  # shouldn't happen
    if txt != orig:
        f.write_text(txt)
        count += 1

print(f"Updated {count} files")
