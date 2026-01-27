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
  validateProfile,
  prepareProfileForSave,
  getItemDetailsByKey,
} from "../../../services/profile-editor-service.js";
import { createProfileClass, deleteProfileClass } from "../../../services/class-service.js";
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
import { openReportModal } from "../../../ui/components/report-modal.js";
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
import {
  findModelNameById,
  findAvailablePackageCandidatesByName,
  findProfileClassByName,
  findProfilePackageByName,
} from "../../../utils/profile-editor-lookup.js";
import { openSelectLocationModal } from "../../../ui/components/select-location-modal.js";

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

/**
 * Optional one-shot subtitle override for the profile details panel.
 * Used by actions like "Показать в профиле" to explain context (e.g. different model).
 * @type {{ itemKey: string, message: string } | null}
 */
let profileDetailsSubtitleOverride = null;

/**
 * Pending details-tab sync request.
 *
 * Used by "Показать в профиле" / "Показать в модели": we capture the active tab
 * in the source panel and switch to the equivalent tab in the target panel after
 * the target item is selected (tabs are rebuilt depending on selected item type).
 *
 * @type {{ targetSide: "left"|"right", tabName: string } | null}
 */
let pendingDetailsTabSync = null;

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
  await loadModals([
    "create-package-modal",
    "create-diagram-modal",
    "report-modal",
    "select-location-modal",
  ]);
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
 * Normalize a class name for profile-wide uniqueness checks.
 *
 * @param {string} name
 * @returns {string}
 */
function normalizeClassName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Whether a profile tree item is a ClassProfile-like object.
 *
 * @param {any} item
 * @returns {boolean}
 */
function isProfileClassItem(item) {
  if (!item || typeof item !== "object") return false;
  const id = String(item?.id ?? "").trim();
  const name = String(item?.name ?? "").trim();
  const refModelId = String(item?.refModelId ?? "").trim();
  const refModelItemId = String(item?.refModelItemId ?? "").trim();
  return Boolean(id && name && refModelId && refModelItemId);
}

/**
 * Render a short preview of item names suitable for a toast.
 *
 * @param {string[]} names
 * @param {number} max
 * @returns {string}
 */
function formatNamePreview(names, max = 4) {
  const list = Array.isArray(names) ? names.map((x) => String(x || "").trim()).filter(Boolean) : [];
  if (!list.length) return "";
  const shown = list.slice(0, max);
  const rest = list.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} (+${rest})` : shown.join(", ");
}

/**
 * Render a short preview for skipped/failed lists.
 *
 * @param {{name: string, reason: string}[]} items
 * @param {number} max
 * @returns {string}
 */
function formatIssuePreview(items, max = 3) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return "";
  const shown = list.slice(0, max).map((x) => {
    const n = String(x?.name ?? "").trim();
    const r = String(x?.reason ?? "").trim();
    return r ? `${n} (${r})` : n;
  });
  const rest = list.length - shown.length;
  return rest > 0 ? `${shown.join("; ")}; (+${rest})` : shown.join("; ");
}

/**
 * Collect all class names already present in the current profile (recursive).
 *
 * @param {Array} packages
 * @returns {Set<string>} Normalized class names
 */
function collectProfileClassNames(packages) {
  const names = new Set();

  const walk = (pkgs) => {
    if (!Array.isArray(pkgs)) return;
    for (const pkg of pkgs) {
      const classes = Array.isArray(pkg?.classes) ? pkg.classes : [];
      for (const cls of classes) {
        const n = normalizeClassName(cls?.name);
        if (n) names.add(n);
      }
      walk(pkg?.subPackages);
    }
  };

  walk(packages);
  return names;
}

/**
 * Find root profile package id (a package with no parentPackageId).
 *
 * @param {Array} packages
 * @returns {string|null}
 */
function findRootProfilePackageId(packages) {
  if (!Array.isArray(packages) || packages.length === 0) return null;
  const root = packages.find((p) => p && (p.parentPackageId === null || p.parentPackageId === undefined || p.parentPackageId === ""));
  return root?.id ? String(root.id) : (packages[0]?.id ? String(packages[0].id) : null);
}

/**
 * Resolve the profile package id that should receive transferred classes:
 * - active selection in the right tree (its data-package-id)
 * - otherwise the profile root package (no parent)
 *
 * @returns {string|null}
 */
function resolveTargetProfilePackageId() {
  const rightTreeRoot = document.getElementById("profile-tree");
  if (!rightTreeRoot) return findRootProfilePackageId(profileData.items);

  const activeKey = String(activeRightItem ?? "");
  if (activeKey) {
    const activeEl = rightTreeRoot.querySelector(`[data-item-key="${cssEscape(activeKey)}"]`);
    if (activeEl instanceof HTMLElement) {
      const pkgId = activeEl.getAttribute("data-package-id") || "";
      if (pkgId) return String(pkgId);
    }
  }

  return findRootProfilePackageId(profileData.items);
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

        // Apply a one-shot tab sync if requested by navigation actions.
        applyPendingDetailsTabSync(side);

        // Apply/clear the profile subtitle override based on the selection.
        if (side === SIDE_RIGHT) {
          if (
            profileDetailsSubtitleOverride &&
            profileDetailsSubtitleOverride.itemKey === itemKey
          ) {
            setDetailsPanelSubtitle(
              "profile-item-details",
              profileDetailsSubtitleOverride.message
            );
          } else {
            setDetailsPanelSubtitle("profile-item-details", "");
            profileDetailsSubtitleOverride = null;
          }
        }
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

/**
 * Set details-panel subtitle text for a section.
 *
 * @param {"available-item-details"|"profile-item-details"|string} sectionId
 * @param {string} text
 */
function setDetailsPanelSubtitle(sectionId, text) {
  const el = document.getElementById(`${sectionId}-subtitle`);
  if (!(el instanceof HTMLElement)) return;
  const msg = String(text ?? "").trim();
  el.textContent = msg;
}

/**
 * Get currently active tab name inside a details section.
 *
 * @param {"available-item-details"|"profile-item-details"|string} sectionId
 * @returns {string|null}
 */
function getActiveDetailsTabName(sectionId) {
  const sectionEl = document.getElementById(sectionId);
  if (!sectionEl) return null;

  const active = sectionEl.querySelector(".tabs .tab.active");
  const tab = active?.getAttribute?.("data-tab") || "";
  return tab ? String(tab) : null;
}

/**
 * Map a details tab name to the equivalent tab name in the opposite panel.
 *
 * @param {string|null} tabName
 * @returns {string|null}
 */
function mapDetailsTabToOtherPanel(tabName) {
  const name = String(tabName ?? "").trim();
  if (!name) return null;

  if (name.startsWith("model-item-")) {
    return name.replace(/^model-item-/, "profile-item-");
  }

  if (name.startsWith("profile-item-")) {
    return name.replace(/^profile-item-/, "model-item-");
  }

  return null;
}

/**
 * Apply pending details-tab sync for the given side.
 *
 * Must be executed after `loadItemDetails`, because tabs are rebuilt based on
 * the selected item type. If the desired tab doesn't exist (e.g. package has no
 * attributes/links), we keep the default tab.
 *
 * @param {"left"|"right"} side
 */
function applyPendingDetailsTabSync(side) {
  if (!pendingDetailsTabSync) return;
  if (pendingDetailsTabSync.targetSide !== side) return;

  const sectionId = side === SIDE_LEFT ? "available-item-details" : "profile-item-details";
  const sectionEl = document.getElementById(sectionId);
  const desired = String(pendingDetailsTabSync.tabName || "").trim();

  pendingDetailsTabSync = null;

  if (!sectionEl || !desired) return;

  const exists = sectionEl.querySelector(`.tabs .tab[data-tab="${desired}"]`);
  if (exists) {
    detailsPanelComponent?.switchTab?.(desired, sectionId);
  }
}

/**
 * Render a custom empty-state message inside the profile details panel.
 *
 * This intentionally targets the profile "general" tab, because the message is
 * user guidance (not a data view).
 *
 * @param {string} message
 */
function renderProfileDetailsEmptyState(message) {
  if (!detailsPanelComponent) return;
  const sectionId = "profile-item-details";

  // Ensure the general tab exists and is active.
  detailsPanelComponent?.switchTab?.("profile-item-general", sectionId);

  const sectionEl = document.getElementById(sectionId);
  if (!sectionEl) return;

  const content = sectionEl.querySelector('[data-tab-content="profile-item-general"]');
  if (!(content instanceof HTMLElement)) return;

  content.innerHTML = `<div class="empty-state">${String(message)}</div>`;
}

/**
 * Render the "class not found" state in the profile details panel with tab sync.
 *
 * Rules:
 * - If requested tab is "profile-item-attributes" or "profile-item-links", keep it active
 *   and show the standard guidance message for that tab.
 * - Otherwise keep the general tab active and show the class-not-found message.
 *
 * @param {{ preferredTabName?: string|null }} params
 */
function renderProfileClassNotFoundState({ preferredTabName = null } = {}) {
  if (!detailsPanelComponent) return;

  // Clear any pending sync from the click action; we handle tab selection directly here.
  pendingDetailsTabSync = null;

  // Ensure the profile panel has the full set of tabs (item=null => "unknown" => class-like tabs).
  updateDetailsTabsForSide(SIDE_RIGHT, null);

  // Always keep the general tab content meaningful.
  renderProfileDetailsEmptyState(
    'Данный класс не найден в текущем профиле.  Вы можете добавить его, используя кнопку "→ Перенести в профиль".'
  );

  const tab = String(preferredTabName ?? "").trim();

  if (tab === "profile-item-attributes") {
    detailsPanelComponent.renderProfileAttributes(null);
    detailsPanelComponent?.switchTab?.("profile-item-attributes", "profile-item-details");
    return;
  }

  if (tab === "profile-item-links") {
    detailsPanelComponent.renderProfileLinks(null);
    detailsPanelComponent?.switchTab?.("profile-item-links", "profile-item-details");
    return;
  }
}

/**
 * Expand profile tree parents so the given node becomes visible.
 *
 * @param {HTMLElement} nodeEl A node inside #profile-tree.
 */
function expandProfileTreeToNode(nodeEl) {
  if (!(nodeEl instanceof HTMLElement)) return;

  // Walk up through nested children containers; each container references its parent node key.
  let container = nodeEl.closest('.tree-children[data-parent]');
  while (container instanceof HTMLElement) {
    const parentKey = container.getAttribute('data-parent') || "";
    if (parentKey) {
      ensureRightNodeExpanded(parentKey);
      const parentEl = rightTreeComponent?.getTreeItemEl?.(parentKey);
      container = parentEl?.closest('.tree-children[data-parent]') || null;
    } else {
      break;
    }
  }
}

/**
 * Focus and select a profile tree node by its DOM element.
 *
 * @param {HTMLElement} nodeEl
 */
function focusProfileTreeNode(nodeEl) {
  if (!(nodeEl instanceof HTMLElement)) return;
  const itemKey = nodeEl.getAttribute("data-item-key") || "";
  if (!itemKey) return;

  expandProfileTreeToNode(nodeEl);
  rightTreeComponent?.selectItem?.(itemKey);
  nodeEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Expand available (left) tree parents so the given node becomes visible.
 *
 * @param {HTMLElement} nodeEl A node inside #available-tree.
 */
function expandAvailableTreeToNode(nodeEl) {
  if (!(nodeEl instanceof HTMLElement)) return;

  let container = nodeEl.closest('.tree-children[data-parent]');
  while (container instanceof HTMLElement) {
    const parentKey = container.getAttribute('data-parent') || "";
    if (parentKey) {
      const children = leftTreeComponent?.getChildrenContainerEl?.(parentKey);
      if (children && children.classList.contains("collapsed")) {
        leftTreeComponent?.toggleExpand?.(parentKey);
      }
      const parentEl = leftTreeComponent?.getTreeItemEl?.(parentKey);
      container = parentEl?.closest('.tree-children[data-parent]') || null;
    } else {
      break;
    }
  }
}

/**
 * Focus and select an available-tree node by its DOM element.
 *
 * @param {HTMLElement} nodeEl
 */
function focusAvailableTreeNode(nodeEl) {
  if (!(nodeEl instanceof HTMLElement)) return;
  const itemKey = nodeEl.getAttribute("data-item-key") || "";
  if (!itemKey) return;

  expandAvailableTreeToNode(nodeEl);
  leftTreeComponent?.selectItem?.(itemKey);
  nodeEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Resolve model/profile context info for the currently active right-tree node.
 *
 * @returns {{ type: string, modelId: string, profileId: string } | null}
 */
function getActiveRightNodeContext() {
  const key = String(activeRightItem ?? "").trim();
  if (!key) return null;

  const el = rightTreeComponent?.getTreeItemEl?.(key);
  if (!(el instanceof HTMLElement)) return null;

  return {
    type: String(el.getAttribute("data-type") || "").trim(),
    modelId: String(el.getAttribute("data-model-id") || "").trim(),
    profileId: String(el.getAttribute("data-profile-id") || "").trim(),
  };
}

/**
 * Handler for "Показать в модели".
 *
 * Requirements:
 * - For classes: strict lookup by refModelId/refModelItemId.
 * - For packages: lookup by name across all available roots; if ambiguous, show modal
 *   with "package — model/profile" choices.
 */
function handleShowInModel() {
  if (!currentProjectId || !currentProfileId) {
    showToast("Не удалось определить текущий проект/профиль", { type: "error" });
    return;
  }

  // Sync target (available) active tab with source (profile) active tab.
  const sourceTab = getActiveDetailsTabName("profile-item-details");
  const targetTab = mapDetailsTabToOtherPanel(sourceTab);
  if (targetTab) {
    pendingDetailsTabSync = { targetSide: SIDE_LEFT, tabName: targetTab };
  }

  const ctx = getActiveRightNodeContext();
  if (!ctx) {
    showToast("Выберите класс или пакет в дереве профиля", { type: "info" });
    return;
  }

  const item = getItemDetailsByKey(activeRightItem, availableData, profileData);
  const name = String(item?.name ?? "").trim();
  if (!name) {
    showToast("Не удалось определить имя выбранного объекта", { type: "error" });
    return;
  }

  const availableTree = document.getElementById("available-tree");
  if (!availableTree) return;

  if (ctx.type === "class") {
    const refModelId = String(item?.refModelId ?? "").trim();
    const refModelItemId = String(item?.refModelItemId ?? "").trim();
    if (!refModelId || !refModelItemId) {
      showToast("Для этого класса не указаны refModelId/refModelItemId", { type: "error" });
      return;
    }

    const selector = `.tree-item-with-checkbox[data-type="class"][data-model-id="${cssEscape(
      refModelId
    )}"][data-class-id="${cssEscape(refModelItemId)}"]`;

    const nodeEl = availableTree.querySelector(selector);
    if (!(nodeEl instanceof HTMLElement)) {
      const modelName = findModelNameById(availableData, refModelId);
      const extra = modelName ? ` (${modelName})` : "";
      showToast(`Класс не найден в доступных моделях${extra}`, { type: "error" });
      return;
    }

    focusAvailableTreeNode(nodeEl);
    return;
  }

  if (ctx.type === "package") {
    const candidates = findAvailablePackageCandidatesByName(availableData, name);

    if (candidates.length === 0) {
      showToast("Пакет не найден среди доступных моделей/профилей", { type: "info" });
      return;
    }

    /**
     * Navigate to a specific package candidate in the available (left) tree.
     *
     * @param {{ contextType: "model"|"profile", contextId: string, packageId: string }} c
     * @returns {boolean} True when the node was found and focused.
     */
    const goToCandidate = (c) => {
      const selector = c.contextType === "model"
        ? `.tree-item-with-checkbox[data-type="package"][data-model-id="${cssEscape(c.contextId)}"][data-package-id="${cssEscape(c.packageId)}"]`
        : `.tree-item-with-checkbox[data-type="package"][data-profile-id="${cssEscape(c.contextId)}"][data-package-id="${cssEscape(c.packageId)}"]`;

      const nodeEl = availableTree.querySelector(selector);
      if (!(nodeEl instanceof HTMLElement)) {
        return false;
      }

      focusAvailableTreeNode(nodeEl);
      return true;
    };

    if (candidates.length === 1) {
      goToCandidate(candidates[0]);
      return;
    }

    // Ambiguous: ask the user to pick which model/profile package to show.
    const items = candidates.map((c, idx) => {
      const suffix = c.contextType === "model" ? "(Модель)" : "(Профиль)";
      return {
        id: String(idx),
        title: `${c.packageName}`,
        subtitle: `${c.contextName} ${suffix}`,
      };
    });

    openSelectLocationModal({
      title: "Выберите, где показать пакет",
      hint: `Найдено несколько пакетов с именем: ${name}`,
      items,
      onSelect: (id) => {
        const i = Number.parseInt(String(id), 10);
        if (!Number.isFinite(i)) return false;
        const chosen = candidates[i];
        if (!chosen) return false;

        const ok = goToCandidate(chosen);
        if (!ok) {
          showToast(
            "Переход не выполнен: пакет не найден в дереве (возможна рассинхронизация)",
            { type: "error", timeoutMs: 6000 }
          );
        }
        return ok;
      },
    });

    return;
  }

  showToast("Поддерживается только показ классов и пакетов", { type: "info" });
}

/**
 * Resolve model/profile context info for the currently active left-tree node.
 *
 * @returns {{ type: string, modelId: string, profileId: string } | null}
 */
function getActiveLeftNodeContext() {
  const key = String(activeLeftItem ?? "").trim();
  if (!key) return null;

  const el = leftTreeComponent?.getTreeItemEl?.(key);
  if (!(el instanceof HTMLElement)) return null;

  return {
    type: String(el.getAttribute("data-type") || "").trim(),
    modelId: String(el.getAttribute("data-model-id") || "").trim(),
    profileId: String(el.getAttribute("data-profile-id") || "").trim(),
  };
}

/**
 * Handler for "Показать в профиле".
 *
 * Uses the currently selected model item (left details) and tries to locate
 * the matching object in the profile tree by name.
 */
function handleShowInProfile() {
  profileDetailsSubtitleOverride = null;
  setDetailsPanelSubtitle("profile-item-details", "");

  // Capture source tab so we can sync on success / not-found.
  const sourceTab = getActiveDetailsTabName("available-item-details");
  const mappedTargetTab = mapDetailsTabToOtherPanel(sourceTab);

  if (!currentProfileId) {
    showToast("Не удалось определить текущий профиль", { type: "error" });
    return;
  }

  const ctx = getActiveLeftNodeContext();
  if (!ctx) {
    showToast("Выберите класс или пакет в левом дереве", { type: "info" });
    return;
  }

  const item = getItemDetailsByKey(activeLeftItem, availableData, profileData);
  const name = String(item?.name ?? "").trim();
  if (!name) {
    showToast("Не удалось определить имя выбранного объекта", { type: "error" });
    return;
  }

  const profileTree = document.getElementById("profile-tree");
  if (!profileTree) return;

  if (ctx.type === "class") {
    const found = findProfileClassByName(profileData.items, name);
    if (!found) {
      renderProfileClassNotFoundState({ preferredTabName: mappedTargetTab });
      return;
    }

    // Sync tabs only when we are about to navigate/select a real profile item.
    if (mappedTargetTab) {
      pendingDetailsTabSync = { targetSide: SIDE_RIGHT, tabName: mappedTargetTab };
    }

    const selector = `.tree-item-with-checkbox[data-type="class"][data-class-id="${cssEscape(
      found.id
    )}"][data-profile-id="${cssEscape(currentProfileId)}"]`;

    const nodeEl = profileTree.querySelector(selector);
    if (!(nodeEl instanceof HTMLElement)) {
      // Data says it's present, but the tree node wasn't found.
      showToast("Не удалось найти класс в дереве профиля", { type: "error" });
      return;
    }

    // If class exists but comes from another model, show a contextual subtitle.
    const sourceModelId = String(ctx.modelId || "").trim();
    const refModelId = String(found?.refModelId || "").trim();
    if (sourceModelId && refModelId && sourceModelId !== refModelId) {
      const modelName = findModelNameById(availableData, refModelId);
      const extra = modelName ? modelName : refModelId;
      const itemKey = nodeEl.getAttribute("data-item-key") || "";
      if (itemKey) {
        profileDetailsSubtitleOverride = {
          itemKey,
          message: `Класс профиля импортирован из другой модели: ${extra}`,
        };
      }
    }

    focusProfileTreeNode(nodeEl);
    return;
  }

  if (ctx.type === "package") {
    const found = findProfilePackageByName(profileData.items, name);
    if (!found) {
      renderProfileDetailsEmptyState("Пакет не найден в текущем профиле.");
      return;
    }

    const selector = `.tree-item-with-checkbox[data-type="package"][data-package-id="${cssEscape(
      found.id
    )}"][data-profile-id="${cssEscape(currentProfileId)}"]`;

    const nodeEl = profileTree.querySelector(selector);
    if (!(nodeEl instanceof HTMLElement)) {
      showToast("Не удалось найти пакет в дереве профиля", { type: "error" });
      return;
    }

    focusProfileTreeNode(nodeEl);
    return;
  }

  showToast("Поддерживается только поиск классов и пакетов", { type: "info" });
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
 * Render available models/profiles tree.
 *
 * While rendering the left tree, we compare class names against the current
 * profile's class set. If a class name is already present in the profile,
 * the corresponding checkbox in the left tree becomes disabled to prevent
 * duplicate transfers.
 */
function renderAvailableTree() {
  const container = document.getElementById("available-tree");
  if (!container) {
    console.error("❌ Container #available-tree not found");
    return;
  }

  // Profile-wide set of normalized class names that are already in the profile.
  // Used only for UI (disabling checkboxes); business rules are still enforced
  // in the transfer operation as well.
  const disabledClassNames = collectProfileClassNames(profileData.items);

  const html = renderAvailableTreeHTML(
    availableData,
    selectedLeftItems,
    expandedLeftItems,
    activeLeftItem,
    { disabledClassNames }
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

  // Details panel buttons (event delegation because the panel HTML is re-rendered).
  const detailsPanel = document.getElementById("details-panel");
  if (detailsPanel) {
    detailsPanel.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const showInProfileBtn = target.closest("#show-in-profile-btn");
      if (showInProfileBtn) {
        handleShowInProfile();
      }

      const showInModelBtn = target.closest("#show-in-model-btn");
      if (showInModelBtn) {
        handleShowInModel();
      }
    });
  }
}

// ============================================================
// PROFILE OPERATIONS
// ============================================================

async function transferToProfile() {
  if (selectedLeftItems.size === 0) {
    showToast("Выберите классы для переноса", { type: "error" });
    return;
  }

  if (!currentProjectId || !currentProfileId) {
    showToast("Не удалось определить текущий проект/профиль", { type: "error" });
    return;
  }

  const targetPackageId = resolveTargetProfilePackageId();
  if (!targetPackageId) {
    showToast("Не найден целевой пакет профиля (корневой пакет отсутствует)", { type: "error" });
    return;
  }

  const existingNames = collectProfileClassNames(profileData.items);

  /** @type {Array<string>} */
  const transferred = [];
  /** @type {Array<{name: string, reason: string}>} */
  const skipped = [];
  /** @type {Array<{name: string, reason: string}>} */
  const failed = [];

  let lastProject = null;

  // Process only model classes (left-model-...) from the selected set.
  const selectedKeys = Array.from(selectedLeftItems);
  const modelClassKeys = selectedKeys.filter((k) => String(k).startsWith("left-model-") && String(k).includes("-cls-"));

  if (modelClassKeys.length === 0) {
    showToast("Выберите хотя бы один класс модели (в левом дереве)", { type: "error" });
    return;
  }

  for (const itemKey of modelClassKeys) {
    const item = getItemDetailsByKey(itemKey, availableData, profileData);
    const className = String(item?.name ?? "").trim();

    if (!item || !className) {
      failed.push({ name: className || String(itemKey), reason: "Не удалось прочитать данные класса" });
      continue;
    }

    const refModelId = item?.modelId ? String(item.modelId) : "";
    const refModelItemId = item?.id ? String(item.id) : "";

    if (!refModelId || !refModelItemId) {
      failed.push({ name: className, reason: "Класс не относится к модели (нет modelId/id)" });
      continue;
    }

    const normalized = normalizeClassName(className);
    if (existingNames.has(normalized)) {
      skipped.push({ name: className, reason: "В профиле уже есть класс с таким именем" });
      continue;
    }

    // Build payload for backend ClassProfile creation.
    // Note: no attributes/literals/links are sent (only the class itself).
    const payload = {
      name: className,
      type: item?.type ?? null,
      stereotype: item?.stereotype ?? null,
      documentation: item?.documentation ?? null,
      documentationRu: item?.documentationRu ?? null,
      details: item?.details ?? null,
      isAbstract: item?.isAbstract ?? null,
      refModelId,
      refModelItemId,
    };

    try {
      // Backend persistence is performed per class (separate request for each class).
      const project = await createProfileClass(
        String(currentProjectId),
        String(currentProfileId),
        String(targetPackageId),
        payload
      );

      lastProject = project;
      transferred.push(className);
      existingNames.add(normalized);
    } catch (e) {
      const status = Number(e?.status || 0);
      const msg = e?.message ? String(e.message) : "Ошибка сохранения";

      // Respect profile-wide uniqueness by name (backend returns 409).
      if (status === 409) {
        skipped.push({ name: className, reason: msg });
      } else {
        failed.push({ name: className, reason: msg });
      }
    }
  }

  if (lastProject) {
    // Sync local UI state from backend and rerender both trees.
    syncProfileDataFromProject(lastProject);
    await loadAvailableData();
    renderAvailableTree();
    renderProfileTree();
  }

  // Clear selection
  selectedLeftItems.clear();
  leftTreeComponent?.clearSelection?.();

  // Report via toasts
  const summary = `Перенос завершён: добавлено ${transferred.length}, пропущено ${skipped.length}, ошибок ${failed.length}`;
  showToast(summary, {
    type: failed.length ? "error" : skipped.length ? "info" : "success",
    timeoutMs: 7000,
    actions: [
      {
        label: "Подробнее",
        onClick: () => {
          openReportModal({
            title: "Отчёт: перенос классов в профиль",
            summaryLines: [
              summary,
              `Добавлено: ${transferred.length}${transferred.length ? ` (${formatNamePreview(transferred, 8)})` : ""}`,
              `Пропущено: ${skipped.length}${skipped.length ? ` (${formatIssuePreview(skipped, 8)})` : ""}`,
              `Ошибки: ${failed.length}${failed.length ? ` (${formatIssuePreview(failed, 8)})` : ""}`,
            ],
            sections: [
              { title: `Добавлено (${transferred.length})`, items: transferred.map((name) => ({ text: name, kind: "success" })) },
              {
                title: `Пропущено (${skipped.length})`,
                items: skipped.map((x) => ({ text: `${x.name}${x.reason ? ` — ${x.reason}` : ""}`, kind: "info" })),
              },
              {
                title: `Ошибки (${failed.length})`,
                items: failed.map((x) => ({ text: `${x.name}${x.reason ? ` — ${x.reason}` : ""}`, kind: "error" })),
              },
            ],
          });
        },
      },
    ],
  });
}

async function removeFromProfile() {
  if (selectedRightItems.size === 0) {
    showToast("Выберите классы для исключения из профиля", { type: "error" });
    return;
  }

  if (!currentProjectId || !currentProfileId) {
    showToast("Не удалось определить текущий проект/профиль", { type: "error" });
    return;
  }

  // Only classes can be excluded by this button (packages/diagrams have their own UX).
  const selectedKeys = Array.from(selectedRightItems);
  const classKeys = selectedKeys.filter((k) => String(k).includes("-cls-"));

  if (classKeys.length === 0) {
    showToast("Выберите хотя бы один класс в правом дереве", { type: "error" });
    return;
  }

  if (!confirm(`Исключить ${classKeys.length} класс(ов) из профиля?`)) {
    return;
  }

  /** @type {Array<string>} */
  const removed = [];
  /** @type {Array<{name: string, reason: string}>} */
  const skipped = [];
  /** @type {Array<{name: string, reason: string}>} */
  const failed = [];

  let lastProject = null;

  for (const itemKey of classKeys) {
    const item = getItemDetailsByKey(itemKey, availableData, profileData);
    const classId = String(item?.id ?? "").trim();
    const className = String(item?.name ?? "").trim();

    if (!isProfileClassItem(item) || !classId) {
      skipped.push({ name: className || String(itemKey), reason: "Выбранный элемент не является классом профиля" });
      continue;
    }

    try {
      // Backend removes ClassProfile row; relation to ClassModel is cleared by deletion.
      const project = await deleteProfileClass(
        String(currentProjectId),
        String(currentProfileId),
        classId
      );
      lastProject = project;
      removed.push(className);
    } catch (e) {
      const status = Number(e?.status || 0);
      const msg = e?.message ? String(e.message) : "Ошибка удаления";

      if (status === 404) {
        skipped.push({ name: className, reason: msg });
      } else {
        failed.push({ name: className, reason: msg });
      }
    }
  }

  if (lastProject) {
    syncProfileDataFromProject(lastProject);
    await loadAvailableData();
    renderAvailableTree();
    renderProfileTree();
  }

  // Clear selection
  selectedRightItems.clear();
  rightTreeComponent?.clearSelection?.();

  // Report via toasts
  const summary = `Исключение завершено: удалено ${removed.length}, пропущено ${skipped.length}, ошибок ${failed.length}`;
  showToast(summary, {
    type: failed.length ? "error" : skipped.length ? "info" : "success",
    timeoutMs: 7000,
    actions: [
      {
        label: "Подробнее",
        onClick: () => {
          openReportModal({
            title: "Отчёт: исключение классов из профиля",
            summaryLines: [
              summary,
              `Удалено: ${removed.length}${removed.length ? ` (${formatNamePreview(removed, 8)})` : ""}`,
              `Пропущено: ${skipped.length}${skipped.length ? ` (${formatIssuePreview(skipped, 8)})` : ""}`,
              `Ошибки: ${failed.length}${failed.length ? ` (${formatIssuePreview(failed, 8)})` : ""}`,
            ],
            sections: [
              { title: `Удалено (${removed.length})`, items: removed.map((name) => ({ text: name, kind: "success" })) },
              {
                title: `Пропущено (${skipped.length})`,
                items: skipped.map((x) => ({ text: `${x.name}${x.reason ? ` — ${x.reason}` : ""}`, kind: "info" })),
              },
              {
                title: `Ошибки (${failed.length})`,
                items: failed.map((x) => ({ text: `${x.name}${x.reason ? ` — ${x.reason}` : ""}`, kind: "error" })),
              },
            ],
          });
        },
      },
    ],
  });
}

/**
 * Save profile
 */
async function handleSaveProfile() {
  // Validate profile
  const validation = validateProfile(profileData);

  if (!validation.valid) {
    const errors = Array.isArray(validation.errors) ? validation.errors : [];
    const shown = errors.slice(0, 4);
    const rest = errors.length - shown.length;
    const preview = rest > 0 ? `${shown.join("; ")} (+${rest})` : shown.join("; ");
    showToast(`Ошибки валидации: ${preview || "(подробности в консоли)"}`, { type: "error", timeoutMs: 10000 });
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

      showToast("Профиль успешно обновлён", { type: "success" });
    } else {
      // Create new profile
      const newProfile = await createProfile(currentProjectId, preparedProfile);
      if (!newProfile) {
        throw new Error("Не удалось создать профиль");
      }

      profileData.id = newProfile.id;

      showToast("Профиль успешно создан", { type: "success" });
    }

    // Redirect back to project details
    // window.location.href = `project-details.html?id=${currentProjectId}`;
  } catch (error) {
    console.error("❌ Error saving profile:", error);
    showToast(`Ошибка при сохранении профиля: ${error.message}`, { type: "error", timeoutMs: 10000 });
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
