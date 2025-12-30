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
let originalItemData = null; // ✅ Для хранения исходных данных при редактировании

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
        setSelectedTreeItem(selectModelEl);
        const modelId = selectModelEl.getAttribute("data-model-id");
        if (modelId) selectModel(modelId);
        return;
      }

      // Select profile from tree
      const selectProfileEl = target.closest("[data-action='select-profile']");
      if (selectProfileEl) {
        setSelectedTreeItem(selectProfileEl);
        const profileId = selectProfileEl.getAttribute("data-profile-id");
        if (profileId) selectProfile(profileId);
        return;
      }

      // ✅ Select package from tree (NEW)
      const selectPackageEl = target.closest("[data-action='select-package']");
      if (selectPackageEl) {
        setSelectedTreeItem(selectPackageEl);
        const packageId = selectPackageEl.getAttribute("data-package-id");
        if (packageId) handleSelectPackage(packageId);
        return;
      }

      // ✅ Select class from tree (NEW)
      const selectClassEl = target.closest("[data-action='select-class']");
      if (selectClassEl) {
        setSelectedTreeItem(selectClassEl);
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

  // ✅ Delegated events on item-details-content
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.addEventListener("click", handleItemDetailsClick);
    itemDetailsContent.addEventListener("submit", handleItemDetailsSubmit);
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
  showModelContainer();
  showProfileContainer();
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
  showModelContainer();
  showProfileContainer();
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

function showModelContainer() {
  const modelContainer = document.getElementById("models-container");
  if (modelContainer) {
    modelContainer.classList.remove("hidden");
  }
}

/**
 * Hide model container
 */
function hideModelContainer() {
  const modelContainer = document.getElementById("models-container");
  if (modelContainer) {
    modelContainer.classList.add("hidden");
  }
}


function showProfileContainer() {
  const profileContainer = document.getElementById("profiles-container");
  if (profileContainer) {
    profileContainer.classList.remove("hidden");
  }
}

/**
 * Hide profile container
 */
function hideProfileContainer() {
  const profileContainer = document.getElementById("profiles-container");
  if (profileContainer) {
    profileContainer.classList.add("hidden");
  }
}

/**
 * Handle select package from tree
 */
function handleSelectPackage(packageId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  const pkg = findPackageById(project, packageId);
  if (!pkg) {
    console.warn(`Package not found: ${packageId}`);
    return;
  }

  // ✅ Store original for cancel
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
 */
function handleSelectClass(classId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  const cls = findClassById(project, classId);
  if (!cls) {
    console.warn(`Class not found: ${classId}`);
    return;
  }

  // ✅ Store original for cancel
  originalItemData = JSON.parse(JSON.stringify(cls));

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderClassDetails(cls);
  }

  showItemContainer();
  hideModelContainer();
  hideProfileContainer();
}

/**
 * Handle select attribute from tree
 */
function handleSelectAttribute(attrId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  const attr = findAttributeById(project, attrId);
  if (!attr) {
    console.warn(`Attribute not found: ${attrId}`);
    return;
  }

  // ✅ Store original for cancel
  originalItemData = JSON.parse(JSON.stringify(attr));

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderAttributeDetails(attr);
  }

  showItemContainer();
  hideModelContainer();
  hideProfileContainer();
}


/**
 * Handle select link from tree
 */
function handleSelectLink(linkId) {
  const project = getProjectById(currentProjectId);
  if (!project) return;

  const link = findLinkById(project, linkId);
  if (!link) {
    console.warn(`Link not found: ${linkId}`);
    return;
  }

  // ✅ Store original for cancel
  originalItemData = JSON.parse(JSON.stringify(link));

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderLinkDetails(link);
  }

  showItemContainer();
  hideModelContainer();
  hideProfileContainer();
}

/**
 * ✅ Handle clicks in item details (NEW)
 */
function handleItemDetailsClick(e) {
  const target = e.target instanceof HTMLElement ? e.target : null;
  if (!target) return;

  // ✅ Tab switching (NEW)
  const tabBtn = target.closest("[data-section-tab]");
  if (tabBtn) {
    handleTabSwitch(tabBtn);
    return;
  }


  // Package form cancel
  const pkgCancelBtn = target.closest("#pkg-cancel-btn");
  if (pkgCancelBtn) {
    handleCancelPackageEdit();
    return;
  }

  // Class form cancel
  const clsCancelBtn = target.closest("#cls-cancel-btn");
  if (clsCancelBtn) {
    handleCancelClassEdit();
    return;
  }

  // Attribute form cancel
  const attrCancelBtn = target.closest("#attr-cancel-btn");
  if (attrCancelBtn) {
    handleCancelAttributeEdit();
    return;
  }

  // Link form cancel
  const linkCancelBtn = target.closest("#link-cancel-btn");
  if (linkCancelBtn) {
    handleCancelLinkEdit();
    return;
  }

  // Add attribute button
  const addAttrBtn = target.closest("#add-attribute-btn");
  if (addAttrBtn) {
    const classId = addAttrBtn.getAttribute("data-class-id");
    handleAddAttribute(classId);
    return;
  }

  // Add link button
  const addLinkBtn = target.closest("#add-link-btn");
  if (addLinkBtn) {
    const classId = addLinkBtn.getAttribute("data-class-id");
    handleAddLink(classId);
    return;
  }

  // Add literal button
  const addLiteralBtn = target.closest("#add-literal-btn");
  if (addLiteralBtn) {
    const classId = addLiteralBtn.getAttribute("data-class-id");
    handleAddLiteral(classId);
    return;
  }

  // Edit attribute
  const editAttrBtn = target.closest("[data-action='edit-attribute']");
  if (editAttrBtn) {
    const attrId = editAttrBtn.getAttribute("data-attr-id");
    handleEditAttribute(attrId);
    return;
  }

  // Delete attribute
  const deleteAttrBtn = target.closest("[data-action='delete-attribute']");
  if (deleteAttrBtn) {
    const attrId = deleteAttrBtn.getAttribute("data-attr-id");
    handleDeleteAttribute(attrId);
    return;
  }

  // Edit link
  const editLinkBtn = target.closest("[data-action='edit-link']");
  if (editLinkBtn) {
    const linkId = editLinkBtn.getAttribute("data-link-id");
    handleEditLink(linkId);
    return;
  }

  // Delete link
  const deleteLinkBtn = target.closest("[data-action='delete-link']");
  if (deleteLinkBtn) {
    const linkId = deleteLinkBtn.getAttribute("data-link-id");
    handleDeleteLink(linkId);
    return;
  }

  // Edit literal
  const editLiteralBtn = target.closest("[data-action='edit-literal']");
  if (editLiteralBtn) {
    const literalId = editLiteralBtn.getAttribute("data-literal-id");
    handleEditLiteral(literalId);
    return;
  }

  // Delete literal
  const deleteLiteralBtn = target.closest("[data-action='delete-literal']");
  if (deleteLiteralBtn) {
    const literalId = deleteLiteralBtn.getAttribute("data-literal-id");
    handleDeleteLiteral(literalId);
    return;
  }
}

/**
 * ✅ Handle tab switching (NEW)
 */
function handleTabSwitch(tabBtn) {
  const tabName = tabBtn.getAttribute("data-section-tab");
  const classId = tabBtn.getAttribute("data-class-id");

  // Remove active class from all tabs
  const allTabs = document.querySelectorAll("[data-section-tab]");
  allTabs.forEach(tab => tab.classList.remove("active"));

  // Add active class to clicked tab
  tabBtn.classList.add("active");

  // Hide all tab content sections
  const allContent = document.querySelectorAll("[data-tab-content]");
  allContent.forEach(content => content.classList.remove("active"));

  // Show selected tab content
  const selectedContent = document.querySelector(`[data-tab-content="${tabName}"]`);
  if (selectedContent) {
    selectedContent.classList.add("active");
  }

  // Hide all action buttons
  const allActionBtns = document.querySelectorAll(".tab-action-btn");
  allActionBtns.forEach(btn => btn.classList.add("hidden"));

  // Show corresponding action button
  const selectedActionBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedActionBtn) {
    selectedActionBtn.classList.remove("hidden");
  }

  console.log(`📑 Переключение на таб: ${tabName}`);
}

/**
 * ✅ Handle form submissions in item details (NEW)
 */
function handleItemDetailsSubmit(e) {
  e.preventDefault();

  const form = e.target;

  // Package form
  if (form.id === "package-form") {
    handleSavePackage(form);
    return;
  }

  // Class form
  if (form.id === "class-form") {
    handleSaveClass(form);
    return;
  }

  // Attribute form
  if (form.id === "attribute-form") {
    handleSaveAttribute(form);
    return;
  }

  // Link form
  if (form.id === "link-form") {
    handleSaveLink(form);
    return;
  }
}

// ============================================================
// ✅ PACKAGE HANDLERS (NEW)
// ============================================================

/**
 * Save package changes
 */
function handleSavePackage(form) {
  const packageId = form.getAttribute("data-package-id");

  const updatedData = {
    name: document.getElementById("pkg-name").value.trim(),
    type: document.getElementById("pkg-type").value.trim(),
    documentation: document.getElementById("pkg-documentation").value.trim(),
    documentationRu: document.getElementById("pkg-documentationRu").value.trim(),
    details: document.getElementById("pkg-details").value.trim(),
  };

  console.log("💾 Сохранение пакета:", packageId, updatedData);
  alert("Функция сохранения пакета в разработке");

  // TODO: Call service to update package
  // updatePackage(currentProjectId, packageId, updatedData);
  // renderProjectTreeSidebar();
}

/**
 * Cancel package edit (restore original)
 */
function handleCancelPackageEdit() {
  if (! originalItemData) return;

  const confirmed = confirm("Отменить изменения?   Несохранённые данные будут потеряны.");
  if (!confirmed) return;

  // Re-render with original data
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderPackageDetails(originalItemData);
  }

  console.log("↩️ Отмена редактирования пакета");
}

// ============================================================
// ✅ CLASS HANDLERS (NEW)
// ============================================================

/**
 * Save class changes
 */
function handleSaveClass(form) {
  const classId = form.getAttribute("data-class-id");

  const updatedData = {
    name: document.getElementById("cls-name").value.trim(),
    stereotype: document.getElementById("cls-stereotype").value.trim(),
    type: document.getElementById("cls-type").value,
    isAbstract: document.getElementById("cls-isAbstract").checked,
    documentation: document.getElementById("cls-documentation").value.trim(),
    documentationRu: document.getElementById("cls-documentationRu").value.trim(),
    details: document.getElementById("cls-details").value.trim(),
  };

  console.log("💾 Сохранение класса:", classId, updatedData);
  alert("Функция сохранения класса в разработке");

  // TODO: Call service to update class
  // updateClass(currentProjectId, classId, updatedData);
  // renderProjectTreeSidebar();
}

/**
 * Cancel class edit (restore original)
 */
function handleCancelClassEdit() {
  if (!originalItemData) return;

  const confirmed = confirm("Отменить изменения?  Несохранённые данные будут потеряны.");
  if (!confirmed) return;

  // Re-render with original data
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderClassDetails(originalItemData);
  }

  console.log("↩️ Отмена редактирования класса");
}

// ============================================================
// ✅ ATTRIBUTE HANDLERS (NEW)
// ============================================================

/**
 * Add new attribute
 */
function handleAddAttribute(classId) {
  console.log("➕ Добавление атрибута для класса:", classId);
  alert("Функция добавления атрибута в разработке");

  // TODO: Open modal or inline form to create attribute
  // createAttribute(currentProjectId, classId, attributeData);
}

/**
 * Edit attribute
 */
function handleEditAttribute(attrId) {
  console.log("✏️ Редактирование атрибута:", attrId);

  const project = getProjectById(currentProjectId);
  if (!project) return;

  const attr = findAttributeById(project, attrId);
  if (!attr) {
    console.warn(`Attribute not found: ${attrId}`);
    return;
  }

  // Store original for cancel
  originalItemData = JSON.parse(JSON.stringify(attr));

  // Render attribute edit form
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderAttributeDetails(attr);
  }

  showItemContainer();
  hideModelContainer();
  hideProfileContainer();
}

/**
 * Delete attribute
 */
function handleDeleteAttribute(attrId) {
  console.log("🗑️ Удаление атрибута:", attrId);

  const confirmed = confirm("Удалить атрибут?");
  if (!confirmed) return;

  alert("Функция удаления атрибута в разработке");

  // TODO: Call service to delete attribute
  // deleteAttribute(currentProjectId, classId, attrId);
  // Re-render class details
}

/**
 * Save attribute changes
 */
function handleSaveAttribute(form) {
  const attrId = form.getAttribute("data-attr-id");

  const updatedData = {
    name: document.getElementById("attr-name").value.trim(),
    dataType: document.getElementById("attr-dataType").value.trim(),
    multiplicity: document.getElementById("attr-multiplicity").value.trim(),
    stereotype: document.getElementById("attr-stereotype").value.trim(),
    visibility: document.getElementById("attr-visibility").value,
    initialValue: document.getElementById("attr-initialValue").value.trim(),
    dataTypeId: document.getElementById("attr-dataTypeId").value.trim(),
    documentation: document.getElementById("attr-documentation").value.trim(),
    documentationRu: document.getElementById("attr-documentationRu").value.trim(),
    details: document.getElementById("attr-details").value.trim(),
  };

  console.log("💾 Сохранение атрибута:", attrId, updatedData);
  alert("Функция сохранения атрибута в разработке");

  // TODO: Call service to update attribute
  // updateAttribute(currentProjectId, classId, attrId, updatedData);
}

/**
 * Cancel attribute edit
 */
function handleCancelAttributeEdit() {
  if (!originalItemData) return;

  const confirmed = confirm("Отменить изменения?  Несохранённые данные будут потеряны.");
  if (!confirmed) return;

  // Re-render with original data
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderAttributeDetails(originalItemData);
  }

  console.log("↩️ Отмена редактирования атрибута");
}

// ============================================================
// ✅ LINK HANDLERS (NEW)
// ============================================================

/**
 * Add new link
 */
function handleAddLink(classId) {
  console.log("➕ Добавление связи для класса:", classId);
  alert("Функция добавления связи в разработке");

  // TODO: Open modal or inline form to create link
  // createLink(currentProjectId, classId, linkData);
}

/**
 * Edit link
 */
function handleEditLink(linkId) {
  console.log("✏️ Редактирование связи:", linkId);

  const project = getProjectById(currentProjectId);
  if (!project) return;

  const link = findLinkById(project, linkId);
  if (!link) {
    console.warn(`Link not found: ${linkId}`);
    return;
  }

  // Store original for cancel
  originalItemData = JSON.parse(JSON.stringify(link));

  // Render link edit form
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderLinkDetails(link);
  }

  showItemContainer();
  hideModelContainer();
  hideProfileContainer();
}

/**
 * Delete link
 */
function handleDeleteLink(linkId) {
  console.log("🗑️ Удаление связи:", linkId);

  const confirmed = confirm("Удалить связь?");
  if (!confirmed) return;

  alert("Функция удаления связи в разработке");

  // TODO: Call service to delete link
  // deleteLink(currentProjectId, classId, linkId);
  // Re-render class details
}

/**
 * Save link changes
 */
function handleSaveLink(form) {
  const linkId = form.getAttribute("data-link-id");

  const updatedData = {
    relationKind: document.getElementById("link-relationKind").value,
    role: document.getElementById("link-role").value,
    targetClassName: document.getElementById("link-targetClassName").value.trim(),
    targetClassId:  document.getElementById("link-targetClassId").value.trim(),
    multiplicity: document.getElementById("link-multiplicity").value.trim(),
    targetClassRoleName: document.getElementById("link-targetClassRoleName").value.trim(),
    srcClassRoleName: document.getElementById("link-srcClassRoleName").value.trim(),
    targetDescription: document.getElementById("link-targetDescription").value.trim(),
  };

  console.log("💾 Сохранение связи:", linkId, updatedData);
  alert("Функция сохранения связи в разработке");

  // TODO: Call service to update link
  // updateLink(currentProjectId, classId, linkId, updatedData);
}

/**
 * Cancel link edit
 */
function handleCancelLinkEdit() {
  if (!originalItemData) return;

  const confirmed = confirm("Отменить изменения? Несохранённые данные будут потеряны.");
  if (!confirmed) return;

  // Re-render with original data
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderLinkDetails(originalItemData);
  }

  console.log("↩️ Отмена редактирования связи");
}

// ============================================================
// ✅ LITERAL HANDLERS (NEW)
// ============================================================

/**
 * Add new literal
 */
function handleAddLiteral(classId) {
  console.log("➕ Добавление значения перечисления для класса:", classId);
  alert("Функция добавления значения в разработке");

  // TODO: Open modal or inline form to create literal
  // createLiteral(currentProjectId, classId, literalData);
}

/**
 * Edit literal
 */
function handleEditLiteral(literalId) {
  console.log("✏️ Редактирование значения перечисления:", literalId);
  alert("Функция редактирования значения в разработке");

  // TODO: Open modal or inline form to edit literal
}

/**
 * Delete literal
 */
function handleDeleteLiteral(literalId) {
  console.log("🗑️ Удаление значения перечисления:", literalId);

  const confirmed = confirm("Удалить значение? ");
  if (!confirmed) return;

  alert("Функция удаления значения в разработке");

  // TODO: Call service to delete literal
  // deleteLiteral(currentProjectId, classId, literalId);
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

function setSelectedTreeItem(el) {
  const previouslySelected = document.querySelector(".project-tree-item * .tree-structure-name.selected");
  if (previouslySelected) {
    previouslySelected.classList.remove("selected");
  }
  if (el) {
    el.classList.add("selected");
  }
  console.log("Selected tree item set", `${el ? el.textContent : "none"}`);
}

console.log("Project Details Page Module Loaded");
