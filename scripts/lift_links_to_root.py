#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""Lift generalizationsList/associationList from package objects to the root.

Purpose:
- Convert older import JSON (where link lists can appear inside packages) to the
  newer format where they live on the root object next to `packages`.

Usage:
  python scripts/lift_links_to_root.py models-data/focl-import-model.json

By default it edits the file in-place.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


def walk_packages(packages: Iterable[Any]) -> Iterable[Dict[str, Any]]:
    for p in packages or []:
        if not isinstance(p, dict):
            continue
        yield p
        yield from walk_packages(p.get("subPackages") or [])


def unique_by(items: List[Dict[str, Any]], key_fn) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    seen: set = set()
    for it in items:
        if not isinstance(it, dict):
            continue
        k = key_fn(it)
        if k in seen:
            continue
        seen.add(k)
        out.append(it)
    return out


def gen_key(g: Dict[str, Any]) -> Tuple[Any, Any, Any]:
    parent = (g.get("parent") or {}).get("classId")
    child = (g.get("child") or {}).get("classId")
    return (g.get("linkId"), parent, child)


def assoc_key(a: Dict[str, Any]) -> Tuple[Any, Tuple[Tuple[Any, Any], ...]]:
    ends = a.get("linkEnd") or []
    ids: List[Tuple[Any, Any]] = []
    for e in ends:
        if isinstance(e, dict):
            ids.append((e.get("linkEndClassId"), e.get("linkEndName")))
    return (a.get("linkId"), tuple(sorted(ids)))


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/lift_links_to_root.py <path-to-json>")
        return 2

    path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(data, dict):
        raise SystemExit("Expected a JSON object at root")

    all_gen: List[Dict[str, Any]] = []
    all_assoc: List[Dict[str, Any]] = []

    # Collect from package tree and remove them there
    for pkg in walk_packages(data.get("packages") or []):
        gl = pkg.pop("generalizationsList", None)
        al = pkg.pop("associationList", None)
        if isinstance(gl, list) and gl:
            all_gen.extend([x for x in gl if isinstance(x, dict)])
        if isinstance(al, list) and al:
            all_assoc.extend([x for x in al if isinstance(x, dict)])

    # Also merge any existing root-level lists
    root_gl = data.get("generalizationsList")
    root_al = data.get("associationList")
    if isinstance(root_gl, list):
        all_gen.extend([x for x in root_gl if isinstance(x, dict)])
    if isinstance(root_al, list):
        all_assoc.extend([x for x in root_al if isinstance(x, dict)])

    all_gen = unique_by(all_gen, gen_key)
    all_assoc = unique_by(all_assoc, assoc_key)

    data["generalizationsList"] = all_gen
    data["associationList"] = all_assoc

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {path}: generalizationsList={len(all_gen)}, associationList={len(all_assoc)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
