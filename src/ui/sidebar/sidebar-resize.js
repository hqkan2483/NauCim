const DEFAULTS = {
  sidebarId: "sidebar",
  resizeHandleId: "sidebar-resize-handle",
  minWidth: 150,
  maxWidth: 500,
  storageKeyWidth: "cim.sidebarWidth",
};

let resizeInitialized = false;
let isResizing = false;
let startX = 0;
let startWidth = 0;

function initSidebarResize(options = {}) {
  if (resizeInitialized) return;

  const cfg = { ...DEFAULTS, ...options };

  const resizeHandle = document.getElementById(cfg. resizeHandleId);
  if (!resizeHandle) {
    console.warn(`[sidebarResize] Handle #${cfg.resizeHandleId} not found`);
    return;
  }

  resizeHandle.addEventListener("mousedown", (e) => {
    // Ensure click is on handle itself
    if (e.target !== resizeHandle && !resizeHandle.contains(e.target)) {
      return;
    }

    isResizing = true;
    startX = e.clientX;
    startWidth = document.getElementById(cfg.sidebarId).offsetWidth;
    document.body.style.userSelect = "none";
    resizeHandle.style.backgroundColor = "var(--hover)";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const diff = e.clientX - startX;
    const newWidth = Math.max(cfg.minWidth, Math.min(cfg.maxWidth, startWidth + diff));

    const sidebar = document.getElementById(cfg.sidebarId);
    sidebar.style.width = newWidth + "px";
    localStorage.setItem(cfg.storageKeyWidth, newWidth);
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.userSelect = "";
      const resizeHandle = document.getElementById(cfg.resizeHandleId);
      if (resizeHandle) {
        resizeHandle.style.backgroundColor = "";
      }
    }
  });

  resizeInitialized = true;
}

export { initSidebarResize };
