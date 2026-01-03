const DEFAULTS = {
  sidebarId: "sidebar",
  toggleBtnSelector: ".sidebar__toggle",
  collapsedClass: "collapsed",
  openClass: "sidebar-open",
  defaultWidth: 250,
  storageKeyWidth: "cim.sidebarWidth",
  storageKeyCollapsed: "cim.sidebarCollapsed",
};

let toggleInitialized = false;
let savedSidebarWidth = null;

function initSidebarToggle(options = {}) {
  if (toggleInitialized) return;

  const cfg = { ...DEFAULTS, ...options };

  const toggleBtn = document.querySelector(cfg.toggleBtnSelector);
  if (!toggleBtn) {
    console.warn(`[sidebarToggle] Button "${cfg.toggleBtnSelector}" not found`);
    return;
  }

  toggleBtn.addEventListener("click", () => toggleSidebar(cfg));
  toggleInitialized = true;
}

function toggleSidebar(cfg) {
  const sidebar = document.getElementById(cfg.sidebarId);
  const toggleBtn = document.querySelector(cfg. toggleBtnSelector);
  if (!sidebar || !toggleBtn) return;

  const isCurrentlyCollapsed = sidebar.classList.contains(cfg.collapsedClass);

  if (isCurrentlyCollapsed) {
    // Expand
    const width = savedSidebarWidth || localStorage.getItem(cfg.storageKeyWidth) || cfg.defaultWidth;
    sidebar.style.width = width + "px";
    sidebar.classList.remove(cfg.collapsedClass);
    toggleBtn.classList.add(cfg.openClass);
  } else {
    // Collapse
    const currentWidth = sidebar.offsetWidth || localStorage.getItem(cfg.storageKeyWidth) || cfg.defaultWidth;
    savedSidebarWidth = currentWidth;
    sidebar.style.width = "0px";
    sidebar.classList. add(cfg.collapsedClass);
    toggleBtn.classList. remove(cfg.openClass);
  }

  // Save collapsed state
  const isCollapsed = sidebar.classList.contains(cfg.collapsedClass);
  localStorage.setItem(cfg.storageKeyCollapsed, isCollapsed);
}

function restoreSidebarState(options = {}) {
  const cfg = { ... DEFAULTS, ...options };

  const sidebar = document.getElementById(cfg.sidebarId);
  const toggleBtn = document.querySelector(cfg.toggleBtnSelector);
  if (!sidebar || !toggleBtn) return;

  const isCollapsed = localStorage.getItem(cfg.storageKeyCollapsed) === "true";
  const savedWidth = localStorage.getItem(cfg.storageKeyWidth) || cfg.defaultWidth;

  savedSidebarWidth = savedWidth;

  if (isCollapsed) {
    sidebar.classList.add(cfg.collapsedClass);
    toggleBtn.classList.remove(cfg.openClass);
    sidebar.style.width = "0px";
  } else {
    sidebar.classList.remove(cfg.collapsedClass);
    toggleBtn.classList.add(cfg.openClass);
    sidebar.style.width = savedWidth + "px";
  }
}

export { initSidebarToggle, restoreSidebarState };
