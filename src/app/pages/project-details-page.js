import { getProjectById, appDataInit } from "../../services/project-service.js";
import { getModels, getModel } from "../../services/model-service.js";
import { getProfiles, getProfile } from "../../services/profile-service.js";
import { getQueryParam } from "../../utils/url-helper.js";
import { initSidebarResize, initSidebarToggle, restoreSidebarState } from "../../ui/sidebar/index.js";
import { renderModelDetails } from "../../ui/renderers/model-details-renderer.js";
import { renderProfileDetails } from "../../ui/renderers/profile-details-renderer.js";

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

  // 3. Initialize UI systems
  restoreSidebarState();
  initSidebarToggle();
  initSidebarResize();

  // 4. Bind events
  bindEvents();

  // 5. Check and render project
  checkProject();
});

// ============================================================
// EVENT BINDINGS
// ============================================================
function bindEvents() {
  // Delegated events on models list
  const modelsListEl = document.getElementById("models-list");
  if (modelsListEl) {
    modelsListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (! target) return;

      const selectEl = target.closest(".tree-item");
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

      const selectEl = target.closest(".tree-item");
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
        <div class="tree-item ${isSelected ? "selected" : ""}" data-model-id="${m.id}">
          📦 ${m.name}
        </div>
      `;
    })
    .join("");

  modelsList.innerHTML = html;

  // Clear details
  const modelDetails = document.getElementById("model-details");
  if (modelDetails) {
    modelDetails.innerHTML = '<div class="text-center">Выберите модель для просмотра деталей</div>';
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
        <div class="tree-item ${isSelected ? "selected" : ""}" data-profile-id="${p.id}">
          ⚙️ ${p.name}
        </div>
      `;
    })
    .join("");

  profilesList.innerHTML = html;

  // Clear details
  const profileDetails = document.getElementById("profile-details");
  if (profileDetails) {
    profileDetails.innerHTML = '<div class="text-center">Выберите профиль для просмотра деталей</div>';
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

console.log("Project Details Page Module Loaded");

