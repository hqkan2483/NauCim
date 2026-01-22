import { closeModal, openModal } from "../modal.js";
import { initDataTypePickerModal } from "./data-type-picker-modal.js";
import { bindClassPickerInput } from "./class-picker-input.js";
import { showToast } from "./toast.js";
import { getProjectById } from "../../services/project-service.js";
import { validateUniqueAssociationNames as validateAssocNamesFrontend } from "../../services/link-service.js";

let currentProjectId = null;
let editingAssociationLinkId = null;
let editingClassId = null;
let editingContext = null; // { modelId?: string, profileId?: string }
let onUpdateCallback = null;
let currentLinkEndIds = { src: null, target: null }; // Store linkEndIds
let onCreateCallback = null;
let isCreatingAssociation = false;
let validationInProgress = false;

/**
 * Initialize the Association Link modal.
 * Sets up event handlers and class pickers.
 *
 * @param {string} projectId - Current project ID
 * @param {object} [callbacks] - Callbacks for modal events
 * @param {Function} [callbacks.onUpdate] - Called after successful update
 */
function initAssociationLinkModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onUpdateCallback = callbacks?.onUpdate || null;
  onCreateCallback = callbacks?.onCreate || null;

  initDataTypePickerModal(projectId);

  bindClassPickerInput(projectId, {
    buttonId: "association-sourceClass-picker-btn",
    nameInputId: "association-sourceClassName",
    idInputId: "association-sourceClassId",
    getContext: () => editingContext,
    filters: {
      excludeStereotypes: ["CIMDatatype", "Primitive"],
      includeTypes: ["Class"],
    },
  });

  bindClassPickerInput(projectId, {
    buttonId: "association-targetClass-picker-btn",
    nameInputId: "association-targetClassName",
    idInputId: "association-targetClassId",
    getContext: () => editingContext,
    filters: {
      excludeStereotypes: ["CIMDatatype", "Primitive"],
      includeTypes: ["Class"],
    },
  });

  const saveBtn = document.getElementById("save-association-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await saveAssociationLink();
    });
  }

  const targetRoleInput = document.getElementById("association-target-role");
  if (targetRoleInput) {
    targetRoleInput.addEventListener("input", () => {
      validateAssociationNameUniqueness().catch((err) => console.error("[validateAssociationNameUniqueness]", err));
    });
  }

  const targetClassIdInput = document.getElementById("association-targetClassId");
  if (targetClassIdInput) {
    targetClassIdInput.addEventListener("change", () => {
      validateAssociationNameUniqueness().catch((err) => console.error("[validateAssociationNameUniqueness]", err));
    });
  }
}

/**
 * Open the Association Link modal for editing.
 * Populates all fields from the association link data.
 *
 * @param {object} associationLink - Association link data to edit
 * @param {string} classId - ID of the class being edited
 * @param {object} [ctx] - Context containing modelId/profileId
 */
async function openEditAssociationLinkModal(associationLink, classId, ctx = {}) {
  if (!currentProjectId) return;
  if (!associationLink) return;

  const linkId = associationLink?.linkId ? String(associationLink.linkId) : "";
  if (!linkId) return;

  editingAssociationLinkId = linkId;
  editingClassId = classId || null;
  editingContext = {
    modelId: ctx?.modelId ? String(ctx.modelId) : "",
    profileId: ctx?.profileId ? String(ctx.profileId) : "",
    editingClassName: ctx?.editingClassName ? String(ctx.editingClassName) : "",
  };
  isCreatingAssociation = false;

  const relationKindSelect = document.getElementById("association-link-relationKind");
  const stereotypeInput = document.getElementById("association-link-stereotype");
  const documentationTextarea = document.getElementById("association-link-documentation");
  const documentationRuTextarea = document.getElementById("association-link-documentationRu");
  const detailsTextarea = document.getElementById("association-link-details");

  if (relationKindSelect) relationKindSelect.value = "Association";
  if (stereotypeInput) stereotypeInput.value = String(associationLink?.stereotype ?? "");
  if (documentationTextarea) documentationTextarea.value = String(associationLink?.documentation ?? "");
  if (documentationRuTextarea) documentationRuTextarea.value = String(associationLink?.documentationRu ?? "");
  if (detailsTextarea) detailsTextarea.value = String(associationLink?.details ?? "");

  const ends = Array.isArray(associationLink?.linkEnd) ? associationLink.linkEnd : [];
  const editingId = editingClassId ? String(editingClassId) : "";

  const srcEnd =
    (editingId ? ends.find((e) => String(e?.linkEndClassId ?? "") === editingId) : null) || ends[0] || null;
  const targetEnd = (srcEnd ? ends.find((e) => e !== srcEnd) : null) || ends[1] || null;

  // Store linkEndIds for later use
  currentLinkEndIds = {
    src: String(srcEnd?.linkEndId ?? ""),
    target: String(targetEnd?.linkEndId ?? ""),
  };

  // Populate source end fields
  populateLinkEnd("source", srcEnd);
  
  // Override sourceClassName and sourceClassId with editing class data
  if (editingContext?.editingClassName) {
    const srcClassName = document.getElementById("association-sourceClassName");
    if (srcClassName) {
      srcClassName.value = editingContext.editingClassName;
    }
  }
  if (editingClassId) {
    const srcClassId = document.getElementById("association-sourceClassId");
    if (srcClassId) {
      srcClassId.value = String(editingClassId);
    }
  }
  
  // Populate target end fields
  populateLinkEnd("target", targetEnd);
  const modal = document.getElementById("association-link-modal");
  if (modal) openModal(modal);

  // Запускаем проверку уже после открытия, чтобы ошибки сразу были видны
  requestAnimationFrame(() => {
    validateAssociationNameUniqueness().catch((err) => console.error("[validateAssociationNameUniqueness]", err));
  });
}

async function openCreateAssociationLinkModal(classId, ctx = {}) {
  if (!currentProjectId) return;

  editingAssociationLinkId = null;
  editingClassId = classId || null;
  editingContext = {
    modelId: ctx?.modelId ? String(ctx.modelId) : "",
    profileId: ctx?.profileId ? String(ctx.profileId) : "",
    editingClassName: ctx?.editingClassName ? String(ctx.editingClassName) : "",
  };
  isCreatingAssociation = true;

  const relationKindSelect = document.getElementById("association-link-relationKind");
  const stereotypeInput = document.getElementById("association-link-stereotype");
  const documentationTextarea = document.getElementById("association-link-documentation");
  const documentationRuTextarea = document.getElementById("association-link-documentationRu");
  const detailsTextarea = document.getElementById("association-link-details");

  if (relationKindSelect) relationKindSelect.value = "Association";
  if (stereotypeInput) stereotypeInput.value = "";
  if (documentationTextarea) documentationTextarea.value = "";
  if (documentationRuTextarea) documentationRuTextarea.value = "";
  if (detailsTextarea) detailsTextarea.value = "";

  // Prefill source as editing class
  populateLinkEnd("source", null);
  const srcName = document.getElementById("association-sourceClassName");
  const srcId = document.getElementById("association-sourceClassId");
  if (srcName) srcName.value = ctx?.editingClassName ? String(ctx.editingClassName) : "";
  if (srcId) srcId.value = classId ? String(classId) : "";

  populateLinkEnd("target", null);
  currentLinkEndIds = { src: "", target: "" };

  const modal = document.getElementById("association-link-modal");
  if (modal) openModal(modal);

  // Проверяем сразу после отображения модалки
  requestAnimationFrame(() => {
    validateAssociationNameUniqueness().catch((err) => console.error("[validateAssociationNameUniqueness]", err));
  });
}

/**
 * Populate a link end section with data.
 *
 * @param {string} prefix - Field ID prefix ('source' or 'target')
 * @param {object} endData - Link end data
 */
function populateLinkEnd(prefix, endData) {
  const className = document.getElementById(`association-${prefix}ClassName`);
  const classId = document.getElementById(`association-${prefix}ClassId`);
  const role = document.getElementById(`association-${prefix.replace('source', 'src').replace('target', 'target')}-role`);
  const stereo = document.getElementById(`association-${prefix.replace('source', 'src').replace('target', 'target')}-stereotype`);
  const mult = document.getElementById(`association-${prefix.replace('source', 'src').replace('target', 'target')}-multiplicity`);
  const doc = document.getElementById(`association-${prefix.replace('source', 'src').replace('target', 'target')}-documentation`);
  const docRu = document.getElementById(`association-${prefix.replace('source', 'src').replace('target', 'target')}-documentationRu`);
  const details = document.getElementById(`association-${prefix.replace('source', 'src').replace('target', 'target')}-details`);

  if (className) className.value = String(endData?.linkEndClassName ?? "");
  if (classId) classId.value = String(endData?.linkEndClassId ?? "");
  if (role) role.value = String(endData?.linkEndName ?? "");
  if (stereo) stereo.value = String(endData?.stereotype ?? "");
  if (mult) mult.value = String(endData?.multiplicity ?? "");
  if (doc) doc.value = String(endData?.documentation ?? "");
  if (docRu) docRu.value = String(endData?.documentationRu ?? "");
  if (details) details.value = String(endData?.details ?? "");
}

/**
 * Collect link end data from form fields.
 *
 * @param {string} prefix - Field ID prefix ('source' or 'target')
 * @param {string} linkEndId - Link end ID
 * @returns {object} Link end data object
 */
function collectLinkEnd(prefix, linkEndId) {
  const classId = document.getElementById(`association-${prefix}ClassId`)?.value || "";
  const rolePrefix = prefix.replace('source', 'src').replace('target', 'target');
  const role = document.getElementById(`association-${rolePrefix}-role`)?.value || "";
  const stereo = document.getElementById(`association-${rolePrefix}-stereotype`)?.value || "";
  const mult = document.getElementById(`association-${rolePrefix}-multiplicity`)?.value || "";
  const doc = document.getElementById(`association-${rolePrefix}-documentation`)?.value || "";
  const docRu = document.getElementById(`association-${rolePrefix}-documentationRu`)?.value || "";
  const details = document.getElementById(`association-${rolePrefix}-details`)?.value || "";

  return {
    ...(linkEndId ? { linkEndId: String(linkEndId) } : {}),
    linkEndName: role,
    linkEndClassId: classId,
    multiplicity: mult,
    documentation: doc || null,
    documentationRu: docRu || null,
    details: details || null,
    stereotype: stereo,
  };
}

/**
 * Save the association link.
 * Collects form data, validates, and calls the backend.
 */
async function saveAssociationLink() {
  if (!currentProjectId) {
    showToast("Отсутствуют необходимые данные для сохранения", { type: "error" });
    return;
  }

  try {
    const validationOk = await validateAssociationNameUniqueness();
    if (!validationOk) return;

    // Collect main link data
    const stereotype = document.getElementById("association-link-stereotype")?.value || "";
    const documentation = document.getElementById("association-link-documentation")?.value || "";
    const documentationRu = document.getElementById("association-link-documentationRu")?.value || "";
    const details = document.getElementById("association-link-details")?.value || "";

    // Collect source end (editing class)
    const srcEnd = collectLinkEnd("source", currentLinkEndIds.src || undefined);
    if (!srcEnd.linkEndClassId) {
      showToast("Не указан класс исходного узла", { type: "error" });
      return;
    }

    // Collect target end
    const targetEnd = collectLinkEnd("target", currentLinkEndIds.target || undefined);
    if (!targetEnd.linkEndClassId) {
      showToast("Необходимо выбрать целевой класс", { type: "error" });
      return;
    }

    // Build payload
    const payload = {
      ...(editingAssociationLinkId ? { linkId: editingAssociationLinkId } : {}),
      linkType: "Association",
      documentation: documentation || null,
      documentationRu: documentationRu || null,
      details: details || null,
      stereotype,
      linkEnd: [srcEnd, targetEnd],
    };

    // Close modal before backend call
    const modal = document.getElementById("association-link-modal");
    if (modal) closeModal(modal);

    // Call update callback
    if (isCreatingAssociation && onCreateCallback) {
      await onCreateCallback(editingClassId, payload, editingContext);
    } else if (!isCreatingAssociation && onUpdateCallback) {
      await onUpdateCallback(editingAssociationLinkId, editingClassId, payload, editingContext);
    }

    editingAssociationLinkId = null;
    editingClassId = null;
    editingContext = null;
    currentLinkEndIds = { src: null, target: null };
    isCreatingAssociation = false;
  } catch (error) {
    console.error("[saveAssociationLink] Failed:", error);
    const msg = error?.message ? String(error.message) : "Ошибка сохранения";
    showToast(`Ошибка сохранения связи: ${msg}`, { type: "error" });
  }
}

async function validateAssociationNameUniqueness() {
  if (validationInProgress) return true;
  validationInProgress = true;

  const errorEl = document.getElementById("association-link-validation-error");
  const saveBtn = document.getElementById("save-association-btn");
  const clearError = () => {
    if (errorEl) {
      errorEl.style.display = "none";
      errorEl.textContent = "";
      errorEl.setAttribute("aria-hidden", "true");
    }
    if (saveBtn) saveBtn.disabled = false;
  };

  clearError();

  try {
    const project = await getProjectById(currentProjectId);
    if (!project) return true;

    const payload = buildCurrentPayloadForValidation();
    if (!payload) return true;

    await validateAssocNamesFrontend({
      linkId: editingAssociationLinkId || "",
      payload,
      project,
    });

    return true;
  } catch (error) {
    const msg = error?.message ? String(error.message) : "Имя узла уже используется";
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = "block";
      errorEl.setAttribute("aria-hidden", "false");
    } else {
      showToast(msg, { type: "error" });
    }
    if (saveBtn) saveBtn.disabled = true;
    return false;
  } finally {
    validationInProgress = false;
  }
}

function buildCurrentPayloadForValidation() {
  const stereotype = document.getElementById("association-link-stereotype")?.value || "";
  const documentation = document.getElementById("association-link-documentation")?.value || "";
  const documentationRu = document.getElementById("association-link-documentationRu")?.value || "";
  const details = document.getElementById("association-link-details")?.value || "";

  const srcEnd = collectLinkEnd("source", currentLinkEndIds.src || undefined);
  const targetEnd = collectLinkEnd("target", currentLinkEndIds.target || undefined);

  if (!srcEnd.linkEndClassId || !targetEnd.linkEndClassId) return null;

  return {
    ...(editingAssociationLinkId ? { linkId: editingAssociationLinkId } : {}),
    linkType: "Association",
    documentation: documentation || null,
    documentationRu: documentationRu || null,
    details: details || null,
    stereotype,
    linkEnd: [srcEnd, targetEnd],
  };
}

export { initAssociationLinkModal, openEditAssociationLinkModal, openCreateAssociationLinkModal };
