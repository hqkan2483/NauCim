# Running NauCim Locally

This guide explains how to run and develop the Nautilus.CIM application on your local machine.

## Prerequisites

### Required

- **Modern Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
  - JavaScript ES6+ support required
  - localStorage support required

### Optional (for Python scripts)

- **Python 3.6+** - Only needed if you plan to run data processing scripts
  - See [PYTHON_SCRIPTS.md](PYTHON_SCRIPTS.md) for details

## Quick Start

### Option 1: Direct File Opening (Simple)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/thachanhtuan/NauCim.git
   cd NauCim
   ```

2. **Open in browser**:
   - Navigate to the repository directory
   - Open `index.html` directly in your browser
   - Or double-click `index.html` in your file manager

**Limitations**:
- Some browsers restrict ES6 modules when using `file://` protocol
- CORS issues may occur with local file access
- Recommended only for quick viewing

### Option 2: Local Web Server (Recommended)

Running a local web server avoids CORS and module loading issues.

#### Using Python

If you have Python installed:

```bash
# Python 3
cd /path/to/NauCim
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: http://localhost:8000

#### Using Node.js

If you have Node.js installed:

```bash
# Install http-server globally (one time)
npm install -g http-server

# Run server
cd /path/to/NauCim
http-server -p 8000
```

Then open: http://localhost:8000

#### Using PHP

If you have PHP installed:

```bash
cd /path/to/NauCim
php -S localhost:8000
```

Then open: http://localhost:8000

#### Using VS Code

If you use Visual Studio Code:

1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Application Pages

After starting the server, you can access:

- **Main Page**: `http://localhost:8000/index.html`
- **Projects**: `http://localhost:8000/projects.html`
- **Project Details**: `http://localhost:8000/project-details.html`
- **Profile Editor**: `http://localhost:8000/profile-editor.html`
- **Profile Comparison**: `http://localhost:8000/compare.html`

## Project Structure

```
NauCim/
├── index.html              # Main entry point
├── *.html                  # Application pages
├── src/                    # Application source code
│   ├── services/          # Business logic
│   ├── ui/                # UI components
│   ├── styles/            # CSS files
│   └── ...
├── models-data/           # JSON data files
├── scripts/               # Python utility scripts
└── docs/                  # Documentation
```

## Development Workflow

### Making Changes

1. **Edit files** in your favorite editor
2. **Save changes**
3. **Refresh browser** to see updates
   - Hard refresh: `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Browser Developer Tools

Essential tools for development:

- **Console** (F12): View logs and errors
- **Network** tab: Check file loading
- **Application** tab: Inspect localStorage data
- **Elements** tab: Inspect DOM and CSS

### Working with Data

#### Viewing Data

Data is stored in browser localStorage. To view:

1. Open browser DevTools (F12)
2. Go to Application tab
3. Select Local Storage → `http://localhost:8000`
4. Look for keys with project data

#### Clearing Data

To reset to initial state:

1. Open browser Console (F12)
2. Run: `localStorage.clear()`
3. Refresh page

Or use browser settings to clear site data.

#### Loading Test Data

The application loads test data automatically from `models-data/`:
- `CIM100-model.json`
- `CIM16-model.json`
- `GOSTRExt-model.json`
- `focl-model.json`
- `GOST-XXXXX.1-profile.json`
- `GOST-XXXXX.2-profile.json`

See `src/services/dataloader.js` for loading logic.

## Architecture Overview

### Data Flow

```
JSON Files (models-data/) 
  ↓
dataloader.js 
  ↓
MemoryStore (src/store/memory-store.js)
  ↓
Services (src/services/)
  ↓
UI Components & Renderers (src/ui/)
  ↓
Browser DOM
```

### Key Components

- **Data Layer**: 
  - `src/services/dataloader.js` - Data loading
  - `src/services/*-service.js` - CRUD operations
  - `src/store/memory-store.js` - In-memory storage

- **UI Layer**:
  - `src/ui/components/` - Reusable components (modals)
  - `src/ui/renderers/` - Rendering logic
  - `src/ui/sidebar/` - Sidebar components

- **Styles**:
  - `src/styles/` - All CSS files (modular)

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed information.

## Common Development Tasks

### Adding a New Feature

1. **Plan the change** - Review architecture docs
2. **Choose the right location**:
   - Data operations → `src/services/`
   - Rendering logic → `src/ui/renderers/`
   - Reusable component → `src/ui/components/`
   - Styles → `src/styles/`
3. **Follow conventions** - See [CONVENTIONS.md](CONVENTIONS.md)
4. **Test in browser** - Verify functionality

### Modifying Styles

1. **Never edit** `styles.css` (deprecated)
2. **Edit files in** `src/styles/`:
   - Global tokens → `01-tokens.css`
   - Component styles → `components/`
   - Page styles → `pages/`
3. **Refresh browser** to see changes
4. **Use DevTools** to inspect computed styles

### Working with Services

Example: Adding a new project operation

```javascript
// src/services/project-service.js
export function archiveProject(projectId) {
  const project = MemoryStore.getProjectById(projectId);
  if (!project) return null;
  
  project.archived = true;
  project.modifyDate = new Date().toISOString();
  
  MemoryStore.updateProject(projectId, project);
  return project;
}
```

### Adding a New Renderer

Example: Creating a renderer for a new component

```javascript
// src/ui/renderers/my-component-renderer.js

export function renderMyComponent(data) {
  return `
    <div class="my-component">
      <h3>${data.title}</h3>
      <p>${data.description}</p>
    </div>
  `;
}
```

Then import and use:

```javascript
import { renderMyComponent } from './ui/renderers/my-component-renderer.js';

const html = renderMyComponent({ title: 'Hello', description: 'World' });
document.getElementById('container').innerHTML = html;
```

## Troubleshooting

### Page is Blank

- **Check console** for JavaScript errors (F12)
- **Verify** you're using a local web server (not `file://`)
- **Try** hard refresh: `Ctrl+F5`

### Module Not Found Errors

- **Ensure** web server is running
- **Check** import paths include `.js` extension
- **Verify** file paths are correct and case-sensitive

### Data Not Loading

- **Check** Network tab in DevTools
- **Verify** JSON files exist in `models-data/`
- **Look for** errors in Console
- **Check** `dataloader.js` for issues

### Styles Not Applying

- **Check** Elements tab to see computed styles
- **Verify** CSS files are loaded in Network tab
- **Clear** browser cache
- **Check** for CSS syntax errors in Console

### localStorage Full

If you get quota exceeded errors:
1. Open DevTools → Application → Local Storage
2. Clear old data
3. Or increase quota in browser settings (Chrome)

## Testing Changes

### Manual Testing Checklist

- [ ] Page loads without errors
- [ ] All interactive elements work
- [ ] Data saves to localStorage
- [ ] Styles render correctly
- [ ] No console errors
- [ ] Works in multiple browsers
- [ ] Responsive design works

### Browser Testing

Test in multiple browsers:
- Chrome (primary target)
- Firefox
- Safari (if on Mac)
- Edge

### Performance

Monitor in DevTools:
- Network tab: Check file sizes
- Performance tab: Check for slow operations
- Console: Check for warnings

## Best Practices

### Code Organization

✅ **DO**:
- Use ES6 modules
- Follow naming conventions
- Keep functions small and focused
- Add comments for complex logic
- Use services for data operations

❌ **DON'T**:
- Modify deprecated files (`data.js`, `sidebar.js`, `styles.css`)
- Put business logic in renderers
- Mix concerns (data/UI/styles)
- Hardcode values that should be variables

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes
# ... edit files ...

# Stage changes
git add src/services/my-service.js

# Commit with clear message
git commit -m "Add archive project feature"

# Push to remote
git push origin feature/my-feature
```

### Before Committing

- [ ] Test in browser
- [ ] Check for console errors
- [ ] Review changed files
- [ ] Follow conventions
- [ ] Update documentation if needed

## Further Reading

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture documentation
- [CONVENTIONS.md](CONVENTIONS.md) - Coding standards and conventions
- [PYTHON_SCRIPTS.md](PYTHON_SCRIPTS.md) - Python utility scripts
- [docs_DATA_STRUCTURES_Version5.md](docs_DATA_STRUCTURES_Version5.md) - Data contract

## Getting Help

If you encounter issues:
1. Check this documentation
2. Review browser console for errors
3. Check existing issues on GitHub
4. Open a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and version
   - Console errors (if any)
