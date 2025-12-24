import {
  getAllProjects,
  getProjectById,
  getCurrentProject,
  appDataInit,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/project-service.js";
import {
  initModalSystem,
  bindModalTriggers,
  openModal,
  closeModal,
} from "../../ui/modal.js";
import {
  getCurrentProjectId,
  setCurrentProjectId,
} from "../../state/current-project-state.js";
import {
  initSidebarResize,
  initSidebarToggle,
  restoreSidebarState,
  initProjectsTree,
  renderProjectsTree,
} from "../../ui/sidebar/index.js";

let editingProjectId = null;
let searchQuery = "";

// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize data
  await appDataInit();

  // 2. Initialize UI systems
  initModalSystem();
  bindModalTriggers(document);

  restoreSidebarState();
  initSidebarToggle();
  initSidebarResize();

  initProjectsTree({
    getProjects: getAllProjects,
    getCurrentProjectId: getCurrentProjectId,
    onProjectSelect: (projectId) => {
      selectProject(projectId);
    },
      onLabelClick: () => {
    // ✅ Клик по "📁 Проекты" — вернуть список проектов
    showProjectsList();
  },
  });
  // 3. Bind page-specific events
  bindEvents();

  // 4. Initial render
  renderProjectsList();
  updateCurrentProjectDisplay();
});

// ============================================================
// EVENT BINDINGS
// ============================================================
function bindEvents() {
  // Search
  const searchInput = document.getElementById("search-projects");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderProjectsList();
    });
  }

  // Create project
  const createBtn = document.getElementById("create-project-btn");
  if (createBtn) {
    createBtn.addEventListener("click", handleCreateProject);
  }

  // Save project edit
  const saveEditBtn = document.getElementById("save-project-edit-btn");
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", handleSaveProjectEdit);
  }

  // Open current project
  const openProjectBtn = document.getElementById("open-current-project-btn");
  if (openProjectBtn) {
    openProjectBtn.addEventListener("click", handleOpenCurrentProject);
  }

  // Delegated events on projects list (edit, delete, select)
  const projectsListEl = document.getElementById("projects-list");
  if (projectsListEl) {
    projectsListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      // Delete project
      const deleteBtn = target.closest("[data-action='delete-project']");
      if (deleteBtn) {
        const projectId = deleteBtn.getAttribute("data-project-id");
        if (projectId) handleDeleteProject(projectId);
        return;
      }

      // Edit project
      const editBtn = target.closest("[data-action='edit-project']");
      if (editBtn) {
        const projectId = editBtn.getAttribute("data-project-id");
        if (projectId) handleEditProject(projectId);
        return;
      }

      // Select project (click on card)
      const projectCard = target.closest(".project-card");
      if (projectCard) {
        const projectId = projectCard.getAttribute("data-project-id");
        if (projectId) selectProject(projectId);
      }
    });
  }
}

// ============================================================
// RENDER
// ============================================================
function renderProjectsList() {
  const container = document.getElementById("projects-list");
  if (!container) return;

  const projects = getAllProjects();
  const currentProjectId = getCurrentProjectId();

  // Filter
  const filtered = projects.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery) ||
      (p.description && p.description.toLowerCase().includes(searchQuery))
    );
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-data">Проекты не найдены</div>';
    return;
  }

  const html = filtered
    .map((p) => {
      const isActive = p.id === currentProjectId;
      return `
      <div class="project-card ${isActive ? "active" : ""}" data-project-id="${
        p.id
      }">
      <div class="project-card-content">
        <div class="project-card-header">
          <div class="project-card-title">${p.name}</div>
        </div>
        ${
          p.description
            ? `<div class="project-card-description">${p.description}</div>`
            : ""
        }
        <div class="project-card-meta">
        <div class="project-card-meta_item">
          <span>📌 Версия: ${p.version || "—"}</span>
          <span>📅 Создан: ${
            p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"
          }</span>
          </div>
        <div class="project-card-meta_item">
          <span>📋 Моделей: ${p.models ? p.models.length : 0}</span>
          <span>⚙️ Профилей: ${p.profiles ? p.profiles.length : 0}</span>
          </div>
        </div>

      </div>
      <div class="project-card-actions">
        <button class="btn btn-secondary btn-small" data-action="edit-project" data-project-id="${
          p.id
        }">✏️ Редактировать</button>
        <button class="btn btn-secondary btn-small" data-action="delete-project" data-project-id="${
          p.id
        }">🗑️ Удалить</button>

      </div>

    </div>
    `;
    })
    .join("");

  container.innerHTML = html;
}

function updateCurrentProjectDisplay() {
  const currentProjectEl = document.getElementById("current-project");
  if (!currentProjectEl) return;

  const project = getCurrentProject();
  if (project) {
    currentProjectEl.textContent = project.name;
    currentProjectEl.style.color = "rgba(255, 255, 255, 0.95)";
  } else {
    currentProjectEl.textContent = "Нет проекта";
    currentProjectEl.style.color = "rgba(255, 255, 255, 0.7)";
  }
}

// скрывает список проектов показывает детали конкретного проекта
function selectProject(projectId) {
  setCurrentProjectId(projectId);

  // Re-render to highlight selected
  renderProjectsList();
  updateCurrentProjectDisplay();

  // Re-render tree to update active state
  renderProjectsTree();

    // ✅ ДОБАВИТЬ:  скрыть список проектов
  hideProjectsList();

  // Show project details (models/profiles)
  showProjectDetails(projectId);

  // Show "Open project" button
  const openProjectAction = document.getElementById("open-project-action");
  if (openProjectAction) {
    openProjectAction.classList.remove("hidden");
  }
}

function showProjectDetails(projectId) {
  const project = getProjectById(projectId);
  if (!project) return;

  // Show models
  const modelsContainer = document.getElementById("models-container");
  const modelsList = document.getElementById("models-list");
  if (modelsContainer && modelsList) {
    modelsContainer.classList.remove("hidden");

    if (project.models && project.models.length > 0) {
      const html = project.models
        .map(
          (m) => `
        <div class="list-item">
          <div class="list-item-title"><span>📦</span><span>${m.name || "Модель без названия"}</span></div>
          
        </div>
      `
        )
        .join("");
      modelsList.innerHTML = html;
    } else {
      modelsList.innerHTML = '<div class="no-data">Нет моделей</div>';
    }
  }

  // Show profiles
  const profilesContainer = document.getElementById("profiles-container");
  const profilesList = document.getElementById("profiles-list");
  if (profilesContainer && profilesList) {
    profilesContainer.classList.remove("hidden");

    if (project.profiles && project.profiles.length > 0) {
      const html = project.profiles
        .map(
          (pr) => `
        <div class="list-item">
          <div class="list-item-title"><span>📦</span><span>${
            pr.name || "Профиль без названия"
          }</span></div>

        </div>
      `
        )
        .join("");
      profilesList.innerHTML = html;
    } else {
      profilesList.innerHTML = '<div class="no-data">Нет профилей</div>';
    }
  }
}

function showProjectsList() {
  // ✅ Показать список проектов
  const projectsListContainer = document.getElementById("projects-list");
  if (projectsListContainer) {
    projectsListContainer.classList. remove("hidden");
  }

  // Скрыть детали
  const modelsContainer = document.getElementById("models-container");
  const profilesContainer = document.getElementById("profiles-container");
  const openProjectAction = document.getElementById("open-project-action");

  if (modelsContainer) modelsContainer.classList.add("hidden");
  if (profilesContainer) profilesContainer.classList.add("hidden");
  if (openProjectAction) openProjectAction.classList.add("hidden");
}

function hideProjectsList() {
  const projectsListContainer = document.getElementById("projects-list");
  if (projectsListContainer) {
    projectsListContainer.classList.add("hidden");
  }
}

// ============================================================
// CRUD HANDLERS
// ============================================================
function handleCreateProject() {
  const nameInput = document.getElementById("project-name");
  const descInput = document.getElementById("project-desc");
  const versionInput = document.getElementById("project-version");

  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) {
    alert("Введите название проекта");
    return;
  }

  const payload = {
    name,
    description: descInput ? descInput.value.trim() : "",
    version: versionInput ? versionInput.value.trim() : "1.0",
  };

  const newProject = createProject(payload);

  if (newProject) {
    // Clear form
    nameInput.value = "";
    if (descInput) descInput.value = "";
    if (versionInput) versionInput.value = "1.0";

    // Close modal
    const modal = document.getElementById("new-project-modal");
    if (modal) closeModal(modal);

    // Re-render
    renderProjectsList();
    renderProjectsTree();

    // Select new project
    selectProject(newProject.id);
  }
}

function handleEditProject(projectId) {
  const project = getProjectById(projectId);
  if (!project) return;

  // Fill modal
  const nameInput = document.getElementById("edit-project-name");
  const descInput = document.getElementById("edit-project-desc");
  const versionInput = document.getElementById("edit-project-version");

  if (nameInput) nameInput.value = project.name;
  if (descInput) descInput.value = project.description || "";
  if (versionInput) versionInput.value = project.version || "1.0";

  editingProjectId = projectId;

  // Open modal
  const modal = document.getElementById("edit-project-modal");
  if (modal) openModal(modal);
}

function handleSaveProjectEdit() {
  if (!editingProjectId) return;

  const nameInput = document.getElementById("edit-project-name");
  const descInput = document.getElementById("edit-project-desc");
  const versionInput = document.getElementById("edit-project-version");

  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) {
    alert("Введите название проекта");
    return;
  }

  const updates = {
    name,
    description: descInput ? descInput.value.trim() : "",
    version: versionInput ? versionInput.value.trim() : "1.0",
  };

  const updated = updateProject(editingProjectId, updates);

  if (updated) {
    // Close modal
    const modal = document.getElementById("edit-project-modal");
    if (modal) closeModal(modal);

    editingProjectId = null;

    // Re-render
    renderProjectsList();
    renderProjectsTree();
    updateCurrentProjectDisplay();
  }
}

function handleDeleteProject(projectId) {
  const project = getProjectById(projectId);
  if (!project) return;

  const confirmed = confirm(`Удалить проект "${project.name}"?`);
  if (!confirmed) return;

  deleteProject(projectId);

  // Re-render
  renderProjectsList();
  renderProjectsTree();
  updateCurrentProjectDisplay();

  // Hide details if deleted project was selected
  if (getCurrentProjectId() === projectId) {
    showProjectsList();
  }
}

function handleOpenCurrentProject() {
  const currentProjectId = getCurrentProjectId();
  if (!currentProjectId) {
    alert("Не выбран текущий проект");
    return;
  }

  window.location.href = `project-details.html?id=${currentProjectId}`;
}
console.log("Projects Page Module Loaded");
