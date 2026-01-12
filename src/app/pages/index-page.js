import { getAllProjects, appDataInit, getProjectById } from "../../services/project-service.js";
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
      // Получаем актуальный список проектов
      handleRefreshBtn();
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
const currentProjectEl = document.getElementById("current-project-card");
  if (currentProjectEl) {
    currentProjectEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (! target) return;

      // Open project details
      const openBtn = target.closest("[data-action='open-project-details']");
      if (openBtn) {
        const projectId = openBtn.getAttribute("data-project-id");
        if (projectId) handleOpenProject(projectId);
        return;
      }

    });
  }
}

// ============================================================
// RENDER
// ============================================================
function renderDashboard() {
  renderCurrentProject();
  renderRecentProjects();
}

function renderRecentProjects() {
  const container = document.getElementById("recent-projects");
  if (!container) return;

  const projects = getAllProjects();
  // Сортируем по modifyDate (самые новые сначала) и берем первые 3
  const recent = projects
    .sort((a, b) => {
      // Обработка случая, когда modifyDate не задана (считаем ее очень древней)
      const aDate = a.modifyDate ? new Date(a.modifyDate) : new Date(0);
      const bDate = b.modifyDate ? new Date(b.modifyDate) : new Date(0);
      return bDate - aDate;
    })
    .slice(0, RECENT_PROJECTS_COUNT);
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
        compact: true,
      })
    )
    .join("");

  container.innerHTML = html;
}

function renderCurrentProject() {
  const container = document.getElementById("current-project-card");
  if (!container) return;
  const currentProjectId = getCurrentProjectId();
  const project = currentProjectId ? getProjectById(currentProjectId): null;
  if (project) {
    container.innerHTML = renderProjectCard(project, {
        showActions: true,
        showDescription: true,
        showMeta: true,
        showStats: false, // На главной не показываем статистику моделей/профилей
        currentProjectId:  currentProjectId,
        cardClickAction: "select",
        actionsTemplate: renderSimpleAction(project),
        compact: true,
    });
  } else {
    container.innerHTML = '<div class="no-data">Нет проектов. </div>';
  }
}

function updateCurrentProjectDisplay() {
  const currentProjectEl = document.getElementById("current-project");
  if (!currentProjectEl) return;

  const projectId = getCurrentProjectId();
  const project = projectId ? getAllProjects().find((p) => p.id === projectId) : null;

  if (project) {
    currentProjectEl.classList.remove("sidebar__section-info");
    currentProjectEl.classList.add("sidebar__section-data");
    currentProjectEl.innerHTML = `<span>${project.name}</span>`;
    return;
  }

  currentProjectEl.classList.remove("sidebar__section-data");
  currentProjectEl.classList.add("sidebar__section-info");
  currentProjectEl.innerHTML = `<span>Нет проекта</span>`;
}

// ============================================================
// HANDLERS
// ============================================================
function handleSelectProject(projectId) {
  setCurrentProjectId(projectId);
  updateCurrentProjectDisplay();
  renderCurrentProject();
  renderRecentProjects();
}

function handleOpenProject(projectId) {
  setCurrentProjectId(projectId);
  window.location.href = `project-details.html?id=${projectId}`;
}

function handleProjectCreated(newProject) {
  // Re-render recent projects
  renderCurrentProject();
  renderRecentProjects();

  // Select new project
  handleSelectProject(newProject.id);

}

function handleRefreshBtn() {
      let projects =  getAllProjects();
      // Сортируем: если modifyDate отсутствует, считаем её очень старой (в конец)
      projects = projects.slice().sort((a, b) => {
        const getTimestamp = (proj) =>
          proj.modifyDate ? new Date(proj.modifyDate).getTime() : -Infinity;
        return getTimestamp(b) - getTimestamp(a);
      });
      // Обновляем отображение недавних проектов (используем тот же RECENT_PROJECTS_COUNT)
      renderCurrentProject();
      renderRecentProjects(projects);

      // Обновляем информацию о текущем проекте
      updateCurrentProjectDisplay();
}


console.log("Index Page Module Loaded");

