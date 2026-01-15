# GitHub Copilot Instructions for NauCim

## Project Overview

Nautilus.CIM is an interactive prototype platform for creating, editing, and managing CIM (Common Information Model) information model profiles for power systems. This is a client-side application using HTML5, CSS3, and ES6+ JavaScript with localStorage for data persistence.

The project can also run in an **optional local backend mode**: static frontend + local Node.js API with SQLite persistence. See `docs/BACKEND_LOCAL.md` and `backend/README.md`.

## Architecture Guidelines

### Data Layer (⚠️ Important)

#### **DEPRECATED - Do NOT use for new development:**

- `data.js` - Legacy data management file, kept only for compatibility

#### **Current Architecture - Use these:**

- **MemoryStore**: `src/store/memory-store.js` - Global in-memory data storage
- **Data Loading**: `src/services/dataloader.js` - Initializes and loads data into MemoryStore
- **CRUD Operations**: Implemented in service files:
  - `src/services/model-service.js` - Model-related operations
  - `src/services/profile-service.js` - Profile-related operations
  - `src/services/project-service.js` - Project-related operations

**When working with data:**

1. Always use service files for CRUD operations
2. Services interact with MemoryStore
3. Never modify `data.js` - it's deprecated

**When working with persistence / backend mode:**

1. Persistence switching must stay centralized in `src/services/persistence/persistence-config.js`
2. Do not call backend APIs directly from UI/controllers; use `src/services/backend/*`
3. Keep MemoryStore as the single in-memory source of truth; persistence is a separate layer

### UI Components

#### Sidebar (⚠️ Important)

**DEPRECATED - Do NOT use for new development:**

- `sidebar.js` - Legacy sidebar implementation, kept only for compatibility

**Current Architecture - Use these:**

- `src/ui/sidebar/index.js` - Main sidebar initialization
- `src/ui/sidebar/project-tree.js` - Project tree functionality
- `src/ui/sidebar/sidebar-resize.js` - Sidebar resizing
- `src/ui/sidebar/sidebar-toggle.js` - Sidebar toggle functionality
- `src/ui/renderers/project-tree-renderer.js` - Project tree rendering logic

**When working with sidebar:**

1. All sidebar changes go in `src/ui/sidebar/*`
2. Rendering logic belongs in `src/ui/renderers/`
3. Never modify `sidebar.js` - it's deprecated

#### UI Renderers

**Location**: `src/ui/renderers/`

Contains rendering functionality for page blocks that can be isolated into standalone entities:

- `attribute-details-renderer.js`
- `class-details-renderer.js`
- `link-details-renderer.js`
- `model-details-renderer.js`
- `package-details-renderer.js`
- `profile-details-renderer.js`
- `project-card.js`
- `project-list-renderers.js`
- `project-tree-renderer.js`

**Convention**: When creating or refactoring rendering logic, prefer extracting it into separate modules in `src/ui/renderers/`.

#### UI Components (Modals)

**Location**: `src/ui/components/`

Modal windows and reusable components:

- `attribute-modal.js`
- `link-modal.js`
- `model-modal.js`
- `profile-modal.js`
- `project-modal.js`

**Convention**: When creating or refactoring pages or blocks, prefer extracting reusable components.

### Styles (⚠️ Important)

**DEPRECATED - Do NOT use for new development:**

- `styles.css` - Legacy styles file, kept only for compatibility

**Current Architecture - Use these:**

- `src/styles/**` - All styling changes should be made here
- Create new CSS files in `src/styles/` as needed following the existing naming pattern:
  - `00-fonts.css` - Font definitions
  - `01-tokens.css` - CSS custom properties/variables
  - `02-body.css` - Body and base styles
  - `03-app-container.css` - App container
  - `04-utils.css` - Utility classes
  - `05-sidebar-nav.css` - Sidebar navigation
  - `06-main-content.css` - Main content area
  - `07-info-style.css` - Info styles
  - `components/` - Component-specific styles
  - `pages/` - Page-specific styles

**When working with styles:**

1. Never modify `styles.css` - it's deprecated
2. Add new styles to appropriate files in `src/styles/`
3. Follow the numbering convention for base styles
4. Use `components/` and `pages/` subdirectories for specific styles

## Data Contract

**Canonical Reference**: `docs/DATA_STRUCTURES.md`

This document defines all data structures used in the application:

- Project
- Model
- Profile
- Class
- Attribute
- Package
- Enums

Always refer to this document when working with data structures.

## Development Conventions

### File Organization

- **Services** (`src/services/`) - Business logic and data operations
- **Backend Client** (`src/services/backend/`) - Thin frontend API client + repositories
- **Persistence** (`src/services/persistence/`) - Persistence switching and sync helpers
- **Store** (`src/store/`) - Data storage (MemoryStore)
- **UI** (`src/ui/`) - User interface components and renderers
- **Styles** (`src/styles/`) - All CSS files
- **Utils** (`src/utils/`) - Utility functions
- **Parser** (`src/parser/`) - Data parsing logic

### Local Backend (optional)

- **Backend app** (`backend/src/`) - Express server, routes, services
- **Database schema/migrations** (`backend/prisma/`) - Prisma schema and migrations
- Backend docs: `docs/BACKEND_LOCAL.md`, `backend/README.md`

### Modularization Strategy

1. **Extract rendering logic** into `src/ui/renderers/` when it can be isolated
2. **Create reusable components** in `src/ui/components/` for modal windows and shared UI elements
3. **Separate concerns**: Keep data operations in services, rendering in renderers, and business logic isolated

### Code Style

- Use ES6+ features (modules, arrow functions, destructuring, etc.)
- Follow existing naming conventions in the codebase
- Keep functions small and focused
- Add comments for complex logic

## Important Notes for AI Assistance

1. **Never suggest using deprecated files** (`data.js`, `sidebar.js`, `styles.css`)
2. **Always use the current architecture** with services, renderers, and modular UI components
3. **Respect the separation of concerns**: data layer, UI layer, and styling are separate
4. **Follow the modularization strategy** when refactoring or adding new features
5. **Reference the data contract** (`docs/DATA_STRUCTURES.md`) for data structures

## Technology Stack

- **HTML5** - Page structure
- **CSS3** - Styles and animations
- **JavaScript ES6+** - Logic and interactivity (ES modules)
- **SVG** - Rendering connections between classes
- **Drag and Drop API** - Element dragging
- **localStorage** - Local data storage

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
