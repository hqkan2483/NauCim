import { openModal, closeModal } from "../modal.js";
import { showToast } from "./toast.js";
import { normalizeName } from "../../utils/project-traversal.js";

/**
 * Create Enumeration Modal (UI component)
 *
 * Separate from class-create modal on purpose.
 * Responsibilities:
 * - Collect enumeration fields from user
 * - Perform client-side validation, including uniqueness in model/profile scope
 * - Delegate persistence to the caller via `onCreate`
 */

let currentProjectId = null;
let ctx = null; // { modelId, profileId, packageId }
let existingClassNamesNormalized = new Set();
let onCreateCallback = null;

/**
 * Set/clear enumeration name error state.
 *
 * @param {string} message
 * @returns {void}
 */
function setNameError(message) {
  const input = document.getElementById("create-enum-name");
  const errorEl = document.getElementById("create-enum-name-error");

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
 *
 * @returns {boolean}
 */
function validate() {
  const input = document.getElementById("create-enum-name");
  if (!input) return false;

  setNameError("");

  const name = String(input.value || "").trim();
  if (!name) {
    setNameError("Введите имя перечисления.");
    return false;
  }

  const normalized = normalizeName(name);
  if (normalized && existingClassNamesNormalized.has(normalized)) {
    setNameError("Имя должно быть уникальным в рамках модели/профиля.");
    return false;
  }

  return true;
}

/**
 * Toggle modal busy state.
 *
 * @param {boolean} isBusy
 * @returns {void}
 */
function setBusy(isBusy) {
  const btn = document.getElementById("create-enum-save-btn");
  if (btn) btn.disabled = Boolean(isBusy);
}

/**
 * Handle create action.
 *
 * @returns {Promise<void>}
 */
async function handleCreate() {
  if (!currentProjectId || !ctx) return;

  const nameInput = document.getElementById("create-enum-name");
  if (!nameInput) return;

  if (!validate()) {
    nameInput.focus();
    return;
  }

  const payload = {
    name: nameInput.value.trim(),
    type: "Enumeration",
    isAbstract: Boolean(document.getElementById("create-enum-isAbstract")?.checked),
    stereotype: document.getElementById("create-enum-stereotype")?.value?.trim() || "",
    documentation: document.getElementById("create-enum-documentation")?.value?.trim() || "",
    documentationRu: document.getElementById("create-enum-documentationRu")?.value?.trim() || "",
    details: document.getElementById("create-enum-details")?.value?.trim() || "",
  };

  setBusy(true);

  try {
    if (typeof onCreateCallback !== "function") return;
    await onCreateCallback({ ...ctx, payload });

    const modal = document.getElementById("create-enumeration-modal");
    if (modal) closeModal(modal);
  } catch (err) {
    if (err?.status === 409) {
      setNameError(err.message || "Имя уже существует.");
    } else {
      showToast(err?.message || "Не удалось создать перечисление", { type: "error" });
    }
  } finally {
    setBusy(false);
  }
}

/**
 * Initialize modal component.
 *
 * @param {string} projectId
 * @param {{ onCreate?: Function }} callbacks
 * @returns {void}
 */
export function initCreateEnumerationModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onCreateCallback = callbacks.onCreate || null;

  const saveBtn = document.getElementById("create-enum-save-btn");
  if (saveBtn) saveBtn.addEventListener("click", handleCreate);

  const nameInput = document.getElementById("create-enum-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      setNameError("");
      validate();
    });
  }

  const modal = document.getElementById("create-enumeration-modal");
  if (modal) {
    modal.addEventListener("modal:afterclose", () => {
      ctx = null;
      existingClassNamesNormalized = new Set();
      setNameError("");
      setBusy(false);
    });
  }
}

/**
 * Open modal in "create enumeration in package" mode.
 *
 * @param {object} params
 * @param {string} params.packageId
 * @param {string} [params.modelId]
 * @param {string} [params.profileId]
 * @param {Set<string>} [params.existingClassNamesNormalized]
 * @returns {void}
 */
export function openCreateEnumerationModal({
  packageId,
  modelId = "",
  profileId = "",
  existingClassNamesNormalized: existing = new Set(),
} = {}) {
  if (!currentProjectId) return;
  if (!packageId) return;

  ctx = {
    packageId: String(packageId),
    modelId: modelId ? String(modelId) : "",
    profileId: profileId ? String(profileId) : "",
  };

  existingClassNamesNormalized = existing instanceof Set ? existing : new Set();

  const nameInput = document.getElementById("create-enum-name");
  if (nameInput) nameInput.value = "";

  const isAbs = document.getElementById("create-enum-isAbstract");
  const stereo = document.getElementById("create-enum-stereotype");
  const doc = document.getElementById("create-enum-documentation");
  const docRu = document.getElementById("create-enum-documentationRu");
  const details = document.getElementById("create-enum-details");

  if (isAbs) isAbs.checked = false;
  if (stereo) stereo.value = "";
  if (doc) doc.value = "";
  if (docRu) docRu.value = "";
  if (details) details.value = "";

  setNameError("");
  setBusy(false);

  const modal = document.getElementById("create-enumeration-modal");
  if (modal) openModal(modal);

  nameInput?.focus();
}
