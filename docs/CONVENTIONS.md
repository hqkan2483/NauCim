# Coding Conventions - Nautilus.CIM

This document outlines coding standards, best practices, and data contract rules for the Nautilus.CIM project.

## Data Contract Rules

### Canonical Source of Truth

**`docs/docs_DATA_STRUCTURES_Version5.md`** is the **ONLY** authoritative reference for data structures.

### Strict Rules

1. **DO NOT invent fields** - All field names must exactly match Version 5 documentation
2. **DO NOT rename fields** - Field naming in V5 is the standard; do not deviate
3. **ASK before modifying V5** - Any change to data structures requires user approval
4. **Validate required fields** - Ensure all required fields are present with correct types
5. **Respect default values** - Use default values as specified in V5
6. **Maintain field types** - String, number, boolean, array, object types must match V5

### When Working with Data Structures

Before creating, modifying, or validating any of these entities:
- Project
- Model  
- Profile
- Class
- Attribute
- Package
- Enums (AccessRights, ProfileType, AttributeType, etc.)

**Always** reference `docs/docs_DATA_STRUCTURES_Version5.md` first.

### Example: Adding a New Project

❌ **Wrong** - Inventing fields:
```javascript
const project = {
  id: generateId(),
  title: "My Project",  // Wrong: should be "name"
  desc: "...",          // Wrong: should be "description"
  createdAt: new Date() // Wrong: should be "createDate" in ISO 8601 string
};
```

✅ **Correct** - Following V5:
```javascript
const project = {
  id: generateId(),
  name: "My Project",                    // Correct field name
  description: "Project description",    // Correct field name (optional)
  version: "1.0",                        // Required
  createDate: new Date().toISOString(),  // Correct format
  modifyDate: new Date().toISOString(),  // Required
  accessRights: "PRIVATE",               // From AccessRights enum
  models: [],                            // Required array
  profiles: []                           // Required array
};
```

## JavaScript Conventions

### Module System

Use **ES6 native modules** exclusively:

✅ **Correct**:
```javascript
import { getProjects, getProject } from './data.js';
export function myFunction() { }
```

❌ **Wrong**:
```javascript
const data = require('./data.js');  // No CommonJS
module.exports = { };                // No CommonJS
```

### Data Access Pattern

Always use `MemoryStore` API from `data.js`:

✅ **Correct**:
```javascript
import { getProjects, addProject, updateProject } from './data.js';

const projects = getProjects();
const project = getProject(projectId);
addProject(newProject);
```

❌ **Wrong**:
```javascript
import MemoryStore from './data.js';
const projects = MemoryStore.store.projects;  // Don't access .store directly
```

### File Paths

Use relative paths for local resources:

✅ **Correct**:
```javascript
fetch('./models-data/CIM100.json')
import { utils } from '../utils/helpers.js'
```

❌ **Wrong**:
```javascript
fetch('/models-data/CIM100.json')     // Absolute path
fetch('models-data/CIM100.json')       // Missing ./
```

### Async/Await

Prefer `async/await` over raw Promises:

✅ **Correct**:
```javascript
async function loadData() {
  try {
    const response = await fetch('./models-data/data.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}
```

❌ **Discouraged**:
```javascript
function loadData() {
  return fetch('./models-data/data.json')
    .then(res => res.json())
    .then(data => data)
    .catch(err => console.error(err));
}
```

### Error Handling

Always handle errors gracefully:

```javascript
async function saveProject(project) {
  try {
    // Validation
    if (!project.name) {
      throw new Error('Project name is required');
    }
    
    // Operation
    const saved = addProject(project);
    return saved;
    
  } catch (error) {
    console.error('Error saving project:', error);
    // Show user-friendly error message
    alert(`Failed to save project: ${error.message}`);
    return null;
  }
}
```

### ID Generation

Follow existing pattern for entity IDs:

```javascript
// Project IDs: "project-{timestamp}-{random}"
const projectId = `project-${Date.now()}-${generateRandomString()}`;

// Model IDs: "model-{timestamp}-{random}"
const modelId = `model-${Date.now()}-${generateRandomString()}`;

// Profile IDs: "profile-{timestamp}-{random}"
const profileId = `profile-${Date.now()}-${generateRandomString()}`;
```

### Date Handling

Always use ISO 8601 format for dates:

```javascript
const createDate = new Date().toISOString();
// Example: "2025-01-15T10:30:00.000Z"
```

## HTML Conventions

### Script Loading

Use `type="module"` for ES6 modules:

```html
<script type="module" src="./src/app/pages/index-page.js"></script>
```

### Semantic HTML

Use appropriate semantic tags:
```html
<nav>          <!-- Navigation -->
<main>         <!-- Main content -->
<section>      <!-- Content sections -->
<article>      <!-- Independent content -->
<aside>        <!-- Sidebar content -->
```

## CSS Conventions

### File Organization

- Core styles: `src/styles/0X-*.css` (numbered for load order)
- Components: `src/styles/components/*.css`
- Pages: `src/styles/pages/*.css`

### Class Naming

Follow BEM-like conventions:

```css
.block { }
.block__element { }
.block--modifier { }

/* Example */
.sidebar { }
.sidebar__nav-item { }
.sidebar__nav-item--active { }
```

### Utility Classes

Use existing utility classes from `src/styles/04-utils.css`:
- `.mt-10`, `.mt-20`, `.mt-30` - Margins
- `.hidden` - Hide elements
- `.text-center` - Center text

## LocalStorage Conventions

### Read/Write Pattern

Always check for existence before reading:

```javascript
// Reading
const value = localStorage.getItem('key');
const parsed = JSON.parse(localStorage.getItem('jsonKey') || '{}');

// Writing
localStorage.setItem('key', 'value');
localStorage.setItem('jsonKey', JSON.stringify(object));
```

### Reserved Keys

**DO NOT modify or remove** these localStorage keys without team approval:
- `currentProjectId`
- `sidebarWidth`
- `sidebarCollapsed`
- `projectsTreeExpanded`
- `expandedProjects`

### Adding New Keys

If you need new localStorage keys:
1. Document them in this file
2. Use descriptive, camelCase names
3. Add to reserved keys list
4. Handle missing values gracefully

## Python Script Conventions

### File Naming

Use lowercase with hyphens:
- `verify-counts.py` ✅
- `verifyCountsCamelCase.py` ❌
- `verify_counts.py` ✅ (also acceptable)

### Path Handling

Scripts should accept relative paths from repo root:

```python
import sys
import json
from pathlib import Path

# Accept relative path argument
data_file = Path(sys.argv[1])  # e.g., "models-data/CIM100.json"

# Read relative to script location if needed
script_dir = Path(__file__).parent
data_file = script_dir.parent / "models-data" / "CIM100.json"
```

### Documentation

Each script should have:
```python
"""
Script Name: verify_counts.py
Purpose: Validate entity counts and relationships in JSON data files
Usage: python scripts/verify_counts.py
"""
```

## Documentation Conventions

### Inline Comments

Comment **why**, not **what**:

❌ **Bad**:
```javascript
// Loop through projects
projects.forEach(project => {
  // Get project name
  const name = project.name;
});
```

✅ **Good**:
```javascript
// Filter out archived projects since they shouldn't appear in recent list
const activeProjects = projects.filter(p => !p.archived);
```

### JSDoc Comments

Use JSDoc for functions with complex parameters:

```javascript
/**
 * Creates a new project with validation
 * @param {string} name - Project name (required)
 * @param {string} version - Project version (default: "1.0")
 * @param {string} [description] - Optional description
 * @returns {Project} Created project object
 */
function createProject(name, version = "1.0", description = "") {
  // Implementation
}
```

### Markdown Documentation

- Use ATX headers (`#`, `##`, `###`)
- Include table of contents for long docs
- Use code fences with language tags
- Link to related docs

## Version Control

### Commit Messages

Format: `<type>: <description>`

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code restructuring (no behavior change)
- `test:` - Adding tests
- `chore:` - Build/tooling changes

Examples:
```
feat: add profile comparison page
fix: correct sidebar width calculation
docs: update V5 data structures with new field
refactor: extract modal logic into service
```

## Testing

Currently, the project does not have automated tests. When adding tests:

1. Create `tests/` directory
2. Use naming: `feature.test.js`
3. Test data access layer thoroughly
4. Test data structure validation
5. Mock `fetch()` calls in tests

## Security

### XSS Prevention

Always sanitize user input before rendering:

```javascript
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Use when inserting user data into HTML
element.textContent = userInput;  // Safe - browser escapes
element.innerHTML = escapeHtml(userInput);  // Manually escape if needed
```

### Data Validation

Validate all user input:

```javascript
function validateProject(project) {
  if (!project.name || typeof project.name !== 'string') {
    throw new Error('Invalid project name');
  }
  if (!project.version || typeof project.version !== 'string') {
    throw new Error('Invalid project version');
  }
  // More validation per V5 requirements
}
```

---

**Remember**: When in doubt, check:
1. `docs/docs_DATA_STRUCTURES_Version5.md` for data contracts
2. Existing code for patterns and conventions
3. Ask the team if something is unclear
