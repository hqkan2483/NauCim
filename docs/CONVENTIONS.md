# NauCim Development Conventions

This document outlines the coding standards, conventions, and best practices for the NauCim project.

## Table of Contents

- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Code Style](#code-style)
- [Architecture Conventions](#architecture-conventions)
- [Documentation](#documentation)
- [Deprecated Files](#deprecated-files)

## File Organization

### Directory Structure

```
src/
├── services/       # Business logic and data operations
├── store/          # Data storage (MemoryStore)
├── ui/
│   ├── components/ # Reusable UI components (modals)
│   ├── renderers/  # Rendering logic modules
│   └── sidebar/    # Sidebar components
├── styles/         # All CSS files
├── parser/         # Data parsing
├── utils/          # Utility functions
├── data-schema/    # Type definitions
├── state/          # State management
├── enums/          # Enumerations
└── app/            # Application initialization
```

### File Naming

- Use **kebab-case** for file names: `project-service.js`, `sidebar-toggle.js`
- Use descriptive names that indicate purpose: `project-tree-renderer.js` not `ptr.js`
- Suffix service files with `-service`: `model-service.js`
- Suffix renderer files with `-renderer`: `class-details-renderer.js`
- Suffix modal files with `-modal`: `project-modal.js`

## Naming Conventions

### JavaScript

#### Variables and Functions
- Use **camelCase** for variables and functions:
  ```javascript
  const projectId = '123';
  function getProjectById(id) { ... }
  ```

#### Constants
- Use **UPPER_SNAKE_CASE** for true constants:
  ```javascript
  const MAX_PROJECT_NAME_LENGTH = 100;
  const DEFAULT_ACCESS_RIGHTS = 'custom';
  ```

#### Classes and Objects
- Use **PascalCase** for class names:
  ```javascript
  class ProjectService { ... }
  const MemoryStore = { ... }
  ```

#### Private Methods/Variables
- Prefix with underscore for internal/private:
  ```javascript
  function _internalHelper() { ... }
  const _privateCache = {};
  ```

### CSS

#### Class Names
- Use **kebab-case** for CSS classes:
  ```css
  .project-card { ... }
  .sidebar-toggle-button { ... }
  ```

#### CSS Custom Properties
- Use **kebab-case** with semantic names:
  ```css
  --primary-color: #2196F3;
  --sidebar-width: 300px;
  --font-size-large: 18px;
  ```

#### BEM Naming (when appropriate)
- Block__Element--Modifier pattern:
  ```css
  .project-card { ... }
  .project-card__title { ... }
  .project-card__title--highlighted { ... }
  ```

## Code Style

### JavaScript

#### ES6+ Features
Always use modern JavaScript features:

```javascript
// ✅ Good: Arrow functions
const getProjects = () => MemoryStore.getAllProjects();

// ✅ Good: Destructuring
const { id, name, version } = project;

// ✅ Good: Template literals
const message = `Project ${name} was created`;

// ✅ Good: Spread operator
const updatedProject = { ...project, name: newName };

// ✅ Good: Default parameters
function createProject(name, version = '1.0') { ... }
```

#### Module Imports/Exports

```javascript
// ✅ Good: Named exports
export { MemoryStore };
export function getProjectById(id) { ... }

// ✅ Good: Named imports
import { MemoryStore } from './store/memory-store.js';
import { renderProjectCard } from './ui/renderers/project-card.js';

// ✅ Good: Always include .js extension
import { something } from './module.js';
```

#### Function Style

```javascript
// ✅ Good: Small, focused functions
function getProjectById(id) {
  return MemoryStore.getProjectById(id);
}

// ✅ Good: Early returns
function validateProject(project) {
  if (!project.name) return false;
  if (!project.version) return false;
  return true;
}

// ✅ Good: Pure functions when possible
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

#### Comments

```javascript
// ✅ Good: Explain WHY, not WHAT
// Filter out archived projects to improve performance on large datasets
const activeProjects = projects.filter(p => !p.archived);

// ✅ Good: Document complex logic
/**
 * Resolves class inheritance hierarchy by building a dependency tree.
 * Uses breadth-first search to prevent circular dependencies.
 */
function resolveInheritance(classes) { ... }

// ❌ Bad: Obvious comments
// Get project by ID
const project = getProjectById(id);
```

#### Error Handling

```javascript
// ✅ Good: Try-catch for external operations
async function loadData() {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Failed to load data:', error);
    return fallbackData;
  }
}

// ✅ Good: Validation with clear error messages
function createProject(name) {
  if (!name || name.trim().length === 0) {
    throw new Error('Project name is required');
  }
  // ... create project
}
```

### CSS

#### Organization

```css
/* ✅ Good: Logical grouping */
.project-card {
  /* Layout */
  display: flex;
  flex-direction: column;
  
  /* Box model */
  padding: 16px;
  margin: 8px;
  
  /* Visual */
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  
  /* Typography */
  font-size: 14px;
  line-height: 1.5;
}
```

#### Use CSS Custom Properties

```css
/* ✅ Good: Use tokens from 01-tokens.css */
.sidebar {
  background-color: var(--sidebar-bg-color);
  width: var(--sidebar-width);
}

/* ❌ Bad: Hardcoded values */
.sidebar {
  background-color: #f5f5f5;
  width: 300px;
}
```

## Architecture Conventions

### Data Layer

#### Always Use Services for Data Operations

```javascript
// ✅ Good: Use service
import { ProjectService } from './services/project-service.js';
const project = ProjectService.getById(id);

// ❌ Bad: Direct MemoryStore access from UI
import { MemoryStore } from './store/memory-store.js';
const project = MemoryStore.getProjectById(id);
```

#### Data Flow Pattern

```
User Action → Service → MemoryStore → localStorage
            ↓
         Renderer → DOM
```

### UI Layer

#### Separate Rendering from Logic

```javascript
// ✅ Good: Renderer is pure function
export function renderProjectCard(project) {
  return `
    <div class="project-card" data-project-id="${project.id}">
      <h3>${project.name}</h3>
      <p>${project.description}</p>
    </div>
  `;
}

// ❌ Bad: Renderer with business logic
export function renderProjectCard(project) {
  // Don't do data operations in renderers
  const relatedModels = MemoryStore.getModelsByProjectId(project.id);
  // ...
}
```

#### Component Encapsulation

```javascript
// ✅ Good: Component manages its own state
class ProjectModal {
  constructor() {
    this.isOpen = false;
    this.currentProject = null;
  }
  
  open(project) {
    this.currentProject = project;
    this.isOpen = true;
    this.render();
  }
  
  close() {
    this.isOpen = false;
    this.render();
  }
}
```

### Style Layer

#### Where to Put Styles

1. **Global tokens** → `src/styles/01-tokens.css`
2. **Base element styles** → `src/styles/02-body.css`
3. **Layout utilities** → `src/styles/04-utils.css`
4. **Component styles** → `src/styles/components/[component-name].css`
5. **Page styles** → `src/styles/pages/[page-name].css`

#### Never Use Deprecated Files

```css
/* ❌ NEVER modify these files - they are deprecated */
/* - styles.css */

/* ✅ Instead, create/modify files in src/styles/ */
```

## Documentation

### Inline Documentation

```javascript
/**
 * Retrieves a project by its unique identifier.
 * 
 * @param {string} id - The project ID
 * @returns {Object|null} The project object or null if not found
 */
function getProjectById(id) {
  return MemoryStore.getProjectById(id);
}
```

### File Headers

```javascript
/**
 * Project Service
 * 
 * Handles all project-related operations including CRUD,
 * search, and validation.
 */

// Module code...
```

### README Updates

When adding new features:
1. Update relevant documentation in `docs/`
2. Add examples if introducing new patterns
3. Update `docs/ARCHITECTURE.md` if changing structure

## Deprecated Files

### ⚠️ NEVER Modify These Files

The following files are **DEPRECATED** and kept only for backward compatibility:

#### `data.js`
- **Status**: LEGACY
- **Reason**: Replaced by modular architecture
- **Use instead**: 
  - `src/store/memory-store.js` for storage
  - `src/services/dataloader.js` for initialization
  - `src/services/*-service.js` for CRUD operations

#### `sidebar.js`
- **Status**: LEGACY
- **Reason**: Replaced by modular sidebar components
- **Use instead**: 
  - `src/ui/sidebar/index.js` for initialization
  - `src/ui/sidebar/project-tree.js` for tree functionality
  - `src/ui/sidebar/sidebar-resize.js` for resizing
  - `src/ui/sidebar/sidebar-toggle.js` for toggle
  - `src/ui/renderers/project-tree-renderer.js` for rendering

#### `styles.css`
- **Status**: LEGACY
- **Reason**: Replaced by modular styles in `src/styles/`
- **Use instead**: Appropriate files in `src/styles/` directory

### How to Handle Deprecated Code

```javascript
// ✅ Good: Add new features to new architecture
// Add new function to appropriate service
// src/services/project-service.js
export function archiveProject(id) { ... }

// ❌ Bad: Adding to deprecated file
// Don't add functions to data.js
```

## Data Contract

### Always Reference the Canonical Data Structure

**Source**: `docs/docs_DATA_STRUCTURES_Version5.md`

When working with data structures:
1. Check the data contract document first
2. Follow the defined interfaces exactly
3. Don't create ad-hoc data structures
4. Update the data contract if structures change

```javascript
// ✅ Good: Following data contract
const project = {
  id: generateId(),
  name: 'New Project',
  description: 'Description',
  version: '1.0',
  createDate: new Date().toISOString(),
  modifyDate: new Date().toISOString(),
  accessRights: 'custom',
  models: [],
  profiles: []
};
```

## Best Practices Summary

### Do's ✅
- Use ES6+ features (modules, arrow functions, destructuring)
- Follow the modular architecture
- Separate concerns (data, UI, styles)
- Extract reusable logic into renderers and components
- Use services for all data operations
- Add styles to `src/styles/` directory
- Follow naming conventions consistently
- Write descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Don'ts ❌
- Don't modify deprecated files (`data.js`, `sidebar.js`, `styles.css`)
- Don't access MemoryStore directly from UI code
- Don't mix business logic with rendering
- Don't hardcode values that should be CSS custom properties
- Don't create monolithic files
- Don't skip documentation for complex features
- Don't ignore the data contract

## Code Review Checklist

Before committing code, verify:

- [ ] No modifications to deprecated files
- [ ] New data operations added to services
- [ ] New rendering logic in appropriate renderer
- [ ] New styles in `src/styles/` directory
- [ ] Follows naming conventions
- [ ] Includes appropriate comments
- [ ] Uses ES6+ features
- [ ] Follows data contract
- [ ] No hardcoded values (use CSS custom properties)
- [ ] Pure functions where possible
- [ ] Error handling for external operations
