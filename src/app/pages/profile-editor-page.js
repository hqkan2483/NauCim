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
import { initDetailsPanel } from "../../ui/components/profile-details-panel.js";

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

  console.log("🚀 Profile Editor initialized");
  console.log("  - Profile ID from URL:", currentProfileId);

  if (!currentProfileId) {
    console.error("❌ No profile ID found in URL");
    showNoProfileWarning();
    return;
  }

  // ✅ Find project that contains this profile
  const projectId = findProjectByProfileId(currentProfileId);

  if (!projectId) {
    console.error("❌ Project not found for profile:", currentProfileId);
    showNoProjectWarning();
    return;
  }

  currentProjectId = projectId;
  console.log("  - Project ID found:", currentProjectId);

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
  console.log("🔍 Searching for project containing profile:", profileId);

  // ✅ Get all projects from memoryStorage
  const projects = getAllProjects();

  console.log("  - Total projects:", projects.length);

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
        console.log(
          `  ✅ Profile "${profile.name}" found in project "${project.name}" (ID: ${project.id})`
        );
        return project.id;
      }
    }
  }

  console.warn("  ⚠️ Profile not found in any project");
  return null;
}

// ============================================================
// INIT COMPONENTS
// ============================================================

function initComponents() {
  console.log("🔧 Initializing components...");

  // Initialize left tree (available items)
  const leftTreeContainer = document.getElementById("available-tree");
  console.log("  - Left tree container:", leftTreeContainer);

  if (leftTreeContainer) {
    leftTreeComponent = initEditorTree("available-tree", {
      onSelect: (itemKey) => {
        console.log("📌 Left tree item selected:", itemKey);
        activeLeftItem = itemKey;
        loadItemDetails(itemKey, "left");
      },
      onExpand: (itemKey, isExpanded) => {
        console.log("📂 Left tree item expanded:", itemKey, isExpanded);
        if (isExpanded) {
          expandedLeftItems.add(itemKey);
        } else {
          expandedLeftItems.delete(itemKey);
        }
      },
      onCheck: (itemKey, isChecked) => {
        console.log("☑️ Left tree item checked:", itemKey, isChecked);
        if (isChecked) {
          selectedLeftItems.add(itemKey);
        } else {
          selectedLeftItems.delete(itemKey);
        }
      },
    });
    console.log("  ✅ Left tree component initialized:", leftTreeComponent);
  } else {
    console.error("  ❌ Left tree container not found");
  }

  // Initialize right tree (profile items)
  const rightTreeContainer = document.getElementById("profile-tree");
  console.log("  - Right tree container:", rightTreeContainer);

  if (rightTreeContainer) {
    rightTreeComponent = initEditorTree("profile-tree", {
      onSelect: (itemKey) => {
        console.log("📌 Right tree item selected:", itemKey);
        activeRightItem = itemKey;
        loadItemDetails(itemKey, "right");
      },
      onExpand: (itemKey, isExpanded) => {
        console.log("📂 Right tree item expanded:", itemKey, isExpanded);
        if (isExpanded) {
          expandedRightItems.add(itemKey);
        } else {
          expandedRightItems.delete(itemKey);
        }
      },
      onCheck: (itemKey, isChecked) => {
        console.log("☑️ Right tree item checked:", itemKey, isChecked);
        if (isChecked) {
          selectedRightItems.add(itemKey);
        } else {
          selectedRightItems.delete(itemKey);
        }
      },
    });
    console.log("  ✅ Right tree component initialized:", rightTreeComponent);
  } else {
    console.error("  ❌ Right tree container not found");
  }

  // Initialize details panel
  const detailsPanelContainer = document.getElementById("details-panel");
  console.log("  - Details panel container:", detailsPanelContainer);

  if (detailsPanelContainer) {
    detailsPanelComponent = initDetailsPanel("details-panel", {
      onTabSwitch: (tabName) => {
        console.log("📑 Tab switched to:", tabName);
      },
      defaultTab: "model",
    });
    console.log("  ✅ Details panel initialized:", detailsPanelComponent);
  } else {
    console.error("  ❌ Details panel container not found");
  }

  console.log("✅ All components initialized");
}

// ============================================================
// LOAD ITEM DETAILS
// ============================================================

function loadItemDetails(itemKey, side) {
  console.log("📋 Loading item details:", itemKey, "Side:", side);

  if (!detailsPanelComponent) {
    console.error("❌ Details panel component not initialized");
    return;
  }

  const item = getItemDetailsByKey(itemKey, availableData, profileData);

  console.log("  - Item found:", item);

  if (side === "left") {
    detailsPanelComponent.renderModelDetails(item);
    detailsPanelComponent.switchTab("model");
  } else {
    detailsPanelComponent.renderProfileDetails(item);
    detailsPanelComponent.switchTab("profile");
  }
}

// ============================================================
// LOAD DATA
// ============================================================

/**
 * Load profile from URL parameters
 */
function loadProfileFromUrl() {
  console.log("📄 Loading profile...");
  console.log("  - Profile ID:", currentProfileId);
  console.log("  - Project ID:", currentProjectId);

  if (!currentProfileId || !currentProjectId) {
    console.error("❌ Missing IDs");
    return;
  }

  // ✅ Parse profileId to number for getProfile
  const profileIdNum = parseInt(currentProfileId);
  const profile = getProfile(currentProjectId, profileIdNum);

  console.log("  - Profile data:", profile);

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

    console.log("  ✅ Profile loaded:", {
      name: profileData.name,
      itemsCount: profileData.items.length,
    });

    updateProfileDisplay();
  } else {
    console.warn("⚠️ Profile not found:", currentProfileId);
    showNoProfileWarning();
  }
}

/**
 * Load available models and profiles
 */
function loadAvailableData() {
  const project = getProjectById(currentProjectId);

  console.log("📦 Loading available data...");
  console.log("  - Project:", project);

  if (!project) {
    console.error("❌ Project not found:", currentProjectId);
    return;
  }

  availableData = [];

  // ✅ Add models with NEW structure (rootPackages)
  if (project.models && Array.isArray(project.models)) {
    console.log("📋 Models found:", project.models.length);

    project.models.forEach((model) => {
      // ✅ NEW STRUCTURE:  rootPackages[0].packages
      const packages = model.rootPackages?.[0]?.packages || [];

      console.log(`  - Model "${model.name}":`, {
        rootPackages: model.rootPackages?.length || 0,
        packages: packages.length,
      });

      availableData.push({
        type: "model",
        id: model.id,
        name: model.name,
        data: model,
        children: packages, // ✅ Use extracted packages
      });
    });
  } else {
    console.warn("⚠️ No models found in project");
  }

  // ✅ Add profiles with NEW structure
  if (project.profiles && Array.isArray(project.profiles)) {
    console.log("⚙️ Profiles found:", project.profiles.length);

    project.profiles.forEach((profile) => {
      // ✅ Don't include the profile being edited
      const isCurrentProfile =
        profile.id === profileData.id ||
        profile.id === parseInt(currentProfileId) ||
        String(profile.id) === String(currentProfileId);

      if (!isCurrentProfile) {
        // ✅ NEW STRUCTURE:  rootPackages[0].packages
        const packages = profile.rootPackages?.[0]?.packages || [];

        console.log(`  - Profile "${profile.name}":`, {
          rootPackages: profile.rootPackages?.length || 0,
          packages: packages.length,
        });

        availableData.push({
          type: "profile",
          id: profile.id,
          name: profile.name,
          data: profile,
          children: packages, // ✅ Use extracted packages
        });
      } else {
        console.log(`  - Skipping current profile "${profile.name}"`);
      }
    });
  } else {
    console.warn("⚠️ No profiles found in project");
  }

  console.log("✅ Available data loaded:", availableData.length, "items");
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

  console.log("🎨 Rendering available tree...");
  console.log("  - Available data:", availableData.length);

  const html = renderAvailableTreeHTML(
    availableData,
    selectedLeftItems,
    expandedLeftItems,
    activeLeftItem
  );

  console.log("  - HTML length:", html.length);

  container.innerHTML = html;

  console.log("✅ Available tree rendered");
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

  console.log("🎨 Rendering profile tree...");
  console.log("  - Profile items:", profileData.items.length);

  const html = renderProfileTreeHTML(
    profileData,
    selectedRightItems,
    expandedRightItems,
    activeRightItem
  );

  console.log("  - HTML length:", html.length);

  container.innerHTML = html;

  console.log("✅ Profile tree rendered");
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

  // // Tree interactions (delegated)
  // document.addEventListener("click", handleTreeClick);

  // Details tabs
  bindDetailsTabs();
}

/**
 * Handle tree click events (delegated)
 */
function handleTreeClick(e) {
  const target = e.target;

  // Toggle expand/collapse
  if (target.closest("[data-action='toggle-expand']")) {
    const treeItem = target.closest("[data-item-key]");
    if (treeItem) {
      const itemKey = treeItem.getAttribute("data-item-key");
      const side = treeItem.getAttribute("data-side") || "left";
      toggleExpand(itemKey, side);
    }
    return;
  }

  // Toggle checkbox
  if (target.closest("[data-action='toggle-select']")) {
    const treeItem = target.closest("[data-item-key]");
    if (treeItem) {
      const itemKey = treeItem.getAttribute("data-item-key");
      const side = treeItem.getAttribute("data-side") || "left";
      toggleSelect(itemKey, side);
    }
    return;
  }

  // Select item
  const treeItem = target.closest("[data-item-key]");
  if (treeItem) {
    const itemKey = treeItem.getAttribute("data-item-key");
    const side = treeItem.getAttribute("data-side") || "left";
    setActiveItem(itemKey, side);
  }
}

// ============================================================
// PROFILE OPERATIONS
// ============================================================

function transferToProfile() {
  console.log("→ Transfer to profile");
  console.log("  - Selected left items:", selectedLeftItems.size);

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

    console.log("✅ Transfer complete");
  } catch (error) {
    console.error("❌ Transfer failed:", error);
    alert("Ошибка при переносе элементов: " + error.message);
  }
}

function removeFromProfile() {
  console.log("✕ Remove from profile");
  console.log("  - Selected right items:", selectedRightItems.size);

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

    console.log("✅ Removal complete");
  } catch (error) {
    console.error("❌ Removal failed:", error);
    alert("Ошибка при удалении элементов: " + error.message);
  }
}

/**
 * Save profile
 */
function handleSaveProfile() {
  console.log("💾 Saving profile...");
  console.log("  - Profile data:", profileData);

  // Validate profile
  const validation = validateProfile(profileData);

  if (!validation.valid) {
    alert("Ошибки валидации:\n" + validation.errors.join("\n"));
    console.error("❌ Validation errors:", validation.errors);
    return;
  }

  // Prepare for save
  const preparedProfile = prepareProfileForSave(profileData, currentProjectId);

  console.log("  - Prepared profile:", preparedProfile);

  // Save profile
  try {
    if (preparedProfile.id && preparedProfile.id !== null) {
      // Update existing profile
      updateProfile(currentProjectId, preparedProfile.id, preparedProfile);
      console.log("  ✅ Profile updated");
      alert("Профиль успешно обновлён!");
    } else {
      // Create new profile
      const newProfile = createProfile(currentProjectId, preparedProfile);
      profileData.id = newProfile.id;
      console.log("  ✅ Profile created with ID:", newProfile.id);
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
  const toggleBtn = document.getElementById("toggle-mode-btn");

  if (isEditorMode) {
    contentArea.classList.remove("standart-mode");
    contentArea.classList.add("editor-mode");
    toggleBtn.innerHTML = "📋 Стандартный режим";
  } else {
    contentArea.classList.remove("editor-mode");
    contentArea.classList.add("standart-mode");
    toggleBtn.innerHTML = "📐 Режим диаграммы";
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
// ============================================================
// DETAILS TABS
// ============================================================

function bindDetailsTabs() {
  const tabs = document.querySelectorAll(".tabs .tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.getAttribute("data-tab");
      switchDetailsTab(tabName);
    });
  });
}

function switchDetailsTab(tabName) {
  // Remove active from all tabs
  document.querySelectorAll(".tabs .tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Add active to clicked tab
  const activeTab = document.querySelector(`.tabs .tab[data-tab="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.add("active");
  }

  // Hide all tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Show selected content
  const activeContent = document.querySelector(
    `[data-tab-content="${tabName}"]`
  );
  if (activeContent) {
    activeContent.classList.add("active");
  }
}

console.log("Profile Editor Page Module Loaded");
