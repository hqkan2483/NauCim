# Architecture Overview - Nautilus.CIM

This document describes the runtime architecture and module boundaries of the Nautilus.CIM application.

## Application Type

Nautilus.CIM is a **static web application** consisting of HTML pages, JavaScript ES6 modules, CSS, and JSON data files. It runs entirely in the browser without a backend server, but **requires a local HTTP server** for development/runtime due to browser security restrictions on `fetch()` API with `file://` protocol.

## Data Model

For complete data structure definitions, see the **canonical data contract**: [`docs/docs_DATA_STRUCTURES_Version5.md`](docs_DATA_STRUCTURES_Version5.md)

Key entities include:
- **Project** - Top-level container for models and profiles
- **Model** - CIM information model containing packages and classes
- **Profile** - Subset of a model with specific attributes included
- **Class** - CIM class definition with attributes
- **Attribute** - Field/property of a class
- **Package** - Organizational container for classes

## Runtime Architecture

### Pages and Entry Points

Each HTML page serves as an independent entry point with its own ES6 module:

| HTML Page | Entry Module | Purpose |
|-----------|--------------|---------|
| `index.html` | `src/app/pages/index-page.js` | Home page, recent projects dashboard |
| `projects.html` | `src/app/pages/projects-page.js` | Project management, list and CRUD operations |
| `project-details.html` | `src/app/pages/project-details-page.js` | Project details, models, profiles, class viewer |
| `compare.html` | Inline scripts | Compare two profiles side-by-side |
| `profile-editor.html` | Inline scripts + Joint.js | Visual profile editor with diagrams |

### Shared Components

#### Data Layer (`data.js`)

Central data management module providing:
- **MemoryStore** - In-memory data storage and access
- **Demo data initialization** - Loads JSON files via `fetch()` from `models-data/*.json`
- **Data access API** - Functions like `getProjects()`, `getProject(id)`, `addProject()`, etc.

**Critical**: The data layer uses `fetch()` to load JSON files, which is why a local HTTP server is required.

Demo data sources:
- `models-data/CIM100.json` - CIM 100 model
- `models-data/GOSTRExtension.json` - GOST R extension model
- `models-data/CIM16.json` - CIM 16 model
- `models-data/focl.json` - FOCL model
- `models-data/profile-test.json` - Test profile 1
- `models-data/profile-test2.json` - Test profile 2

#### Sidebar (`sidebar.js`)

Shared navigation component used across all pages:
- Project navigation and tree structure
- Collapsible/expandable sidebar
- Resizable width via drag handle
- State persistence in localStorage

#### Templates (`src/ui/templates/modals/`)

Reusable HTML template fragments for modal dialogs:
- `new-project-modal.html` - Create new project
- `edit-project-modal.html` - Edit project details
- `new-model-modal.html` - Create new model
- `edit-model-modal.html` - Edit model details
- `new-profile-modal.html` - Create new profile
- `edit-profile-modal.html` - Edit profile details
- `edit-attribute-modal.html` - Edit attribute properties
- `edit-link-modal.html` - Edit class relationships

### Module Organization

```
src/
├── app/
│   ├── pages/          # Page entry modules
│   │   ├── index-page.js
│   │   ├── projects-page.js
│   │   ├── project-details-page.js
│   │   └── project-details/  # Sub-modules for project details page
│   └── init.js         # Application initialization
├── services/           # Business logic services
├── state/             # State management
├── store/             # Data store utilities
├── ui/                # UI components and templates
│   └── templates/
│       └── modals/    # Modal dialog templates
├── utils/             # Helper functions
└── styles/            # CSS modules

Root level:
├── data.js            # Central data layer
├── sidebar.js         # Shared sidebar component
└── models-data/       # JSON data files (loaded via fetch)
```

## State Management

### In-Memory State (`data.js`)

The `MemoryStore` object maintains runtime state:
- List of all projects
- Currently selected project ID
- Project data (models, profiles, classes, attributes)

### Persistent State (localStorage)

UI preferences stored in browser localStorage:
- `currentProjectId` - Currently selected project
- `sidebarWidth` - Sidebar width in pixels
- `sidebarCollapsed` - Sidebar collapsed state (boolean)
- `projectsTreeExpanded` - Projects tree expansion state (boolean)
- `expandedProjects` - Per-project expansion state (JSON object)

**Important**: The application does NOT persist project data to localStorage - demo data is loaded fresh on each page load from JSON files.

## Data Flow

1. **Page Load** → HTML page loads
2. **Module Load** → Page entry module (`*-page.js`) loads via `<script type="module">`
3. **Data Initialization** → `data.js` fetches and parses JSON files from `models-data/`
4. **MemoryStore Population** → Parsed data populates `MemoryStore.store.projects`
5. **UI Render** → Page module renders UI using data from MemoryStore
6. **User Interaction** → Events trigger updates to MemoryStore
7. **State Persistence** → UI state (sidebar, selections) saved to localStorage

## Development Constraints

### Local HTTP Server Required

**Why**: Browsers block `fetch()` requests to local files (`file://` protocol) for security reasons.

**Solution**: Run a local HTTP server. See [`docs/RUN_LOCAL.md`](RUN_LOCAL.md) for instructions.

### No Backend

This is a **purely frontend** application:
- No database connection
- No API endpoints
- No server-side processing
- All data processing happens in browser JavaScript

### Browser Compatibility

Requires modern browser with ES6+ support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Module Dependencies

- **ES6 Modules** - All JavaScript uses native ES6 module syntax (`import/export`)
- **Joint.js** - Used in `profile-editor.html` for visual diagram editing
- **No build step** - Pure HTML/CSS/JS, no transpilation or bundling required

## Extending the Application

### Adding a New Page

1. Create HTML file at root (e.g., `my-page.html`)
2. Create entry module at `src/app/pages/my-page.js`
3. Add `<script type="module" src="./src/app/pages/my-page.js">` to HTML
4. Import `data.js` to access MemoryStore
5. Import `sidebar.js` if using shared navigation

### Adding New Data Structures

1. **First**: Update canonical documentation in `docs/docs_DATA_STRUCTURES_Version5.md`
2. Update TypeScript interface definitions in V5 doc
3. Update example JSON in V5 doc
4. Modify `data.js` MemoryStore if needed
5. Update any JSON files in `models-data/` to match new structure

### Adding Python Scripts

1. Create `.py` file in `scripts/` directory
2. Document in `docs/PYTHON_SCRIPTS.md`
3. Ensure script accepts relative paths for data files
4. Test from repo root: `python scripts/my-script.py`

---

**Key Principle**: Always consult `docs/docs_DATA_STRUCTURES_Version5.md` before modifying data structures. It is the single source of truth.
