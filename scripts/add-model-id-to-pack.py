#!/usr/bin/env python3
import json
import shutil
from pathlib import Path
from collections import OrderedDict

SRC = Path("models-data/GOSTRExt-model.json")
BACKUP = SRC.with_suffix(".backup.json")

def insert_before_classes(obj):
    # obj is OrderedDict
    # ensure modelId/profileId are present (set to None) and inserted before 'classes' key
    new = OrderedDict()
    inserted = False
    for k, v in obj.items():
        if k == "classes":
            if "modelId" not in obj or obj.get("modelId") is not None:
                new["modelId"] = None
            else:
                new["modelId"] = obj["modelId"]
            if "profileId" not in obj or obj.get("profileId") is not None:
                new["profileId"] = None
            else:
                new["profileId"] = obj["profileId"]
            inserted = True
            new[k] = v
        else:
            new[k] = v
    if not inserted:
        # 'classes' not found — append fields at end if not present
        if "modelId" not in obj:
            new["modelId"] = None
        if "profileId" not in obj:
            new["profileId"] = None
    obj.clear()
    obj.update(new)

def traverse(o):
    if isinstance(o, list):
        for item in o:
            traverse(item)
    elif isinstance(o, dict):
        # for every key named 'subPackages' handle its items
        for k, v in list(o.items()):
            if k == "subPackages" and isinstance(v, list):
                for sp in v:
                    if isinstance(sp, dict):
                        # preserve order by reconstituting as OrderedDict
                        sp_od = OrderedDict(sp.items())
                        insert_before_classes(sp_od)
                        # replace contents of sp dict with ordered items
                        sp.clear()
                        sp.update(sp_od)
                        # then recurse inside this subpackage (it may contain nested subPackages)
                        traverse(sp)
            else:
                traverse(v)

def main():
    if not SRC.exists():
        print(f"Source not found: {SRC}")
        return
    shutil.copy2(SRC, BACKUP)
    print(f"Backup created: {BACKUP}")
    with SRC.open("r", encoding="utf-8") as f:
        data = json.load(f, object_pairs_hook=OrderedDict)
    traverse(data)
    with SRC.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Done.")

if __name__ == "__main__":
    main()
