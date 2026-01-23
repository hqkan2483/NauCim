import { closeModal, openModal } from "../modal.js";

/**
 * Literal Modal Component
 * Self-contained modal for editing enumeration literal fields.
 */

let currentProjectId = null;
let editingLiteralId = null;
let editingClassId = null;
let editingContext = null; // { modelId?: string, profileId?: string }
let isCreateMode = false;
let existingLiteralNamesNormalized = new Set();

// Callbacks from pages
let onUpdateCallback = null;
let onCreateCallback = null;

function normalizeLiteralName(name) {
  return String(name ?? "").trim().toLocaleLowerCase();
}

function setModalTitle(title) {
  const el = document.getElementById("edit-literal-modal-title");
  if (el) el.textContent = String(title || "");
}

function syncSaveButtonState() {
  const saveBtn = document.getElementById("save-literal-edit-btn");
  if (!saveBtn) return;

  const nameErrorVisible =
    !document.getElementById("edit-lit-name-error")?.classList.contains("hidden");

  saveBtn.disabled = Boolean(nameErrorVisible);
}

function setNameFieldError(message) {
  const nameInput = document.getElementById("edit-lit-name");
  const errorEl = document.getElementById("edit-lit-name-error");

  const msg = message ? String(message) : "";
  const hasError = Boolean(msg);

  if (nameInput) {
    nameInput.classList.toggle("input-error", hasError);
  }

  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.toggle("hidden", !hasError);
  }

  syncSaveButtonState();
}

function validateRequiredFields() {
  const nameInput = document.getElementById("edit-lit-name");
  const name = nameInput?.value?.trim() || "";

  let ok = true;

  if (!name) {
    setNameFieldError("Введите значение литерала.");
    ok = false;
  }

  return ok;
}

function syncNameUniquenessUI() {
  const nameInput = document.getElementById("edit-lit-name");
  if (!nameInput) return true;

  const normalized = normalizeLiteralName(nameInput.value);
  const hasConflict = normalized && existingLiteralNamesNormalized.has(normalized);

  if (hasConflict) {
    nameInput.setCustomValidity("Имя литерала должно быть уникальным в рамках класса.");
    setNameFieldError("Имя литерала должно быть уникальным в рамках класса.");
  } else {
    nameInput.setCustomValidity("");
    setNameFieldError("");
  }

  return !hasConflict;
}

function initLiteralModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onUpdateCallback = callbacks.onUpdate || null;
  onCreateCallback = callbacks.onCreate || null;

  const saveBtn = document.getElementById("save-literal-edit-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveLiteralEdit);
  }

  const nameInput = document.getElementById("edit-lit-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      setNameFieldError("");
      syncNameUniquenessUI();
    });
  }

  const modal = document.getElementById("edit-literal-modal");
  if (modal) {
    modal.addEventListener("modal:afterclose", () => {
      editingLiteralId = null;
      editingClassId = null;
      editingContext = null;
      isCreateMode = false;
      existingLiteralNamesNormalized = new Set();
      setNameFieldError("");
    });
  }
}

function openCreateLiteralModal({ classId, modelId = "", profileId = "", existingNames = [] } = {}) {
  if (!currentProjectId) return;
  if (!classId) return;

  isCreateMode = true;
  editingLiteralId = null;
  editingClassId = String(classId);
  editingContext = {
    modelId: modelId ? String(modelId) : "",
    profileId: profileId ? String(profileId) : "",
  };

  existingLiteralNamesNormalized = new Set(
    (Array.isArray(existingNames) ? existingNames : [])
      .map(normalizeLiteralName)
      .filter(Boolean)
  );

  setModalTitle("Создание литерала");

  const nameInput = document.getElementById("edit-lit-name");
  const initialValueInput = document.getElementById("edit-lit-initialValue");
  const documentationTextarea = document.getElementById("edit-lit-documentation");
  const documentationRuTextarea = document.getElementById("edit-lit-documentationRu");

  if (nameInput) nameInput.value = "";
  if (initialValueInput) initialValueInput.value = "";
  if (documentationTextarea) documentationTextarea.value = "";
  if (documentationRuTextarea) documentationRuTextarea.value = "";

  setNameFieldError("");
  syncNameUniquenessUI();
  syncSaveButtonState();

  const modal = document.getElementById("edit-literal-modal");
  if (modal) openModal(modal);
}

function openEditLiteralModal(literal, { existingNames = [] } = {}) {
  if (!currentProjectId) return;
  if (!literal) return;

  isCreateMode = false;
  const modelId = literal.modelId ? String(literal.modelId) : "";
  const profileId = literal.profileId ? String(literal.profileId) : "";

  editingLiteralId = literal.id;
  editingClassId = literal.classId ? String(literal.classId) : null;
  editingContext = {
    modelId,
    profileId,
  };

  existingLiteralNamesNormalized = new Set(
    (Array.isArray(existingNames) ? existingNames : [])
      .map(normalizeLiteralName)
      .filter(Boolean)
  );

  setModalTitle("Редактирование литерала");

  const nameInput = document.getElementById("edit-lit-name");
  const initialValueInput = document.getElementById("edit-lit-initialValue");
  const documentationTextarea = document.getElementById("edit-lit-documentation");
  const documentationRuTextarea = document.getElementById("edit-lit-documentationRu");

  if (nameInput) nameInput.value = literal.name || "";
  if (initialValueInput) initialValueInput.value = literal.initialValue || "";
  if (documentationTextarea) documentationTextarea.value = literal.documentation || "";
  if (documentationRuTextarea) documentationRuTextarea.value = literal.documentationRu || "";

  setNameFieldError("");
  syncNameUniquenessUI();
  syncSaveButtonState();

  const modal = document.getElementById("edit-literal-modal");
  if (modal) openModal(modal);
}

function handleSaveLiteralEdit() {
  if (!currentProjectId) return;
  if (!editingLiteralId && !isCreateMode) return;

  const nameInput = document.getElementById("edit-lit-name");
  if (!nameInput) return;

  setNameFieldError("");

  if (!validateRequiredFields()) {
    nameInput.focus();
    return;
  }

  if (!syncNameUniquenessUI()) {
    nameInput.focus();
    return;
  }

  const updates = {
    name: nameInput.value.trim(),
    initialValue: document.getElementById("edit-lit-initialValue")?.value.trim() || "",
    documentation: document.getElementById("edit-lit-documentation")?.value.trim() || "",
    documentationRu: document.getElementById("edit-lit-documentationRu")?.value.trim() || "",
  };

  const modal = document.getElementById("edit-literal-modal");
  const literalId = editingLiteralId;
  const classId = editingClassId;
  const context = editingContext;
  const wasCreate = isCreateMode;

  if (modal) closeModal(modal);

  editingLiteralId = null;
  editingClassId = null;
  editingContext = null;
  isCreateMode = false;

  if (wasCreate) {
    if (onCreateCallback && classId) {
      onCreateCallback({ classId, context, updates });
    }
    return;
  }

  if (onUpdateCallback && literalId) {
    onUpdateCallback(literalId, updates, { classId, context });
  }
}

export { initLiteralModal, openCreateLiteralModal, openEditLiteralModal };
