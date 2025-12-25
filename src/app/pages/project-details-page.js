import { getProjectById, appDataInit } from "../../services/project-service.js";
import { getModels, getModel, deleteModel } from "../../services/model-service.js";
import { getProfiles, getProfile, deleteProfile } from "../../services/profile-service.js";
import { getQueryParam } from "../../utils/url-helper.js";
import { initModalSystem, bindModalTriggers } from "../../ui/modal.js";
import { loadModals } from "../../ui/modal-loader.js";
import { initSidebarResize, initSidebarToggle, restoreSidebarState } from "../../ui/sidebar/index.js";
import { renderModelDetails } from "../../ui/renderers/model-details-renderer.js";
import { renderProfileDetails } from "../../ui/renderers/profile-details-renderer.js";
import { initModelModal, clearNewModelModal, openEditModelModal } from "../../ui/components/model-modal.js";
import { initProfileModal, clearNewProfileModal, openEditProfileModal } from "../../ui/components/profile-modal.js";

// ============================================================
// STATE
// ============================================================
let currentProjectId = null;
let selectedModelId = null;
let selectedProfileId = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize data
  await appDataInit();

  // 2. Get project ID from URL
  currentProjectId = getQueryParam("id");

  // 3. Load modals
  await loadModals([
    "new-model-modal",
    "edit-model-modal",
    "new-profile-modal",
    "edit-profile-modal",
  ]);

  // 4. Initialize UI systems
  initModalSystem();
  bindModalTriggers(document);

  restoreSidebarState();
  initSidebarToggle();
  initSidebarResize();

  // 5. Initialize model modal
  if (currentProjectId) {
    initModelModal(currentProjectId, {
      onCreate: (newModel) => {
        renderModelsContainer();
        selectModel(newModel.id);
      },
      onUpdate: () => {
        renderModelsContainer();
        if (selectedModelId) {
          // Re-render details for updated model
          const model = getModel(currentProjectId, selectedModelId);
          const modelDetails = document.getElementById("model-details");
          if (modelDetails) {
            modelDetails.innerHTML = renderModelDetails(model);
          }
        }
      },
    });

    // Initialize profile modal
    initProfileModal(currentProjectId, {
      onCreate: (newProfile) => {
        renderProfilesContainer();
        selectProfile(newProfile.id);
      },
      onUpdate:  () => {
        renderProfilesContainer();
        if (selectedProfileId) {
          // Re-render details for updated profile
          const profile = getProfile(currentProjectId, selectedProfileId);
          const profileDetails = document.getElementById("profile-details");
          if (profileDetails) {
            profileDetails.innerHTML = renderProfileDetails(profile);
          }
        }
      },
    });
  }

  // 6. Bind events
  bindEvents();

  // 7. Check and render project
  checkProject();
});

// ============================================================
// EVENT BINDINGS
// ============================================================
function bindEvents() {
  // Go to projects button
  const goToProjectsBtn = document.getElementById("go-to-projects-btn");
  if (goToProjectsBtn) {
    goToProjectsBtn.addEventListener("click", () => {
      window.location.href = "projects.html";
    });
  }

  // Clear modal forms on open
  document.addEventListener("modal:beforeopen", (e) => {
    const modalId = e.detail.modalId;

    if (modalId === "new-model-modal") {
      clearNewModelModal();
    } else if (modalId === "new-profile-modal") {
      clearNewProfileModal();
    }
  });

  // Delegated events on models list
  const modelsListEl = document.getElementById("models-list");
  if (modelsListEl) {
    modelsListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (! target) return;

      // Edit model
      const editBtn = target.closest("[data-action='edit-model']");
      if (editBtn) {
        const modelId = editBtn.getAttribute("data-model-id");
        if (modelId) handleEditModel(modelId);
        return;
      }

      // Delete model
      const deleteBtn = target.closest("[data-action='delete-model']");
      if (deleteBtn) {
        const modelId = deleteBtn.getAttribute("data-model-id");
        if (modelId) handleDeleteModel(modelId);
        return;
      }

      // Select model
      const selectEl = target.closest(".list-item");
      if (selectEl) {
        const modelId = selectEl.getAttribute("data-model-id");
        if (modelId) selectModel(modelId);
      }
    });
  }

  // Delegated events on profiles list
  const profilesListEl = document.getElementById("profiles-list");
  if (profilesListEl) {
    profilesListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      // Edit profile
      const editBtn = target.closest("[data-action='edit-profile']");
      if (editBtn) {
        const profileId = editBtn.getAttribute("data-profile-id");
        if (profileId) handleEditProfile(profileId);
        return;
      }

      // Delete profile
      const deleteBtn = target.closest("[data-action='delete-profile']");
      if (deleteBtn) {
        const profileId = deleteBtn.getAttribute("data-profile-id");
        if (profileId) handleDeleteProfile(profileId);
        return;
      }

      // Select profile
      const selectEl = target.closest(".list-item");
      if (selectEl) {
        const profileId = selectEl.getAttribute("data-profile-id");
        if (profileId) selectProfile(profileId);
      }
    });
  }
}

// ============================================================
// CHECK PROJECT
// ============================================================
function checkProject() {
  if (!currentProjectId) {
    showNoProjectWarning();
    return;
  }

  const project = getProjectById(currentProjectId);
  if (!project) {
    showNoProjectWarning();
    return;
  }

  // Update page title
  updatePageTitle(project);

  // Hide warning, show content
  hideNoProjectWarning();

  // Render models and profiles
  renderModelsContainer();
  renderProfilesContainer();
}

function showNoProjectWarning() {
  document.getElementById("no-project-warning").classList.remove("hidden");
  document.getElementById("models-container").classList.add("hidden");
  document.getElementById("profiles-container").classList.add("hidden");
}

function hideNoProjectWarning() {
  document.getElementById("no-project-warning").classList.add("hidden");
  document.getElementById("models-container").classList.remove("hidden");
  document.getElementById("profiles-container").classList.remove("hidden");
}

function updatePageTitle(project) {
  const titleElement = document.getElementById("project-title");
  if (titleElement) {
    titleElement.textContent = project.name;
  }
}

// ============================================================
// RENDER - MODELS
// ============================================================
function renderModelsContainer() {
  const modelsList = document.getElementById("models-list");
  if (!modelsList) return;

  const models = getModels(currentProjectId);

  if (! models || models.length === 0) {
    modelsList.innerHTML = '<div class="no-items text-muted">Нет моделей</div>';
    return;
  }

  const html = models
    .map((m) => {
      const isSelected = selectedModelId === m.id;
      return `
        <div class="list-item ${isSelected ? "selected" : ""}" data-model-id="${m.id}">
          <div class="list-item-content">
            <span class="list-item-icon">📦</span>
            <span class="list-item-name">${m.name}</span>
          </div>
          <div class="list-item-actions">
            <button class="btn-icon btn-icon-small" data-action="edit-model" data-model-id="${m.id}" title="Редактировать">✏️</button>
            <button class="btn-icon btn-icon-small" data-action="delete-model" data-model-id="${m.id}" title="Удалить">🗑️</button>
          </div>
        </div>
      `;
    })
    .join("");

  modelsList.innerHTML = html;

  // Clear details if nothing selected
  if (!selectedModelId) {
    const modelDetails = document.getElementById("model-details");
    if (modelDetails) {
      modelDetails.innerHTML = '<div class="text-center">Выберите модель для просмотра деталей</div>';
    }
  }
}

function selectModel(modelId) {
  selectedModelId = modelId;

  // Re-render list to highlight selected
  renderModelsContainer();

  // Render details
  const model = getModel(currentProjectId, modelId);
  const modelDetails = document.getElementById("model-details");

  if (modelDetails) {
    modelDetails.innerHTML = renderModelDetails(model);
  }
}

// ============================================================
// RENDER - PROFILES
// ============================================================
function renderProfilesContainer() {
  const profilesList = document.getElementById("profiles-list");
  if (!profilesList) return;

  const profiles = getProfiles(currentProjectId);

  if (!profiles || profiles.length === 0) {
    profilesList.innerHTML = '<div class="no-items text-muted">Нет профилей</div>';
    return;
  }

  const html = profiles
    .map((p) => {
      const isSelected = selectedProfileId === p.id;
      return `
        <div class="list-item ${isSelected ? "selected" : ""}" data-profile-id="${p.id}">
          <div class="list-item-content">
            <span class="list-item-icon">⚙️</span>
            <span class="list-item-name">${p.name}</span>
          </div>
          <div class="list-item-actions">
            <button class="btn-icon btn-icon-small" data-action="edit-profile" data-profile-id="${p.id}" title="Редактировать">✏️</button>
            <button class="btn-icon btn-icon-small" data-action="delete-profile" data-profile-id="${p.id}" title="Удалить">🗑️</button>
          </div>
        </div>
      `;
    })
    .join("");

  profilesList.innerHTML = html;

  // Clear details if nothing selected
  if (!selectedProfileId) {
    const profileDetails = document.getElementById("profile-details");
    if (profileDetails) {
      profileDetails.innerHTML = '<div class="text-center">Выберите профиль для просмотра деталей</div>';
    }
  }
}

function selectProfile(profileId) {
  selectedProfileId = profileId;

  // Re-render list to highlight selected
  renderProfilesContainer();

  // Render details
  const profile = getProfile(currentProjectId, profileId);
  const profileDetails = document.getElementById("profile-details");

  if (profileDetails) {
    profileDetails.innerHTML = renderProfileDetails(profile);
  }
}

// ============================================================
// CRUD HANDLERS - MODELS
// ============================================================
function handleEditModel(modelId) {
  openEditModelModal(modelId);
}

function handleDeleteModel(modelId) {
  const model = getModel(currentProjectId, modelId);
  if (!model) return;

  const confirmed = confirm(`Удалить модель "${model.name}"?`);
  if (!confirmed) return;

  deleteModel(currentProjectId, modelId);

  // Re-render
  renderModelsContainer();

  // Clear details if deleted model was selected
  if (selectedModelId === modelId) {
    selectedModelId = null;
  }
}

// ============================================================
// CRUD HANDLERS - PROFILES
// ============================================================
function handleEditProfile(profileId) {
  openEditProfileModal(profileId);
}

function handleDeleteProfile(profileId) {
  const profile = getProfile(currentProjectId, profileId);
  if (!profile) return;

  const confirmed = confirm(`Удалить профиль "${profile.name}"?`);
  if (!confirmed) return;

  deleteProfile(currentProjectId, profileId);

  // Re-render
  renderProfilesContainer();

  // Clear details if deleted profile was selected
  if (selectedProfileId === profileId) {
    selectedProfileId = null;
  }
}

console.log("Project Details Page Module Loaded");
