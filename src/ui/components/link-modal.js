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

// Callbacks from pages
let onUpdateCallback = null;

function initLinkModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onUpdateCallback = callbacks.onUpdate || null;

  initDataTypePickerModal(projectId);

  bindClassPickerInput(projectId, {
    buttonId: "edit-link-targetClass-picker-btn",
    nameInputId: "edit-link-targetClassName",
    idInputId: "edit-link-targetClassId",
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
 * Open link edit modal.
 * @param {object} link
 * @param {string} classId
 * @param {{modelId?: string, profileId?: string}} [ctx]
 */
function openEditLinkModal(link, classId, ctx = {}) {
  if (!currentProjectId) return;
  if (!link) return;

  editingLinkId = link.linkId;
  editingClassId = classId || null;
  editingContext = {
    modelId: ctx?.modelId ? String(ctx.modelId) : (link?.modelId ? String(link.modelId) : ""),
    profileId: ctx?.profileId ? String(ctx.profileId) : (link?.profileId ? String(link.profileId) : ""),
  };

  const relationKindSelect = document.getElementById("edit-link-relationKind");
  const roleSelect = document.getElementById("edit-link-role");
  const targetClassNameInput = document.getElementById("edit-link-targetClassName");
  const targetClassIdInput = document.getElementById("edit-link-targetClassId");
  const multiplicityInput = document.getElementById("edit-link-multiplicity");
  const targetClassRoleNameInput = document.getElementById("edit-link-targetClassRoleName");
  const srcClassRoleNameInput = document.getElementById("edit-link-srcClassRoleName");
  const targetDescriptionTextarea = document.getElementById("edit-link-targetDescription");

  if (relationKindSelect) relationKindSelect.value = link.relationKind || "Association";
  if (roleSelect) roleSelect.value = link.role || "unspecified";
  if (targetClassNameInput) targetClassNameInput.value = link.targetClassName || "";
  if (targetClassIdInput) targetClassIdInput.value = link.targetClassId || "";
  if (multiplicityInput) multiplicityInput.value = link.multiplicity || "1";
  if (targetClassRoleNameInput) targetClassRoleNameInput.value = link.targetClassRoleName || "";
  if (srcClassRoleNameInput) srcClassRoleNameInput.value = link.srcClassRoleName || "";
  if (targetDescriptionTextarea) targetDescriptionTextarea.value = link.targetDescription || "";

  const modal = document.getElementById("edit-link-modal");
  if (modal) openModal(modal);
}

function handleSaveLinkEdit() {
  if (!currentProjectId || !editingLinkId) return;

  const relationKindSelect = document.getElementById("edit-link-relationKind");
  const targetClassNameInput = document.getElementById("edit-link-targetClassName");
  if (!relationKindSelect || !targetClassNameInput) return;

  const relationKind = relationKindSelect.value;
  const targetClassName = targetClassNameInput.value.trim();

  if (!targetClassName) {
    targetClassNameInput.focus();
    return;
  }

  const updates = {
    relationKind,
    role: document.getElementById("edit-link-role")?.value || "unspecified",
    targetClassName,
    targetClassId: document.getElementById("edit-link-targetClassId")?.value.trim() || "",
    multiplicity: document.getElementById("edit-link-multiplicity")?.value.trim() || "1",
    targetClassRoleName: document.getElementById("edit-link-targetClassRoleName")?.value.trim() || "",
    srcClassRoleName: document.getElementById("edit-link-srcClassRoleName")?.value.trim() || "",
    targetDescription: document.getElementById("edit-link-targetDescription")?.value.trim() || "",
  };

  const modal = document.getElementById("edit-link-modal");
  if (modal) closeModal(modal);

  const linkId = editingLinkId;
  const classId = editingClassId;
  editingLinkId = null;
  editingClassId = null;
  editingContext = null;

  if (onUpdateCallback) {
    onUpdateCallback(linkId, classId, updates);
  }
}

export { initLinkModal, openEditLinkModal };
