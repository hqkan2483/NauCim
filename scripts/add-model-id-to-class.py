#!/usr/bin/env python3
import json
import shutil
from pathlib import Path
from collections import OrderedDict

SRC = Path("models-data/GOSTRExt-model.json")
BACKUP = SRC.with_suffix(".backup.json")

def insert_fields_after_profile_relations(cls):
    # вставить modelId и profileId сразу после profileRelations, если их нет
    changed = False
    if not isinstance(cls, dict):
        return False
    if "modelId" in cls and "profileId" in cls:
        return False
    new = OrderedDict()
    inserted = False
    for k, v in cls.items():
        new[k] = v
        if k == "profileRelations":
            if "modelId" not in cls:
                new["modelId"] = None
            else:
                new["modelId"] = cls["modelId"]
            if "profileId" not in cls:
                new["profileId"] = None
            else:
                new["profileId"] = cls["profileId"]
            inserted = True
            changed = True
    if not inserted:
        # если profileRelations отсутствует — добавляем поля в конец (сохранение семантики)
        if "modelId" not in cls:
            new["modelId"] = None
            changed = True
        if "profileId" not in cls:
            new["profileId"] = None
            changed = True
    # обновляем исходный dict, сохранив порядок
    cls.clear()
    cls.update(new)
    return changed

def traverse(obj):
    changed_count = 0
    if isinstance(obj, dict):
        if "classes" in obj and isinstance(obj["classes"], list):
            for cls in obj["classes"]:
                if insert_fields_after_profile_relations(cls):
                    changed_count += 1
        for v in obj.values():
            changed_count += traverse(v)
    elif isinstance(obj, list):
        for item in obj:
            changed_count += traverse(item)
    return changed_count

def main():
    if not SRC.exists():
        print(f"Source not found: {SRC}")
        return
    shutil.copy2(SRC, BACKUP)
    print(f"Backup created: {BACKUP}")
    data = json.loads(SRC.read_text(encoding="utf-8"))
    changed = traverse(data)
    SRC.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {SRC} — classes modified: {changed}")

if __name__ == "__main__":
    main()
