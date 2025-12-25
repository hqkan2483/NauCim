import { getAllProjects, appDataInit } from "../../services/project-service.js";
import { getCurrentProjectId, setCurrentProjectId } from "../../state/current-project-state.js";
import { initModalSystem, bindModalTriggers } from "../../ui/modal.js";
import { loadModals } from "../../ui/modal-loader.js"; // ✅ Импорт
import { initSidebarResize, initSidebarToggle, restoreSidebarState } from "../../ui/sidebar/index.js";
import { renderProjectCard, renderSimpleAction } from "../../ui/renderers/project-card.js";
import { initProjectModal, clearNewProjectModal } from "../../ui/components/project-modal.js";

// ============================================================
// STATE
// ============================================================
const RECENT_PROJECTS_COUNT = 3;

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize data
  await appDataInit();

  // 2. ✅ Load modals
  await loadModals(["new-project-modal"]);

  // 3. Initialize UI systems
  initModalSystem();
  bindModalTriggers(document);

  restoreSidebarState();
  initSidebarToggle();
  initSidebarResize();

  // 4. Initialize project modal
  initProjectModal({
    onCreate: handleProjectCreated,
    onUpdate: null, // Not used on index page
  });

  // 5. Bind page-specific events
  bindEvents();

  // 6. Initial render
  renderDashboard();
  updateCurrentProjectDisplay();
});

// ============================================================
// EVENT BINDINGS
// ============================================================
function bindEvents() {
  // Refresh button
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      location.reload();
    });
  }

  // Go to projects button
  const goToProjectsBtn = document.getElementById("go-to-projects-btn");
  if (goToProjectsBtn) {
    goToProjectsBtn.addEventListener("click", () => {
      window.location.href = "projects.html";
    });
  }

  // Clear modal form on open
  document.addEventListener("modal:beforeopen", (e) => {
    if (e.detail.modalId === "new-project-modal") {
      clearNewProjectModal();
    }
  });

  // Delegated events on recent projects
  const recentProjectsEl = document.getElementById("recent-projects");
  if (recentProjectsEl) {
    recentProjectsEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (! target) return;

      // Open project details
      const openBtn = target.closest("[data-action='open-project-details']");
      if (openBtn) {
        const projectId = openBtn.getAttribute("data-project-id");
        if (projectId) handleOpenProject(projectId);
        return;
      }

      // Select project (click on title)
      const selectEl = target.closest("[data-action='select-project']");
      if (selectEl) {
        const projectId = selectEl.getAttribute("data-project-id");
        if (projectId) handleSelectProject(projectId);
      }
    });
  }
}

// ============================================================
// RENDER
// ============================================================
function renderDashboard() {
  renderRecentProjects();
}

function renderRecentProjects() {
  const container = document.getElementById("recent-projects");
  if (!container) return;

  const projects = getAllProjects();
  const recent = projects.slice(0, RECENT_PROJECTS_COUNT);
  const currentProjectId = getCurrentProjectId();

  if (recent.length === 0) {
    container.innerHTML = '<div class="no-data">Нет проектов.  Создайте первый проект!</div>';
    return;
  }

  const html = recent
    .map((p) =>
      renderProjectCard(p, {
        showActions: true,
        showDescription: true,
        showMeta: true,
        showStats: false, // На главной не показываем статистику моделей/профилей
        currentProjectId:  currentProjectId,
        cardClickAction: "select",
        actionsTemplate: renderSimpleAction(p),
      })
    )
    .join("");

  container.innerHTML = html;
}

function updateCurrentProjectDisplay() {
  const currentProjectEl = document.getElementById("current-project");
  if (!currentProjectEl) return;

  const projectId = getCurrentProjectId();
  if (projectId) {
    const project = getAllProjects().find((p) => p.id === projectId);
    if (project) {
      currentProjectEl.textContent = project.name;
      currentProjectEl.style.color = "rgba(255, 255, 255, 0.95)";
      return;
    }
  }

  currentProjectEl.textContent = "Нет проекта";
  currentProjectEl.style.color = "rgba(255, 255, 255, 0.7)";
}

// ============================================================
// HANDLERS
// ============================================================
function handleSelectProject(projectId) {
  setCurrentProjectId(projectId);
  updateCurrentProjectDisplay();
  renderRecentProjects();
}

function handleOpenProject(projectId) {
  setCurrentProjectId(projectId);
  window.location.href = `project-details.html?id=${projectId}`;
}

function handleProjectCreated(newProject) {
  // Re-render recent projects
  renderRecentProjects();

  // Select new project
  handleSelectProject(newProject.id);
}

console.log("Index Page Module Loaded");

