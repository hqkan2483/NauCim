import { openModal, closeModal } from "../modal.js";
import { showToast } from "./toast.js";
import { normalizeName } from "../../utils/project-traversal.js";

/**
 * Create Diagram Modal (UI component)
 *
 * Responsibilities:
 * - Collect diagram fields from user (name/description/details)
 * - Perform client-side validation, including model/profile-wide uniqueness
 * - Delegate persistence to the caller via `onCreate`
 */

let currentProjectId = null;
let ctx = null; // { modelId, profileId, packageId }
let existingDiagramNamesNormalized = new Set();
let onCreateCallback = null;

/**
 * Set/clear diagram name error state.
 * @param {string} message
 */
function setNameError(message) {
  const input = document.getElementById("create-diagram-name");
  const errorEl = document.getElementById("create-diagram-name-error");

  const msg = String(message || "");
  const hasError = Boolean(msg);

  if (input) input.classList.toggle("input-error", hasError);
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.toggle("hidden", !hasError);
  }
}

/**
 * Validate required fields and uniqueness.
 * @returns {boolean}
 */
function validate() {
  const input = document.getElementById("create-diagram-name");
  if (!input) return false;

  setNameError("");

  const name = String(input.value || "").trim();
  if (!name) {
    setNameError("Введите название диаграммы.");
    return false;
  }

  const normalized = normalizeName(name);
  if (normalized && existingDiagramNamesNormalized.has(normalized)) {
    setNameError("Название диаграммы должно быть уникальным в рамках модели/профиля.");
    return false;
  }

  return true;
}

function setBusy(isBusy) {
  const btn = document.getElementById("create-diagram-save-btn");
  if (btn) btn.disabled = Boolean(isBusy);
}

async function handleCreate() {
  if (!currentProjectId || !ctx) return;

  const nameInput = document.getElementById("create-diagram-name");
  if (!nameInput) return;

  if (!validate()) {
    nameInput.focus();
    return;
  }

  const payload = {
    diagramName: nameInput.value.trim(),
    diagramType: "ClassDiagram",
    documentation: document.getElementById("create-diagram-documentation")?.value?.trim() || "",
    details: document.getElementById("create-diagram-details")?.value?.trim() || "",
  };

  setBusy(true);

  try {
    if (typeof onCreateCallback !== "function") return;
    await onCreateCallback({ ...ctx, payload });

    const modal = document.getElementById("create-diagram-modal");
    if (modal) closeModal(modal);
  } catch (err) {
    if (err?.status === 409) {
      setNameError(err.message || "Название диаграммы уже существует.");
    } else {
      showToast(err?.message || "Не удалось создать диаграмму", { type: "error" });
    }
  } finally {
    setBusy(false);
  }
}

/**
 * Initialize modal component.
 * @param {string} projectId
 * @param {{ onCreate?: Function }} callbacks
 */
export function initCreateDiagramModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onCreateCallback = callbacks.onCreate || null;

  const saveBtn = document.getElementById("create-diagram-save-btn");
  if (saveBtn) saveBtn.addEventListener("click", handleCreate);

  const nameInput = document.getElementById("create-diagram-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      setNameError("");
      validate();
    });
  }

  const modal = document.getElementById("create-diagram-modal");
  if (modal) {
    modal.addEventListener("modal:afterclose", () => {
      ctx = null;
      existingDiagramNamesNormalized = new Set();
      setNameError("");
      setBusy(false);
    });
  }
}

/**
 * Open modal in "create diagram in package" mode.
 * @param {object} params
 * @param {string} params.packageId
 * @param {string} [params.modelId]
 * @param {string} [params.profileId]
 * @param {Set<string>} [params.existingDiagramNamesNormalized]
 */
export function openCreateDiagramModal({
  packageId,
  modelId = "",
  profileId = "",
  existingDiagramNamesNormalized: existing = new Set(),
} = {}) {
  if (!currentProjectId) return;
  if (!packageId) return;

  ctx = {
    packageId: String(packageId),
    modelId: modelId ? String(modelId) : "",
    profileId: profileId ? String(profileId) : "",
  };

  existingDiagramNamesNormalized = existing instanceof Set ? existing : new Set();

  const nameInput = document.getElementById("create-diagram-name");
  const doc = document.getElementById("create-diagram-documentation");
  const details = document.getElementById("create-diagram-details");

  if (nameInput) nameInput.value = "";
  if (doc) doc.value = "";
  if (details) details.value = "";

  setNameError("");
  setBusy(false);

  const modal = document.getElementById("create-diagram-modal");
  if (modal) openModal(modal);

  nameInput?.focus();
}
