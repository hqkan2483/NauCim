 const DEFAULTS = {
  containerSelector: "#projects-tree-container",
  listSelector: "#projects-list-tree",
  toggleBtnSelector: ".nav-tree-toggle",
  storageKeyExpanded: "cim.projectsTreeExpanded",
  storageKeyExpandedProjects: "cim.expandedProjects",
  collapsedClass: "nav-tree-collapsed",
  // Callbacks (must be provided by page)
  getProjects: () => [],
  getCurrentProjectId: () => null,
  onProjectSelect: null, // (projectId) => void
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
      treeConfig. onLabelClick();
    });
  }

  // Bind events (delegated)
  bindProjectTreeEvents();

  // Restore tree state
  restoreProjectsTreeState();
}

function toggleProjectsTree() {
  if (!treeConfig) return;

  const container = document.querySelector(treeConfig.containerSelector);
  const button = document.querySelector(treeConfig.toggleBtnSelector);
  if (!container || !button) return;

  const isExpanded = button.getAttribute("aria-expanded") === "true";

  if (isExpanded) {
    // Collapse
    container.classList.add(treeConfig.collapsedClass);
    button.setAttribute("aria-expanded", "false");
    localStorage.setItem(treeConfig. storageKeyExpanded, "false");
  } else {
    // Expand
    container.classList.remove(treeConfig.collapsedClass);
    button.setAttribute("aria-expanded", "true");
    localStorage.setItem(treeConfig.storageKeyExpanded, "true");
    renderProjectsTree();
  }
}

function restoreProjectsTreeState() {
  if (!treeConfig) return;

  const container = document.querySelector(treeConfig.containerSelector);
  const button = document.querySelector(treeConfig.toggleBtnSelector);
  if (!container || ! button) return;

  const isExpanded = localStorage.getItem(treeConfig. storageKeyExpanded) === "true";

  if (isExpanded) {
    container.classList.remove(treeConfig.collapsedClass);
    button.setAttribute("aria-expanded", "true");
    renderProjectsTree();
  } else {
    container.classList. add(treeConfig.collapsedClass);
    button.setAttribute("aria-expanded", "false");
  }
}

function renderProjectsTree() {
  if (!treeConfig) return;

  const projectsList = document.querySelector(treeConfig.listSelector);
  if (!projectsList) return;

  const projects = treeConfig.getProjects();
  const currentProjectId = treeConfig.getCurrentProjectId ?  treeConfig.getCurrentProjectId() : null;
  const expandedProjects = JSON.parse(localStorage.getItem(treeConfig.storageKeyExpandedProjects) || "{}");

  if (! projects || projects.length === 0) {
    projectsList.innerHTML = '<div class="nav-tree-item-link no-projects-tree">Нет проектов</div>';
    return;
  }

  const html = projects
    . map((p) => {
      const isExpanded = expandedProjects[p.id];
      const isCurrentProject = currentProjectId === p.id;

      return `
      <div class="project-tree-item">
        <div class="project-tree-header ${isCurrentProject ? "active" : ""}">
          <button class="project-expand-btn"
                  data-project-id="${p.id}"
                  data-action="expand"
                  aria-expanded="${isExpanded ?  "true" : "false"}">
            <span class="expand-icon">${isExpanded ? "▼" : "▶"}</span>
          </button>
          <span class="project-name"
                data-project-id="${p.id}"
                data-action="select"
                title="${p.name}">
            📦 ${p.name}
          </span>
        </div>
        ${
          isExpanded
            ? `
          <div class="project-structure">
            ${
              p.models && p.models.length > 0
                ? `
              <div class="structure-section">
                <div class="structure-title">📋 Модели (${p.models.length})</div>
                <div class="structure-items">
                  ${p.models.map((m) => `<div class="structure-item" data-id="${m.id || ""}">🔷 ${m.name || "Модель без названия"}</div>`).join("")}
                </div>
              </div>
            `
                : ""
            }
            ${
              p.profiles && p.profiles.length > 0
                ? `
              <div class="structure-section">
                <div class="structure-title">⚙️ Профили (${p.profiles.length})</div>
                <div class="structure-items">
                  ${p.profiles.map((pr) => `<div class="structure-item" data-id="${pr.id || ""}">⚡ ${pr.name || "Профиль без названия"}</div>`).join("")}
                </div>
              </div>
            `
                : ""
            }
            ${(! p.models || p.models. length === 0) && (! p.profiles || p.profiles. length === 0) ? `<div class="structure-empty">Нет моделей и профилей</div>` : ""}
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");

  projectsList.innerHTML = html;

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
    const expandBtn = target. closest("[data-action='expand']");
    if (expandBtn) {
      const projectId = expandBtn. getAttribute("data-project-id");
      if (projectId) {
        toggleProjectStructure(projectId);
        e.stopPropagation();
      }
      return;
    }

    // Select project
    const selectEl = target.closest("[data-action='select']");
    if (selectEl) {
      const projectId = selectEl.getAttribute("data-project-id");
      if (projectId && treeConfig. onProjectSelect) {
        treeConfig.onProjectSelect(projectId);
        e.stopPropagation();
      }
    }
  });

  eventsInitialized = true;
}

function toggleProjectStructure(projectId) {
  if (!treeConfig) return;

  const expandedProjects = JSON.parse(localStorage.getItem(treeConfig. storageKeyExpandedProjects) || "{}");

  const wasExpanded = !!expandedProjects[projectId];

  if (wasExpanded) {
    delete expandedProjects[projectId];
  } else {
    expandedProjects[projectId] = true;
  }

  localStorage.setItem(treeConfig. storageKeyExpandedProjects, JSON.stringify(expandedProjects));

  if (treeConfig.onProjectExpand) {
    treeConfig.onProjectExpand(projectId, ! wasExpanded);
  }

  renderProjectsTree();
}

export { initProjectsTree, renderProjectsTree, toggleProjectsTree };
