export { initSidebarResize } from "./sidebar-resize.js";
export { initSidebarToggle, restoreSidebarState } from "./sidebar-toggle.js";
export { initProjectsTree, renderProjectsTree, toggleProjectsTree } from "./project-tree.js";

/**
 * All-in-one init for sidebar (toggle + resize + restore state).
 * Projects tree is initialized separately (page-specific).
 */
export function initSidebar(options = {}) {
  restoreSidebarState(options);
  initSidebarToggle(options);
  initSidebarResize(options);
}
