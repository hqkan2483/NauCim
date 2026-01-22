#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import json
from pathlib import Path
from typing import Any, Iterable, List

import jsonschema
from jsonschema import Draft202012Validator, Draft7Validator


def load_json(path: str) -> Any:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def format_json_path(path_parts: Iterable[Any]) -> str:
    out = "$"
    for part in path_parts:
        if isinstance(part, int):
            out += f"[{part}]"
        else:
            out += "." + str(part)
    return out


def pick_validator(schema: dict):
    schema_uri = (schema.get("$schema") or "").lower()
    if "draft-07" in schema_uri:
        return Draft7Validator
    if "2020-12" in schema_uri:
        return Draft202012Validator

    # Fallback: attempt to infer from schema meta
    return jsonschema.validators.validator_for(schema)


def validate_instance(instance_path: str, schema_path: str) -> List[jsonschema.ValidationError]:
    instance = load_json(instance_path)
    schema = load_json(schema_path)

    Validator = pick_validator(schema)

    # Validate schema itself to catch mistakes early
    Validator.check_schema(schema)

    validator = Validator(schema)
    errors = sorted(
        validator.iter_errors(instance),
        key=lambda e: (list(e.path), e.message),
    )
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate a JSON file against one or more JSON Schema files.",
    )
    parser.add_argument(
        "instance",
        nargs="?",
        default="models-data/focl-import-model.json",
        help="Path to JSON instance to validate (default: models-data/focl-import-model.json)",
    )
    parser.add_argument(
        "schemas",
        nargs="*",
        default=[
            "src/data-schema/xmi_model_detailed.schema.draft-07.json",
            "src/data-schema/xmi_model_detailed.schema.2020-12.json",
        ],
        help=(
            "One or more schema paths. Defaults to both project schemas: "
            "draft-07 and 2020-12."
        ),
    )
    parser.add_argument(
        "--max-errors",
        type=int,
        default=25,
        help="Maximum number of errors to print per schema (default: 25)",
    )
    args = parser.parse_args()

    instance_path = args.instance
    schema_paths = args.schemas

    any_failed = False

    for schema_path in schema_paths:
        print(f"=== {schema_path} ===")
        try:
            errors = validate_instance(instance_path, schema_path)
        except Exception as exc:
            print(f"SCHEMA/VALIDATION ERROR: {type(exc).__name__}: {exc}")
            return 2

        if not errors:
            print("OK: valid")
            continue

        any_failed = True
        print(f"FAIL: errors = {len(errors)}")
        for err in errors[: args.max_errors]:
            print(f"- {format_json_path(err.path)} - {err.message}")
        if len(errors) > args.max_errors:
            print(f"... plus {len(errors) - args.max_errors} more")

    return 1 if any_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
