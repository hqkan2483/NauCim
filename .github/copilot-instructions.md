# GitHub Copilot Instructions for NauCim

## Data Contract: Canonical Source of Truth

**CRITICAL**: The file `docs/docs_DATA_STRUCTURES_Version5.md` is the **canonical data contract** and **single source of truth** for all data structures in this application.

### Strict Rules for Data Structures

1. **DO NOT invent or rename fields** - All fields must match exactly as defined in Version 5 documentation
2. **ASK before changing V5** - Any modification to data structures defined in V5 requires explicit user approval
3. **Ensure required fields** - All required fields and default values must match V5 specifications
4. **Validate against V5** - When working with data structures (Project, Model, Profile, Class, Attribute, Package), always reference `docs/docs_DATA_STRUCTURES_Version5.md`

## Repository Architecture

### Entry Points and Page Structure

- **Main entry page**: `index.html` → loads `src/app/pages/index-page.js` as ES6 module
- **Projects page**: `projects.html` → loads `src/app/pages/projects-page.js`
- **Project details**: `project-details.html` → loads `src/app/pages/project-details-page.js`
- **Compare page**: `compare.html` → loads comparison UI (inline scripts)
- **Profile editor**: `profile-editor.html` → loads profile editing UI (uses Joint.js for diagrams)

### Architecture Boundaries

#### Page Layer (`src/app/pages/*-page.js`)
- Entry modules for each HTML page
- Responsible for initializing page-specific UI and event handlers
- Import and use shared data layer and services

#### Data Layer (`data.js`)
- **Central data management** via `MemoryStore` object
- **Loads JSON data via `fetch()`** from `models-data/*.json` files
- Provides functions: `getProjects()`, `getProject(id)`, `addProject()`, `updateProject()`, `deleteProject()`
- Initializes demo data from multiple JSON files (CIM100.json, GOSTRExtension.json, CIM16.json, focl.json, profile-test.json, profile-test2.json)

#### Sidebar (`sidebar.js`)
- Shared navigation component
- Manages sidebar state (collapsed/expanded, width, project tree)
- Uses localStorage for persistence

#### Templates (`src/ui/templates/modals/*.html`)
- HTML templates for modal dialogs
- Includes: new-project-modal, edit-project-modal, new-model-modal, edit-model-modal, new-profile-modal, edit-profile-modal, edit-attribute-modal, edit-link-modal

#### Services and Utilities (`src/services/`, `src/utils/`)
- Reusable business logic and helper functions
- Import from page modules as needed

### Runtime Constraints

**CRITICAL**: This is a **static application** that requires a **local HTTP server** to run properly.

**Why**: The application uses `fetch()` to load JSON data from `models-data/*.json`. Browsers block `fetch()` requests when using the `file://` protocol for security reasons.

**Solution**: Always run via local HTTP server (see `docs/RUN_LOCAL.md`)

### LocalStorage Persistence

The application stores UI state in browser localStorage. **DO NOT change or remove** these keys without understanding their purpose:

- `currentProjectId` - ID of the currently selected project
- `sidebarWidth` - Width of the sidebar in pixels
- `sidebarCollapsed` - Boolean string ("true"/"false") for sidebar collapsed state
- `projectsTreeExpanded` - Boolean string for projects tree expansion state
- `expandedProjects` - JSON object mapping project IDs to their expansion state

### Python Scripts (`scripts/*.py`)

- **Purpose**: Offline CLI utilities for preparing, validating, and transforming JSON data in `models-data/`
- **Not runtime dependencies**: These scripts are NOT loaded or used by the web application
- **Relative paths**: Run scripts from repo root with relative paths, e.g., `python scripts/verify_counts.py`
- **Historical reference**: `scripts/runScript.txt` contains absolute paths from original development environment and is for reference only

#### Available Scripts
- `verify_counts.py` - Validate data counts and relationships
- `check_refModelItemId.py` - Check reference model item IDs
- `set_refModelItemId.py` - Set reference model item IDs
- `add-model-id-to-class.py` - Add model IDs to class definitions
- `add-model-id-to-pack.py` - Add model IDs to package definitions
- `regen-class-id.py` - Regenerate class IDs
- `rename_attribute_type.py` - Rename attribute types across models

## Coding Conventions

### Module System
- Use **ES6 modules** (`type="module"` in script tags)
- Use `import/export` syntax, not CommonJS `require()`

### Data Access
- Always use `MemoryStore` functions from `data.js` to access/modify data
- Do NOT directly access `MemoryStore.store` - use provided getter/setter methods

### File Paths
- Use relative paths for in-repo resources (e.g., `./models-data/CIM100.json`)
- Static assets are at repo root level (`index.html`, `styles.css`, `data.js`, `sidebar.js`)

### UI Patterns
- Modal dialogs are loaded from `src/ui/templates/modals/*.html`
- Page-specific CSS in `src/styles/pages/`
- Component CSS in `src/styles/components/`
- Shared styles in `src/styles/0X-*.css` files

## Documentation References

- **Data structures**: `docs/docs_DATA_STRUCTURES_Version5.md` ⭐ CANONICAL
- **Architecture details**: `docs/ARCHITECTURE.md`
- **Coding conventions**: `docs/CONVENTIONS.md`
- **Local development**: `docs/RUN_LOCAL.md`
- **Python scripts**: `docs/PYTHON_SCRIPTS.md`

## Development Workflow

1. **Before making data structure changes**: Review `docs/docs_DATA_STRUCTURES_Version5.md`
2. **Before running the app**: Start local HTTP server (see `docs/RUN_LOCAL.md`)
3. **Before modifying JSON data**: Consider using Python scripts in `scripts/` folder
4. **Before changing localStorage keys**: Verify existing usage in `sidebar.js` and `data.js`

---

**Remember**: When in doubt about data structures, always refer to `docs/docs_DATA_STRUCTURES_Version5.md` as the source of truth.
