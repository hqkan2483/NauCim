import { closeModal, openModal } from "../modal.js";
import {
  initDataTypePickerModal,
  openDataTypePickerModal,
} from "./data-type-picker-modal.js";

/**
 * Attribute Modal Component
 * Self-contained modal for editing attribute fields.
 */

let currentProjectId = null;
let editingAttrId = null;
let editingClassId = null;
let editingContext = null; // { modelId?: string, profileId?: string }
let editingDataTypeId = null; // stored in JS (no DOM input)
let isCreateMode = false;
let existingAttrNamesNormalized = new Set();

// Callbacks from pages
let onUpdateCallback = null;
let onCreateCallback = null;

function normalizeAttrName(name) {
  return String(name ?? "").trim().toLocaleLowerCase();
}

function syncSaveButtonState() {
  const saveBtn = document.getElementById("save-attribute-edit-btn");
  if (!saveBtn) return;

  const nameErrorVisible = !document.getElementById("edit-attr-name-error")?.classList.contains("hidden");
  const typeErrorVisible = !document.getElementById("edit-attr-dataType-error")?.classList.contains("hidden");
  const multErrorVisible =
    !document.getElementById("edit-attr-multiplicity-error")?.classList.contains("hidden");

  saveBtn.disabled = Boolean(nameErrorVisible || typeErrorVisible || multErrorVisible);
}

function setNameFieldError(message) {
  const nameInput = document.getElementById("edit-attr-name");
  const errorEl = document.getElementById("edit-attr-name-error");

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

function setDataTypeFieldError(message) {
  const input = document.getElementById("edit-attr-dataType");
  const errorEl = document.getElementById("edit-attr-dataType-error");

  const msg = message ? String(message) : "";
  const hasError = Boolean(msg);

  if (input) input.classList.toggle("input-error", hasError);
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.toggle("hidden", !hasError);
  }

  syncSaveButtonState();
}

function setMultiplicityFieldError(message) {
  const input = document.getElementById("edit-attr-multiplicity");
  const errorEl = document.getElementById("edit-attr-multiplicity-error");

  const msg = message ? String(message) : "";
  const hasError = Boolean(msg);

  if (input) input.classList.toggle("input-error", hasError);
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.toggle("hidden", !hasError);
  }

  syncSaveButtonState();
}

function validateRequiredFields() {
  const nameInput = document.getElementById("edit-attr-name");
  const multiplicityInput = document.getElementById("edit-attr-multiplicity");

  const name = nameInput?.value?.trim() || "";
  const multiplicity = multiplicityInput?.value?.trim() || "";

  let ok = true;

  if (!name) {
    setNameFieldError("Введите имя атрибута.");
    ok = false;
  }

  if (!editingDataTypeId) {
    setDataTypeFieldError("Выберите тип данных.");
    ok = false;
  }

  if (!multiplicity) {
    setMultiplicityFieldError("Заполните множественность (например: 0..1).");
    ok = false;
  }

  return ok;
}

function syncNameUniquenessUI() {
  const nameInput = document.getElementById("edit-attr-name");
  if (!nameInput) return true;

  const normalized = normalizeAttrName(nameInput.value);
  const hasConflict = normalized && existingAttrNamesNormalized.has(normalized);

  if (hasConflict) {
    nameInput.setCustomValidity("Имя атрибута должно быть уникальным в рамках класса.");
    setNameFieldError("Имя атрибута должно быть уникальным в рамках класса.");
  } else {
    nameInput.setCustomValidity("");
    setNameFieldError("");
  }

  return !hasConflict;
}

function initAttributeModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onUpdateCallback = callbacks.onUpdate || null;
  onCreateCallback = callbacks.onCreate || null;

  initDataTypePickerModal(projectId);

  const saveBtn = document.getElementById("save-attribute-edit-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveAttributeEdit);
  }

  const pickBtn = document.getElementById("edit-attr-dataType-picker-btn");
  if (pickBtn) {
    pickBtn.addEventListener("click", handleOpenDataTypePicker);
  }

  const nameInput = document.getElementById("edit-attr-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      // Clear any previous error (e.g. required) and re-check uniqueness live.
      setNameFieldError("");
      syncNameUniquenessUI();
    });
  }

  const multiplicityInput = document.getElementById("edit-attr-multiplicity");
  if (multiplicityInput) {
    multiplicityInput.addEventListener("input", () => {
      setMultiplicityFieldError("");
    });
  }

  const modal = document.getElementById("edit-attribute-modal");
  if (modal) {
    modal.addEventListener("modal:afterclose", () => {
      editingAttrId = null;
      editingClassId = null;
      editingContext = null;
      editingDataTypeId = null;
      isCreateMode = false;
      existingAttrNamesNormalized = new Set();

      setNameFieldError("");
      setDataTypeFieldError("");
      setMultiplicityFieldError("");
    });
  }
}

function openCreateAttributeModal({
  classId,
  modelId = "",
  profileId = "",
  existingNames = [],
} = {}) {
  if (!currentProjectId) return;
  if (!classId) return;

  isCreateMode = true;
  editingAttrId = null;
  editingClassId = String(classId);
  editingContext = {
    modelId: modelId ? String(modelId) : "",
    profileId: profileId ? String(profileId) : "",
  };
  editingDataTypeId = null;
  existingAttrNamesNormalized = new Set(
    (Array.isArray(existingNames) ? existingNames : []).map(normalizeAttrName).filter(Boolean)
  );

  const nameInput = document.getElementById("edit-attr-name");
  const dataTypeInput = document.getElementById("edit-attr-dataType");
  const multiplicityInput = document.getElementById("edit-attr-multiplicity");
  const stereotypeInput = document.getElementById("edit-attr-stereotype");
  const initialValueInput = document.getElementById("edit-attr-initialValue");
  const documentationTextarea = document.getElementById("edit-attr-documentation");
  const documentationRuTextarea = document.getElementById("edit-attr-documentationRu");
  const detailsTextarea = document.getElementById("edit-attr-details");

  if (nameInput) nameInput.value = "";
  if (dataTypeInput) {
    dataTypeInput.value = "";
    dataTypeInput.readOnly = true;
  }
  if (multiplicityInput) multiplicityInput.value = "0..1";
  if (stereotypeInput) stereotypeInput.value = "";
  if (initialValueInput) initialValueInput.value = "";
  if (documentationTextarea) documentationTextarea.value = "";
  if (documentationRuTextarea) documentationRuTextarea.value = "";
  if (detailsTextarea) detailsTextarea.value = "";

  setNameFieldError("");
  setDataTypeFieldError("");
  setMultiplicityFieldError("");
  syncNameUniquenessUI();
  syncSaveButtonState();

  const modal = document.getElementById("edit-attribute-modal");
  if (modal) openModal(modal);
}

function openEditAttributeModal(attr, { existingNames = [] } = {}) {
  if (!currentProjectId) return;
  if (!attr) return;

  isCreateMode = false;
  editingAttrId = attr.id;
  editingClassId = attr.classId ? String(attr.classId) : null;
  editingContext = {
    modelId: attr.modelId ? String(attr.modelId) : "",
    profileId: attr.profileId ? String(attr.profileId) : "",
  };

  const nameInput = document.getElementById("edit-attr-name");
  const dataTypeInput = document.getElementById("edit-attr-dataType");
  const multiplicityInput = document.getElementById("edit-attr-multiplicity"); // select с пользовательским вводом
  const stereotypeInput = document.getElementById("edit-attr-stereotype");
  // const visibilitySelect = document.getElementById("edit-attr-visibility");
  const initialValueInput = document.getElementById("edit-attr-initialValue");
  const documentationTextarea = document.getElementById("edit-attr-documentation");
  const documentationRuTextarea = document.getElementById("edit-attr-documentationRu");
  const detailsTextarea = document.getElementById("edit-attr-details");

  editingDataTypeId = attr.dataTypeId ? String(attr.dataTypeId) : null;
  existingAttrNamesNormalized = new Set(
    (Array.isArray(existingNames) ? existingNames : []).map(normalizeAttrName).filter(Boolean)
  );

  if (nameInput) nameInput.value = attr.name || "";
  if (dataTypeInput) {
    dataTypeInput.value = attr.dataType || "";
    dataTypeInput.readOnly = true;
  }
  if (multiplicityInput) multiplicityInput.value = attr.multiplicity || "0..1";
  if (stereotypeInput) stereotypeInput.value = attr.stereotype || "";
  // if (visibilitySelect) visibilitySelect.value = attr.visibility || "public";
  if (initialValueInput) initialValueInput.value = attr.initialValue || "";
  if (documentationTextarea) documentationTextarea.value = attr.documentation || "";
  if (documentationRuTextarea) documentationRuTextarea.value = attr.documentationRu || "";
  if (detailsTextarea) detailsTextarea.value = attr.details || "";

  setNameFieldError("");
  setDataTypeFieldError("");
  setMultiplicityFieldError("");
  syncNameUniquenessUI();
  syncSaveButtonState();

  const modal = document.getElementById("edit-attribute-modal");
  if (modal) openModal(modal);
}

async function handleOpenDataTypePicker() {
  if (!currentProjectId) return;
  if (!editingAttrId && !isCreateMode) return;

  const dataTypeInput = document.getElementById("edit-attr-dataType");
  if (!dataTypeInput) return;

  const modelId = editingContext?.modelId || "";
  const profileId = editingContext?.profileId || "";

  await openDataTypePickerModal({
    modelId,
    profileId,
    selectedId: editingDataTypeId || null,
    onSelect: (item) => {
      // Fill both: name + id
      dataTypeInput.value = item?.name ? String(item.name) : "";
      editingDataTypeId = item?.id ? String(item.id) : null;

      setDataTypeFieldError("");
    },
  });
}

function handleSaveAttributeEdit() {
  if (!currentProjectId) return;
  if (!editingAttrId && !isCreateMode) return;

  const nameInput = document.getElementById("edit-attr-name");
  const dataTypeInput = document.getElementById("edit-attr-dataType");
  if (!nameInput || !dataTypeInput) return;

  // Required fields
  setNameFieldError("");
  setDataTypeFieldError("");
  setMultiplicityFieldError("");

  if (!validateRequiredFields()) {
    // Focus first invalid field
    if (!nameInput.value.trim()) {
      nameInput.focus();
    } else if (!editingDataTypeId) {
      dataTypeInput.focus();
    } else {
      document.getElementById("edit-attr-multiplicity")?.focus();
    }
    return;
  }

  // Uniqueness
  if (!syncNameUniquenessUI()) {
    nameInput.focus();
    return;
  }

  const updates = {
    name: nameInput.value.trim(),
    multiplicity: document.getElementById("edit-attr-multiplicity")?.value.trim(),
    stereotype: document.getElementById("edit-attr-stereotype")?.value.trim() || "",
    // visibility: document.getElementById("edit-attr-visibility")?.value || "public",
    initialValue: document.getElementById("edit-attr-initialValue")?.value.trim() || "",
    dataTypeId: editingDataTypeId,
    documentation: document.getElementById("edit-attr-documentation")?.value.trim() || "",
    documentationRu: document.getElementById("edit-attr-documentationRu")?.value.trim() || "",
    details: document.getElementById("edit-attr-details")?.value.trim() || "",
  };

  const modal = document.getElementById("edit-attribute-modal");
  const attrId = editingAttrId;
  const classId = editingClassId;
  const context = editingContext;
  const wasCreate = isCreateMode;

  if (modal) closeModal(modal);

  editingAttrId = null;
  editingClassId = null;
  editingDataTypeId = null;
  editingContext = null;
  isCreateMode = false;

  if (wasCreate) {
    if (onCreateCallback && classId) {
      onCreateCallback({ classId, context, updates });
    }
    return;
  }

  if (onUpdateCallback && attrId) {
    onUpdateCallback(attrId, updates);
  }
}

export { initAttributeModal, openEditAttributeModal, openCreateAttributeModal };
