import { getProjectById, appDataInit } from "../../services/project-service.js";
import {
  getModels,
  getModel,
  deleteModel,
} from "../../services/model-service.js";
import {
  getProfiles,
  getProfile,
  deleteProfile,
} from "../../services/profile-service.js";
import { getQueryParam } from "../../utils/url-helper.js";
import { initModalSystem, bindModalTriggers } from "../../ui/modal.js";
import { loadModals } from "../../ui/modal-loader.js";
import {
  initSidebarResize,
  initSidebarToggle,
  restoreSidebarState,
} from "../../ui/sidebar/index.js";
import { renderModelDetails, renderModelControls } from "../../ui/renderers/model-details-renderer.js";
import { renderProfileDetails, renderProfileControls } from "../../ui/renderers/profile-details-renderer.js";
import {
  initModelModal,
  clearNewModelModal,
  openEditModelModal,
} from "../../ui/components/model-modal.js";
import {
  initProfileModal,
  clearNewProfileModal,
  openEditProfileModal,
} from "../../ui/components/profile-modal.js";
import { 
  renderProjectTree, 
  toggleTreeItem, 
  toggleProject 
} from "../../ui/renderers/project-tree-renderer.js";
import { renderPackageDetails } from "../../ui/renderers/package-details-renderer.js"; // ✅ NEW
import { renderClassDetails } from "../../ui/renderers/class-details-renderer.js"; // ✅ NEW
import { renderAttributeDetails } from "../../ui/renderers/attribute-details-renderer.js"; // ✅ NEW
import { renderLinkDetails } from "../../ui/renderers/link-details-renderer.js"; // ✅ NEW

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
        renderProjectTreeSidebar();
        selectModel(newModel.id);
      },
      onUpdate: () => {
        renderModelsContainer();
        renderProjectTreeSidebar();
        if (selectedModelId) {
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
        renderProjectTreeSidebar();
        selectProfile(newProfile.id);
      },
      onUpdate: () => {
        renderProfilesContainer();
        renderProjectTreeSidebar();
        if (selectedProfileId) {
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

  // ✅ Delegated events on project tree sidebar
  const projectStructureEl = document.getElementById("current-project-structure");
  if (projectStructureEl) {
    projectStructureEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (! target) return;

      // Toggle project
      const toggleProjectBtn = target.closest("[data-action='toggle-project']");
      if (toggleProjectBtn) {
        const projectId = toggleProjectBtn.getAttribute("data-project-id");
        if (projectId) {
          toggleProject(projectId);
          renderProjectTreeSidebar();
        }
        return;
      }

      // Toggle tree item 
      const toggleItemBtn = target.closest("[data-action='toggle-tree-item']");
      if (toggleItemBtn) {
        const itemId = toggleItemBtn.getAttribute("data-item-id");
        if (itemId) {
          toggleTreeItem(itemId);
          renderProjectTreeSidebar();
        }
        return;
      }

      // Select model from tree
      const selectModelEl = target.closest("[data-action='select-model']");
      if (selectModelEl) {
        const modelId = selectModelEl.getAttribute("data-model-id");
        if (modelId) selectModel(modelId);
        return;
      }

      // Select profile from tree
      const selectProfileEl = target.closest("[data-action='select-profile']");
      if (selectProfileEl) {
        const profileId = selectProfileEl.getAttribute("data-profile-id");
        if (profileId) selectProfile(profileId);
        return;
      }

      // ✅ Select package from tree (NEW)
      const selectPackageEl = target.closest("[data-action='select-package']");
      if (selectPackageEl) {
        const packageId = selectPackageEl.getAttribute("data-package-id");
        if (packageId) handleSelectPackage(packageId);
        return;
      }

      // ✅ Select class from tree (NEW)
      const selectClassEl = target.closest("[data-action='select-class']");
      if (selectClassEl) {
        const classId = selectClassEl.getAttribute("data-class-id");
        if (classId) handleSelectClass(classId);
        return;
      }

      // ✅ Select attribute from tree (NEW)
      const selectAttributeEl = target.closest("[data-action='select-attribute']");
      if (selectAttributeEl) {
        const attrId = selectAttributeEl.getAttribute("data-attr-id");
        if (attrId) handleSelectAttribute(attrId);
        return;
      }

      // ✅ Select link from tree (NEW)
      const selectLinkEl = target.closest("[data-action='select-link']");
      if (selectLinkEl) {
        const linkId = selectLinkEl.getAttribute("data-link-id");
        if (linkId) handleSelectLink(linkId);
        return;
      }
    });
  }

  // Delegated events on models list
  const modelsListEl = document.getElementById("models-list");
  if (modelsListEl) {
    modelsListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const selectEl = target.closest(".list-item");
      if (selectEl) {
        const modelId = selectEl.getAttribute("data-model-id");
        if (modelId) selectModel(modelId);
      }
    });
  }

  // Delegated events on models control
  const modelControlEl = document.getElementById("model-details-control");
  if (modelControlEl) {
    modelControlEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const editBtn = target.closest("[data-action='edit-model']");
      if (editBtn) {
        const modelId = editBtn.getAttribute("data-model-id");
        if (modelId) handleEditModel(modelId);
        return;
      }

      const importBtn = target.closest("[data-action='import-model']");
      if (importBtn) {
        const modelId = importBtn.getAttribute("data-model-id");
        if (modelId) handleImportModel(modelId);
        return;
      }

      const exportBtn = target.closest("[data-action='export-model']");
      if (exportBtn) {
        const modelId = exportBtn.getAttribute("data-model-id");
        if (modelId) handleExportModel(modelId);
        return;
      }

      const checkBtn = target.closest("[data-action='check-model']");
      if (checkBtn) {
        const modelId = checkBtn.getAttribute("data-model-id");
        if (modelId) handleCheckModel(modelId);
        return;
      }

      const deleteBtn = target.closest("[data-action='delete-model']");
      if (deleteBtn) {
        const modelId = deleteBtn.getAttribute("data-model-id");
        if (modelId) handleDeleteModel(modelId);
        return;
      }
    });
  }

  // Delegated events on profiles list
  const profilesListEl = document.getElementById("profiles-list");
  if (profilesListEl) {
    profilesListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const selectEl = target.closest(".list-item");
      if (selectEl) {
        const profileId = selectEl.getAttribute("data-profile-id");
        if (profileId) selectProfile(profileId);
      }
    });
  }

  // Delegated events on profile control
  const profileControlEl = document.getElementById("profile-details-control");
  if (profileControlEl) {
    profileControlEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const editBtn = target.closest("[data-action='edit-profile']");
      if (editBtn) {
        const profileId = editBtn.getAttribute("data-profile-id");
        if (profileId) handleEditProfile(profileId);
        return;
      }

      const importBtn = target.closest("[data-action='import-profile']");
      if (importBtn) {
        const profileId = importBtn.getAttribute("data-profile-id");
        if (profileId) handleImportProfile(profileId);
        return;
      }

      const exportBtn = target.closest("[data-action='export-profile']");
      if (exportBtn) {
        const profileId = exportBtn.getAttribute("data-profile-id");
        if (profileId) handleExportProfile(profileId);
        return;
      }

      const checkBtn = target.closest("[data-action='check-profile']");
      if (checkBtn) {
        const profileId = checkBtn.getAttribute("data-profile-id");
        if (profileId) handleCheckProfile(profileId);
        return;
      }

      const deleteBtn = target.closest("[data-action='delete-profile']");
      if (deleteBtn) {
        const profileId = deleteBtn.getAttribute("data-profile-id");
        if (profileId) handleDeleteProfile(profileId);
        return;
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

  updatePageTitle(project);
  updateSidebarTitle(project);
  hideNoProjectWarning();
  renderProjectTreeSidebar();
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

function updateSidebarTitle(project) {
  const sidebarTitleElement = document.getElementById("sidebar-project-title");
  if (sidebarTitleElement) {
    sidebarTitleElement.textContent = project.name;
  }
}

function renderProjectTreeSidebar() {
  const container = document.getElementById("current-project-structure");
  if (!container) return;

  const project = getProjectById(currentProjectId);
  if (!project) {
    container.innerHTML = '<div class="no-items text-muted">Проект не найден</div>';
    return;
  }

  container.innerHTML = renderProjectTree(project, currentProjectId);
}

// ============================================================
// RENDER - MODELS
// ============================================================
function renderModelsContainer() {
  const modelsList = document.getElementById("models-list");
  if (!modelsList) return;

  const models = getModels(currentProjectId);

  if (!models || models.length === 0) {
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
        </div>
      `;
    })
    .join("");

  modelsList.innerHTML = html;

  if (!selectedModelId) {
    const modelDetails = document.getElementById("model-details");
    if (modelDetails) {
      modelDetails.innerHTML =
        '<div class="text-center">Выберите модель для просмотра деталей</div>';
    }
  }
}

function selectModel(modelId) {
  selectedModelId = modelId;
  renderModelsContainer();

  const model = getModel(currentProjectId, modelId);
  const modelDetails = document.getElementById("model-details");
  const modelDetailsControl = document.getElementById("model-details-control");

  if (modelDetails) {
    modelDetails.innerHTML = renderModelDetails(model);
  }

  if (modelDetailsControl) {
    modelDetailsControl.innerHTML = renderModelControls(model);
  }

  // ✅ Hide item-container when selecting model
  hideItemContainer();
}

// ============================================================
// RENDER - PROFILES
// ============================================================
function renderProfilesContainer() {
  const profilesList = document.getElementById("profiles-list");
  if (!profilesList) return;

  const profiles = getProfiles(currentProjectId);

  if (!profiles || profiles.length === 0) {
    profilesList.innerHTML =
      '<div class="no-items text-muted">Нет профилей</div>';
    return;
  }

  const html = profiles
    .map((p) => {
      const isSelected = selectedProfileId === p.id;
      return `
        <div class="list-item ${isSelected ? "selected" :  ""}" data-profile-id="${p.id}">
          <div class="list-item-content">
            <span class="list-item-icon">⚙️</span>
            <span class="list-item-name">${p.name}</span>
          </div>
        </div>
      `;
    })
    .join("");

  profilesList.innerHTML = html;

  if (!selectedProfileId) {
    const profileDetails = document.getElementById("profile-details");
    if (profileDetails) {
      profileDetails.innerHTML =
        '<div class="text-center">Выберите профиль для просмотра деталей</div>';
    }
  }
}

function selectProfile(profileId) {
  selectedProfileId = profileId;
  renderProfilesContainer();

  const profile = getProfile(currentProjectId, profileId);
  const profileDetails = document.getElementById("profile-details");
  const profileDetailsControl = document.getElementById("profile-details-control");

  if (profileDetails) {
    profileDetails.innerHTML = renderProfileDetails(profile);
  }

  if (profileDetailsControl) {
    profileDetailsControl.innerHTML = renderProfileControls(profile);
  }

  // ✅ Hide item-container when selecting profile
  hideItemContainer();
}

// ============================================================
// ✅ ITEM DETAILS HANDLERS (NEW)
// ============================================================

/**
 * Show item container
 */
function showItemContainer() {
  const itemContainer = document.getElementById("item-container");
  if (itemContainer) {
    itemContainer.classList.remove("hidden");
  }
}

/**
 * Hide item container
 */
function hideItemContainer() {
  const itemContainer = document.getElementById("item-container");
  if (itemContainer) {
    itemContainer.classList.add("hidden");
  }
}

/**
 * Handle select package from tree
 */
function handleSelectPackage(packageId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  // Find package in project structure
  const pkg = findPackageById(project, packageId);
  if (!pkg) {
    console.warn(`Package not found: ${packageId}`);
    return;
  }

  // Render package details
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderPackageDetails(pkg);
  }

  showItemContainer();
}

/**
 * Handle select class from tree
 */
function handleSelectClass(classId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  // Find class in project structure
  const cls = findClassById(project, classId);
  if (!cls) {
    console.warn(`Class not found: ${classId}`);
    return;
  }

  // Render class details
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderClassDetails(cls);
  }

  showItemContainer();
}

/**
 * Handle select attribute from tree
 */
function handleSelectAttribute(attrId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  // Find attribute in project structure
  const attr = findAttributeById(project, attrId);
  if (!attr) {
    console.warn(`Attribute not found: ${attrId}`);
    return;
  }

  // Render attribute details
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderAttributeDetails(attr);
  }

  showItemContainer();
}

/**
 * Handle select link from tree
 */
function handleSelectLink(linkId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  // Find link in project structure
  const link = findLinkById(project, linkId);
  if (!link) {
    console.warn(`Link not found: ${linkId}`);
    return;
  }

  // Render link details
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderLinkDetails(link);
  }

  showItemContainer();
}

// ============================================================
// ✅ HELPER FUNCTIONS TO FIND ITEMS (NEW)
// ============================================================

/**
 * Find package by ID in project structure
 */
function findPackageById(project, packageId) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.id === packageId) return pkg;
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages && model.rootPackages[0] && model.rootPackages[0].packages) {
        const found = searchInPackages(model.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages && profile.rootPackages[0] && profile.rootPackages[0].packages) {
        const found = searchInPackages(profile.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Find class by ID in project structure
 */
function findClassById(project, classId) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        const cls = pkg.classes.find(c => c.id === classId);
        if (cls) return cls;
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages && model.rootPackages[0] && model.rootPackages[0].packages) {
        const found = searchInPackages(model.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages && profile.rootPackages[0] && profile.rootPackages[0].packages) {
        const found = searchInPackages(profile.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Find attribute by ID in project structure
 */
function findAttributeById(project, attrId) {
  const cls = findClassByAttributeId(project, attrId);
  if (!cls || !cls.attributes) return null;
  return cls.attributes.find(attr => attr.id === attrId);
}

function findClassByAttributeId(project, attrId) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.attributes && cls.attributes.some(attr => attr.id === attrId)) {
            return cls;
          }
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages && model.rootPackages[0] && model.rootPackages[0].packages) {
        const found = searchInPackages(model.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages && profile.rootPackages[0] && profile.rootPackages[0].packages) {
        const found = searchInPackages(profile.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Find link by ID in project structure
 */
function findLinkById(project, linkId) {
  const cls = findClassByLinkId(project, linkId);
  if (!cls || !cls.links) return null;
  return cls.links.find(link => link.linkId === linkId);
}

function findClassByLinkId(project, linkId) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.links && cls.links.some(link => link.linkId === linkId)) {
            return cls;
          }
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages && model.rootPackages[0] && model.rootPackages[0].packages) {
        const found = searchInPackages(model.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages && profile.rootPackages[0] && profile.rootPackages[0].packages) {
        const found = searchInPackages(profile.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  return null;
}

// ============================================================
// CRUD HANDLERS - MODELS
// ============================================================
function handleEditModel(modelId) {
  openEditModelModal(modelId);
}

function handleImportModel(modelId) {
  alert("Функция импорта в разработке");
}

function handleExportModel(modelId) {
  alert("Функция экспорта в разработке");
}

function handleCheckModel(modelId) {
  alert("Функция проверки в разработке");
}

function handleDeleteModel(modelId) {
  const model = getModel(currentProjectId, modelId);
  if (!model) return;

  const confirmed = confirm(`Удалить модель "${model.name}"?`);
  if (!confirmed) return;

  deleteModel(currentProjectId, modelId);
  renderModelsContainer();
  renderProjectTreeSidebar();

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

function handleImportProfile(profileId) {
  alert("Функция импорта в разработке");
}

function handleExportProfile(profileId) {
  alert("Функция экспорта в разработке");
}

function handleCheckProfile(profileId) {
  alert("Функция проверки в разработке");
}

function handleDeleteProfile(profileId) {
  const profile = getProfile(currentProjectId, profileId);
  if (!profile) return;

  const confirmed = confirm(`Удалить профиль "${profile.name}"?`);
  if (!confirmed) return;

  deleteProfile(currentProjectId, profileId);
  renderProfilesContainer();
  renderProjectTreeSidebar();

  if (selectedProfileId === profileId) {
    selectedProfileId = null;
  }
}

console.log("Project Details Page Module Loaded");
