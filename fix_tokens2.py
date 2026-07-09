import re, pathlib
ROOT = pathlib.Path("src")
files = list(ROOT.rglob("*.tsx")) + list(ROOT.rglob("*.ts"))

rules = [
    (r"hover:shadow-sm", ""),
    (r"hover:shadow-md", ""),
    (r"\[#2d8a4e\]", "blue-700"),
    (r"\[#23743f\]", "blue-800"),
]
n=0
for f in files:
    t=f.read_text(); o=t
    for p,r in rules: t=re.sub(p,r,t)
    if t!=o: f.write_text(t); n+=1
print("updated",n)
# check brand-green usage
