import {
  getProjectById,
  appDataInit,
  getAllProjects,
} from "../../services/project-service.js";
import {
  getProfile,
  updateProfile,
  createProfile,
} from "../../services/profile-service.js";
import { getQueryParam } from "../../utils/url-helper.js";
import { renderAvailableTree as renderAvailableTreeHTML } from "../../ui/renderers/available-tree-renderer.js";
import { renderProfileTree as renderProfileTreeHTML } from "../../ui/renderers/profile-tree-renderer.js";
import {
  transferItemsToProfile,
  removeItemsFromProfile,
  validateProfile,
  prepareProfileForSave,
  getItemDetailsByKey,
} from "../../services/profile-editor-service.js";
import { initEditorTree } from "../../ui/components/editor-tree.js";
import {
  initDetailsPanel,
  renderProfileEditorDetailsPanelLayout,
  renderProfileEditorDetailsTabs,
} from "../../ui/components/profile-editor-details-panel.js";

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

/// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  await appDataInit();

  // ✅ Get profile ID from URL
  currentProfileId = getQueryParam("id");

  if (!currentProfileId) {
    showNoProfileWarning();
    return;
  }

  // ✅ Find project that contains this profile
  const projectId = findProjectByProfileId(currentProfileId);

  if (!projectId) {
    showNoProjectWarning();
    return;
  }

  currentProjectId = projectId;

  loadProfileFromUrl();
  loadAvailableData();

  // ✅ Render trees FIRST
  renderAvailableTree();
  renderProfileTree();

  // ✅ Then initialize components (they need the rendered HTML)
  initComponents();

  // ✅ Finally bind global events
  bindEvents();
});

// ============================================================
// FIND PROJECT BY PROFILE ID
// ============================================================

/**
 * Find project ID by profile ID
 * @param {string|number} profileId - Profile ID
 * @returns {string|number|null} Project ID or null
 */
function findProjectByProfileId(profileId) {
  // ✅ Get all projects from memoryStorage
  const projects = getAllProjects();

  for (const project of projects) {
    if (project.profiles && Array.isArray(project.profiles)) {
      const profile = project.profiles.find((p) => {
        // ✅ Compare as both string and number
        return (
          p.id === profileId ||
          p.id === parseInt(profileId) ||
          p.id === String(profileId) ||
          String(p.id) === String(profileId)
        );
      });

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
  // Initialize left tree (available items)
  const leftTreeContainer = document.getElementById("available-tree");

  if (leftTreeContainer) {
    leftTreeComponent = initEditorTree("available-tree", {
      onSelect: (itemKey) => {
        activeLeftItem = itemKey;
        loadItemDetails(itemKey, "left");
      },
      onExpand: (itemKey, isExpanded) => {
        if (isExpanded) {
          expandedLeftItems.add(itemKey);
        } else {
          expandedLeftItems.delete(itemKey);
        }
      },
      onCheck: (itemKey, isChecked) => {
        if (isChecked) {
          selectedLeftItems.add(itemKey);
        } else {
          selectedLeftItems.delete(itemKey);
        }
      },
    });
  } else {
    console.error("  ❌ Left tree container not found");
  }

  // Initialize right tree (profile items)
  const rightTreeContainer = document.getElementById("profile-tree");

  if (rightTreeContainer) {
    rightTreeComponent = initEditorTree("profile-tree", {
      onSelect: (itemKey) => {
        activeRightItem = itemKey;
        loadItemDetails(itemKey, "right");
      },
      onExpand: (itemKey, isExpanded) => {
        if (isExpanded) {
          expandedRightItems.add(itemKey);
        } else {
          expandedRightItems.delete(itemKey);
        }
      },
      onCheck: (itemKey, isChecked) => {
        if (isChecked) {
          selectedRightItems.add(itemKey);
        } else {
          selectedRightItems.delete(itemKey);
        }
      },
    });
  } else {
    console.error("  ❌ Right tree container not found");
  }

  // Initialize details panel
  const detailsPanelContainer = document.getElementById("details-panel");

  if (detailsPanelContainer) {
    detailsPanelContainer.innerHTML = renderProfileEditorDetailsPanelLayout();

    detailsPanelComponent = initDetailsPanel("details-panel", {
      onTabSwitch: (tabName) => {},
      defaultTab: "model",
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

  if (side === "left") {
    detailsPanelComponent.renderModelDetails(item);
    updateDetailsTabsForSide("left", item);
  } else {
    detailsPanelComponent.renderProfileDetails(item);
    updateDetailsTabsForSide("right", item);
  }
}

function updateDetailsTabsForSide(side, item) {
  const sectionId = side === "left" ? "available-item-details" : "profile-item-details";
  const sectionKind = side === "left" ? "available" : "profile";
  const defaultTab = side === "left" ? "model" : "profile";

  const sectionEl = document.getElementById(sectionId);
  const tabsEl = sectionEl?.querySelector(".tabs");
  if (!sectionEl || !tabsEl) return;

  const currentActiveTab = tabsEl.querySelector(".tab.active")?.getAttribute("data-tab") || null;

  tabsEl.innerHTML = renderProfileEditorDetailsTabs(item, {
    section: sectionKind,
    activeTab: currentActiveTab || defaultTab,
  });

  // выбираем таб, который реально существует после пересборки
  const desiredTab =
    (currentActiveTab && tabsEl.querySelector(`.tab[data-tab="${currentActiveTab}"]`))
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
function loadProfileFromUrl() {
  if (!currentProfileId || !currentProjectId) {
    console.error("❌ Missing IDs");
    return;
  }

  // ✅ Parse profileId to number for getProfile
  const profileIdNum = parseInt(currentProfileId);
  const profile = getProfile(currentProjectId, profileIdNum);

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
function loadAvailableData() {
  const project = getProjectById(currentProjectId);

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
  } else {
  }

  // ✅ Add profiles with NEW structure
  if (project.profiles && Array.isArray(project.profiles)) {
    project.profiles.forEach((profile) => {
      // ✅ Don't include the profile being edited
      const isCurrentProfile =
        profile.id === profileData.id ||
        profile.id === parseInt(currentProfileId) ||
        String(profile.id) === String(currentProfileId);

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
      } else {
      }
    });
  } else {
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
    clearLeftBtn.addEventListener("click", () => clearSelection("left"));
  }

  const clearRightBtn = document.getElementById("clear-right-selection-btn");
  if (clearRightBtn) {
    clearRightBtn.addEventListener("click", () => clearSelection("right"));
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
    profileData = transferItemsToProfile(
      selectedLeftItems,
      availableData,
      profileData
    );

    // Clear selection
    selectedLeftItems.clear();
    if (leftTreeComponent) {
      leftTreeComponent.clearSelection();
    }

    // Re-render profile tree
    renderProfileTree();

    // Re-initialize right tree component
    if (rightTreeComponent) {
      rightTreeComponent.destroy();
    }
    rightTreeComponent = initEditorTree("profile-tree", {
      onSelect: (itemKey) => {
        activeRightItem = itemKey;
        loadItemDetails(itemKey, "right");
      },
      onExpand: (itemKey, isExpanded) => {
        if (isExpanded) {
          expandedRightItems.add(itemKey);
        } else {
          expandedRightItems.delete(itemKey);
        }
      },
      onCheck: (itemKey, isChecked) => {
        if (isChecked) {
          selectedRightItems.add(itemKey);
        } else {
          selectedRightItems.delete(itemKey);
        }
      },
    });
  } catch (error) {
    console.error("❌ Transfer failed:", error);
    alert("Ошибка при переносе элементов: " + error.message);
  }
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
    if (rightTreeComponent) {
      rightTreeComponent.clearSelection();
    }

    // Re-render profile tree
    renderProfileTree();

    // Re-initialize right tree component
    if (rightTreeComponent) {
      rightTreeComponent.destroy();
    }
    rightTreeComponent = initEditorTree("profile-tree", {
      onSelect: (itemKey) => {
        activeRightItem = itemKey;
        loadItemDetails(itemKey, "right");
      },
      onExpand: (itemKey, isExpanded) => {
        if (isExpanded) {
          expandedRightItems.add(itemKey);
        } else {
          expandedRightItems.delete(itemKey);
        }
      },
      onCheck: (itemKey, isChecked) => {
        if (isChecked) {
          selectedRightItems.add(itemKey);
        } else {
          selectedRightItems.delete(itemKey);
        }
      },
    });
  } catch (error) {
    console.error("❌ Removal failed:", error);
    alert("Ошибка при удалении элементов: " + error.message);
  }
}

/**
 * Save profile
 */
function handleSaveProfile() {
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
      updateProfile(currentProjectId, preparedProfile.id, preparedProfile);

      alert("Профиль успешно обновлён!");
    } else {
      // Create new profile
      const newProfile = createProfile(currentProjectId, preparedProfile);
      profileData.id = newProfile.id;

      alert("Профиль успешно создан!");
    }

    // Redirect back to project details
    window.location.href = `project-details.html?id=${currentProjectId}`;
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
  if (side === "left") {
    selectedLeftItems.clear();
    // ✅ Use component method instead of re-rendering
    if (leftTreeComponent) {
      leftTreeComponent.clearSelection();
    }
  } else {
    selectedRightItems.clear();
    if (rightTreeComponent) {
      rightTreeComponent.clearSelection();
    }
  }
}

// ============================================================
// SEARCH/FILTER
// ============================================================

function filterLeftTree() {
  const searchInput = document.getElementById("left-search");
  const query = searchInput.value;

  // TODO: Implement visual filtering (hide non-matching items)
  console.log("Filtering left tree:", query);
}

function filterRightTree() {
  const searchInput = document.getElementById("right-search");
  const query = searchInput.value;

  // TODO:  Implement visual filtering
  console.log("Filtering right tree:", query);
}

console.log("Profile Editor Page Module Loaded");
