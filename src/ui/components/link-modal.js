import { closeModal, openModal } from "../modal.js";
import { initDataTypePickerModal } from "./data-type-picker-modal.js";
import { bindClassPickerInput } from "./class-picker-input.js";
import { getProjectById } from "../../services/project-service.js";

/**
 * Link Modal Component
 * Self-contained modal for editing class link fields.
 */

let currentProjectId = null;
let editingLinkId = null;
let editingClassId = null;
let editingContext = null; // { modelId?: string, profileId?: string }
let editingInitialRole = null; // 'child' | 'parent' (role of editing class)
let isCreatingLink = false;

// Callbacks from pages
let onUpdateCallback = null;
let onCreateCallback = null;

function initGeneralizationLinkModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onUpdateCallback = callbacks.onUpdate || null;
  onCreateCallback = callbacks.onCreate || null;

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
    onSelect: () => {
      // Validate when target class is selected
      validateGeneralizationInRealTime();
    },
  });

  const saveBtn = document.getElementById("save-generalization-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveGeneralizationLinkSave);
  }
}

/**
 * Clear validation error message and re-enable save button.
 */
function clearValidationError() {
  const errorEl = document.getElementById("generalization-link-validation-error");
  const saveBtn = document.getElementById("save-generalization-btn");
  
  if (errorEl) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
  }
  
  if (saveBtn) {
    saveBtn.disabled = false;
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
function openEditGeneralizationLinkModal(generalizationLink, classId, ctx = {}) {
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
  isCreatingLink = false;

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

  // Clear any previous validation errors
  clearValidationError();

  // Add real-time validation on role change (remove old listener first)
  if (roleSelect) {
    // Remove existing listener to avoid duplicates
    roleSelect.removeEventListener("change", validateGeneralizationInRealTime);
    roleSelect.addEventListener("change", validateGeneralizationInRealTime);
  }

  const modal = document.getElementById("generalization-link-modal");
  if (modal) {
    openModal(modal);
    // Trigger validation after modal opens and DOM is ready
    requestAnimationFrame(() => {
      validateGeneralizationInRealTime();
    });
  }
}

function openCreateGeneralizationLinkModal(classId, ctx = {}) {
  if (!currentProjectId) return;

  editingLinkId = null;
  editingClassId = classId || null;
  editingContext = {
    modelId: ctx?.modelId ? String(ctx.modelId) : "",
    profileId: ctx?.profileId ? String(ctx.profileId) : "",
  };
  editingInitialRole = "child";
  isCreatingLink = true;

  const roleSelect = document.getElementById("generalization-link-role");
  const targetClassNameInput = document.getElementById("generalization-link-targetClassName");
  const targetClassIdInput = document.getElementById("generalization-link-targetClassId");
  const stereotypeInput = document.getElementById("generalization-link-stereotype");
  const documentationTextarea = document.getElementById("generalization-link-documentation");
  const documentationRuTextarea = document.getElementById("generalization-link-documentationRu");
  const detailsTextarea = document.getElementById("generalization-link-details");

  if (roleSelect) roleSelect.value = "child";
  if (targetClassNameInput) targetClassNameInput.value = "";
  if (targetClassIdInput) targetClassIdInput.value = "";
  if (stereotypeInput) stereotypeInput.value = "";
  if (documentationTextarea) documentationTextarea.value = "";
  if (documentationRuTextarea) documentationRuTextarea.value = "";
  if (detailsTextarea) detailsTextarea.value = "";

  clearValidationError();

  if (roleSelect) {
    roleSelect.removeEventListener("change", validateGeneralizationInRealTime);
    roleSelect.addEventListener("change", validateGeneralizationInRealTime);
  }

  const modal = document.getElementById("generalization-link-modal");
  if (modal) {
    openModal(modal);
    requestAnimationFrame(() => {
      validateGeneralizationInRealTime();
    });
  }
}

function handleSaveGeneralizationLinkSave() {
  if (!currentProjectId) return;

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
    ...(editingLinkId ? { linkId: String(editingLinkId) } : {}),
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
  const wasCreating = isCreatingLink;
  editingLinkId = null;
  editingClassId = null;
  editingContext = null;
  editingInitialRole = null;
  isCreatingLink = false;

  if (wasCreating && onCreateCallback) {
    onCreateCallback(classId, {
      ctx,
      role: role || "",
      generalizationLink,
    });
    return;
  }

  if (!wasCreating && onUpdateCallback) {
    onUpdateCallback(linkId, classId, {
      ctx,
      role: role || "",
      generalizationLink,
    });
  }
}

/**
 * Validate generalization link in real-time.
 * Shows error message if child class already has another parent.
 */
async function validateGeneralizationInRealTime() {
  const errorEl = document.getElementById("generalization-link-validation-error");
  const saveBtn = document.getElementById("save-generalization-btn");
  
  if (!errorEl || !saveBtn) return;
  
  // Clear previous error
  errorEl.style.display = "none";
  errorEl.textContent = "";
  saveBtn.disabled = false;
  
  if (!currentProjectId || !editingClassId) return;
  
  const role = document.getElementById("generalization-link-role")?.value || "child";
  const targetClassId = document.getElementById("generalization-link-targetClassId")?.value.trim() || "";
  
  if (!targetClassId) return; // No target selected yet
  
  try {
    const project = await getProjectById(currentProjectId);
    if (!project) return;
    
    // Determine which class will be the child
    const childClassId = role === "child" ? editingClassId : targetClassId;
    
    // Find all generalization links for the child class
    const allLinks = findAllGeneralizationLinksForClass(project, childClassId);
    
    // Check if the child already has a parent (excluding current link)
    for (const { link, role: linkRole } of allLinks) {
      const existingLinkId = String(link?.linkId || "");
      
      // Skip the link being edited
      if (editingLinkId && existingLinkId === String(editingLinkId)) continue;
      
      // If this class is a child in another link, it already has a parent
      if (linkRole === 'child') {
        const existingParentId = String(link?.parent?.classId || "");
        const existingParentName = String(link?.parent?.className || existingParentId);
        
        errorEl.textContent = `⚠️ Класс уже имеет родителя "${existingParentName}". Каждый класс может иметь только одного родителя.`;
        errorEl.style.display = "block";
        saveBtn.disabled = true;
        return;
      }
    }
  } catch (error) {
    console.error("[validateGeneralizationInRealTime] Error:", error);
  }
}

/**
 * Find all generalization links for a given class ID in the project.
 * Returns links where the class is either parent or child.
 *
 * @param {object} project - Project data
 * @param {string} classId - Class ID to search for
 * @returns {Array<{link: object, role: 'parent'|'child'|null}>} Array of generalization links with role information
 */
function findAllGeneralizationLinksForClass(project, classId) {
  const links = [];
  const cid = String(classId);

  // Search in models
  if (Array.isArray(project?.models)) {
    for (const model of project.models) {
      const rootPackage = model?.rootPackages?.[0];
      if (rootPackage && Array.isArray(rootPackage.generalizationsList)) {
        for (const link of rootPackage.generalizationsList) {
          const parentId = String(link?.parent?.classId || "");
          const childId = String(link?.child?.classId || "");
          
          if (parentId === cid) {
            links.push({ link, role: 'parent' });
          } else if (childId === cid) {
            links.push({ link, role: 'child' });
          }
        }
      }
    }
  }

  // Search in profiles
  if (Array.isArray(project?.profiles)) {
    for (const profile of project.profiles) {
      const rootPackage = profile?.rootPackages?.[0];
      if (rootPackage && Array.isArray(rootPackage.generalizationsList)) {
        for (const link of rootPackage.generalizationsList) {
          const parentId = String(link?.parent?.classId || "");
          const childId = String(link?.child?.classId || "");
          
          if (parentId === cid) {
            links.push({ link, role: 'parent' });
          } else if (childId === cid) {
            links.push({ link, role: 'child' });
          }
        }
      }
    }
  }

  return links;
}

export {
  initGeneralizationLinkModal,
  openEditGeneralizationLinkModal,
  openCreateGeneralizationLinkModal,
};
