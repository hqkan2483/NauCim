import { renderProjectsSidebarTree } from "../renderers/projects-sidebar-tree-renderer.js";
import { TREE_STORAGE_KEYS } from "../trees/tree-storage-keys.js";

 const DEFAULTS = {
  containerSelector: "#projects-tree-container",
  listSelector: "#projects-list-tree",
  toggleBtnSelector: ".nav-tree-toggle",
  storageKeyExpanded: TREE_STORAGE_KEYS.projectsTreeExpanded,
  storageKeyExpandedProjects: TREE_STORAGE_KEYS.expandedProjects,
  collapsedClass: "nav-tree-collapsed",
  // Callbacks (must be provided by page)
  getProjects: () => [],
  getCurrentProjectId: () => null,
  onProjectSelect: null, // (projectId) => void
  onModelSelect: null, // (projectId, modelId) => void
  onProfileSelect: null, // (projectId, profileId) => void
  onProjectExpand: null, // (projectId, isExpanded) => void
  onLabelClick: null, //
};

let treeConfig = null;
let eventsInitialized = false;

/**
 * Initialize projects tree in sidebar.
 * @param {object} options - Configuration and callbacks
 */
function initProjectsTree(options = {}) {
  treeConfig = { ... DEFAULTS, ...options };

  const toggleBtn = document.querySelector(treeConfig.toggleBtnSelector);
  if (!toggleBtn) {
    console.warn(`[projectsTree] Toggle button "${treeConfig.toggleBtnSelector}" not found`);
    return;
  }

  // ✅ Bind toggle button (только иконка)
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // останавливаем всплытие
    toggleProjectsTree();
  });

  // ✅ Bind label (корень дерева)
  const labelEl = document.querySelector(".nav-tree-label");
  if (labelEl && treeConfig.onLabelClick) {
    labelEl.addEventListener("click", () => {
      treeConfig.onLabelClick();
    });
  }

  // Bind events (delegated)
  bindProjectTreeEvents();

  // Restore tree state
  restoreProjectsTreeState().catch(err => {
    console.error("[projectsTree] Failed to restore state:", err);
  });
}

async function toggleProjectsTree() {
  if (!treeConfig) return;

  const container = document.querySelector(treeConfig.containerSelector);
  const button = document.querySelector(treeConfig.toggleBtnSelector);
  if (!container || !button) return;

  const isExpanded = button.getAttribute("aria-expanded") === "true";

  if (isExpanded) {
    // Collapse
    container.classList.add(treeConfig.collapsedClass);
    button.setAttribute("aria-expanded", "false");
    localStorage.setItem(treeConfig.storageKeyExpanded, "false");
  } else {
    // Expand
    container.classList.remove(treeConfig.collapsedClass);
    button.setAttribute("aria-expanded", "true");
    localStorage.setItem(treeConfig.storageKeyExpanded, "true");
    await renderProjectsTree();
  }
}

async function restoreProjectsTreeState() {
  if (!treeConfig) return;

  const container = document.querySelector(treeConfig.containerSelector);
  const button = document.querySelector(treeConfig.toggleBtnSelector);
  if (!container || !button) return;

  const isExpanded = localStorage.getItem(treeConfig.storageKeyExpanded) === "true";

  if (isExpanded) {
    container.classList.remove(treeConfig.collapsedClass);
    button.setAttribute("aria-expanded", "true");
    await renderProjectsTree();
  } else {
    container.classList.add(treeConfig.collapsedClass);
    button.setAttribute("aria-expanded", "false");
  }
}

async function renderProjectsTree() {
  if (!treeConfig) return;

  const projectsList = document.querySelector(treeConfig.listSelector);
  if (!projectsList) return;

  const projectsResult = treeConfig.getProjects();
  // Handle both sync and async getProjects
  const projects = projectsResult instanceof Promise ? await projectsResult : projectsResult;
  const currentProjectId = treeConfig.getCurrentProjectId ?  treeConfig.getCurrentProjectId() : null;
  const expandedProjects = JSON.parse(localStorage.getItem(treeConfig.storageKeyExpandedProjects) || "{}");

  projectsList.innerHTML = renderProjectsSidebarTree(projects, {
    currentProjectId,
    expandedProjects,
  });

}

function bindProjectTreeEvents() {
  if (!treeConfig || eventsInitialized) return;

  const projectsList = document.querySelector(treeConfig.listSelector);
  if (!projectsList) return;

  // ✅ Навешиваем обработчик ОДИН РАЗ на родительский элемент
  projectsList.addEventListener("click", (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (!target) return;

    // Expand/collapse project structure
    const expandBtn = target.closest("[data-action='toggle-project']");
    if (expandBtn) {
      const projectId = expandBtn.getAttribute("data-project-id");
      if (projectId) {
        toggleProjectStructure(projectId);
        e.stopPropagation();
      }
      return;
    }

    // Select project
    const selectEl = target.closest("[data-action='select-project']");
    if (selectEl) {
      const projectId = selectEl.getAttribute("data-project-id");
      if (projectId && treeConfig.onProjectSelect) {
        treeConfig.onProjectSelect(projectId);
        e.stopPropagation();
      }
      return;
    }

    // Select model inside project tree
    const selectModelEl = target.closest("[data-action='select-model']");
    if (selectModelEl) {
      const projectId = selectModelEl.getAttribute("data-project-id");
      const modelId = selectModelEl.getAttribute("data-model-id");
      if (projectId && modelId && treeConfig.onModelSelect) {
        treeConfig.onModelSelect(projectId, modelId);
        e.stopPropagation();
      }
      return;
    }

    // Select profile inside project tree
    const selectProfileEl = target.closest("[data-action='select-profile']");
    if (selectProfileEl) {
      const projectId = selectProfileEl.getAttribute("data-project-id");
      const profileId = selectProfileEl.getAttribute("data-profile-id");
      if (projectId && profileId && treeConfig.onProfileSelect) {
        treeConfig.onProfileSelect(projectId, profileId);
        e.stopPropagation();
      }
      return;
    }
  });

  eventsInitialized = true;
}

async function toggleProjectStructure(projectId) {
  if (!treeConfig) return;

  const expandedProjects = JSON.parse(localStorage.getItem(treeConfig.storageKeyExpandedProjects) || "{}");

  const wasExpanded = !!expandedProjects[projectId];

  if (wasExpanded) {
    delete expandedProjects[projectId];
  } else {
    expandedProjects[projectId] = true;
  }

  localStorage.setItem(treeConfig.storageKeyExpandedProjects, JSON.stringify(expandedProjects));

  if (treeConfig.onProjectExpand) {
    treeConfig.onProjectExpand(projectId, !wasExpanded);
  }

  await renderProjectsTree();
}

export { initProjectsTree, renderProjectsTree, toggleProjectsTree };
