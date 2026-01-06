# Python Scripts Documentation

This directory contains utility scripts for processing and maintaining CIM model data files.

## Overview

The scripts in `scripts/` directory are used for data migration, validation, and maintenance of JSON model files stored in `models-data/` directory.

## Scripts

### Model Data Processing

#### `add-model-id-to-class.py`

**Purpose**: Adds `modelId` and `profileId` fields to class objects in model JSON files.

**Usage**:
```bash
python scripts/add-model-id-to-class.py
```

**Details**:
- Operates on `models-data/GOSTRExt-model.json` (configurable via `SRC` variable)
- Creates backup file before modification
- Inserts `modelId` and `profileId` fields after `profileRelations` field
- Uses OrderedDict to maintain field order

#### `add-model-id-to-pack.py`

**Purpose**: Adds `modelId` and `profileId` fields to package objects in model JSON files.

**Usage**:
```bash
python scripts/add-model-id-to-pack.py
```

**Details**:
- Operates on `models-data/GOSTRExt-model.json` (configurable via `SRC` variable)
- Creates backup file before modification
- Inserts fields before the `classes` key
- Sets fields to `None` initially

#### `regen-class-id.py`

**Purpose**: Regenerates class IDs in model JSON files.

**Usage**:
```bash
python scripts/regen-class-id.py
```

**Details**:
- Updates class identifiers
- Maintains referential integrity within the model

### Validation Scripts

#### `check_refModelItemId.py`

**Purpose**: Validates `refModelItemId` references in profile JSON files.

**Usage**:
```bash
python scripts/check_refModelItemId.py
```

**Details**:
- Operates on `models-data/GOST-XXXXX.1-profile.json` (configurable via `SRC` variable)
- Traverses all classes and checks reference integrity
- Reports count of total items and items with valid references

#### `verify_counts.py`

**Purpose**: Verifies counts and statistics in model JSON files.

**Usage**:
```bash
python scripts/verify_counts.py
```

**Details**:
- Validates data integrity
- Checks counts of various elements

### Data Transformation

#### `rename_attribute_type.py`

**Purpose**: Renames attribute types across multiple model files.

**Usage**:
```bash
python scripts/rename_attribute_type.py <file1.json> <file2.json> ...
```

**Example**:
```bash
python scripts/rename_attribute_type.py \
  models-data/CIM16-model.json \
  models-data/CIM100-model.json \
  models-data/focl-model.json \
  models-data/GOSTRExt-model.json
```

**Details**:
- Processes multiple files in one run
- Updates attribute type references
- Maintains consistency across model files

#### `set_refModelItemId.py`

**Purpose**: Sets `refModelItemId` references in profile files.

**Usage**:
```bash
python scripts/set_refModelItemId.py
```

**Details**:
- Updates reference IDs
- Ensures proper linking between profile and model items

## Parser Scripts

Located in `src/parser/`:

### `validate_json_schema.py`

**Purpose**: Validates JSON data against defined schemas.

**Usage**:
```bash
python src/parser/validate_json_schema.py
```

### `xmi_parser_v3_12.py`

**Purpose**: Parses XMI (XML Metadata Interchange) files to JSON format.

**Usage**:
```bash
python src/parser/xmi_parser_v3_12.py <input.xmi>
```

**Details**:
- Converts XMI format (used by UML tools) to JSON
- Parses CIM model definitions
- Version 3.12 of the parser

## Requirements

### Python Version
- Python 3.6 or higher

### Dependencies
Most scripts use only standard library modules:
- `json` - JSON processing
- `pathlib` - Path operations
- `collections.OrderedDict` - Ordered dictionaries
- `shutil` - File operations

No external dependencies required for basic scripts.

## Best Practices

### Before Running Scripts

1. **Backup your data**: Most scripts create backups automatically, but always keep your own backup
2. **Review the script**: Check the `SRC` variable to ensure it points to the correct file
3. **Test on sample data**: Test on a copy before running on production data

### Configuration

Scripts typically have configurable paths at the top:

```python
SRC = Path("models-data/GOSTRExt-model.json")
BACKUP = SRC.with_suffix(".backup.json")
```

Modify these paths as needed for your use case.

### After Running

1. **Verify output**: Check the modified files to ensure changes are correct
2. **Check backups**: Verify that backup files were created (`.backup.json`)
3. **Test data loading**: Ensure the modified files can be loaded by the application

## Common Workflows

### Adding New Fields to Model

1. Use `add-model-id-to-pack.py` for package-level fields
2. Use `add-model-id-to-class.py` for class-level fields
3. Validate with `verify_counts.py`

### Updating References

1. Use `set_refModelItemId.py` to set references
2. Validate with `check_refModelItemId.py`
3. Regenerate IDs if needed with `regen-class-id.py`

### Data Migration

1. Backup all data files
2. Run transformation scripts (e.g., `rename_attribute_type.py`)
3. Validate with verification scripts
4. Test data loading in the application

## Troubleshooting

### File Not Found Error

Ensure you're running scripts from the repository root:
```bash
cd /path/to/NauCim
python scripts/script-name.py
```

### Encoding Issues

Scripts use UTF-8 encoding by default. If you encounter encoding errors:
- Ensure your JSON files are UTF-8 encoded
- Check for BOM (Byte Order Mark) issues

### Backup Files

If a `.backup.json` file already exists, some scripts may fail. Either:
- Delete or rename the old backup
- Modify the script to use a different backup name

## Integration with Application

These scripts prepare and maintain data files that are loaded by:
- `src/services/dataloader.js` - Main data loader
- Application reads from `models-data/` directory
- Data is loaded into `MemoryStore` for runtime use

See [ARCHITECTURE.md](ARCHITECTURE.md) for more details on data flow.

## Contributing

When adding new scripts:
1. Follow the existing naming convention: `verb-noun.py`
2. Include a shebang: `#!/usr/bin/env python3`
3. Add configuration variables at the top
4. Create backups before modifying files
5. Use `OrderedDict` for maintaining field order in JSON
6. Add proper error handling
7. Document the script in this file
