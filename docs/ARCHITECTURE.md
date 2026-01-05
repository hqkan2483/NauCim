# NauCim Architecture Documentation

## Overview

Nautilus.CIM is a client-side interactive prototype platform for creating, editing, and managing CIM (Common Information Model) information model profiles for electrical power systems according to the CIM standard.

## Architecture Principles

The application follows a modular architecture with clear separation of concerns:

1. **Data Layer** - Data storage and business logic
2. **UI Layer** - User interface components and renderers
3. **Style Layer** - CSS styling organized by concern

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript ES6+ (ES Modules)
- **Graphics**: SVG for class diagrams and relationships
- **Data Storage**: Browser localStorage
- **APIs**: Drag and Drop API for interactive elements

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Architecture Layers

### 1. Data Layer

#### MemoryStore (`src/store/memory-store.js`)

Global in-memory data storage that holds all application state:
- Projects collection
- Current project context

```javascript
const MemoryStore = {
  store: {
    projects: [],
  },
  initialize({ projects = [] }),
  getAllProjects(),
  getProjectById(id),
  addProject(project),
  updateProject(id, updates),
  deleteProject(id)
}
```

#### Data Loader (`src/services/dataloader.js`)

**Primary data initialization file** responsible for:
- Loading test/demo data from JSON files
- Fetching package definitions
- Initializing MemoryStore with data
- Handling data loading errors with fallbacks

#### Service Layer (`src/services/`)

Business logic and CRUD operations organized by domain:

- **`model-service.js`** - Model-related operations
  - Create, read, update, delete models
  - Model search and filtering
  - Model validation

- **`profile-service.js`** - Profile-related operations
  - Profile CRUD operations
  - Profile comparison logic
  - Profile generation

- **`project-service.js`** - Project-related operations
  - Project CRUD operations
  - Project context management
  - Access rights handling

**Service Pattern**: All services interact with MemoryStore and provide domain-specific operations.

#### ⚠️ Deprecated: `data.js`

**Status**: LEGACY - Kept only for compatibility

**DO NOT USE** for new development. This file contains the old monolithic data management approach. All new code should use:
- `src/store/memory-store.js` for data storage
- `src/services/dataloader.js` for data initialization
- Service files in `src/services/` for CRUD operations

### 2. UI Layer

#### Sidebar Components (`src/ui/sidebar/`)

Modular sidebar functionality:

- **`index.js`** - Main sidebar initialization and coordination
- **`project-tree.js`** - Project tree structure and interactions
- **`sidebar-resize.js`** - Sidebar resizing functionality
- **`sidebar-toggle.js`** - Show/hide sidebar controls
- **`sidebar-state.js`** - Sidebar state management

#### ⚠️ Deprecated: `sidebar.js`

**Status**: LEGACY - Kept only for compatibility

**DO NOT USE** for new development. All sidebar functionality has been modularized into `src/ui/sidebar/` directory.

#### UI Renderers (`src/ui/renderers/`)

**Purpose**: Rendering functionality for page blocks that can be isolated into standalone entities.

**Strategy**: When creating or refactoring rendering logic, prefer extracting it into separate modules here.

Current renderers:
- **`attribute-details-renderer.js`** - Attribute detail views
- **`class-details-renderer.js`** - Class detail views
- **`link-details-renderer.js`** - Association/link rendering
- **`model-details-renderer.js`** - Model detail views
- **`package-details-renderer.js`** - Package detail views
- **`profile-details-renderer.js`** - Profile detail views
- **`project-card.js`** - Project card components
- **`project-list-renderers.js`** - Project list rendering
- **`project-tree-renderer.js`** - Project tree rendering logic

**Renderer Pattern**: 
- Renderers are pure rendering functions
- They receive data and return DOM elements or HTML strings
- They do not contain business logic
- They can be reused across different pages

#### UI Components (`src/ui/components/`)

**Purpose**: Reusable UI components, primarily modal windows.

**Strategy**: When creating or refactoring pages or blocks, prefer extracting reusable components.

Current components:
- **`attribute-modal.js`** - Attribute editor modal
- **`link-modal.js`** - Link/association editor modal
- **`model-modal.js`** - Model editor modal
- **`profile-modal.js`** - Profile editor modal
- **`project-modal.js`** - Project editor modal

**Component Pattern**:
- Components encapsulate both rendering and interaction logic
- They can manage their own state
- They provide public APIs for initialization and interaction

#### Other UI Modules

- **`dom.js`** - DOM manipulation utilities
- **`modal-loader.js`** - Dynamic modal loading
- **`modal.js`** - Base modal functionality
- **`storage.js`** - localStorage wrapper
- **`templates/`** - HTML templates

### 3. Style Layer

#### Modular Styles (`src/styles/`)

All CSS is organized in a modular structure:

**Base Styles** (numbered for load order):
- `00-fonts.css` - Font definitions
- `01-tokens.css` - CSS custom properties and design tokens
- `02-body.css` - Body and base element styles
- `03-app-container.css` - Application container layout
- `04-utils.css` - Utility classes
- `05-sidebar-nav.css` - Sidebar navigation styles
- `06-main-content.css` - Main content area styles
- `07-info-style.css` - Information display styles

**Component Styles**:
- `components/` - Component-specific styles

**Page Styles**:
- `pages/` - Page-specific styles

**Style Organization Strategy**:
1. Global tokens and variables in `01-tokens.css`
2. Base element styles in numbered files
3. Component-specific styles in `components/`
4. Page-specific styles in `pages/`
5. Follow the numbering convention for load order

#### ⚠️ Deprecated: `styles.css`

**Status**: LEGACY - Kept only for compatibility

**DO NOT USE** for new development. All new styles should be added to the appropriate file in `src/styles/`.

### 4. Data Schema and Parsing

#### Data Schema (`src/data-schema/`)

Type definitions and schema validation.

#### Parser (`src/parser/`)

Parsing logic for CIM models and profiles.

#### Utilities (`src/utils/`)

Shared utility functions used across the application.

## Data Flow

1. **Initialization**:
   ```
   dataloader.js → MemoryStore.initialize() → MemoryStore.store
   ```

2. **Data Operations**:
   ```
   User Action → Service (project/model/profile) → MemoryStore → localStorage
   ```

3. **Rendering**:
   ```
   Service → Renderer → DOM → User
   ```

4. **User Interaction**:
   ```
   User Input → Component/Modal → Service → MemoryStore → Renderer → DOM
   ```

## File Structure

```
NauCim/
├── .github/
│   └── copilot-instructions.md    # Copilot guidance
├── docs/
│   ├── ARCHITECTURE.md             # This file
│   ├── CONVENTIONS.md              # Development conventions
│   ├── docs_DATA_STRUCTURES_Version5.md  # Data contract (canonical)
│   └── ...
├── src/
│   ├── services/                   # Business logic
│   │   ├── dataloader.js          # Primary data loader
│   │   ├── model-service.js
│   │   ├── profile-service.js
│   │   └── project-service.js
│   ├── store/
│   │   └── memory-store.js        # In-memory data store
│   ├── ui/
│   │   ├── components/            # Reusable UI components (modals)
│   │   ├── renderers/             # Rendering logic modules
│   │   └── sidebar/               # Sidebar components
│   ├── styles/                    # All CSS files
│   ├── parser/                    # Data parsing
│   ├── utils/                     # Utilities
│   └── ...
├── models-data/                   # JSON data files
├── index.html                     # Main page
├── projects.html                  # Projects page
├── data.js                        # ⚠️ DEPRECATED
├── sidebar.js                     # ⚠️ DEPRECATED
├── styles.css                     # ⚠️ DEPRECATED
└── README.md
```

## Key Design Patterns

### 1. Service Pattern
Services encapsulate business logic and data operations for specific domains (projects, models, profiles).

### 2. Renderer Pattern
Renderers are pure functions that transform data into DOM elements, keeping rendering logic separate from business logic.

### 3. Component Pattern
Components combine rendering and interaction logic for reusable UI elements.

### 4. Module Pattern
ES6 modules with explicit imports/exports for clear dependencies.

## Data Contract

**Canonical Reference**: `docs/docs_DATA_STRUCTURES_Version5.md`

This document defines all data structures:
- Project
- Model
- Profile
- Class
- Attribute
- Package
- Enums

Always refer to this document when working with data structures to ensure consistency.

## Extension Points

When adding new features:

1. **New Data Operations**: Add to appropriate service or create new service in `src/services/`
2. **New UI Rendering**: Create renderer in `src/ui/renderers/`
3. **New Reusable Component**: Create component in `src/ui/components/`
4. **New Styles**: Add to `src/styles/` following the organization pattern
5. **New Page**: Create HTML file in root, import modules from `src/`

## Migration Notes

The application is in a transition phase:

- **Old approach**: Monolithic files (`data.js`, `sidebar.js`, `styles.css`)
- **New approach**: Modular architecture with clear separation of concerns

**For contributors**: Always use the new modular approach. The deprecated files are kept for backward compatibility but should not be modified.

## Performance Considerations

- All data is stored in-memory for fast access
- localStorage is used for persistence across sessions
- Rendering is separated from data operations for better performance
- SVG is used for scalable graphics without performance impact

## Security Considerations

- No server-side component - all data is client-side
- Data stored in browser localStorage
- No authentication system in prototype
- Input validation in services before storing data
