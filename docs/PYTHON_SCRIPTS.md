# Python Scripts Documentation

This document describes the Python utility scripts in the `scripts/` directory and how to use them.

## Overview

The `scripts/` folder contains Python CLI utilities for **offline data preparation, validation, and transformation** of JSON files in the `models-data/` directory.

**Important**: These scripts are **NOT** runtime dependencies of the web application. They are developer tools for maintaining and preparing data files.

## Running Scripts

### Prerequisites

- Python 3.x installed
- No additional packages required (scripts use Python standard library)

### Basic Usage

Run scripts from the **repository root** using relative paths:

```bash
# From repository root directory
python scripts/script-name.py [arguments]
```

### Script Descriptions

#### 1. `verify_counts.py`

**Purpose**: Validate entity counts and relationships in JSON data files.

**Usage**:
```bash
python scripts/verify_counts.py
```

**What it does**:
- Counts projects, models, profiles, classes, attributes, packages
- Verifies referential integrity between entities
- Reports any inconsistencies or missing references

**When to use**:
- After manually editing JSON files
- Before committing data changes
- To troubleshoot data issues

---

#### 2. `check_refModelItemId.py`

**Purpose**: Check reference model item IDs across entities.

**Usage**:
```bash
python scripts/check_refModelItemId.py
```

**What it does**:
- Validates `refModelItemId` fields exist and are correct
- Checks that references point to valid entities
- Reports orphaned or invalid references

**When to use**:
- After adding new classes or attributes
- When working with model relationships

---

#### 3. `set_refModelItemId.py`

**Purpose**: Automatically set or update reference model item IDs.

**Usage**:
```bash
python scripts/set_refModelItemId.py
```

**What it does**:
- Analyzes entity relationships
- Sets `refModelItemId` fields to correct values
- Updates JSON files in place

**When to use**:
- After importing new data
- When references are missing or incorrect
- **Warning**: Modifies files - commit changes first or backup

---

#### 4. `add-model-id-to-class.py`

**Purpose**: Add model IDs to class definitions.

**Usage**:
```bash
python scripts/add-model-id-to-class.py
```

**What it does**:
- Adds `modelId` field to class objects that are missing it
- Derives model ID from parent relationships
- Updates JSON files with the changes

**When to use**:
- After data migration
- When adding new classes without model IDs

---

#### 5. `add-model-id-to-pack.py`

**Purpose**: Add model IDs to package definitions.

**Usage**:
```bash
python scripts/add-model-id-to-pack.py
```

**What it does**:
- Adds `modelId` field to package objects
- Ensures packages are properly associated with models
- Updates JSON files

**When to use**:
- Similar to class ID script but for packages
- After importing package data

---

#### 6. `regen-class-id.py`

**Purpose**: Regenerate class IDs across data files.

**Usage**:
```bash
python scripts/regen-class-id.py
```

**What it does**:
- Generates new unique IDs for classes
- Updates all references to use new IDs
- Maintains referential integrity

**When to use**:
- When IDs are duplicated or invalid
- After merging data from multiple sources
- **Warning**: Changes IDs - may break external references

---

#### 7. `rename_attribute_type.py`

**Purpose**: Rename attribute types across multiple model files.

**Usage**:
```bash
python scripts/rename_attribute_type.py <file1> <file2> <file3> ...
```

**Example**:
```bash
python scripts/rename_attribute_type.py \
  models-data/CIM16-model.json \
  models-data/CIM100-model.json \
  models-data/focl-model.json \
  models-data/GOSTRExt-model.json
```

**What it does**:
- Finds and replaces attribute type names
- Updates multiple JSON files in batch
- Useful for standardizing attribute type naming

**When to use**:
- After changing attribute type enum values
- When standardizing naming across models
- **Note**: Edit script to configure old/new type names before running

---

## Historical Reference: `runScript.txt`

The file `scripts/runScript.txt` contains:
```
python "C:/pdp/MyProjects/GitHub/NauCim-1/scripts/rename_attribute_type.py" ...
```

**Purpose**: Historical documentation of how scripts were originally run.

**Status**: 
- Contains **absolute paths** from original development machine
- **Do NOT use** these exact commands
- Keep for reference only

**Modern usage**: Run scripts with relative paths from repo root as shown above.

---

## Best Practices

### Before Running Scripts

1. **Backup your data**:
   ```bash
   cp -r models-data models-data.backup
   ```
   Or commit changes to git first.

2. **Understand what the script does**:
   - Read script description above
   - Review script source code if needed
   - Test on a copy of data first

3. **Run from correct directory**:
   ```bash
   # Always from repo root
   cd /path/to/NauCim
   python scripts/script-name.py
   ```

### After Running Scripts

1. **Verify changes**:
   ```bash
   git diff models-data/
   ```

2. **Test the application**:
   - Start local server (see [`RUN_LOCAL.md`](RUN_LOCAL.md))
   - Load pages and verify data displays correctly
   - Check browser console for errors

3. **Commit changes** (if successful):
   ```bash
   git add models-data/
   git commit -m "feat: update model IDs via script"
   ```

### When Scripts Fail

If a script produces errors:

1. **Read error message** carefully
2. **Check input files** exist and are valid JSON
3. **Verify Python version**: `python --version` (should be 3.x)
4. **Restore from backup** if data is corrupted
5. **Report issue** with error details

---

## Script Maintenance

### Adding New Scripts

When creating new utility scripts:

1. Add to `scripts/` directory
2. Use relative paths for file access
3. Add documentation to this file
4. Test from repo root
5. Include usage examples

### Script Template

```python
#!/usr/bin/env python3
"""
Script Name: my_script.py
Purpose: Brief description of what this script does
Usage: python scripts/my_script.py [arguments]
"""

import sys
import json
from pathlib import Path

def main():
    # Script implementation
    pass

if __name__ == "__main__":
    main()
```

---

## Integration with Data Structures

All scripts work with data structures defined in [`docs/docs_DATA_STRUCTURES_Version5.md`](docs_DATA_STRUCTURES_Version5.md).

**Before modifying data with scripts**:
1. Review V5 documentation
2. Understand entity relationships
3. Know which fields are required
4. Verify enum values are valid

**After script modifications**:
1. Validate data still conforms to V5
2. Check that required fields are present
3. Ensure referential integrity

---

## Common Workflows

### Workflow 1: Import New Model Data

```bash
# 1. Add new JSON file to models-data/
cp ~/Downloads/new-model.json models-data/

# 2. Add model IDs to classes
python scripts/add-model-id-to-class.py

# 3. Add model IDs to packages
python scripts/add-model-id-to-pack.py

# 4. Set reference IDs
python scripts/set_refModelItemId.py

# 5. Verify counts
python scripts/verify_counts.py

# 6. Test in browser
python -m http.server 8000
```

### Workflow 2: Standardize Attribute Types

```bash
# 1. Edit rename_attribute_type.py to set old/new names

# 2. Run on all model files
python scripts/rename_attribute_type.py \
  models-data/CIM16-model.json \
  models-data/CIM100-model.json \
  models-data/GOSTRExt-model.json

# 3. Verify changes
git diff models-data/

# 4. Check counts
python scripts/verify_counts.py
```

### Workflow 3: Fix Broken References

```bash
# 1. Check for issues
python scripts/check_refModelItemId.py

# 2. Auto-fix references
python scripts/set_refModelItemId.py

# 3. Verify fix
python scripts/check_refModelItemId.py

# 4. Test application
python -m http.server 8000
```

---

## Related Documentation

- **Data structures**: [`docs_DATA_STRUCTURES_Version5.md`](docs_DATA_STRUCTURES_Version5.md) - Entity definitions
- **Architecture**: [`ARCHITECTURE.md`](ARCHITECTURE.md) - How data flows in the app
- **Running locally**: [`RUN_LOCAL.md`](RUN_LOCAL.md) - Testing after script changes
- **Conventions**: [`CONVENTIONS.md`](CONVENTIONS.md) - Python coding standards

---

**Remember**: Scripts are tools for **preparing data offline**, not part of the runtime application.
