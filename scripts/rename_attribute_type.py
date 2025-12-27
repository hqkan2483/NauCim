#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from collections import OrderedDict


def _replace_type_preserve_order(d):
    """Transform attribute dict: rename 'type' to 'datatype' and add 'dataTypeId' after it."""
    if not isinstance(d, dict):
        return d
    new = OrderedDict()
    datatype_added = False

    for k, v in d.items():
        if k == 'type':
            # Rename 'type' to 'datatype' and immediately add 'dataTypeId'
            new['datatype'] = v
            new['dataTypeId'] = ""
            datatype_added = True
        elif k == 'datatype':
            # If 'datatype' already exists, keep it and add 'dataTypeId' after
            new['datatype'] = v
            if 'dataTypeId' not in d:  # Only add if not already present
                new['dataTypeId'] = ""
            datatype_added = True
        elif k == 'dataTypeId':
            # Skip for now, we'll add it after datatype if needed
            pass
        else:
            new[k] = v

    return new


def rename_in_attributes(obj):
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if k == 'attributes' and isinstance(v, list):
                for i, attr in enumerate(v):
                    if isinstance(attr, dict):
                        # Process if has 'type' (need rename) or has 'datatype' but no 'dataTypeId' (need to add)
                        if ('type' in attr and 'datatype' not in attr) or ('datatype' in attr and 'dataTypeId' not in attr):
                            # replace attribute dict preserving key order
                            v[i] = _replace_type_preserve_order(attr)
            else:
                rename_in_attributes(v)
    elif isinstance(obj, list):
        for item in obj:
            rename_in_attributes(item)


def process_file(path: Path, inplace=True):
    text = path.read_text(encoding='utf-8')
    try:
        data = json.loads(text, object_pairs_hook=OrderedDict)
    except Exception as e:
        print(f"ERROR: failed to parse JSON in {path}: {e}")
        return 1
    rename_in_attributes(data)
    out_text = json.dumps(data, ensure_ascii=False, indent=2)
    if inplace:
        path.write_text(out_text, encoding='utf-8')
        print(f"Updated {path}")
    else:
        print(out_text)
    return 0


def main():
    if len(sys.argv) < 2:
        print("Usage: rename_attribute_type.py <file1> [file2 ...]")
        return 2
    rc = 0
    for p in sys.argv[1:]:
        path = Path(p)
        if not path.exists():
            print(f"File not found: {p}")
            rc = 1
            continue
        rc |= process_file(path)
    return rc


if __name__ == '__main__':
    raise SystemExit(main())
