import { closeModal, openModal } from "../modal.js";

/**
 * Attribute Modal Component
 * Self-contained modal for editing attribute fields.
 */

let currentProjectId = null;
let editingAttrId = null;

// Callbacks from pages
let onUpdateCallback = null;

function initAttributeModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onUpdateCallback = callbacks.onUpdate || null;

  const saveBtn = document.getElementById("save-attribute-edit-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveAttributeEdit);
  }
}

function openEditAttributeModal(attr) {
  if (!currentProjectId) return;
  if (!attr) return;

  editingAttrId = attr.id;

  const nameInput = document.getElementById("edit-attr-name");
  const dataTypeInput = document.getElementById("edit-attr-dataType");
  const multiplicityInput = document.getElementById("edit-attr-multiplicity");
  const stereotypeInput = document.getElementById("edit-attr-stereotype");
  const visibilitySelect = document.getElementById("edit-attr-visibility");
  const initialValueInput = document.getElementById("edit-attr-initialValue");
  const dataTypeIdInput = document.getElementById("edit-attr-dataTypeId");
  const documentationTextarea = document.getElementById("edit-attr-documentation");
  const documentationRuTextarea = document.getElementById("edit-attr-documentationRu");
  const detailsTextarea = document.getElementById("edit-attr-details");

  if (nameInput) nameInput.value = attr.name || "";
  if (dataTypeInput) dataTypeInput.value = attr.dataType || "";
  if (multiplicityInput) multiplicityInput.value = attr.multiplicity || "0..1";
  if (stereotypeInput) stereotypeInput.value = attr.stereotype || "";
  if (visibilitySelect) visibilitySelect.value = attr.visibility || "public";
  if (initialValueInput) initialValueInput.value = attr.initialValue || "";
  if (dataTypeIdInput) dataTypeIdInput.value = attr.dataTypeId || "";
  if (documentationTextarea) documentationTextarea.value = attr.documentation || "";
  if (documentationRuTextarea) documentationRuTextarea.value = attr.documentationRu || "";
  if (detailsTextarea) detailsTextarea.value = attr.details || "";

  const modal = document.getElementById("edit-attribute-modal");
  if (modal) openModal(modal);
}

function handleSaveAttributeEdit() {
  if (!currentProjectId || !editingAttrId) return;

  const nameInput = document.getElementById("edit-attr-name");
  const dataTypeInput = document.getElementById("edit-attr-dataType");
  if (!nameInput || !dataTypeInput) return;

  const name = nameInput.value.trim();
  const dataType = dataTypeInput.value.trim();

  if (!name) {
    nameInput.focus();
    return;
  }

  if (!dataType) {
    dataTypeInput.focus();
    return;
  }

  const updates = {
    name,
    dataType,
    multiplicity: document.getElementById("edit-attr-multiplicity")?.value.trim() || "0..1",
    stereotype: document.getElementById("edit-attr-stereotype")?.value.trim() || "",
    visibility: document.getElementById("edit-attr-visibility")?.value || "public",
    initialValue: document.getElementById("edit-attr-initialValue")?.value.trim() || "",
    dataTypeId: document.getElementById("edit-attr-dataTypeId")?.value.trim() || "",
    documentation: document.getElementById("edit-attr-documentation")?.value.trim() || "",
    documentationRu: document.getElementById("edit-attr-documentationRu")?.value.trim() || "",
    details: document.getElementById("edit-attr-details")?.value.trim() || "",
  };

  const modal = document.getElementById("edit-attribute-modal");
  if (modal) closeModal(modal);

  const attrId = editingAttrId;
  editingAttrId = null;

  if (onUpdateCallback) {
    onUpdateCallback(attrId, updates);
  }
}

export { initAttributeModal, openEditAttributeModal };
