/**
 * Modal Loader - Dynamically load modal HTML templates
 */

const MODAL_TEMPLATES_PATH = "./src/ui/templates/modals/";

/**
 * Load modal HTML from template file
 * @param {string} modalName - Name of the modal (e.g., 'new-project-modal')
 * @returns {Promise<boolean>} - true if loaded successfully
 */
export async function loadModal(modalName) {
  try {
    // NOTE: Some dev servers (notably VS Code Live Server) inject live-reload snippets into HTML.
    // When they cache the transformed response, they can sometimes serve a stale/incomplete version
    // even after the underlying file changes. A cache-busting query keeps template loading reliable.
    const templateUrl = new URL(`${MODAL_TEMPLATES_PATH}${modalName}.html`, window.location.href);
    templateUrl.searchParams.set("_", Date.now().toString(36));

    const response = await fetch(templateUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`❌ Failed to load modal:  ${modalName} (${response.status})`);
      return false;
    }

    let html = await response.text();

    // VS Code Live Server injects a live-reload <script> into served HTML.
    // When modal templates contain SVG (or other sensitive fragments), that injection can corrupt
    // the markup and even truncate the response. Strip the injected block defensively.
    html = String(html || "").replace(
      /<!--\s*Code injected by live-server\s*-->[\s\S]*?<\/script>\s*/gi,
      ""
    );

    // Parse modal HTML template
    const tpl = document.createElement("template");
    tpl.innerHTML = String(html || "").trim();

    // Prefer the element whose id matches modalName (our convention)
    const modalElementById = tpl.content.querySelector(`#${CSS.escape(modalName)}`);
    const modalElement = modalElementById || tpl.content.firstElementChild;
    if (!modalElement) {
      console.error(`❌ Invalid modal HTML: ${modalName}`);
      return false;
    }

    // If parsing produced multiple top-level nodes, don't silently drop them.
    // This can happen when the template markup is malformed; we try to keep everything inside the modal.
    const topLevelEls = Array.from(tpl.content.children);
    // Only attempt to merge when we *didn't* find a modal element by id.
    // Full-document templates (<html><head><body>...) can yield multiple roots in fragment parsing;
    // merging those would incorrectly append <head>/<body> into the modal DOM.
    if (!modalElementById && topLevelEls.length > 1) {
      console.warn(
        `⚠️ Modal template ${modalName} produced ${topLevelEls.length} root elements. ` +
          `This usually indicates malformed HTML; attempting to merge extra nodes into the modal.`
      );

      const contentHost = modalElement.querySelector(".modal-content") || modalElement;
      for (const el of topLevelEls) {
        if (el === modalElement) continue;
        contentHost.appendChild(el);
      }
    }

    // Check if modal already exists
    const existingModal = document.getElementById(modalElement.id);
    if (existingModal) {
      existingModal.replaceWith(modalElement);
      return true;
    }

    document.body.appendChild(modalElement);
    return true;
  } catch (error) {
    console.error(`❌ Error loading modal ${modalName}:`, error);
    return false;
  }
}

/**
 * Load multiple modals
 * @param {string[]} modalNames - Array of modal names
 * @returns {Promise<boolean>} - true if all loaded successfully
 */
export async function loadModals(modalNames) {
  const promises = modalNames.map((name) => loadModal(name));
  const results = await Promise.all(promises);
  return results.every((result) => result === true);
}
