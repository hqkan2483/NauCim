import {
  createModel,
  updateModel,
  getModel,
  getModelHeader,
  isModelNameUnique,
} from "../../services/model-service.js";
import { closeModal, openModal } from "../modal.js";

/**
 * Model Modal Component
 * Self-contained modal with validation and business logic
 */

let editingModelId = null;
let currentProjectId = null;

let isCreatingModel = false;
let isSavingModel = false;

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
    createBtn.addEventListener("click", (e) => {
      e.preventDefault();
      void handleCreateModel();
    });
  }

  // Bind save edit button
  const saveEditBtn = document.getElementById("save-model-edit-btn");
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", (e) => {
      e.preventDefault();
      void handleSaveModelEdit();
    });
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
    nameInput.addEventListener("input", () => { void validateNameField(nameInput, null); });
    nameInput.addEventListener("blur", () => { void validateNameField(nameInput, null); });
  }

  // Edit model modal
  const editNameInput = document.getElementById("edit-model-name");
  if (editNameInput) {
    editNameInput.addEventListener("input", () => { void validateNameField(editNameInput, editingModelId); });
    editNameInput.addEventListener("blur", () => { void validateNameField(editNameInput, editingModelId); });
  }
}

/**
 * Validate name field and show visual feedback
 * @param {HTMLInputElement} input
 * @param {string|null} excludeId - Model ID to exclude (for edit)
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
  const isUnique = await isModelNameUnique(currentProjectId, name, excludeId);

  // Avoid showing stale results if user kept typing during async check
  if (input.value.trim() !== nameSnapshot) {
    return false;
  }

  if (!isUnique) {
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
  if (versionInput) versionInput.value = "0.10";
}

/**
 * Open edit model modal
 * @param {string} modelId
 */
function openEditModelModal(modelId) {
  return (async () => {
    if (!currentProjectId) return;

    const model =
      (await getModelHeader(currentProjectId, modelId)) ||
      (await getModel(currentProjectId, modelId));
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

  const modal = document.getElementById("edit-model-header-modal");
  if (modal) {
    openModal(modal);
  }
  })();
}

/**
 * Handle create model
 */
async function handleCreateModel() {
  if (isCreatingModel) return;
  isCreatingModel = true;

  const createBtn = document.getElementById("create-model-btn");
  const originalCreateBtnText = createBtn?.textContent;
  if (createBtn) {
    createBtn.disabled = true;
    createBtn.textContent = "Добавление...";
  }

  try {
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
  const isValid = await validateNameField(nameInput, null);
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
  const newModel = await createModel(currentProjectId, payload);

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
  } finally {
    isCreatingModel = false;
    if (createBtn) {
      createBtn.disabled = false;
      if (typeof originalCreateBtnText === "string") createBtn.textContent = originalCreateBtnText;
    }
  }
}

/**
 * Handle save model edit
 */
async function handleSaveModelEdit() {
  if (isSavingModel) return;
  isSavingModel = true;

  const saveBtn = document.getElementById("save-model-edit-btn");
  const originalSaveBtnText = saveBtn?.textContent;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Сохранение...";
  }

  try {
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
  const isValid = await validateNameField(nameInput, editingModelId);
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
  const updatedModel = await updateModel(currentProjectId, editingModelId, updates);

  if (updatedModel) {
    // Close modal
    const modal = document.getElementById("edit-model-header-modal");
    if (modal) closeModal(modal);

    editingModelId = null;

    // Notify page
    if (onUpdateCallback) {
      await onUpdateCallback(updatedModel);
    }
  } else {
    // Service-level error
    showValidationError(nameInput, "Не удалось обновить модель. Проверьте данные.");
  }
  } finally {
    isSavingModel = false;
    if (saveBtn) {
      saveBtn.disabled = false;
      if (typeof originalSaveBtnText === "string") saveBtn.textContent = originalSaveBtnText;
    }
  }
}

export {initModelModal, clearNewModelModal, openEditModelModal};
