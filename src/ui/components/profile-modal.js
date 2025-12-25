import { createProfile, updateProfile, getProfile, isProfileNameUnique } from "../../services/profile-service.js";
import { closeModal, openModal } from "../modal.js";

/**
 * Profile Modal Component
 * Self-contained modal with validation and business logic
 */

let editingProfileId = null;
let currentProjectId = null;

// Callbacks from pages
let onCreateCallback = null;
let onUpdateCallback = null;

/**
 * Initialize profile modal handlers
 * @param {string} projectId - Current project ID
 * @param {Object} callbacks - { onCreate, onUpdate }
 */
function initProfileModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onCreateCallback = callbacks.onCreate || null;
  onUpdateCallback = callbacks.onUpdate || null;

  // Bind create button
  const createBtn = document.getElementById("create-profile-btn");
  if (createBtn) {
    createBtn.addEventListener("click", handleCreateProfile);
  }

  // Bind save edit button
  const saveEditBtn = document.getElementById("save-profile-edit-btn");
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", handleSaveProfileEdit);
  }

  // Initialize real-time validation
  initValidation();
}

/**
 * Initialize real-time validation for name inputs
 */
function initValidation() {
  // New profile modal
  const nameInput = document.getElementById("profile-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      validateNameField(nameInput, null);
    });

    nameInput.addEventListener("blur", () => {
      validateNameField(nameInput, null);
    });
  }

  // Edit profile modal
  const editNameInput = document.getElementById("edit-profile-name");
  if (editNameInput) {
    editNameInput.addEventListener("input", () => {
      validateNameField(editNameInput, editingProfileId);
    });

    editNameInput.addEventListener("blur", () => {
      validateNameField(editNameInput, editingProfileId);
    });
  }
}

/**
 * Validate name field and show visual feedback
 * @param {HTMLInputElement} input
 * @param {string|null} excludeId - Profile ID to exclude (for edit)
 * @returns {boolean} - true if valid
 */
function validateNameField(input, excludeId = null) {
  if (!currentProjectId) return false;

  const name = input.value.trim();

  // Remove previous feedback
  clearValidationFeedback(input);

  // Empty check
  if (!name) {
    return false;
  }

  // Length check
  if (name.length < 3) {
    showValidationError(input, "Минимум 3 символа");
    return false;
  }

  // Uniqueness check
  if (! isProfileNameUnique(currentProjectId, name, excludeId)) {
    showValidationError(input, "Профиль с таким названием уже существует");
    return false;
  }

  // Success
  showValidationSuccess(input, "✓ Название доступно");
  return true;
}

/**
 * Clear validation feedback
 */
function clearValidationFeedback(input) {
  input.classList.remove("input-error", "input-success");

  const feedback = input.parentNode.querySelector(".validation-feedback");
  if (feedback) {
    feedback.remove();
  }
}

/**
 * Show validation error
 */
function showValidationError(input, message) {
  input.classList.add("input-error");
  input.classList.remove("input-success");

  const feedback = document.createElement("div");
  feedback.className = "validation-feedback validation-error";
  feedback.textContent = message;
  input.parentNode.appendChild(feedback);
}

/**
 * Show validation success
 */
function showValidationSuccess(input, message) {
  input.classList.add("input-success");
  input.classList.remove("input-error");

  const feedback = document.createElement("div");
  feedback.className = "validation-feedback validation-success";
  feedback.textContent = message;
  input.parentNode.appendChild(feedback);
}

/**
 * Clear new profile modal form
 */
function clearNewProfileModal() {
  const nameInput = document.getElementById("profile-name");
  const descInput = document.getElementById("profile-desc");
  const versionInput = document.getElementById("profile-version");

  if (nameInput) {
    nameInput.value = "";
    clearValidationFeedback(nameInput);
  }
  if (descInput) descInput.value = "";
  if (versionInput) versionInput.value = "1.0";
}

/**
 * Open edit profile modal
 * @param {string} profileId
 */
function openEditProfileModal(profileId) {
  if (!currentProjectId) return;

  const profile = getProfile(currentProjectId, profileId);
  if (!profile) return;

  const nameInput = document.getElementById("edit-profile-name");
  const descInput = document.getElementById("edit-profile-desc");
  const versionInput = document.getElementById("edit-profile-version");

  if (nameInput) {
    nameInput.value = profile.name;
    clearValidationFeedback(nameInput);
  }
  if (descInput) descInput.value = profile.description || "";
  if (versionInput) versionInput.value = profile.version || "1.0";

  editingProfileId = profileId;

  const modal = document.getElementById("edit-profile-modal");
  if (modal) {
    openModal(modal);
  }
}

/**
 * Handle create profile
 */
function handleCreateProfile() {
  if (!currentProjectId) {
    alert("Не выбран проект");
    return;
  }

  const nameInput = document.getElementById("profile-name");
  const descInput = document.getElementById("profile-desc");
  const versionInput = document.getElementById("profile-version");

  if (!nameInput) return;

  const name = nameInput.value.trim();

  // Validate empty name
  if (!name) {
    showValidationError(nameInput, "Введите название профиля");
    nameInput.focus();
    return;
  }

  // Validate with visual feedback
  const isValid = validateNameField(nameInput, null);
  if (!isValid) {
    nameInput.focus();
    return;
  }

  // Create payload
  const payload = {
    name,
    description: descInput ?  descInput.value.trim() : "",
    version: versionInput ? versionInput.value.trim() : "1.0",
  };

  // Call service
  const newProfile = createProfile(currentProjectId, payload);

  if (newProfile) {
    // Close modal
    const modal = document.getElementById("new-profile-modal");
    if (modal) closeModal(modal);

    // Notify page
    if (onCreateCallback) {
      onCreateCallback(newProfile);
    }
  } else {
    // Service-level error
    showValidationError(nameInput, "Не удалось создать профиль. Проверьте данные.");
  }
}

/**
 * Handle save profile edit
 */
function handleSaveProfileEdit() {
  if (!currentProjectId || !editingProfileId) return;

  const nameInput = document.getElementById("edit-profile-name");
  const descInput = document.getElementById("edit-profile-desc");
  const versionInput = document.getElementById("edit-profile-version");

  if (!nameInput) return;

  const name = nameInput.value.trim();

  // Validate empty name
  if (!name) {
    showValidationError(nameInput, "Введите название профиля");
    nameInput.focus();
    return;
  }

  // Validate with visual feedback
  const isValid = validateNameField(nameInput, editingProfileId);
  if (!isValid) {
    nameInput.focus();
    return;
  }

  // Create updates
  const updates = {
    name,
    description: descInput ? descInput.value.trim() : "",
    version: versionInput ?  versionInput.value.trim() : "0.1",
  };

  // Call service
  const updated = updateProfile(currentProjectId, editingProfileId, updates);

  if (updated) {
    // Close modal
    const modal = document.getElementById("edit-profile-modal");
    if (modal) closeModal(modal);

    editingProfileId = null;

    // Notify page
    if (onUpdateCallback) {
      onUpdateCallback(updated);
    }
  } else {
    // Service-level error
    showValidationError(nameInput, "Не удалось обновить профиль. Проверьте данные.");
  }
}

export {initProfileModal, clearNewProfileModal, openEditProfileModal};
