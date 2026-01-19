import { closeModal, openModal } from "../modal.js";
import { initDataTypePickerModal } from "./data-type-picker-modal.js";
import { bindClassPickerInput } from "./class-picker-input.js";

/**
 * Link Modal Component
 * Self-contained modal for editing class link fields.
 */

let currentProjectId = null;
let editingLinkId = null;
let editingClassId = null;
let editingContext = null; // { modelId?: string, profileId?: string }
let editingInitialRole = null; // 'child' | 'parent' (role of editing class)

// Callbacks from pages
let onUpdateCallback = null;

function initLinkModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onUpdateCallback = callbacks.onUpdate || null;

  initDataTypePickerModal(projectId);

  bindClassPickerInput(projectId, {
    buttonId: "generalization-link-targetClass-picker-btn",
    nameInputId: "generalization-link-targetClassName",
    idInputId: "generalization-link-targetClassId",
    getContext: () => editingContext,
    filters: {
      excludeStereotypes: ["CIMDatatype", "Primitive"],
      includeTypes: ["Class"],
    },
  });

  const saveBtn = document.getElementById("save-link-edit-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveLinkEdit);
  }
}

/**
 * Open Generalization link edit modal.
 *
 * Expects a GeneralizationLink (RootPackage.generalizationsList item).
 * The UI role selector represents the role of the edited class.
 *
 * @param {object} generalizationLink
 * @param {string} classId Edited class id (editingClassId)
 * @param {{modelId?: string, profileId?: string}} [ctx]
 */
function openEditLinkModal(generalizationLink, classId, ctx = {}) {
  if (!currentProjectId) return;
  if (!generalizationLink) return;

  const linkId = generalizationLink?.linkId ? String(generalizationLink.linkId) : "";
  if (!linkId) return;

  editingLinkId = linkId;
  editingClassId = classId || null;
  editingContext = {
    modelId: ctx?.modelId ? String(ctx.modelId) : "",
    profileId: ctx?.profileId ? String(ctx.profileId) : "",
  };

  const parent = generalizationLink?.parent || null;
  const child = generalizationLink?.child || null;
  const parentId = parent?.classId ? String(parent.classId) : "";
  const childId = child?.classId ? String(child.classId) : "";

  // Determine the role of the edited class and the "target" class.
  let role = "child";
  let target = parent;
  if (editingClassId && String(editingClassId) === parentId) {
    role = "parent";
    target = child;
  } else if (editingClassId && String(editingClassId) === childId) {
    role = "child";
    target = parent;
  }
  editingInitialRole = role;

  const relationKindSelect = document.getElementById("generalization-link-relationKind");
  const roleSelect = document.getElementById("generalization-link-role");
  const targetClassNameInput = document.getElementById("generalization-link-targetClassName");
  const targetClassIdInput = document.getElementById("generalization-link-targetClassId");
  const multiplicityInput = document.getElementById("generalization-link-multiplicity");
  const stereotypeInput = document.getElementById("generalization-link-stereotype");
  const documentationTextarea = document.getElementById("generalization-link-documentation");
  const documentationRuTextarea = document.getElementById("generalization-link-documentationRu");
  const detailsTextarea = document.getElementById("generalization-link-details");

  if (relationKindSelect) relationKindSelect.value = "Generalization";
  if (roleSelect) roleSelect.value = role;
  if (targetClassNameInput) targetClassNameInput.value = String(target?.className ?? "");
  if (targetClassIdInput) targetClassIdInput.value = String(target?.classId ?? "");
  if (multiplicityInput) multiplicityInput.value = "1";
  if (stereotypeInput) stereotypeInput.value = String(generalizationLink?.stereotype ?? "");
  if (documentationTextarea) documentationTextarea.value = String(generalizationLink?.documentation ?? "");
  if (documentationRuTextarea) documentationRuTextarea.value = String(generalizationLink?.documentationRu ?? "");
  if (detailsTextarea) detailsTextarea.value = String(generalizationLink?.details ?? "");

  const modal = document.getElementById("generalization-link-modal");
  if (modal) openModal(modal);
}

function handleSaveLinkEdit() {
  if (!currentProjectId || !editingLinkId) return;

  const role = document.getElementById("generalization-link-role")?.value || "child";
  const targetClassId = document.getElementById("generalization-link-targetClassId")?.value.trim() || "";
  const targetClassNameInput = document.getElementById("generalization-link-targetClassName");

  if (!targetClassId) {
    if (targetClassNameInput) targetClassNameInput.focus();
    return;
  }

  const documentation = document.getElementById("generalization-link-documentation")?.value ?? "";
  const documentationRu = document.getElementById("generalization-link-documentationRu")?.value ?? "";
  const details = document.getElementById("generalization-link-details")?.value ?? "";
  const stereotype = document.getElementById("generalization-link-stereotype")?.value ?? "";

  const editingId = editingClassId ? String(editingClassId) : "";
  if (!editingId) return;

  // Build payload per docs: send classIds only (no className).
  const generalizationLink = {
    linkId: String(editingLinkId),
    linkType: "Generalization",
    documentation: String(documentation),
    documentationRu: String(documentationRu),
    details: String(details),
    stereotype: String(stereotype),
    parent:
      role === "child"
        ? { classId: String(targetClassId) }
        : { classId: String(editingId) },
    child:
      role === "child"
        ? { classId: String(editingId) }
        : { classId: String(targetClassId) },
  };

  const modal = document.getElementById("generalization-link-modal");
  if (modal) closeModal(modal);

  const linkId = editingLinkId;
  const classId = editingClassId;
  const ctx = editingContext;
  editingLinkId = null;
  editingClassId = null;
  editingContext = null;
  editingInitialRole = null;

  if (onUpdateCallback) {
    onUpdateCallback(linkId, classId, {
      ctx,
      role: role || "",
      generalizationLink,
    });
  }
}

export { initLinkModal, openEditLinkModal };
