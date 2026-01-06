# Running Nautilus.CIM Locally

This guide explains how to run the Nautilus.CIM application on your local machine.

## Why a Local Server is Required

Nautilus.CIM is a **static web application** that loads data from JSON files using JavaScript's `fetch()` API. 

**Browser Security Restriction**: Modern browsers block `fetch()` requests when opening HTML files directly via `file://` protocol. This is a security measure to prevent malicious websites from reading local files.

**Solution**: Run a local HTTP server to serve the files over `http://localhost`.

## Quick Start (Recommended)

### Option 1: Python HTTP Server (Easiest)

Python 3 includes a built-in HTTP server. This is the **recommended** method.

**Prerequisites**: Python 3.x installed

**Steps**:

1. Open terminal/command prompt
2. Navigate to the repository root directory:
   ```bash
   cd /path/to/NauCim
   ```
3. Start the server:
   ```bash
   python -m http.server 8000
   ```
   Or on some systems:
   ```bash
   python3 -m http.server 8000
   ```
4. Open browser and navigate to:
   ```
   http://localhost:8000
   ```

**Default pages**:
- Home: `http://localhost:8000/index.html`
- Projects: `http://localhost:8000/projects.html`
- Project details: `http://localhost:8000/project-details.html`
- Compare: `http://localhost:8000/compare.html`
- Profile editor: `http://localhost:8000/profile-editor.html`

### Option 2: Node.js HTTP Server

If you have Node.js installed, you can use the `http-server` package.

**Prerequisites**: Node.js and npm installed

**Steps**:

1. Install `http-server` globally (one-time):
   ```bash
   npm install -g http-server
   ```
2. Navigate to repository root:
   ```bash
   cd /path/to/NauCim
   ```
3. Start the server:
   ```bash
   http-server -p 8000
   ```
4. Open browser to `http://localhost:8000`

### Option 3: PHP Built-in Server

If you have PHP installed:

**Prerequisites**: PHP 5.4+ installed

**Steps**:

1. Navigate to repository root:
   ```bash
   cd /path/to/NauCim
   ```
2. Start the server:
   ```bash
   php -S localhost:8000
   ```
3. Open browser to `http://localhost:8000`

### Option 4: VS Code Live Server Extension

If you use Visual Studio Code:

**Steps**:

1. Install the "Live Server" extension by Ritwick Dey
2. Open the NauCim folder in VS Code
3. Right-click on `index.html`
4. Select "Open with Live Server"
5. Browser opens automatically to `http://127.0.0.1:5500/index.html`

**Benefit**: Auto-reload on file changes during development

## Troubleshooting

### Port Already in Use

If you see "Address already in use" error, try a different port:

```bash
# Python
python -m http.server 8080

# Node http-server
http-server -p 8080

# PHP
php -S localhost:8080
```

Then access via `http://localhost:8080`

### CORS Errors

If you see CORS errors in browser console:
- Make sure you're accessing via `http://localhost`, not `file://`
- Check that the server is running
- Try clearing browser cache

### Failed to Fetch JSON

If demo data doesn't load:
1. Verify files exist in `models-data/` directory:
   ```bash
   ls models-data/*.json
   ```
2. Check browser DevTools Console for error messages
3. Ensure you're using a local server, not opening files directly

### Browser Compatibility

Nautilus.CIM requires a modern browser with ES6+ support:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

If using an older browser, you may see JavaScript errors.

## Development Workflow

### Typical Development Session

1. Start local server:
   ```bash
   python -m http.server 8000
   ```
2. Open `http://localhost:8000` in browser
3. Make changes to HTML/CSS/JS files
4. Refresh browser to see changes (or use Live Server for auto-reload)
5. Press `Ctrl+C` in terminal to stop server when done

### Working with Multiple Pages

The application has multiple HTML entry points:
- `index.html` - Dashboard/home page
- `projects.html` - Project management
- `project-details.html` - Project details view
- `compare.html` - Profile comparison
- `profile-editor.html` - Visual profile editor

Navigate between them via:
- In-app navigation links
- Direct URL in browser (e.g., `http://localhost:8000/projects.html`)

### Debugging

1. **Browser DevTools Console**: 
   - Press `F12` to open DevTools
   - Check Console tab for JavaScript errors
   - Check Network tab for failed fetch requests

2. **Data Inspection**:
   - Open Console in DevTools
   - Access MemoryStore:
     ```javascript
     // In browser console after page loads
     window.MemoryStore  // View entire store
     window.MemoryStore.store.projects  // View projects array
     ```

3. **LocalStorage Inspection**:
   - DevTools → Application tab → Local Storage
   - View/edit stored UI state

## Production Deployment

While this guide focuses on local development, for production deployment:

### Static Hosting Options

The application can be deployed to any static hosting service:
- **GitHub Pages**: Free hosting for public repos
- **Netlify**: Free tier with easy deployment
- **Vercel**: Free tier with auto-deployment
- **AWS S3 + CloudFront**: Scalable cloud hosting
- **Any web server**: Apache, Nginx, IIS

### Deployment Steps (Generic)

1. Copy all repository files to hosting server
2. Ensure directory structure is preserved
3. Set root/index to `index.html`
4. No build step required - serve files as-is

### Important Notes

- Application is purely client-side - no backend needed
- All data is demo data from JSON files
- No database or API endpoints required
- User changes are NOT persisted (currently)

## Next Steps

After getting the app running:
- Read [`ARCHITECTURE.md`](ARCHITECTURE.md) to understand the code structure
- Review [`docs_DATA_STRUCTURES_Version5.md`](docs_DATA_STRUCTURES_Version5.md) for data contracts
- Check [`CONVENTIONS.md`](CONVENTIONS.md) for coding standards
- Explore [`PYTHON_SCRIPTS.md`](PYTHON_SCRIPTS.md) if working with data files

## Additional Resources

- [Python http.server documentation](https://docs.python.org/3/library/http.server.html)
- [Node.js http-server package](https://www.npmjs.com/package/http-server)
- [VS Code Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

---

**Key Takeaway**: Always use a local HTTP server - never open `index.html` directly in the browser.
