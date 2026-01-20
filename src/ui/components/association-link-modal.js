import { closeModal, openModal } from "../modal.js";
import { initDataTypePickerModal } from "./data-type-picker-modal.js";
import { bindClassPickerInput } from "./class-picker-input.js";
import { showToast } from "./toast.js";

let currentProjectId = null;
let editingAssociationLinkId = null;
let editingClassId = null;
let editingContext = null; // { modelId?: string, profileId?: string }

function initAssociationLinkModal(projectId) {
  currentProjectId = projectId;

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
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const modal = document.getElementById("association-link-modal");
      if (modal) closeModal(modal);
      showToast("Сохранение Association будет добавлено позже", { type: "info" });
    });
  }
}

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
  };

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

  // Source end fields
  const srcClassName = document.getElementById("association-sourceClassName");
  const srcClassId = document.getElementById("association-sourceClassId");
  const srcRole = document.getElementById("association-src-role");
  const srcStereo = document.getElementById("association-src-stereotype");
  const srcMult = document.getElementById("association-src-multiplicity");
  const srcDoc = document.getElementById("association-src-documentation");
  const srcDocRu = document.getElementById("association-src-documentationRu");
  const srcDetails = document.getElementById("association-src-details");

  if (srcClassName) srcClassName.value = String(srcEnd?.linkEndClassName ?? "");
  if (srcClassId) srcClassId.value = String(srcEnd?.linkEndClassId ?? "");
  if (srcRole) srcRole.value = String(srcEnd?.linkEndName ?? "");
  if (srcStereo) srcStereo.value = String(srcEnd?.stereotype ?? "");
  if (srcMult) srcMult.value = String(srcEnd?.multiplicity ?? "");
  if (srcDoc) srcDoc.value = String(srcEnd?.documentation ?? "");
  if (srcDocRu) srcDocRu.value = String(srcEnd?.documentationRu ?? "");
  if (srcDetails) srcDetails.value = String(srcEnd?.details ?? "");

  // Target end fields
  const targetClassName = document.getElementById("association-targetClassName");
  const targetClassId = document.getElementById("association-targetClassId");
  const targetRole = document.getElementById("association-target-role");
  const targetStereo = document.getElementById("association-target-stereotype");
  const targetMult = document.getElementById("association-target-multiplicity");
  const targetDoc = document.getElementById("association-target-documentation");
  const targetDocRu = document.getElementById("association-target-documentationRu");
  const targetDetails = document.getElementById("association-target-details");

  if (targetClassName) targetClassName.value = String(targetEnd?.linkEndClassName ?? "");
  if (targetClassId) targetClassId.value = String(targetEnd?.linkEndClassId ?? "");
  if (targetRole) targetRole.value = String(targetEnd?.linkEndName ?? "");
  if (targetStereo) targetStereo.value = String(targetEnd?.stereotype ?? "");
  if (targetMult) targetMult.value = String(targetEnd?.multiplicity ?? "");
  if (targetDoc) targetDoc.value = String(targetEnd?.documentation ?? "");
  if (targetDocRu) targetDocRu.value = String(targetEnd?.documentationRu ?? "");
  if (targetDetails) targetDetails.value = String(targetEnd?.details ?? "");

  const modal = document.getElementById("association-link-modal");
  if (modal) openModal(modal);
}

export { initAssociationLinkModal, openEditAssociationLinkModal };
