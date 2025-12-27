from pathlib import Path
files = [
  Path('C:/pdp/MyProjects/GitHub/NauCim-1/models-data/GOST-XXXXX.1-profile.json'),
  Path('C:/pdp/MyProjects/GitHub/NauCim-1/models-data/GOST-XXXXX.2-profile.json')
]
for p in files:
    txt = p.read_text(encoding='utf-8')
    c_type = txt.count('"type"')
    c_datatype = txt.count('"datatype"')
    print(f"{p.name}: \"type\": {c_type}, \"datatype\": {c_datatype}")
