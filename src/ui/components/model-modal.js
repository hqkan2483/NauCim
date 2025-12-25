import { createModel, updateModel, getModel, isModelNameUnique } from "../../services/model-service.js";
import { closeModal, openModal } from "../modal.js";

/**
 * Model Modal Component
 * Self-contained modal with validation and business logic
 */

let editingModelId = null;
let currentProjectId = null;

// Callbacks from pages
let onCreateCallback = null;
let onUpdateCallback = null;

/**
 * Initialize model modal handlers
 * @param {string} projectId - Current project ID
 * @param {Object} callbacks - { onCreate, onUpdate }
 */
function initModelModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onCreateCallback = callbacks.onCreate || null;
  onUpdateCallback = callbacks.onUpdate || null;

  // Bind create button
  const createBtn = document.getElementById("create-model-btn");
  if (createBtn) {
    createBtn.addEventListener("click", handleCreateModel);
  }

  // Bind save edit button
  const saveEditBtn = document.getElementById("save-model-edit-btn");
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", handleSaveModelEdit);
  }

  // Initialize real-time validation
  initValidation();
}

/**
 * Initialize real-time validation for name inputs
 */
function initValidation() {
  // New model modal
  const nameInput = document.getElementById("model-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      validateNameField(nameInput, null);
    });

    nameInput.addEventListener("blur", () => {
      validateNameField(nameInput, null);
    });
  }

  // Edit model modal
  const editNameInput = document.getElementById("edit-model-name");
  if (editNameInput) {
    editNameInput.addEventListener("input", () => {
      validateNameField(editNameInput, editingModelId);
    });

    editNameInput.addEventListener("blur", () => {
      validateNameField(editNameInput, editingModelId);
    });
  }
}

/**
 * Validate name field and show visual feedback
 * @param {HTMLInputElement} input
 * @param {string|null} excludeId - Model ID to exclude (for edit)
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
  if (!isModelNameUnique(currentProjectId, name, excludeId)) {
    showValidationError(input, "Модель с таким названием уже существует");
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
 * Clear new model modal form
 */
function clearNewModelModal() {
  const nameInput = document.getElementById("model-name");
  const descInput = document.getElementById("model-desc");
  const versionInput = document.getElementById("model-version");

  if (nameInput) {
    nameInput.value = "";
    clearValidationFeedback(nameInput);
  }
  if (descInput) descInput.value = "";
  if (versionInput) versionInput.value = "1.0";
}

/**
 * Open edit model modal
 * @param {string} modelId
 */
function openEditModelModal(modelId) {
  if (! currentProjectId) return;

  const model = getModel(currentProjectId, modelId);
  if (!model) return;

  const nameInput = document.getElementById("edit-model-name");
  const descInput = document.getElementById("edit-model-desc");
  const versionInput = document.getElementById("edit-model-version");

  if (nameInput) {
    nameInput.value = model.name;
    clearValidationFeedback(nameInput);
  }
  if (descInput) descInput.value = model.description || "";
  if (versionInput) versionInput.value = model.version || "0.1";

  editingModelId = modelId;

  const modal = document.getElementById("edit-model-modal");
  if (modal) {
    openModal(modal);
  }
}

/**
 * Handle create model
 */
function handleCreateModel() {
  if (!currentProjectId) {
    alert("Не выбран проект");
    return;
  }

  const nameInput = document.getElementById("model-name");
  const descInput = document.getElementById("model-desc");
  const versionInput = document.getElementById("model-version");

  if (!nameInput) return;

  const name = nameInput.value.trim();

  // Validate empty name
  if (!name) {
    showValidationError(nameInput, "Введите название модели");
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
    description: descInput ? descInput.value.trim() : "",
    version: versionInput ? versionInput.value.trim() : "0.1",
  };

  // Call service
  const newModel = createModel(currentProjectId, payload);

  if (newModel) {
    // Close modal
    const modal = document.getElementById("new-model-modal");
    if (modal) closeModal(modal);

    // Notify page
    if (onCreateCallback) {
      onCreateCallback(newModel);
    }
  } else {
    // Service-level error
    showValidationError(nameInput, "Не удалось создать модель.  Проверьте данные.");
  }
}

/**
 * Handle save model edit
 */
function handleSaveModelEdit() {
  if (!currentProjectId || !editingModelId) return;

  const nameInput = document.getElementById("edit-model-name");
  const descInput = document.getElementById("edit-model-desc");
  const versionInput = document.getElementById("edit-model-version");

  if (!nameInput) return;

  const name = nameInput.value.trim();

  // Validate empty name
  if (!name) {
    showValidationError(nameInput, "Введите название модели");
    nameInput.focus();
    return;
  }

  // Validate with visual feedback
  const isValid = validateNameField(nameInput, editingModelId);
  if (!isValid) {
    nameInput.focus();
    return;
  }

  // Create updates
  const updates = {
    name,
    description: descInput ?  descInput.value.trim() : "",
    version: versionInput ? versionInput.value.trim() : "0.1",
  };

  // Call service
  const updated = updateModel(currentProjectId, editingModelId, updates);

  if (updated) {
    // Close modal
    const modal = document.getElementById("edit-model-modal");
    if (modal) closeModal(modal);

    editingModelId = null;

    // Notify page
    if (onUpdateCallback) {
      onUpdateCallback(updated);
    }
  } else {
    // Service-level error
    showValidationError(nameInput, "Не удалось обновить модель. Проверьте данные.");
  }
}

export {initModelModal, clearNewModelModal, openEditModelModal};
