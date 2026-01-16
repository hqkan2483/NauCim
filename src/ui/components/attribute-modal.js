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
let editingContext = null; // { modelId?: string, profileId?: string }
let editingDataTypeId = null; // stored in JS (no DOM input)

// Callbacks from pages
let onUpdateCallback = null;

function initAttributeModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onUpdateCallback = callbacks.onUpdate || null;

  initDataTypePickerModal(projectId);

  const saveBtn = document.getElementById("save-attribute-edit-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveAttributeEdit);
  }

  const pickBtn = document.getElementById("edit-attr-dataType-picker-btn");
  if (pickBtn) {
    pickBtn.addEventListener("click", handleOpenDataTypePicker);
  }
}

function openEditAttributeModal(attr) {
  if (!currentProjectId) return;
  if (!attr) return;

  editingAttrId = attr.id;
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

  const modal = document.getElementById("edit-attribute-modal");
  if (modal) openModal(modal);
}

async function handleOpenDataTypePicker() {
  if (!currentProjectId || !editingAttrId) return;

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
    },
  });
}

function handleSaveAttributeEdit() {
  if (!currentProjectId || !editingAttrId) return;

  const nameInput = document.getElementById("edit-attr-name");
  const dataTypeInput = document.getElementById("edit-attr-dataType");
  if (!nameInput || !dataTypeInput) return;

  const name = nameInput.value.trim();

  if (!name) {
    nameInput.focus();
    return;
  }

  if (!editingDataTypeId) {
    dataTypeInput.focus();
    window.alert("Выберите тип данных через кнопку выбора.");
    return;
  }

  const updates = {
    name,
    multiplicity: document.getElementById("edit-attr-multiplicity")?.value.trim() || "0..1",
    stereotype: document.getElementById("edit-attr-stereotype")?.value.trim() || "",
    // visibility: document.getElementById("edit-attr-visibility")?.value || "public",
    initialValue: document.getElementById("edit-attr-initialValue")?.value.trim() || "",
    dataTypeId: editingDataTypeId,
    documentation: document.getElementById("edit-attr-documentation")?.value.trim() || "",
    documentationRu: document.getElementById("edit-attr-documentationRu")?.value.trim() || "",
    details: document.getElementById("edit-attr-details")?.value.trim() || "",
  };

  const modal = document.getElementById("edit-attribute-modal");
  if (modal) closeModal(modal);

  const attrId = editingAttrId;
  editingAttrId = null;
  editingDataTypeId = null;

  if (onUpdateCallback) {
    onUpdateCallback(attrId, updates);
  }
}

export { initAttributeModal, openEditAttributeModal };
