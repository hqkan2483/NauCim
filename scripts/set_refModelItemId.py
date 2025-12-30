#!/usr/bin/env python3
import json
import shutil
from pathlib import Path

SRC = Path("models-data/GOST-XXXXX.1-profile.json")
BACKUP = SRC.with_suffix(".backup.json")

def traverse(obj):
    if isinstance(obj, dict):
        # если есть массив classes — обработать каждый класс
        if "classes" in obj and isinstance(obj["classes"], list):
            for cls in obj["classes"]:
                if isinstance(cls, dict) and "id" in cls:
                    cls["refModelItemId"] = cls.get("id")
        # рекурсивно проход по полям
        for v in obj.values():
            traverse(v)
    elif isinstance(obj, list):
        for item in obj:
            traverse(item)

def main():
    if not SRC.exists():
        print(f"Source not found: {SRC}")
        return
    shutil.copy2(SRC, BACKUP)
    print(f"Backup created: {BACKUP}")
    data = json.loads(SRC.read_text(encoding="utf-8"))
    traverse(data)
    SRC.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated: {SRC}")

if __name__ == "__main__":
    main()
