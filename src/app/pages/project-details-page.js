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
import {
  renderModelDetails,
  renderModelControls,
} from "../../ui/renderers/model-details-renderer.js";
import {
  renderProfileDetails,
  renderProfileControls,
} from "../../ui/renderers/profile-details-renderer.js";
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
  initAttributeModal,
  openEditAttributeModal,
} from "../../ui/components/attribute-modal.js";
import {
  initLinkModal,
  openEditLinkModal,
} from "../../ui/components/link-modal.js";
import {
  renderProjectTree,
  toggleTreeItem,
  toggleProject,
} from "../../ui/renderers/project-tree-renderer.js";
import { renderPackageDetails } from "../../ui/renderers/package-details-renderer.js";
import { renderClassDetails } from "../../ui/renderers/class-details-renderer.js";
// import { renderAttributeDetails } from "../../ui/renderers/attribute-details-renderer.js";
// import { renderLinkDetails } from "../../ui/renderers/link-details-renderer.js";

// ============================================================
// STATE
// ============================================================
let currentProjectId = null;
let selectedModelId = null;
let selectedProfileId = null;
let originalItemData = null;
let lastClassTabName = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  await appDataInit();
  currentProjectId = getQueryParam("id");

  await loadModals([
    "new-model-modal",
    "edit-model-modal",
    "new-profile-modal",
    "edit-profile-modal",
    "edit-attribute-modal",
    "edit-link-modal",
  ]);

  initModalSystem();
  bindModalTriggers(document);
  restoreSidebarState();
  initSidebarToggle();
  initSidebarResize();

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

    initAttributeModal(currentProjectId, {
      onUpdate: (attrId, updates) => {
        const project = getProjectById(currentProjectId);
        if (!project) return;

        const tabToRestore = getActiveClassTabName() || lastClassTabName;

        const found = findAttributeWithParent(project, attrId);
        if (! found) return;

        Object.assign(found.attr, updates);

        const itemDetailsContent = document.getElementById("item-details-content");
        if (itemDetailsContent) {
          itemDetailsContent.innerHTML = renderClassDetails(found.cls);
          restoreClassTab(tabToRestore);
        }
      },
    });

    initLinkModal(currentProjectId, {
      onUpdate: (linkId, classId, updates) => {
        const project = getProjectById(currentProjectId);
        if (!project) return;

        const tabToRestore = getActiveClassTabName() || lastClassTabName;

        const found = findLinkWithParent(project, classId, linkId);
        if (!found) return;

        Object.assign(found.link, updates);

        const itemDetailsContent = document.getElementById("item-details-content");
        if (itemDetailsContent) {
          itemDetailsContent.innerHTML = renderClassDetails(found.cls);
          restoreClassTab(tabToRestore);
        }
      },
    });
  }

  bindEvents();
  checkProject();
});

// ============================================================
// EVENT BINDINGS
// ============================================================
function bindEvents() {
  const goToProjectsBtn = document.getElementById("go-to-projects-btn");
  if (goToProjectsBtn) {
    goToProjectsBtn.addEventListener("click", () => {
      window.location.href = "projects.html";
    });
  }

  const toggleDiagramBtn = document.getElementById("toggle-diagram-mode");
  if (toggleDiagramBtn) {
    toggleDiagramBtn.addEventListener("click", () => {
      alert("Режим диаграммы будет реализован позже.");
    });
  }

  document.addEventListener("modal:beforeopen", (e) => {
    const modalId = e.detail.modalId;
    if (modalId === "new-model-modal") {
      clearNewModelModal();
    } else if (modalId === "new-profile-modal") {
      clearNewProfileModal();
    }
  });

  const projectStructureEl = document.getElementById(
    "current-project-structure"
  );
  if (projectStructureEl) {
    projectStructureEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

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

      // Select model
      const selectModelEl = target.closest("[data-action='select-model']");
      if (selectModelEl) {
        setSelectedTreeItem(selectModelEl);
        const modelId = selectModelEl.getAttribute("data-model-id");
        if (modelId) selectModel(modelId);
        return;
      }

      // Select profile
      const selectProfileEl = target.closest("[data-action='select-profile']");
      if (selectProfileEl) {
        setSelectedTreeItem(selectProfileEl);
        const profileId = selectProfileEl.getAttribute("data-profile-id");
        if (profileId) selectProfile(profileId);
        return;
      }

      // Select package
      const selectPackageEl = target.closest("[data-action='select-package']");
      if (selectPackageEl) {
        setSelectedTreeItem(selectPackageEl);
        const packageId = selectPackageEl.getAttribute("data-package-id");
        const modelId = selectPackageEl.getAttribute("data-model-id");
        const profileId = selectPackageEl.getAttribute("data-profile-id");
        if (packageId) handleSelectPackage(packageId, modelId, profileId);
        return;
      }

      // Select class
      const selectClassEl = target.closest("[data-action='select-class']");
      if (selectClassEl) {
        setSelectedTreeItem(selectClassEl);
        const classId = selectClassEl.getAttribute("data-class-id");
        const modelId = selectClassEl.getAttribute("data-model-id");
        const profileId = selectClassEl.getAttribute("data-profile-id");
        if (classId) handleSelectClass(classId, modelId, profileId);
        return;
      }

      // ✅ NEW: Select enumeration (class with type Enumeration)
      const selectEnumerationEl = target.closest(
        "[data-action='select-enumeration']"
      );
      if (selectEnumerationEl) {
        setSelectedTreeItem(selectEnumerationEl);
        const classId = selectEnumerationEl.getAttribute("data-class-id");
        const modelId = selectEnumerationEl.getAttribute("data-model-id");
        const profileId = selectEnumerationEl.getAttribute("data-profile-id");
        if (classId) handleSelectEnumeration(classId, modelId, profileId);
        return;
      }

      // Select attribute
      const selectAttributeEl = target.closest(
        "[data-action='select-attribute']"
      );
      if (selectAttributeEl) {
        const attrId = selectAttributeEl.getAttribute("data-attr-id");
        const parentClassId = selectAttributeEl.getAttribute("data-parent-class-id");
        const modelId = selectAttributeEl.getAttribute("data-model-id");
        const profileId = selectAttributeEl.getAttribute("data-profile-id");
        if (attrId) handleSelectAttribute(attrId, parentClassId, modelId, profileId);
        return;
      }

      // Select link
      const selectLinkEl = target.closest("[data-action='select-link']");
      if (selectLinkEl) {
        const linkId = selectLinkEl.getAttribute("data-link-id");
        const parentClassId = selectLinkEl.getAttribute("data-parent-class-id");
        const modelId = selectLinkEl.getAttribute("data-model-id");
        const profileId = selectLinkEl.getAttribute("data-profile-id");
        if (linkId) handleSelectLink(linkId, parentClassId, modelId, profileId);
        return;
      }

      // ✅ NEW: Select literal
      const selectLiteralEl = target.closest("[data-action='select-literal']");
      if (selectLiteralEl) {
        const literalId = selectLiteralEl.getAttribute("data-literal-id");
        const parentClassId = selectLiteralEl.getAttribute("data-parent-class-id");
        const modelId = selectLiteralEl.getAttribute("data-model-id");
        const profileId = selectLiteralEl.getAttribute("data-profile-id");
        if (literalId) handleSelectLiteral(literalId, parentClassId, modelId, profileId);
        return;
      }
    });
  }

  // Models list
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

  // Model controls
  const modelControlEl = document.getElementById("model-details-control");
  if (modelControlEl) {
    modelControlEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const editBtn = target.closest("[data-action='edit-model']");
      if (editBtn) {
        handleEditModel(editBtn.getAttribute("data-model-id"));
        return;
      }

      const importBtn = target.closest("[data-action='import-model']");
      if (importBtn) {
        handleImportModel(importBtn.getAttribute("data-model-id"));
        return;
      }

      const exportBtn = target.closest("[data-action='export-model']");
      if (exportBtn) {
        handleExportModel(exportBtn.getAttribute("data-model-id"));
        return;
      }

      const checkBtn = target.closest("[data-action='check-model']");
      if (checkBtn) {
        handleCheckModel(checkBtn.getAttribute("data-model-id"));
        return;
      }

      const deleteBtn = target.closest("[data-action='delete-model']");
      if (deleteBtn) {
        handleDeleteModel(deleteBtn.getAttribute("data-model-id"));
        return;
      }
    });
  }

  // Profiles list
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

  // Profile controls
  const profileControlEl = document.getElementById("profile-details-control");
  if (profileControlEl) {
    profileControlEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const editBtn = target.closest("[data-action='edit-profile']");
      if (editBtn) {
        handleEditProfile(editBtn.getAttribute("data-profile-id"));
        return;
      }

      const importBtn = target.closest("[data-action='import-profile']");
      if (importBtn) {
        handleImportProfile(importBtn.getAttribute("data-profile-id"));
        return;
      }

      const exportBtn = target.closest("[data-action='export-profile']");
      if (exportBtn) {
        handleExportProfile(exportBtn.getAttribute("data-profile-id"));
        return;
      }

      const checkBtn = target.closest("[data-action='check-profile']");
      if (checkBtn) {
        handleCheckProfile(checkBtn.getAttribute("data-profile-id"));
        return;
      }

      const deleteBtn = target.closest("[data-action='delete-profile']");
      if (deleteBtn) {
        handleDeleteProfile(deleteBtn.getAttribute("data-profile-id"));
        return;
      }
    });
  }

  // Item details
  // ✅ Delegated events on item-details-content (STANDARD MODE)
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.addEventListener("click", handleItemDetailsClick);
    itemDetailsContent.addEventListener("submit", handleItemDetailsSubmit);
  }
}

// ============================================================
// PROJECT
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
  if (titleElement) titleElement.textContent = project.name;
}

function updateSidebarTitle(project) {
  const sidebarTitleElement = document.getElementById("sidebar-project-title");
  if (sidebarTitleElement) sidebarTitleElement.textContent = project.name;
}

function renderProjectTreeSidebar() {
  const container = document.getElementById("current-project-structure");
  if (!container) return;

  const project = getProjectById(currentProjectId);
  if (!project) {
    container.innerHTML =
      '<div class="no-items text-muted">Проект не найден</div>';
    return;
  }

  container.innerHTML = renderProjectTree(project, currentProjectId);
}

// ============================================================
// MODELS
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
        <div class="list-item ${isSelected ? "selected" : ""}" data-model-id="${
        m.id
      }">
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
        '<div class="empty-state">Выберите модель для просмотра деталей</div>';
    }
  }
}

function selectModel(modelId) {
  selectedModelId = modelId;
  renderModelsContainer();

  const model = getModel(currentProjectId, modelId);
  const modelDetails = document.getElementById("model-details");
  const modelDetailsControl = document.getElementById("model-details-control");

  if (modelDetails) modelDetails.innerHTML = renderModelDetails(model);
  if (modelDetailsControl)
    modelDetailsControl.innerHTML = renderModelControls(model);

  hideItemContainer();
  showModelContainer();
  showProfileContainer();
}

// ============================================================
// PROFILES
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
        <div class="list-item ${
          isSelected ? "selected" : ""
        }" data-profile-id="${p.id}">
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
        '<div class="empty-state">Выберите профиль для просмотра деталей</div>';
    }
  }
}

function selectProfile(profileId) {
  selectedProfileId = profileId;
  renderProfilesContainer();

  const profile = getProfile(currentProjectId, profileId);
  const profileDetails = document.getElementById("profile-details");
  const profileDetailsControl = document.getElementById(
    "profile-details-control"
  );

  if (profileDetails) profileDetails.innerHTML = renderProfileDetails(profile);
  if (profileDetailsControl)
    profileDetailsControl.innerHTML = renderProfileControls(profile);

  hideItemContainer();
  showModelContainer();
  showProfileContainer();
}

// ============================================================
// CONTAINERS VISIBILITY
// ============================================================
function showItemContainer() {
  const itemContainer = document.getElementById("item-container");
  if (itemContainer) itemContainer.classList.remove("hidden");
}

function hideItemContainer() {
  const itemContainer = document.getElementById("item-container");
  if (itemContainer) itemContainer.classList.add("hidden");
}

function showModelContainer() {
  const modelContainer = document.getElementById("models-container");
  if (modelContainer) modelContainer.classList.remove("hidden");
}

function hideModelContainer() {
  const modelContainer = document.getElementById("models-container");
  if (modelContainer) modelContainer.classList.add("hidden");
}

function showProfileContainer() {
  const profileContainer = document.getElementById("profiles-container");
  if (profileContainer) profileContainer.classList.remove("hidden");
}

function hideProfileContainer() {
  const profileContainer = document.getElementById("profiles-container");
  if (profileContainer) profileContainer.classList.add("hidden");
}

// ============================================================
// SELECT HANDLERS
// ============================================================
/**
 * Handles the selection of a package and displays its details in the appropriate panel.
 *
 * @param {string} packageId - The unique identifier of the package to select.
 * @param {string} [modelId=""] - The unique identifier of the parent model (optional).
 * @param {string} [profileId=""] - The unique identifier of the parent profile (optional).
 *
 * @returns {void}
 *
 */
function handleSelectPackage(packageId, modelId = "", profileId = "") {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  const context =
    modelId && modelId !== ""
      ? "model"
      : profileId && profileId !== ""
      ? "profile"
      : null;

  if (! context) {
    console.error("Package must belong to either a model or profile");
    return;
  }

  const pkg = findPackageById(project, packageId, modelId, profileId, context);
  if (!pkg) {
    console.warn(`Package not found: ${packageId}`);
    return;
  }

  originalItemData = JSON.parse(JSON.stringify(pkg));

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderPackageDetails(pkg);
  }

  showItemContainer();
  hideModelContainer();
  hideProfileContainer();
}

/**
 * Handle select class from tree
 * @param {string} classId - Class ID
 * @param {string} modelId - Model ID
 * @param {string} profileId - Profile ID
 * @param {string} activeTab - Active tab name (optional)
 */
function handleSelectClass(
  classId,
  modelId = "",
  profileId = "",
  activeTab = "item-attributes"
) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  const context =
    modelId && modelId !== ""
      ? "model"
      : profileId && profileId !== ""
      ? "profile"
      : null;

  if (!context) {
    console.error("Class must belong to either a model or profile");
    return;
  }

  const cls = findClassById(project, classId, modelId, profileId, context);
  if (!cls) {
    console.warn(`Class not found: ${classId}`);
    return;
  }

  originalItemData = JSON.parse(JSON.stringify(cls));

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderClassDetails(cls);
    activateTab(activeTab);
  }

  showItemContainer();
  hideModelContainer();
  hideProfileContainer();
}

/**
 * Handle select enumeration from tree
 * Opens class with literals tab active
 */
function handleSelectEnumeration(classId, modelId = "", profileId = "") {
  handleSelectClass(classId, modelId, profileId, "item-literals");
}

/**
 * Handle select attribute from tree
 * Opens parent class with attributes tab active
 */
function handleSelectAttribute(attrId, parentClassId = "", modelId = "", profileId = "") {
  if (parentClassId) {
    selectParentClassInTree({ id: parentClassId, modelId, profileId });
    handleSelectClass(parentClassId, modelId, profileId, "item-attributes");
    return;
  }

  const project = getProjectById(currentProjectId);
  if (!project) return;

  const parentClass = findClassByAttributeId(project, attrId);
  if (!parentClass) {
    console.warn(`Parent class not found for attribute: ${attrId}`);
    return;
  }

  const parentModelId = parentClass.modelId || "";
  const parentProfileId = parentClass.profileId || "";

  // ✅ Select parent class in tree
  selectParentClassInTree(parentClass);

  // Select parent class with attributes tab active
  handleSelectClass(parentClass.id, parentModelId, parentProfileId, "item-attributes");
}

/**
 * Handle select link from tree
 * Opens parent class with links tab active
 */
function handleSelectLink(linkId, parentClassId = "", modelId = "", profileId = "") {
  if (parentClassId) {
    selectParentClassInTree({ id: parentClassId, modelId, profileId });
    handleSelectClass(parentClassId, modelId, profileId, "item-links");
    return;
  }

  const project = getProjectById(currentProjectId);
  if (!project) return;

  const parentClass = findClassByLinkId(project, linkId);
  if (!parentClass) {
    console.warn(`Parent class not found for link: ${linkId}`);
    return;
  }

  const parentModelId = parentClass.modelId || "";
  const parentProfileId = parentClass.profileId || "";

  // ✅ Select parent class in tree
  selectParentClassInTree(parentClass);

  // Select parent class with links tab active
  handleSelectClass(parentClass.id, parentModelId, parentProfileId, "item-links");
}

/**
 * Handle select literal from tree
 * Opens parent class with literals tab active
 */
function handleSelectLiteral(literalId, parentClassId = "", modelId = "", profileId = "") {
  if (parentClassId) {
    selectParentClassInTree({ id: parentClassId, modelId, profileId });
    handleSelectClass(parentClassId, modelId, profileId, "item-literals");
    return;
  }

  const project = getProjectById(currentProjectId);
  if (!project) return;

  const parentClass = findClassByLiteralId(project, literalId);
  if (!parentClass) {
    console.warn(`Parent class not found for literal: ${literalId}`);
    return;
  }

  const parentModelId = parentClass.modelId || "";
  const parentProfileId = parentClass.profileId || "";

  // ✅ Select parent class in tree
  selectParentClassInTree(parentClass);

  // Select parent class with literals tab active
  handleSelectClass(parentClass.id, parentModelId, parentProfileId, "item-literals");
}

// ============================================================
// TAB ACTIVATION
// ============================================================

/**
 * Activate a specific tab in class details
 * @param {string} tabName - Tab name (item-attributes, item-links, item-literals)
 */
function activateTab(tabName) {
  // Wait for DOM to be ready
  requestAnimationFrame(() => {
    // If requested tab doesn't exist (e.g., Enumeration has only item-literals),
    // keep the renderer's default active tab/content.
    const targetTab = document.querySelector(`[data-section-tab="${tabName}"]`);
    const targetContent = document.querySelector(`[data-tab-content="${tabName}"]`);
    if (!targetTab || !targetContent) {
      return;
    }

    // Remove active class from all tabs
    document
      .querySelectorAll("[data-section-tab]")
      .forEach((tab) => tab.classList.remove("active"));

    // Add active class to specified tab
    targetTab.classList.add("active");

    // Hide all tab content
    document
      .querySelectorAll("[data-tab-content]")
      .forEach((content) => content.classList.remove("active"));

    // Show selected tab content
    targetContent.classList.add("active");

    // Hide all action buttons
    document
      .querySelectorAll(".tab-action-btn")
      .forEach((btn) => btn.classList.add("hidden"));

    // Show corresponding action button
    const selectedActionBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedActionBtn) {
      selectedActionBtn.classList.remove("hidden");
    }
  });
}

// ============================================================
// ITEM DETAILS CLICK HANDLER
// ============================================================
function handleItemDetailsClick(e) {
  const target = e.target instanceof HTMLElement ? e.target : null;
  if (!target) return;

  // Navigate to target class from links table
  const navigateToTargetClassEl = target.closest(
    "[data-action='navigate-to-target-class']"
  );
  if (navigateToTargetClassEl) {
    const classId = navigateToTargetClassEl.getAttribute("data-target-class-id");
    const modelId = navigateToTargetClassEl.getAttribute("data-model-id");
    const profileId = navigateToTargetClassEl.getAttribute("data-profile-id");
    if (! classId) {
      alert("Целевой класс не указан (targetClassId пустой).");
      return;
    }

    handleNavigateToClass(classId, modelId, profileId, "item-links", true);
    return;
  }

  // Navigate to package
  const navigateToPackageEl = target.closest(
    "[data-action='navigate-to-package']"
  );
  if (navigateToPackageEl) {
    const packageId = navigateToPackageEl.getAttribute("data-package-id");
    const modelId = navigateToPackageEl.getAttribute("data-model-id");
    const profileId = navigateToPackageEl.getAttribute("data-profile-id");
    if (packageId) handleNavigateToPackage(packageId, modelId, profileId);
    return;
  }

  // Navigate to class
  const navigateToClassEl = target.closest("[data-action='navigate-to-class']");
  if (navigateToClassEl) {
    const classId = navigateToClassEl.getAttribute("data-class-id");
    const modelId = navigateToClassEl.getAttribute("data-model-id");
    const profileId = navigateToClassEl.getAttribute("data-profile-id");
    if (classId) handleNavigateToClass(classId, modelId, profileId);
    return;
  }

  // ✅ Tab switching (works in both modes)
  const tabBtn = target.closest("[data-section-tab]");
  if (tabBtn) {
    handleTabSwitch(tabBtn);
    return;
  }

  // Cancel buttons
  if (target.closest("#pkg-cancel-btn")) {
    handleCancelPackageEdit();
    return;
  }
  if (target.closest("#cls-cancel-btn")) {
    handleCancelClassEdit();
    return;
  }

  // Add buttons
  const addAttrBtn = target.closest("#add-attribute-btn");
  if (addAttrBtn) {
    handleAddAttribute(addAttrBtn.getAttribute("data-class-id"));
    return;
  }

  const addLinkBtn = target.closest("#add-link-btn");
  if (addLinkBtn) {
    handleAddLink(addLinkBtn.getAttribute("data-class-id"));
    return;
  }

  const addLiteralBtn = target.closest("#add-literal-btn");
  if (addLiteralBtn) {
    handleAddLiteral(addLiteralBtn.getAttribute("data-class-id"));
    return;
  }

  // Edit/Delete buttons
  const editAttrBtn = target.closest("[data-action='edit-attribute']");
  if (editAttrBtn) {
    handleEditAttribute(editAttrBtn.getAttribute("data-attr-id"));
    return;
  }

  const deleteAttrBtn = target.closest("[data-action='delete-attribute']");
  if (deleteAttrBtn) {
    handleDeleteAttribute(deleteAttrBtn.getAttribute("data-attr-id"));
    return;
  }

  const editLinkBtn = target.closest("[data-action='edit-link']");
  if (editLinkBtn) {
    handleEditLink(
      editLinkBtn.getAttribute("data-link-id"),
      editLinkBtn.getAttribute("data-class-id")
    );
    return;
  }

  const deleteLinkBtn = target.closest("[data-action='delete-link']");
  if (deleteLinkBtn) {
    handleDeleteLink(
      deleteLinkBtn.getAttribute("data-link-id"),
      deleteLinkBtn.getAttribute("data-class-id")
    );
    return;
  }

  const editLiteralBtn = target.closest("[data-action='edit-literal']");
  if (editLiteralBtn) {
    handleEditLiteral(editLiteralBtn.getAttribute("data-literal-id"));
    return;
  }

  const deleteLiteralBtn = target.closest("[data-action='delete-literal']");
  if (deleteLiteralBtn) {
    handleDeleteLiteral(deleteLiteralBtn.getAttribute("data-literal-id"));
    return;
  }
}

// ============================================================
// TAB SWITCHING
// ============================================================
function handleTabSwitch(tabBtn) {
  const tabName = tabBtn.getAttribute("data-section-tab");
  lastClassTabName = tabName;

  // Remove active class from all tabs
  document.querySelectorAll("[data-section-tab]").forEach((tab) => tab.classList.remove("active"));
  tabBtn.classList.add("active");

  // Hide all tab content
  document
    .querySelectorAll("[data-tab-content]")
    .forEach((content) => content.classList.remove("active"));

  // Show selected tab content
  const selectedContent = document.querySelector(
    `[data-tab-content="${tabName}"]`
  );
  console.log("Selected content for tab:", tabName, selectedContent);
  if (selectedContent) {
    selectedContent.classList.add("active");
  }

  // Hide all action buttons
  document
    .querySelectorAll(".tab-action-btn")
    .forEach((btn) => btn.classList.add("hidden"));

  // Show corresponding action button
  const selectedActionBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedActionBtn) {
    selectedActionBtn.classList.remove("hidden");
  }
}

function getActiveClassTabName() {
  const activeTab = document.querySelector("[data-section-tab].active");
  return activeTab ? activeTab.getAttribute("data-section-tab") : null;
}

function restoreClassTab(tabName) {
  if (!tabName) return;

  const tabEl = document.querySelector(`[data-section-tab="${tabName}"]`);
  if (tabEl) {
    handleTabSwitch(tabEl);
  }
}

// ============================================================
// NAVIGATION
// ============================================================
function handleNavigateToPackage(packageId, modelId = "", profileId = "") {
  const context =
    modelId && modelId !== ""
      ? "model"
      : profileId && profileId !== ""
      ? "profile"
      : null;
  if (!context) return;

  const project = getProjectById(currentProjectId);
  if (!project) return;

  const parentChain = findPackageParentChain(
    project,
    packageId,
    modelId,
    profileId,
    context
  );
  if (!parentChain || parentChain.length === 0) return;

  expandTreePath(parentChain);

  requestAnimationFrame(() => {
    const selector =
      context === "model"
        ? `[data-type="package"][data-package-id="${packageId}"][data-model-id="${modelId}"]`
        : `[data-type="package"][data-package-id="${packageId}"][data-profile-id="${profileId}"]`;

    const packageEl = document.querySelector(selector);
    if (packageEl) {
      setSelectedTreeItem(packageEl);
      packageEl.scrollIntoView({ behavior: "smooth", block: "center" });
      handleSelectPackage(packageId, modelId, profileId);
    }
  });
}

function handleNavigateToClass(
  classId,
  modelId = "",
  profileId = "",
  activeTab = "item-attributes",
  showAlertOnNotFound = false
) {
  const context =
    modelId && modelId !== ""
      ? "model"
      : profileId && profileId !== ""
      ? "profile"
      : null;
  if (!context) {
    if (showAlertOnNotFound) {
      alert(
        "Невозможно перейти к классу: не определён контекст модели/профиля."
      );
    }
    return;
  }

  const project = getProjectById(currentProjectId);
  if (!project) return;

  const parentChain = findClassParentChain(
    project,
    classId,
    modelId,
    profileId,
    context
  );
  if (!parentChain || parentChain.length === 0) {
    if (showAlertOnNotFound) {
      alert(
        "Класс не найден в дереве в пределах текущей модели/профиля (по targetClassId)."
      );
    }
    return;
  }

  expandTreePath(parentChain);

  requestAnimationFrame(() => {
    const selector =
      context === "model"
        ? `[data-type="class"][data-class-id="${classId}"][data-model-id="${modelId}"]`
        : `[data-type="class"][data-class-id="${classId}"][data-profile-id="${profileId}"]`;

    const classEl = document.querySelector(selector);
    if (classEl) {
      setSelectedTreeItem(classEl);
      classEl.scrollIntoView({ behavior: "smooth", block: "center" });
      handleSelectClass(classId, modelId, profileId, activeTab);
    } else if (showAlertOnNotFound) {
      alert(
        "Класс не найден в дереве в пределах текущей модели/профиля (по targetClassId)."
      );
    }
  });
}

function expandTreePath(parentChain) {
  const expandedProjects = JSON.parse(
    localStorage.getItem("cim.expandedProjects") || "{}"
  );
  expandedProjects[currentProjectId] = true;
  localStorage.setItem(
    "cim.expandedProjects",
    JSON.stringify(expandedProjects)
  );

  const expandedItems = JSON.parse(
    localStorage.getItem("cim.expandedTreeItems") || "{}"
  );
  parentChain.forEach((itemId) => {
    expandedItems[itemId] = true;
  });
  localStorage.setItem("cim.expandedTreeItems", JSON.stringify(expandedItems));

  parentChain.forEach((itemId) => expandTreeItem(itemId));
}

function expandTreeItem(itemId) {
  const toggleBtn = document.querySelector(`[data-item-id="${itemId}"]`);
  if (!toggleBtn) return;

  toggleBtn.setAttribute("aria-expanded", "true");

  const icon = toggleBtn.querySelector(".tree-expand-icon, .expand-icon");
  if (icon) icon.textContent = "▼";

  const treeItem = toggleBtn.closest(
    ".tree-structure-item, .project-tree-item"
  );
  if (!treeItem) return;

  for (let child of treeItem.children) {
    if (
      child.classList.contains("tree-structure-children") ||
      child.classList.contains("project-structure")
    ) {
      child.classList.remove("hidden");
      break;
    }
  }
}

// ============================================================
// FIND PARENT CHAIN
// ============================================================
function findPackageParentChain(
  project,
  packageId,
  modelId,
  profileId,
  context
) {
  const searchInPackages = (packages, currentPath, isSubPackage = false) => {
    for (let idx = 0; idx < packages.length; idx++) {
      const pkg = packages[idx];
      const prefix = isSubPackage ? "sub" : "pkg";
      const pkgPath = [...currentPath, `${prefix}-${idx}`];

      if (pkg.id === packageId) return pkgPath;

      if (pkg.subPackages && pkg.subPackages.length > 0) {
        const found = searchInPackages(pkg.subPackages, [...pkgPath], true);
        if (found) return found;
      }
    }
    return null;
  };

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (!model) return [];

    const modelItemId = `model-${currentProjectId}-${modelId}`;
    if (model.rootPackages?.[0]?.packages) {
      const found = searchInPackages(
        model.rootPackages[0].packages,
        [modelItemId],
        false
      );
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (!profile) return [];

    const profileItemId = `profile-${currentProjectId}-${profileId}`;
    if (profile.rootPackages?.[0]?.packages) {
      const found = searchInPackages(
        profile.rootPackages[0].packages,
        [profileItemId],
        false
      );
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  return [];
}

function findClassParentChain(project, classId, modelId, profileId, context) {
  const searchInPackages = (packages, currentPath, isSubPackage = false) => {
    for (let idx = 0; idx < packages.length; idx++) {
      const pkg = packages[idx];
      const prefix = isSubPackage ? "sub" : "pkg";
      const pkgPath = [...currentPath, `${prefix}-${idx}`];

      if (pkg.classes) {
        const classIdx = pkg.classes.findIndex((c) => c.id === classId);
        if (classIdx !== -1) return pkgPath;
      }

      if (pkg.subPackages && pkg.subPackages.length > 0) {
        const found = searchInPackages(pkg.subPackages, [...pkgPath], true);
        if (found) return found;
      }
    }
    return null;
  };

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (!model) return [];

    const modelItemId = `model-${currentProjectId}-${modelId}`;
    if (model.rootPackages?.[0]?.packages) {
      const found = searchInPackages(
        model.rootPackages[0].packages,
        [modelItemId],
        false
      );
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (!profile) return [];

    const profileItemId = `profile-${currentProjectId}-${profileId}`;
    if (profile.rootPackages?.[0]?.packages) {
      const found = searchInPackages(
        profile.rootPackages[0].packages,
        [profileItemId],
        false
      );
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  return [];
}

// ============================================================
// FORM SUBMIT HANDLER
// ============================================================
function handleItemDetailsSubmit(e) {
  e.preventDefault();
  const form = e.target;

  if (form.id === "package-form") handleSavePackage(form);
  else if (form.id === "class-form") handleSaveClass(form);
}

// ============================================================
// PACKAGE HANDLERS
// ============================================================
function handleSavePackage(form) {
  const packageId = form.getAttribute("data-package-id");
  const updatedData = {
    name: document.getElementById("pkg-name").value.trim(),
    documentation: document.getElementById("pkg-documentation").value.trim(),
    documentationRu: document
      .getElementById("pkg-documentationRu")
      .value.trim(),
    details: document.getElementById("pkg-details").value.trim(),
  };

  console.log("💾 Сохранение пакета:", packageId, updatedData);
  alert("Функция сохранения пакета в разработке");
}

function handleCancelPackageEdit() {
  if (!originalItemData) return;
  if (!confirm("Отменить изменения?  Несохранённые данные будут потеряны."))
    return;

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent)
    itemDetailsContent.innerHTML = renderPackageDetails(originalItemData);
}

// ============================================================
// CLASS HANDLERS
// ============================================================
function handleSaveClass(form) {
  const classId = form.getAttribute("data-class-id");
  const updatedData = {
    name: document.getElementById("cls-name").value.trim(),
    stereotype: document.getElementById("cls-stereotype").value.trim(),
    isAbstract: document.getElementById("cls-isAbstract").checked,
    documentation: document.getElementById("cls-documentation").value.trim(),
    documentationRu: document
      .getElementById("cls-documentationRu")
      .value.trim(),
    details: document.getElementById("cls-details").value.trim(),
  };

  console.log("💾 Сохранение класса:", classId, updatedData);
  alert("Функция сохранения класса в разработке");
}

function handleCancelClassEdit() {
  if (!originalItemData) return;
  if (!confirm("Отменить изменения? Несохранённые данные будут потеряны."))
    return;

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent)
    itemDetailsContent.innerHTML = renderClassDetails(originalItemData);
}

// ============================================================
// ATTRIBUTE HANDLERS
// ============================================================
function handleAddAttribute(classId) {
  alert("Функция добавления атрибута в разработке");
}

function handleEditAttribute(attrId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  const found = findAttributeWithParent(project, attrId);
  if (!found) return;

  openEditAttributeModal(found.attr);
}

function handleDeleteAttribute(attrId) {
  if (!confirm("Удалить атрибут?")) return;
  alert("Функция удаления атрибута в разработке");
}

// ============================================================
// LINK HANDLERS
// ============================================================
function handleAddLink(classId) {
  alert("Функция добавления связи в разработке");
}

function handleEditLink(linkId, classId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  const found = findLinkWithParent(project, classId, linkId);
  if (!found) return;

  openEditLinkModal(found.link, found.cls.id);
}

function handleDeleteLink(linkId, classId) {
  if (!confirm("Удалить связь?")) return;

  const project = getProjectById(currentProjectId);
  if (!project) return;

  const tabToRestore = getActiveClassTabName() || lastClassTabName;

  const found = findLinkWithParent(project, classId, linkId);
  if (!found) return;

  if (!Array.isArray(found.cls.links)) return;
  const idx = found.cls.links.findIndex((l) => l.linkId === linkId);
  if (idx < 0) return;

  found.cls.links.splice(idx, 1);

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderClassDetails(found.cls);
    restoreClassTab(tabToRestore);
  }
}

// ============================================================
// LITERAL HANDLERS
// ============================================================
function handleAddLiteral(classId) {
  alert("Функция добавления значения в разработке");
}

function handleEditLiteral(literalId) {
  alert("Функция редактирования значения в разработке");
}

function handleDeleteLiteral(literalId) {
  if (!confirm("Удалить значение?")) return;
  alert("Функция удаления значения в разработке");
}

// ============================================================
// FIND HELPERS
// ============================================================
function findPackageById(
  project,
  packageId,
  modelId = "",
  profileId = "",
  context = null
) {
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

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (model?.rootPackages?.[0]?.packages) {
      return searchInPackages(model.rootPackages[0].packages);
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (profile?.rootPackages?.[0]?.packages) {
      return searchInPackages(profile.rootPackages[0].packages);
    }
  }

  return null;
}

function findClassById(
  project,
  classId,
  modelId = "",
  profileId = "",
  context = null
) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        const cls = pkg.classes.find((c) => c.id === classId);
        if (cls) return cls;
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (model?.rootPackages?.[0]?.packages) {
      return searchInPackages(model.rootPackages[0].packages);
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (profile?.rootPackages?.[0]?.packages) {
      return searchInPackages(profile.rootPackages[0].packages);
    }
  }

  return null;
}

function findAttributeWithParent(project, attrId) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.attributes) {
            const attr = cls.attributes.find((a) => a.id === attrId);
            if (attr) return { attr, cls };
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

  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(model.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(profile.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  return null;
}

function findLinkWithParent(project, classId, linkId) {
  if (!classId || !linkId) return null;

  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        const cls = pkg.classes.find((c) => c.id === classId);
        if (cls) {
          const link = cls.links?.find((l) => l.linkId === linkId);
          if (link) return { link, cls };
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(model.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(profile.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  return null;
}

// ============================================================
// MODEL/PROFILE CRUD
// ============================================================
function handleEditModel(modelId) {
  openEditModelModal(modelId);
}

function handleImportModel() {
  alert("Функция импорта в разработке");
}

function handleExportModel() {
  alert("Функция экспорта в разработке");
}

function handleCheckModel() {
  alert("Функция проверки в разработке");
}

function handleDeleteModel(modelId) {
  const model = getModel(currentProjectId, modelId);
  if (!model) return;

  if (!confirm(`Удалить модель "${model.name}"?`)) return;

  deleteModel(currentProjectId, modelId);
  renderModelsContainer();
  renderProjectTreeSidebar();

  if (selectedModelId === modelId) {
    selectedModelId = null;
  }
}

function handleEditProfile(profileId) {
  openEditProfileModal(profileId);
}

function handleImportProfile() {
  alert("Функция импорта в разработке");
}

function handleExportProfile() {
  alert("Функция экспорта в разработке");
}

function handleCheckProfile() {
  alert("Функция проверки в разработке");
}

function handleDeleteProfile(profileId) {
  const profile = getProfile(currentProjectId, profileId);
  if (!profile) return;

  if (!confirm(`Удалить профиль "${profile.name}"?`)) return;

  deleteProfile(currentProjectId, profileId);
  renderProfilesContainer();
  renderProjectTreeSidebar();

  if (selectedProfileId === profileId) {
    selectedProfileId = null;
  }
}

// ============================================================
// FIND PARENT CLASS HELPERS
// ============================================================

/**
 * Find class that contains the attribute
 * ✅ FIXED: Returns class WITH context (modelId/profileId)
 * @param {Object} project - Project object
 * @param {string} attrId - Attribute ID
 * @returns {Object|null} Parent class object with modelId/profileId or null
 */
function findClassByAttributeId(project, attrId) {
  const searchInPackages = (packages, modelId = "", profileId = "") => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.attributes) {
            const hasAttribute = cls.attributes.some(a => a.id === attrId);
            if (hasAttribute) {
              // ✅ Return class with context
              return {
                ...cls,
                modelId: cls.modelId || modelId,
                profileId: cls.profileId || profileId
              };
            }
          }
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages, modelId, profileId);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          model.rootPackages[0].packages,
          model.id,  // ✅ Pass modelId
          ""         // ✅ profileId is empty for models
        );
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          profile.rootPackages[0].packages,
          "",          // ✅ modelId is empty for profiles
          profile.id   // ✅ Pass profileId
        );
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Find class that contains the link
 * ✅ FIXED: Returns class WITH context (modelId/profileId)
 * @param {Object} project - Project object
 * @param {string} linkId - Link ID
 * @returns {Object|null} Parent class object with modelId/profileId or null
 */
function findClassByLinkId(project, linkId) {
  const searchInPackages = (packages, modelId = "", profileId = "") => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.links) {
            const hasLink = cls.links.some(l => l.linkId === linkId);
            if (hasLink) {
              // ✅ Return class with context
              return {
                ...cls,
                modelId: cls.modelId || modelId,
                profileId: cls.profileId || profileId
              };
            }
          }
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages, modelId, profileId);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          model.rootPackages[0].packages,
          model.id,  // ✅ Pass modelId
          ""         // ✅ profileId is empty
        );
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          profile.rootPackages[0].packages,
          "",          // ✅ modelId is empty
          profile.id   // ✅ Pass profileId
        );
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Find class that contains the literal
 * ✅ FIXED: Returns class WITH context (modelId/profileId)
 * @param {Object} project - Project object
 * @param {string} literalId - Literal ID
 * @returns {Object|null} Parent class object with modelId/profileId or null
 */
function findClassByLiteralId(project, literalId) {
  const searchInPackages = (packages, modelId = "", profileId = "") => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.literals) {
            const hasLiteral = cls.literals.some(l => l.id === literalId);
            if (hasLiteral) {
              // ✅ Return class with context
              return {
                ...cls,
                modelId: cls.modelId || modelId,
                profileId: cls.profileId || profileId
              };
            }
          }
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages, modelId, profileId);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          model.rootPackages[0].packages,
          model.id,  // ✅ Pass modelId
          ""         // ✅ profileId is empty
        );
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          profile.rootPackages[0].packages,
          "",          // ✅ modelId is empty
          profile.id   // ✅ Pass profileId
        );
        if (found) return found;
      }
    }
  }

  return null;
}


/**
 * Select parent class element in tree
 * @param {Object} parentClass - Parent class object with modelId/profileId
 */
function selectParentClassInTree(parentClass) {
  if (!parentClass) return;

  const modelId = parentClass.modelId || "";
  const profileId = parentClass.profileId || "";
  const context = modelId && modelId !== "" ? "model" :  "profile";

  const selector = context === "model"
    ? `[data-type="class"][data-class-id="${parentClass.id}"][data-model-id="${modelId}"]`
    : `[data-type="class"][data-class-id="${parentClass.id}"][data-profile-id="${profileId}"]`;

  const classEl = document.querySelector(selector);
  if (classEl) {
    setSelectedTreeItem(classEl);
  }
}


// ============================================================
// UTILITY
// ============================================================
function setSelectedTreeItem(el) {
  const previouslySelected = document.querySelector(
    ".project-tree-item * .tree-structure-name.selected"
  );
  if (previouslySelected) previouslySelected.classList.remove("selected");
  if (el) el.classList.add("selected");
}

console.log("Project Details Page Module Loaded");
