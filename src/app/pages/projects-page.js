import {
  getAllProjects,
  getProjectById,
  getCurrentProject,
  appDataInit,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/project-service.js";
import { getCurrentProjectId, setCurrentProjectId } from "../../state/current-project-state.js";
import { initModalSystem, bindModalTriggers, openModal, closeModal } from "../../ui/modal.js";
import { loadModals } from "../../ui/modal-loader.js";
import { initSidebarResize, initSidebarToggle, restoreSidebarState } from "../../ui/sidebar/index.js";
import { initProjectsTree, renderProjectsTree } from "../../ui/sidebar/index.js";
import { getModels, getModel } from "../../services/model-service.js";
import { getProfiles, getProfile } from "../../services/profile-service.js";
import { renderProjectCard } from "../../ui/renderers/project-card.js";
import { initProjectModal, clearNewProjectModal, openEditProjectModal } from "../../ui/components/project-modal.js";
import { renderModelDetails } from "../../ui/renderers/model-details-renderer.js";
import { renderProfileDetails } from "../../ui/renderers/profile-details-renderer.js";

// ============================================================
// STATE
// ============================================================
let editingProjectId = null;
let selectedModelId = null;
let selectedProfileId = null;
let searchQuery = "";

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize data
  await appDataInit();

  // 2. Load modals
  await loadModals(["new-project-modal", "edit-project-modal"]);

  // 3. Initialize UI systems
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
      showProjectsList();
    },
  });

  // Initialize project modal
  initProjectModal({
    onCreate: async (newProject) => {
      await renderProjectsList();
      await renderProjectsTree();
      await selectProject(newProject.id);
    },
    onUpdate: async () => {
      await renderProjectsList();
      await renderProjectsTree();
      await updateCurrentProjectDisplay();
    },
  });

  // 4. Bind page-specific events
  bindEvents();

  // 5. Initial render
  await renderProjectsList();
  await updateCurrentProjectDisplay();
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

  // Open current project
  const openProjectBtn = document.getElementById("open-current-project-btn");
  if (openProjectBtn) {
    openProjectBtn.addEventListener("click", handleOpenCurrentProject);
  }

  // Back to projects list
  const backBtn = document.getElementById("back-to-projects-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showProjectsList();
    });
  }

  // Clear modal forms on open
  document.addEventListener("modal:beforeopen", (e) => {
    const modalId = e.detail.modalId;

    if (modalId === "new-project-modal") {
      clearNewProjectModal();
    }
  });

  // Delegated events on projects list (open, edit, delete, select)
  const projectsListEl = document.getElementById("projects-list");
  if (projectsListEl) {
    projectsListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (! target) return;

      // Open project details page
      const openBtn = target.closest("[data-action='open-project-details']");
      if (openBtn) {
        const projectId = openBtn.getAttribute("data-project-id");
        if (projectId) {
          window.location.href = `project-details.html?id=${projectId}`;
        }
        return;
      }

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

      // Select project (click on title)
      const selectEl = target.closest("[data-action='select-project']");
      if (selectEl) {
        const projectId = selectEl.getAttribute("data-project-id");
        if (projectId) selectProject(projectId);
        return;
      }
    });
  }

 // Delegated events on models list (select)
const modelsListEl = document.getElementById("models-list");
if (modelsListEl) {
  modelsListEl.addEventListener("click", (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (! target) return;

    // ✅ Упрощаем:  клик на любой .list-item
    const selectEl = target.closest(".list-item");
    if (selectEl) {
      const modelId = selectEl.getAttribute("data-model-id");
      if (modelId) selectModel(modelId);
    }
  });
}

// Delegated events on profiles list (select)
const profilesListEl = document.getElementById("profiles-list");
if (profilesListEl) {
  profilesListEl.addEventListener("click", (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (!target) return;

    // ✅ Упрощаем: клик на любой .list-item
    const selectEl = target.closest(".list-item");
    if (selectEl) {
      const profileId = selectEl.getAttribute("data-profile-id");
      if (profileId) selectProfile(profileId);
    }
  });
}
}

// ============================================================
// RENDER - PROJECTS
// ============================================================
async function renderProjectsList() {
  const container = document.getElementById("projects-list");
  if (!container) return;

  const projects = await getAllProjects();
  const currentProjectId = getCurrentProjectId();

  // Filter
  const filtered = projects.filter((p) => {
    if (! searchQuery) return true;
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
    .map((p) =>
      renderProjectCard(p, {
        showActions: true,
        showDescription: true,
        showMeta: true,
        showStats: true,
        currentProjectId:  currentProjectId,
        cardClickAction: "select",
      })
    )
    .join("");

  container.innerHTML = html;
}

async function updateCurrentProjectDisplay() {
  const currentProjectEl = document.getElementById("current-project");
  if (!currentProjectEl) return;

  const project = await getCurrentProject();
  if (project) {
    currentProjectEl.classList.remove("sidebar__section-info");
    currentProjectEl.classList.add("sidebar__section-data");
    currentProjectEl.innerHTML = `<span>${project.name}</span>`;
  } else {
  currentProjectEl.classList.remove("sidebar__section-data");
  currentProjectEl.classList.add("sidebar__section-info");
  currentProjectEl.innerHTML = `<span>Нет проекта</span>`;
  }
}

async function selectProject(projectId) {
  setCurrentProjectId(projectId);

  // Re-render to highlight selected
  await renderProjectsList();
  await updateCurrentProjectDisplay();

  // Re-render tree to update active state
  await renderProjectsTree();

  // Hide projects list
  hideProjectsList();

  // Show project details (models/profiles)
  await showProjectDetails(projectId);

  // Show "Open project" button
  const openProjectAction = document.getElementById("open-project-action");
  if (openProjectAction) {
    openProjectAction.classList.remove("hidden");
  }
}

async function showProjectDetails(projectId) {
  const project = await getProjectById(projectId);
  if (!project) return;

  // Reset selection
  selectedModelId = null;
  selectedProfileId = null;

  // Show models
  const modelsContainer = document.getElementById("models-container");
  if (modelsContainer) {
    modelsContainer.classList.remove("hidden");
    await renderModelsContainer();
  }

  // Show profiles
  const profilesContainer = document.getElementById("profiles-container");
  if (profilesContainer) {
    profilesContainer.classList.remove("hidden");
    await renderProfilesContainer();
  }
}

function showProjectsList() {
  // Show projects list
  const projectsListContainer = document.getElementById("projects-list");
  if (projectsListContainer) {
    projectsListContainer.classList.remove("hidden");
  }

  const backNav = document.getElementById("back-navigation");
  if (backNav) {
    backNav.classList.add("hidden");
  }

  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.classList.remove("hidden");
  }

  // Hide details
  const modelsContainer = document.getElementById("models-container");
  const profilesContainer = document.getElementById("profiles-container");
  const openProjectAction = document.getElementById("open-project-action");

  if (modelsContainer) modelsContainer.classList.add("hidden");
  if (profilesContainer) profilesContainer.classList.add("hidden");
  if (openProjectAction) openProjectAction.classList.add("hidden");

  // Reset selections
  selectedModelId = null;
  selectedProfileId = null;
}

function hideProjectsList() {
  const projectsListContainer = document.getElementById("projects-list");
  if (projectsListContainer) {
    projectsListContainer.classList.add("hidden");
  }

  const backNav = document.getElementById("back-navigation");
  if (backNav) {
    backNav.classList.remove("hidden");
  }

  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.classList.add("hidden");
  }
}

// ============================================================
// RENDER - MODELS
// ============================================================
async function renderModelsContainer() {
  const projectId = getCurrentProjectId();
  if (!projectId) return;

  const modelsList = document.getElementById("models-list");
  if (!modelsList) return;

  const models = await getModels(projectId);

  if (! models || models.length === 0) {
    modelsList.innerHTML = '<div class="no-items text-muted">Нет моделей</div>';
    return;
  }

  const html = models
    .map((m) => {
      const isSelected = selectedModelId === m.id;
      return `
        <div class="list-item ${isSelected ? "selected" : ""}" data-model-id="${m.id}">
          📦 ${m.name}
        </div>
      `;
    })
    .join("");

  modelsList.innerHTML = html;

  // Clear details if nothing selected
  if (! selectedModelId) {
    const modelDetails = document.getElementById("model-details");
    if (modelDetails) {
      modelDetails.innerHTML = '<div class="empty-state">Выберите модель для просмотра деталей</div>';
    }
  }
}

async function selectModel(modelId) {
  selectedModelId = modelId;

  // Re-render list to highlight selected
  await renderModelsContainer();

  // Render details
  const projectId = getCurrentProjectId();
  const model = await getModel(projectId, modelId);
  const modelDetails = document.getElementById("model-details");

  if (modelDetails) {
    modelDetails.innerHTML = renderModelDetails(model);
  }
}

// ============================================================
// RENDER - PROFILES
// ============================================================
async function renderProfilesContainer() {
  const projectId = getCurrentProjectId();
  if (!projectId) return;

  const profilesList = document.getElementById("profiles-list");
  if (!profilesList) return;

  const profiles = await getProfiles(projectId);

  if (!profiles || profiles.length === 0) {
    profilesList.innerHTML = '<div class="no-items text-muted">Нет профилей</div>';
    return;
  }

  const html = profiles
    .map((p) => {
      const isSelected = selectedProfileId === p.id;
      return `
        <div class="list-item ${isSelected ?  "selected" : ""}" data-profile-id="${p.id}">
          ⚙️ ${p.name}
        </div>
      `;
    })
    .join("");

  profilesList.innerHTML = html;

  // Clear details if nothing selected
  if (! selectedProfileId) {
    const profileDetails = document.getElementById("profile-details");
    if (profileDetails) {
      profileDetails.innerHTML = '<div class="empty-state">Выберите профиль для просмотра деталей</div>';
    }
  }
}

async function selectProfile(profileId) {
  selectedProfileId = profileId;

  // Re-render list to highlight selected
  await renderProfilesContainer();

  // Render details
  const projectId = getCurrentProjectId();
  const profile = await getProfile(projectId, profileId);
  const profileDetails = document.getElementById("profile-details");

  if (profileDetails) {
    profileDetails.innerHTML = renderProfileDetails(profile);
  }
}

// ============================================================
// CRUD HANDLERS - PROJECTS
// ============================================================
function handleEditProject(projectId) {
  openEditProjectModal(projectId);
}

async function handleDeleteProject(projectId) {
  const project = await getProjectById(projectId);
  if (! project) return;

  const confirmed = confirm(`Удалить проект "${project.name}"?`);
  if (!confirmed) return;

  await deleteProject(projectId);

  // Re-render
  await renderProjectsList();
  await renderProjectsTree();
  await updateCurrentProjectDisplay();

  // Hide details if deleted project was selected
  if (getCurrentProjectId() === projectId) {
    showProjectsList();
  }
}

function handleOpenCurrentProject() {
  const currentProjectId = getCurrentProjectId();
  if (! currentProjectId) {
    alert("Не выбран текущий проект");
    return;
  }

  window.location.href = `project-details.html?id=${currentProjectId}`;
}

console.log("Projects Page Module Loaded");
