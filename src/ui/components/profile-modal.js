import {
  createProfile,
  updateProfile,
  getProfile,
  getProfileHeader,
  isProfileNameUnique,
} from "../../services/profile-service.js";
import { closeModal, openModal } from "../modal.js";

/**
 * Profile Modal Component
 * Self-contained modal with validation and business logic
 */

let editingProfileId = null;
let currentProjectId = null;

let isCreatingProfile = false;
let isSavingProfile = false;

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
    createBtn.addEventListener("click", (e) => {
      e.preventDefault();
      void handleCreateProfile();
    });
  }

  // Bind save edit button
  const saveEditBtn = document.getElementById("save-profile-edit-btn");
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", (e) => {
      e.preventDefault();
      void handleSaveProfileEdit();
    });
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
      void validateNameField(nameInput, null);
    });

    nameInput.addEventListener("blur", () => {
      void validateNameField(nameInput, null);
    });
  }

  // Edit profile modal
  const editNameInput = document.getElementById("edit-profile-name");
  if (editNameInput) {
    editNameInput.addEventListener("input", () => {
      void validateNameField(editNameInput, editingProfileId);
    });

    editNameInput.addEventListener("blur", () => {
      void validateNameField(editNameInput, editingProfileId);
    });
  }
}

/**
 * Validate name field and show visual feedback
 * @param {HTMLInputElement} input
 * @param {string|null} excludeId - Profile ID to exclude (for edit)
 * @returns {boolean} - true if valid
 */
async function validateNameField(input, excludeId = null) {
  if (!currentProjectId) return false;

  const name = input.value.trim();
  const nameSnapshot = name;

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
  const isUnique = await isProfileNameUnique(currentProjectId, name, excludeId);

  // Avoid showing stale results if user kept typing during async check
  if (input.value.trim() !== nameSnapshot) {
    return false;
  }

  if (!isUnique) {
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
  return (async () => {
    if (!currentProjectId) return;

    const profile =
      (await getProfileHeader(currentProjectId, profileId)) ||
      (await getProfile(currentProjectId, profileId));
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

  const modal = document.getElementById("edit-profile-header-modal");
  if (modal) {
    openModal(modal);
  }
  })();
}

/**
 * Handle create profile
 */
async function handleCreateProfile() {
  if (isCreatingProfile) return;
  isCreatingProfile = true;

  const createBtn = document.getElementById("create-profile-btn");
  const originalCreateBtnText = createBtn?.textContent;
  if (createBtn) {
    createBtn.disabled = true;
    createBtn.textContent = "Создание...";
  }

  try {
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
  const isValid = await validateNameField(nameInput, null);
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
  const newProfile = await createProfile(currentProjectId, payload);

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
  } finally {
    isCreatingProfile = false;
    if (createBtn) {
      createBtn.disabled = false;
      if (typeof originalCreateBtnText === "string") createBtn.textContent = originalCreateBtnText;
    }
  }
}

/**
 * Handle save profile edit
 */
async function handleSaveProfileEdit() {
  if (isSavingProfile) return;
  isSavingProfile = true;

  const saveBtn = document.getElementById("save-profile-edit-btn");
  const originalSaveBtnText = saveBtn?.textContent;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Сохранение...";
  }

  try {
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
  const isValid = await validateNameField(nameInput, editingProfileId);
  if (!isValid) {
    nameInput.focus();
    return;
  }

  // Create updates
  const updates = {
    name,
    description: descInput ? descInput.value.trim() : "",
    version: versionInput ? versionInput.value.trim() : "1.0",
  };

  // Call service
  const updated = await updateProfile(currentProjectId, editingProfileId, updates);

  if (updated) {
    // Close modal
    const modal = document.getElementById("edit-profile-header-modal");
    if (modal) closeModal(modal);

    editingProfileId = null;

    // Notify page
    if (onUpdateCallback) {
      await onUpdateCallback(updated);
    }
  } else {
    // Service-level error
    showValidationError(nameInput, "Не удалось обновить профиль. Проверьте данные.");
  }
  } finally {
    isSavingProfile = false;
    if (saveBtn) {
      saveBtn.disabled = false;
      if (typeof originalSaveBtnText === "string") saveBtn.textContent = originalSaveBtnText;
    }
  }
}

export {initProfileModal, clearNewProfileModal, openEditProfileModal};
