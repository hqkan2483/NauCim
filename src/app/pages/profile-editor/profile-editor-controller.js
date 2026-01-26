import {
  getProjectById,
  appDataInit,
  getAllProjects,
} from "../../../services/project-service.js";
import {
  getProfile,
  updateProfile,
  createProfile,
} from "../../../services/profile-service.js";
import { getQueryParam } from "../../../utils/url-helper.js";
import { renderAvailableTree as renderAvailableTreeHTML } from "../../../ui/renderers/available-tree-renderer.js";
import { renderProfileTree as renderProfileTreeHTML } from "../../../ui/renderers/profile-tree-renderer.js";
import {
  transferItemsToProfile,
  removeItemsFromProfile,
  validateProfile,
  prepareProfileForSave,
  getItemDetailsByKey,
} from "../../../services/profile-editor-service.js";
import { formatTransferReport } from "../../../services/profile-editor-transfer-report.js";
import { initEditorTree } from "../../../ui/components/editor-tree.js";
import {
  initDetailsPanel,
  renderProfileEditorDetailsPanelLayout,
  renderProfileEditorDetailsTabs,
} from "../../../ui/components/profile-editor-details-panel.js";

import { loadModals } from "../../../ui/modal-loader.js";
import { initModalSystem, bindModalTriggers } from "../../../ui/modal.js";
import {
  initCreatePackageModal,
  openCreatePackageModal,
} from "../../../ui/components/create-package-modal.js";
import {
  initCreateDiagramModal,
  openCreateDiagramModal,
} from "../../../ui/components/create-diagram-modal.js";
import { showToast } from "../../../ui/components/toast.js";
import { initEditorTreeContextMenu } from "../../../ui/components/editor-tree-context-menu.js";
import {
  createProfileSubpackage as createProfileSubpackageInBackend,
  deleteProfilePackage as deleteProfilePackageInBackend,
} from "../../../services/package-service.js";
import {
  createProfileDiagram as createProfileDiagramInBackend,
  deleteProfileDiagram as deleteProfileDiagramInBackend,
} from "../../../services/diagram-service.js";
import {
  getSubpackageNameSet,
  getDiagramNameSet,
  findSubpackageIdByName,
  findDiagramIdByName,
  packageHasContents,
} from "../../../utils/project-traversal.js";

// ============================================================
// STATE
// ============================================================
let currentProjectId = null;
let currentProfileId = null;
let profileData = {
  id: null,
  name: "Новый профиль",
  items: [],
};

let availableData = [];
let selectedLeftItems = new Set();
let selectedRightItems = new Set();
let expandedLeftItems = new Set();
let expandedRightItems = new Set();
let activeLeftItem = null;
let activeRightItem = null;
let isEditorMode = false;

// Component instances
let leftTreeComponent = null;
let rightTreeComponent = null;
let detailsPanelComponent = null;

let rightTreeContextMenu = null;

const SIDE_LEFT = "left";
const SIDE_RIGHT = "right";

function getActiveItemKey(side) {
  return side === SIDE_LEFT ? activeLeftItem : activeRightItem;
}

function setActiveItemKey(side, itemKey) {
  if (side === SIDE_LEFT) {
    activeLeftItem = itemKey;
  } else {
    activeRightItem = itemKey;
  }
}

function getSelectedSet(side) {
  return side === SIDE_LEFT ? selectedLeftItems : selectedRightItems;
}

function getExpandedSet(side) {
  return side === SIDE_LEFT ? expandedLeftItems : expandedRightItems;
}

function getTreeComponent(side) {
  return side === SIDE_LEFT ? leftTreeComponent : rightTreeComponent;
}

function setTreeComponent(side, component) {
  if (side === SIDE_LEFT) {
    leftTreeComponent = component;
  } else {
    rightTreeComponent = component;
  }
}

function toggleInSet(set, key, shouldHave) {
  if (shouldHave) {
    set.add(key);
  } else {
    set.delete(key);
  }
}

// ============================================================
// INIT
// ============================================================
export async function initProfileEditorPage() {
  await appDataInit();

  // ✅ Get profile ID from URL
  currentProfileId = getQueryParam("id");

  if (!currentProfileId) {
    showNoProfileWarning();
    return;
  }

  // ✅ Find project that contains this profile
  const projectId = await findProjectByProfileId(currentProfileId);

  if (!projectId) {
    showNoProjectWarning();
    return;
  }

  currentProjectId = projectId;

  // Load modal templates that this page needs.
  await loadModals(["create-package-modal", "create-diagram-modal"]);
  initModalSystem();
  bindModalTriggers(document);

  initCreatePackageModal(String(currentProjectId), {
    onCreate: async ({ parentPackageId, modelId = "", profileId = "", payload } = {}) => {
      await handleCreateProfileSubpackage({ parentPackageId, modelId, profileId, payload });
    },
  });

  initCreateDiagramModal(String(currentProjectId), {
    onCreate: async ({ packageId, modelId = "", profileId = "", payload } = {}) => {
      await handleCreateProfileDiagram({ packageId, modelId, profileId, payload });
    },
  });

  await loadProfileFromUrl();
  await loadAvailableData();

  // ✅ Render trees FIRST
  renderAvailableTree();
  renderProfileTree();

  // ✅ Then initialize components (they need the rendered HTML)
  initComponents();

  // ✅ Finally bind global events
  bindEvents();
}

function cssEscape(value) {
  if (globalThis.CSS && typeof globalThis.CSS.escape === "function") {
    return globalThis.CSS.escape(String(value));
  }
  // Minimal fallback (good enough for UUID-like ids)
  return String(value).replace(/"/g, "\\\"");
}

/**
 * Extract the currently edited profile structure from a full Project object and
 * sync `profileData` (in-memory UI state) with it.
 *
 * @param {object} project Updated project returned by service layer.
 */
function syncProfileDataFromProject(project) {
  if (!project || !currentProfileId) return;
  const profileId = String(currentProfileId);

  const profile = project?.profiles?.find((p) => String(p.id) === profileId);
  if (!profile) return;

  profileData.id = profile.id;
  profileData.name = profile.name;
  profileData.description = profile.description;
  profileData.version = profile.version;
  profileData.relatedModels = profile.relatedModels || [];
  profileData.createDate = profile.createDate;
  profileData.legalState = profile.legalState;
  profileData.legalAct = profile.legalAct;
  profileData.accessRights = profile.accessRights;

  profileData.items = profile.rootPackages?.[0]?.packages || [];
  updateProfileDisplay();
}

/**
 * Find a profile package by id inside a full project payload.
 *
 * @param {object} project
 * @param {string} profileId
 * @param {string} packageId
 * @returns {object|null}
 */
function findProfilePackageById(project, profileId, packageId) {
  const profile = project?.profiles?.find((p) => String(p.id) === String(profileId));
  const roots = profile?.rootPackages?.[0]?.packages || [];

  const search = (packages) => {
    for (const pkg of packages) {
      if (String(pkg?.id) === String(packageId)) return pkg;
      const found = search(pkg?.subPackages || []);
      if (found) return found;
    }
    return null;
  };

  return search(roots);
}

/**
 * Select a right-tree node by canonical ids (data-* contract) and scroll it into view.
 *
 * @param {string} selector CSS selector for the node.
 */
function selectRightTreeNode(selector) {
  const root = document.getElementById("profile-tree");
  if (!root) return;

  const el = root.querySelector(selector);
  if (!(el instanceof HTMLElement)) return;

  const itemKey = el.getAttribute("data-item-key") || "";
  if (!itemKey) return;

  rightTreeComponent?.selectItem?.(itemKey);
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Ensure a node is expanded in the right editor-tree.
 *
 * @param {string} itemKey
 */
function ensureRightNodeExpanded(itemKey) {
  if (!itemKey) return;
  const children = rightTreeComponent?.getChildrenContainerEl?.(itemKey);
  if (children && children.classList.contains("collapsed")) {
    rightTreeComponent?.toggleExpand?.(itemKey);
  }
}

/**
 * Create a profile subpackage using the same modal + UX semantics as project-details-page.
 *
 * @param {{ parentPackageId: string, modelId?: string, profileId?: string, payload?: object }} params
 */
async function handleCreateProfileSubpackage({ parentPackageId, modelId = "", profileId = "", payload } = {}) {
  try {
    const pid = profileId ? String(profileId) : String(currentProfileId || "");
    if (!currentProjectId || !pid || !parentPackageId || !payload?.name) return;

    const updatedProject = await createProfileSubpackageInBackend(
      String(currentProjectId),
      pid,
      String(parentPackageId),
      payload
    );

    if (!updatedProject) throw new Error("Backend did not return updated project");

    syncProfileDataFromProject(updatedProject);
    renderProfileTree();

    const createdId = findSubpackageIdByName(updatedProject, {
      context: "profile",
      profileId: pid,
      parentPackageId: String(parentPackageId),
      name: payload.name,
    });

    requestAnimationFrame(() => {
      // Expand parent and select created package
      const parentSelector = `.tree-item-with-checkbox[data-type="package"][data-package-id="${cssEscape(
        parentPackageId
      )}"][data-profile-id="${cssEscape(pid)}"]`;
      const parentEl = document.querySelector(parentSelector);
      if (parentEl instanceof HTMLElement) {
        const parentKey = parentEl.getAttribute("data-item-key") || "";
        if (parentKey) ensureRightNodeExpanded(parentKey);
      }

      if (createdId) {
        selectRightTreeNode(
          `.tree-item-with-checkbox[data-type="package"][data-package-id="${cssEscape(
            createdId
          )}"][data-profile-id="${cssEscape(pid)}"]`
        );
      }
    });

    showToast("Пакет создан", { type: "success" });
  } catch (error) {
    console.error("[handleCreateProfileSubpackage] Failed:", error);
    const msg = error?.message ? String(error.message) : "Ошибка создания";
    showToast(`Ошибка создания пакета: ${msg}`, { type: "error" });
  }
}

/**
 * Create a profile diagram using the same modal + UX semantics as project-details-page.
 *
 * @param {{ packageId: string, modelId?: string, profileId?: string, payload?: object }} params
 */
async function handleCreateProfileDiagram({ packageId, modelId = "", profileId = "", payload } = {}) {
  try {
    const pid = profileId ? String(profileId) : String(currentProfileId || "");
    if (!currentProjectId || !pid || !packageId || !payload?.diagramName) return;

    const updatedProject = await createProfileDiagramInBackend(
      String(currentProjectId),
      pid,
      String(packageId),
      payload
    );

    if (!updatedProject) throw new Error("Backend did not return updated project");

    syncProfileDataFromProject(updatedProject);
    renderProfileTree();

    const createdId = findDiagramIdByName(updatedProject, {
      context: "profile",
      profileId: pid,
      name: payload.diagramName,
    });

    requestAnimationFrame(() => {
      // Expand parent package and select created diagram
      const parentSelector = `.tree-item-with-checkbox[data-type="package"][data-package-id="${cssEscape(
        packageId
      )}"][data-profile-id="${cssEscape(pid)}"]`;
      const parentEl = document.querySelector(parentSelector);
      if (parentEl instanceof HTMLElement) {
        const parentKey = parentEl.getAttribute("data-item-key") || "";
        if (parentKey) ensureRightNodeExpanded(parentKey);
      }

      if (createdId) {
        selectRightTreeNode(
          `.tree-item-with-checkbox[data-type="diagram"][data-diagram-id="${cssEscape(
            createdId
          )}"][data-profile-id="${cssEscape(pid)}"]`
        );
      }
    });

    showToast("Диаграмма создана", { type: "success" });
  } catch (error) {
    console.error("[handleCreateProfileDiagram] Failed:", error);
    const msg = error?.message ? String(error.message) : "Ошибка создания";
    showToast(`Ошибка создания диаграммы: ${msg}`, { type: "error" });
  }
}

/**
 * Delete a profile package from the editor-tree context menu.
 * Matches project-details-page confirmations and toast wording.
 *
 * @param {{ packageId: string, parentPackageId?: (string|null), profileId?: string }} ctx
 */
async function handleDeleteProfilePackage(ctx = {}) {
  const packageId = String(ctx?.packageId || "");
  if (!packageId) return;

  const pid = String(ctx?.profileId || currentProfileId || "");
  if (!pid || !currentProjectId) return;

  try {
    const project = await getProjectById(currentProjectId);
    if (!project) return;

    const pkg = findProfilePackageById(project, pid, packageId);
    if (!pkg) return;

    if (!confirm("Удалить пакет?")) return;

    if (packageHasContents(pkg)) {
      const okNested = confirm(
        "Пакет содержит вложенные элементы. Будут удалены все пакеты, классы и диаграммы внутри. Продолжить?"
      );
      if (!okNested) return;
    }

    const updatedProject = await deleteProfilePackageInBackend(
      String(currentProjectId),
      pid,
      packageId
    );

    if (!updatedProject) throw new Error("Backend did not return updated project");

    syncProfileDataFromProject(updatedProject);
    renderProfileTree();

    const parentPackageId = String(ctx?.parentPackageId || pkg?.parentPackageId || pkg?.parentId || "");

    requestAnimationFrame(() => {
      if (parentPackageId) {
        selectRightTreeNode(
          `.tree-item-with-checkbox[data-type="package"][data-package-id="${cssEscape(
            parentPackageId
          )}"][data-profile-id="${cssEscape(pid)}"]`
        );
      }
    });

    showToast("Пакет удалён", { type: "success" });
  } catch (error) {
    console.error("[handleDeleteProfilePackage] Failed:", error);
    const msg = error?.message ? String(error.message) : "Ошибка удаления";
    showToast(`Ошибка удаления пакета: ${msg}`, { type: "error" });
  }
}

/**
 * Delete a profile diagram from the editor-tree context menu.
 * Matches project-details-page confirmations and toast wording.
 *
 * @param {{ diagramId: string, packageId: string, profileId?: string }} ctx
 */
async function handleDeleteProfileDiagram(ctx = {}) {
  const diagramId = String(ctx?.diagramId || "");
  const packageId = String(ctx?.packageId || "");
  if (!diagramId || !packageId) return;

  const pid = String(ctx?.profileId || currentProfileId || "");
  if (!pid || !currentProjectId) return;

  if (!confirm("Удалить диаграмму?")) return;

  try {
    const updatedProject = await deleteProfileDiagramInBackend(
      String(currentProjectId),
      pid,
      diagramId
    );

    if (!updatedProject) throw new Error("Backend did not return updated project");

    syncProfileDataFromProject(updatedProject);
    renderProfileTree();

    requestAnimationFrame(() => {
      selectRightTreeNode(
        `.tree-item-with-checkbox[data-type="package"][data-package-id="${cssEscape(
          packageId
        )}"][data-profile-id="${cssEscape(pid)}"]`
      );
    });

    showToast("Диаграмма удалена", { type: "success" });
  } catch (error) {
    console.error("[handleDeleteProfileDiagram] Failed:", error);
    const msg = error?.message ? String(error.message) : "Ошибка удаления";
    showToast(`Ошибка удаления диаграммы: ${msg}`, { type: "error" });
  }
}

// ============================================================
// FIND PROJECT BY PROFILE ID
// ============================================================



/**
 * Find project ID by profile ID
 * @param {string|number} profileId - Profile ID
 * @returns {string|number|null} Project ID or null
 */
async function findProjectByProfileId(profileId) {
  // ✅ Get all projects from memoryStorage
  const projects = await getAllProjects();


  for (const project of projects) {
    if (project.profiles && Array.isArray(project.profiles)) {
      const profile = project.profiles.find((p) => String(p.id) === profileId);

      if (profile) {
        return project.id;
      }
    }
  }

  return null;
}

// ============================================================
// INIT COMPONENTS
// ============================================================

function initComponents() {
  const initTreeForSide = (side) => {
    const containerId = side === SIDE_LEFT ? "available-tree" : "profile-tree";
    const label = side === SIDE_LEFT ? "Left" : "Right";
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`  ❌ ${label} tree container not found`);
      return;
    }

    const component = initEditorTree(containerId, {
      onSelect: (itemKey) => {
        setActiveItemKey(side, itemKey);
        loadItemDetails(itemKey, side);
      },
      onExpand: (itemKey, isExpanded) => {
        toggleInSet(getExpandedSet(side), itemKey, isExpanded);
      },
      onCheck: (itemKey, isChecked) => {
        toggleInSet(getSelectedSet(side), itemKey, isChecked);
      },
    });

    setTreeComponent(side, component);

    // Initial compute of indeterminate markers for already-checked nodes.
    component?.refreshAllIndicators?.();
  };

  initTreeForSide(SIDE_LEFT);
  initTreeForSide(SIDE_RIGHT);

  // Initialize details panel
  const detailsPanelContainer = document.getElementById("details-panel");

  if (detailsPanelContainer) {
    detailsPanelContainer.innerHTML = renderProfileEditorDetailsPanelLayout();

    const TAB_DISPATCH = {
      "profile-item-general": (item) =>
        detailsPanelComponent?.renderProfileDetails(item),
      "profile-item-attributes": (item) =>
        detailsPanelComponent?.renderProfileAttributes(item),
      "profile-item-links": (item) =>
        detailsPanelComponent?.renderProfileLinks(item),
      "profile-item-enumeration": (item) =>
        detailsPanelComponent?.renderProfileEnumeration(item),

      "model-item-general": (item) => detailsPanelComponent?.renderModelDetails(item),
      "model-item-attributes": (item) =>
        detailsPanelComponent?.renderModelAttributes(item),
      "model-item-links": (item) => detailsPanelComponent?.renderModelLinks(item),
      "model-item-enumeration": (item) =>
        detailsPanelComponent?.renderModelEnumeration(item),
    };

    const getSideForTab = (tabName) => {
      if (tabName.startsWith("profile-item-")) return SIDE_RIGHT;
      if (tabName.startsWith("model-item-")) return SIDE_LEFT;
      return null;
    };

    const handleDetailsTabSwitch = (tabName) => {
      const side = getSideForTab(tabName);
      if (!side) return;

      const activeKey = getActiveItemKey(side);
      if (!activeKey) return;

      const item = getItemDetailsByKey(activeKey, availableData, profileData);
      const render = TAB_DISPATCH[tabName];
      if (render) render(item);
    };

    detailsPanelComponent = initDetailsPanel("details-panel", {
      onTabSwitch: (tabName) => {
        // Если ничего не выбрано — оставляем empty-state как есть
        handleDetailsTabSwitch(tabName);
      },
      defaultTab: "model-item-general",
    });
  }
}

// ============================================================
// LOAD ITEM DETAILS
// ============================================================

function loadItemDetails(itemKey, side) {
  if (!detailsPanelComponent) {
    console.error("❌ Details panel component not initialized");
    return;
  }

  const item = getItemDetailsByKey(itemKey, availableData, profileData);

  if (side === SIDE_LEFT) {
    detailsPanelComponent.renderModelDetails(item);
    detailsPanelComponent.renderModelAttributes(item);
    detailsPanelComponent.renderModelLinks(item);
    detailsPanelComponent.renderModelEnumeration(item);
    updateDetailsTabsForSide(SIDE_LEFT, item);
    return;
  }

  detailsPanelComponent.renderProfileDetails(item);
  detailsPanelComponent.renderProfileAttributes(item);
  detailsPanelComponent.renderProfileLinks(item);
  detailsPanelComponent.renderProfileEnumeration(item);
  updateDetailsTabsForSide(SIDE_RIGHT, item);
}

function updateDetailsTabsForSide(side, item) {
  const sectionId =
    side === SIDE_LEFT ? "available-item-details" : "profile-item-details";
  const sectionKind = side === SIDE_LEFT ? "available" : "profile";
  const defaultTab =
    side === SIDE_LEFT ? "model-item-general" : "profile-item-general";

  const sectionEl = document.getElementById(sectionId);
  const tabsEl = sectionEl?.querySelector(".tabs");
  if (!sectionEl || !tabsEl) return;

  const currentActiveTab =
    tabsEl.querySelector(".tab.active")?.getAttribute("data-tab") || null;

  tabsEl.innerHTML = renderProfileEditorDetailsTabs(item, {
    section: sectionKind,
    activeTab: currentActiveTab || defaultTab,
  });

  // выбираем таб, который реально существует после пересборки
  const desiredTab =
    currentActiveTab &&
    tabsEl.querySelector(`.tab[data-tab="${currentActiveTab}"]`)
      ? currentActiveTab
      : defaultTab;

  detailsPanelComponent?.switchTab(desiredTab, sectionId);
}

// ============================================================
// LOAD DATA
// ============================================================

/**
 * Load profile from URL parameters
 */
async function loadProfileFromUrl() {
  if (!currentProfileId || !currentProjectId) {
    console.error("❌ Missing IDs");
    return;
  }

  // ✅ Parse profileId to number for getProfile
  // const profileIdNum = parseInt(currentProfileId);
  const profile = await getProfile(currentProjectId, currentProfileId);

  if (profile) {
    profileData.id = profile.id;
    profileData.name = profile.name;
    profileData.description = profile.description;
    profileData.version = profile.version;
    profileData.relatedModels = profile.relatedModels || [];
    profileData.createDate = profile.createDate;
    profileData.legalState = profile.legalState;
    profileData.legalAct = profile.legalAct;
    profileData.accessRights = profile.accessRights;

    // ✅ NEW STRUCTURE: rootPackages[0].packages
    profileData.items = profile.rootPackages?.[0]?.packages || [];

    updateProfileDisplay();
  } else {
    showNoProfileWarning();
  }
}

/**
 * Load available models and profiles
 */
async function loadAvailableData() {
  const project = await getProjectById(currentProjectId);

  if (!project) {
    console.error("❌ Project not found:", currentProjectId);
    return;
  }

  availableData = [];

  // ✅ Add models with NEW structure (rootPackages)
  if (project.models && Array.isArray(project.models)) {
    project.models.forEach((model) => {
      // ✅ NEW STRUCTURE:  rootPackages[0].packages
      const packages = model.rootPackages?.[0]?.packages || [];

      availableData.push({
        type: "model",
        id: model.id,
        name: model.name,
        data: model,
        children: packages, // ✅ Use extracted packages
      });
    });
  }

  // ✅ Add profiles with NEW structure
  if (project.profiles && Array.isArray(project.profiles)) {
    project.profiles.forEach((profile) => {
      // ✅ Don't include the profile being edited
      const currentProfileIdStr = String(currentProfileId);
      const profileIdStr = String(profile.id);

      const isCurrentProfile =
        profileIdStr === currentProfileIdStr ||
        (profileData?.id !== null &&
          profileData?.id !== undefined &&
          profileIdStr === String(profileData.id));

      if (!isCurrentProfile) {
        // ✅ NEW STRUCTURE:  rootPackages[0].packages
        const packages = profile.rootPackages?.[0]?.packages || [];

        availableData.push({
          type: "profile",
          id: profile.id,
          name: profile.name,
          data: profile,
          children: packages, // ✅ Use extracted packages
        });
      }
    });
  }
}

// ============================================================
// UPDATE UI
// ============================================================

/**
 * Update profile name display
 */
function updateProfileDisplay() {
  const nameDisplay = document.getElementById("profile-name-display");
  const headerName = document.getElementById("profile-header-name");

  if (nameDisplay) nameDisplay.textContent = profileData.name;
  if (headerName) headerName.textContent = profileData.name;
}

/**
 * Show no profile warning
 */
function showNoProfileWarning() {
  const contentArea = document.querySelector(".editor-content-area");
  if (contentArea) {
    contentArea.innerHTML = `
      <div class="warning-content">
        <div class="model-icon-large">⚠️</div>
        <h3>Профиль не найден</h3>
        <p>Указанный профиль не существует или был удалён</p>
        <button class="btn btn-primary mt-15" onclick="window.location.href='projects.html'">
          ← К проектам
        </button>
      </div>
    `;
  }
}

/**
 * Show no project warning
 */
function showNoProjectWarning() {
  const contentArea = document.querySelector(".editor-content-area");
  if (contentArea) {
    contentArea.innerHTML = `
      <div class="warning-content">
        <div class="model-icon-large">⚠️</div>
        <h3>Проект не найден</h3>
        <p>Не удалось найти проект для этого профиля</p>
        <button class="btn btn-primary mt-15" onclick="window.location.href='projects.html'">
          ← К проектам
        </button>
      </div>
    `;
  }
}

// ============================================================
// RENDER TREES
// ============================================================

/**
 * Render available models/profiles tree
 */
function renderAvailableTree() {
  const container = document.getElementById("available-tree");
  if (!container) {
    console.error("❌ Container #available-tree not found");
    return;
  }

  const html = renderAvailableTreeHTML(
    availableData,
    selectedLeftItems,
    expandedLeftItems,
    activeLeftItem
  );

  container.innerHTML = html;

  // After DOM replacement, recompute "partial" checkbox markers.
  leftTreeComponent?.refreshAllIndicators?.();
}

/**
 * Render profile tree
 */
function renderProfileTree() {
  const container = document.getElementById("profile-tree");
  if (!container) {
    console.error("❌ Container #profile-tree not found");
    return;
  }

  const html = renderProfileTreeHTML(
    profileData,
    selectedRightItems,
    expandedRightItems,
    activeRightItem
  );

  container.innerHTML = html;

  // After DOM replacement, recompute "partial" checkbox markers.
  rightTreeComponent?.refreshAllIndicators?.();
}

// ============================================================
// EVENT BINDINGS
// ============================================================

function bindEvents() {
  // Back button
  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      // ✅ Return to project details
      if (currentProjectId) {
        window.location.href = `project-details.html?id=${currentProjectId}`;
      } else {
        window.location.href = "projects.html";
      }
    });
  }

  // Save button
  const saveBtn = document.getElementById("save-profile-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveProfile);
  }

  // Toggle mode button
  const toggleModeBtn = document.getElementById("toggle-mode-btn");
  if (toggleModeBtn) {
    toggleModeBtn.addEventListener("click", toggleEditorMode);
  }

  // Transfer buttons
  const transferBtn = document.getElementById("transfer-to-profile-btn");
  if (transferBtn) {
    transferBtn.addEventListener("click", transferToProfile);
  }

  const removeBtn = document.getElementById("remove-from-profile-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", removeFromProfile);
  }

  // Clear selection buttons
  const clearLeftBtn = document.getElementById("clear-left-selection-btn");
  if (clearLeftBtn) {
    clearLeftBtn.addEventListener("click", () => clearSelection(SIDE_LEFT));
  }

  const clearRightBtn = document.getElementById("clear-right-selection-btn");
  if (clearRightBtn) {
    clearRightBtn.addEventListener("click", () => clearSelection(SIDE_RIGHT));
  }

  // Search inputs
  const leftSearch = document.getElementById("left-search");
  if (leftSearch) {
    leftSearch.addEventListener("input", filterLeftTree);
  }

  const rightSearch = document.getElementById("right-search");
  if (rightSearch) {
    rightSearch.addEventListener("input", filterRightTree);
  }

  // Right-click context menu for the profile (right) tree.
  const profilePanel = document.getElementById("profile-panel");
  if (profilePanel) {
    // Re-init if page is hot-reloaded.
    rightTreeContextMenu?.destroy?.();
    rightTreeContextMenu = initEditorTreeContextMenu(profilePanel, {
      onCreatePackage: async ({ packageId, modelId = "", profileId = "" }) => {
        const project = await getProjectById(currentProjectId);
        if (!project) return;

        const pid = profileId ? String(profileId) : String(currentProfileId || "");
        const existingSiblingNamesNormalized = getSubpackageNameSet(project, {
          context: "profile",
          profileId: pid,
          parentPackageId: packageId,
        });

        openCreatePackageModal({
          parentPackageId: packageId,
          modelId,
          profileId: pid,
          existingSiblingNamesNormalized,
        });
      },
      onCreateDiagram: async ({ packageId, modelId = "", profileId = "" }) => {
        const project = await getProjectById(currentProjectId);
        if (!project) return;

        const pid = profileId ? String(profileId) : String(currentProfileId || "");
        const existingDiagramNamesNormalized = getDiagramNameSet(project, {
          context: "profile",
          profileId: pid,
        });

        openCreateDiagramModal({
          packageId,
          modelId,
          profileId: pid,
          existingDiagramNamesNormalized,
        });
      },
      onDeletePackage: async (ctx) => {
        await handleDeleteProfilePackage(ctx);
      },
      onDeleteDiagram: async (ctx) => {
        await handleDeleteProfileDiagram(ctx);
      },
    });
  }
}

// ============================================================
// PROFILE OPERATIONS
// ============================================================

function transferToProfile() {
  if (selectedLeftItems.size === 0) {
    alert("Выберите элементы для переноса");
    return;
  }

  try {
    // Transfer items
    const result = transferItemsToProfile(
      selectedLeftItems,
      availableData,
      profileData
    );

    // Backward safety (если кто-то вернёт старый формат)
    if (result && result.profileData) {
      profileData = result.profileData;
      showTransferReport(result.report);
    } else {
      profileData = result;
    }

    // Clear selection
    selectedLeftItems.clear();
    leftTreeComponent?.clearSelection();

    // Re-render profile tree
    renderProfileTree();
  } catch (error) {
    console.error("❌ Transfer failed:", error);
    alert("Ошибка при переносе элементов: " + error.message);
  }
}

function showTransferReport(report) {
  const message = formatTransferReport(report);
  if (!message) return;
  alert(message);
}

function removeFromProfile() {
  if (selectedRightItems.size === 0) {
    alert("Выберите элементы для удаления");
    return;
  }

  if (!confirm(`Удалить ${selectedRightItems.size} элемент(ов) из профиля?`)) {
    return;
  }

  try {
    // Remove items
    profileData = removeItemsFromProfile(selectedRightItems, profileData);

    // Clear selection
    selectedRightItems.clear();
    rightTreeComponent?.clearSelection();

    // Re-render profile tree
    renderProfileTree();
  } catch (error) {
    console.error("❌ Removal failed:", error);
    alert("Ошибка при удалении элементов: " + error.message);
  }
}

/**
 * Save profile
 */
async function handleSaveProfile() {
  // Validate profile
  const validation = validateProfile(profileData);

  if (!validation.valid) {
    alert("Ошибки валидации:\n" + validation.errors.join("\n"));
    console.error("❌ Validation errors:", validation.errors);
    return;
  }

  // Prepare for save
  const preparedProfile = prepareProfileForSave(profileData, currentProjectId);

  // Save profile
  try {
    if (preparedProfile.id && preparedProfile.id !== null) {
      // Update existing profile
      const updated = await updateProfile(
        currentProjectId,
        preparedProfile.id,
        preparedProfile
      );

      if (!updated) {
        throw new Error("Не удалось обновить профиль");
      }

      alert("Профиль успешно обновлён!");
    } else {
      // Create new profile
      const newProfile = await createProfile(currentProjectId, preparedProfile);
      if (!newProfile) {
        throw new Error("Не удалось создать профиль");
      }

      profileData.id = newProfile.id;

      alert("Профиль успешно создан!");
    }

    // Redirect back to project details
    // window.location.href = `project-details.html?id=${currentProjectId}`;
  } catch (error) {
    console.error("❌ Error saving profile:", error);
    alert("Ошибка при сохранении профиля: " + error.message);
  }
}

// ============================================================
// MODE TOGGLE
// ============================================================

function toggleEditorMode() {
  isEditorMode = !isEditorMode;

  const contentArea = document.getElementById("editor-content-area");
  const diagramEditor = document.getElementById("diagram-editor");
  const toggleBtn = document.getElementById("toggle-mode-btn");

  if (!contentArea || !diagramEditor || !toggleBtn) return;

  if (isEditorMode) {
    // -> diagram mode
    toggleBtn.innerHTML = "📋 Стандартный режим";
    contentArea.classList.remove("standard-mode");
    contentArea.classList.add("diagram-mode");
    diagramEditor.classList.remove("hidden");
  } else {
    // -> standard mode
    toggleBtn.innerHTML = "📐 Режим диаграммы";
    contentArea.classList.remove("diagram-mode");
    contentArea.classList.add("standard-mode");
    diagramEditor.classList.add("hidden");
  }
}

// ============================================================
// CLEAR SELECTION
// ============================================================

function clearSelection(side) {
  const set = getSelectedSet(side);
  set.clear();
  // ✅ Use component method instead of re-rendering
  getTreeComponent(side)?.clearSelection();
}

// ============================================================
// SEARCH/FILTER
// ============================================================

function filterLeftTree() {
  const searchInput = document.getElementById("left-search");
  if (!searchInput) return;
  const query = searchInput.value;

  // TODO: Implement visual filtering (hide non-matching items)
}

function filterRightTree() {
  const searchInput = document.getElementById("right-search");
  if (!searchInput) return;
  const query = searchInput.value;

  // TODO:  Implement visual filtering
}
