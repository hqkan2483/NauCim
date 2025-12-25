import { createProject, updateProject, getProjectById, isProjectNameUnique } from "../../services/project-service.js";
import { closeModal } from "../modal.js";

/**
 * Project Modal Component
 * Self-contained modal with validation and business logic
 */

let editingProjectId = null;

// Callbacks from pages
let onCreateCallback = null;
let onUpdateCallback = null;

/**
 * Initialize project modal handlers
 * @param {Object} callbacks - { onCreate, onUpdate }
 */
export function initProjectModal(callbacks = {}) {
  onCreateCallback = callbacks.onCreate || null;
  onUpdateCallback = callbacks.onUpdate || null;

  // Bind create button
  const createBtn = document.getElementById("create-project-btn");
  if (createBtn) {
    createBtn.addEventListener("click", handleCreateProject);
  }

  // Bind save edit button
  const saveEditBtn = document.getElementById("save-project-edit-btn");
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", handleSaveProjectEdit);
  }

  // Initialize real-time validation
  initValidation();
}

/**
 * Initialize real-time validation for name inputs
 */
function initValidation() {
  // New project modal
  const nameInput = document.getElementById("project-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      validateNameField(nameInput, null);
    });

    nameInput.addEventListener("blur", () => {
      validateNameField(nameInput, null);
    });
  }

  // Edit project modal
  const editNameInput = document.getElementById("edit-project-name");
  if (editNameInput) {
    editNameInput.addEventListener("input", () => {
      validateNameField(editNameInput, editingProjectId);
    });

    editNameInput.addEventListener("blur", () => {
      validateNameField(editNameInput, editingProjectId);
    });
  }
}

/**
 * Validate name field and show visual feedback
 * @param {HTMLInputElement} input
 * @param {string|null} excludeId - Project ID to exclude (for edit)
 * @returns {boolean} - true if valid
 */
function validateNameField(input, excludeId = null) {
  const name = input.value.trim();

  // Remove previous feedback
  clearValidationFeedback(input);

  // Empty check (only show on blur or submit)
  if (!name) {
    return false;
  }

  // Length check
  if (name.length < 3) {
    showValidationError(input, "Минимум 3 символа");
    return false;
  }

  // Uniqueness check
  if (!isProjectNameUnique(name, excludeId)) {
    showValidationError(input, "Проект с таким названием уже существует");
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
 * Clear new project modal form
 */
export function clearNewProjectModal() {
  const nameInput = document.getElementById("project-name");
  const descInput = document.getElementById("project-desc");
  const versionInput = document.getElementById("project-version");

  if (nameInput) {
    nameInput.value = "";
    clearValidationFeedback(nameInput);
  }
  if (descInput) descInput.value = "";
  if (versionInput) versionInput.value = "1.0";
}

/**
 * Open edit project modal
 * @param {string} projectId
 */
export function openEditProjectModal(projectId) {
  const project = getProjectById(projectId);
  if (!project) return;

  const nameInput = document.getElementById("edit-project-name");
  const descInput = document.getElementById("edit-project-desc");
  const versionInput = document.getElementById("edit-project-version");

  if (nameInput) {
    nameInput.value = project.name;
    clearValidationFeedback(nameInput);
  }
  if (descInput) descInput.value = project.description || "";
  if (versionInput) versionInput.value = project.version || "1.0";

  editingProjectId = projectId;

  const modal = document.getElementById("edit-project-modal");
  if (modal) {
    const event = new CustomEvent("modal: beforeopen", {
      detail: { modalId: "edit-project-modal" },
      bubbles: true,
    });
    modal.dispatchEvent(event);
    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }
}

/**
 * Handle create project
 */
function handleCreateProject() {
  const nameInput = document.getElementById("project-name");
  const descInput = document.getElementById("project-desc");
  const versionInput = document.getElementById("project-version");

  if (!nameInput) return;

  const name = nameInput.value.trim();

  // Validate empty name
  if (!name) {
    showValidationError(nameInput, "Введите название проекта");
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
  const newProject = createProject(payload);

  if (newProject) {
    // Close modal
    const modal = document.getElementById("new-project-modal");
    if (modal) closeModal(modal);

    // Notify page
    if (onCreateCallback) {
      onCreateCallback(newProject);
    }
  } else {
    // Service-level error
    showValidationError(nameInput, "Не удалось создать проект.  Проверьте данные.");
  }
}

/**
 * Handle save project edit
 */
function handleSaveProjectEdit() {
  if (!editingProjectId) return;

  const nameInput = document.getElementById("edit-project-name");
  const descInput = document.getElementById("edit-project-desc");
  const versionInput = document.getElementById("edit-project-version");

  if (!nameInput) return;

  const name = nameInput.value.trim();

  // Validate empty name
  if (!name) {
    showValidationError(nameInput, "Введите название проекта");
    nameInput.focus();
    return;
  }

  // Validate with visual feedback
  const isValid = validateNameField(nameInput, editingProjectId);
  if (!isValid) {
    nameInput.focus();
    return;
  }

  // Create updates
  const updates = {
    name,
    description: descInput ?  descInput.value.trim() : "",
    version: versionInput ? versionInput.value.trim() : "1.0",
  };

  // Call service
  const updated = updateProject(editingProjectId, updates);

  if (updated) {
    // Close modal
    const modal = document.getElementById("edit-project-modal");
    if (modal) closeModal(modal);

    editingProjectId = null;

    // Notify page
    if (onUpdateCallback) {
      onUpdateCallback(updated);
    }
  } else {
    // Service-level error
    showValidationError(nameInput, "Не удалось обновить проект. Проверьте данные.");
  }
}
