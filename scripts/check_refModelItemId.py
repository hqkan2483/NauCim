#!/usr/bin/env python3
import json
from pathlib import Path

SRC = Path("models-data/GOST-XXXXX.1-profile.json")

data = json.loads(SRC.read_text(encoding="utf-8"))
count_total = 0
count_ok = 0

def traverse(obj):
    global count_total, count_ok
    if isinstance(obj, dict):
        if "classes" in obj and isinstance(obj["classes"], list):
            for cls in obj["classes"]:
                if isinstance(cls, dict) and "id" in cls:
                    count_total += 1
                    if cls.get("refModelItemId") == cls.get("id"):
                        count_ok += 1
        for v in obj.values():
            traverse(v)
    elif isinstance(obj, list):
        for item in obj:
            traverse(item)

traverse(data)
print(f"classes with id processed: {count_total}")
print(f"refModelItemId == id: {count_ok}")
