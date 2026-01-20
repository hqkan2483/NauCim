import { openModal, closeModal } from "../modal.js";
import { showToast } from "./toast.js";
import { normalizeName } from "../../utils/project-traversal.js";

/**
 * Create Class Modal (UI component)
 *
 * Responsibilities:
 * - Collect class fields from user (based on class form fields)
 * - Perform client-side validation, including model/profile-wide uniqueness
 * - Delegate persistence to the caller via `onCreate`
 */

let currentProjectId = null;
let ctx = null; // { modelId, profileId, packageId }
let existingClassNamesNormalized = new Set();
let onCreateCallback = null;

/**
 * Set/clear class name error state.
 * @param {string} message
 */
function setNameError(message) {
  const input = document.getElementById("create-cls-name");
  const errorEl = document.getElementById("create-cls-name-error");

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
  const input = document.getElementById("create-cls-name");
  if (!input) return false;

  setNameError("");

  const name = String(input.value || "").trim();
  if (!name) {
    setNameError("Введите имя класса.");
    return false;
  }

  const normalized = normalizeName(name);
  if (normalized && existingClassNamesNormalized.has(normalized)) {
    setNameError("Имя класса должно быть уникальным в рамках модели/профиля.");
    return false;
  }

  return true;
}

function setBusy(isBusy) {
  const btn = document.getElementById("create-cls-save-btn");
  if (btn) btn.disabled = Boolean(isBusy);
}

async function handleCreate() {
  if (!currentProjectId || !ctx) return;

  const nameInput = document.getElementById("create-cls-name");
  if (!nameInput) return;

  if (!validate()) {
    nameInput.focus();
    return;
  }

  const payload = {
    name: nameInput.value.trim(),
    isAbstract: Boolean(document.getElementById("create-cls-isAbstract")?.checked),
    stereotype: document.getElementById("create-cls-stereotype")?.value?.trim() || "",
    documentation: document.getElementById("create-cls-documentation")?.value?.trim() || "",
    documentationRu: document.getElementById("create-cls-documentationRu")?.value?.trim() || "",
    details: document.getElementById("create-cls-details")?.value?.trim() || "",
  };

  setBusy(true);

  try {
    if (typeof onCreateCallback !== "function") return;
    await onCreateCallback({ ...ctx, payload });

    const modal = document.getElementById("create-class-modal");
    if (modal) closeModal(modal);
  } catch (err) {
    if (err?.status === 409) {
      setNameError(err.message || "Имя класса уже существует.");
    } else {
      showToast(err?.message || "Не удалось создать класс", { type: "error" });
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
export function initCreateClassModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onCreateCallback = callbacks.onCreate || null;

  const saveBtn = document.getElementById("create-cls-save-btn");
  if (saveBtn) saveBtn.addEventListener("click", handleCreate);

  const nameInput = document.getElementById("create-cls-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      setNameError("");
      validate();
    });
  }

  const modal = document.getElementById("create-class-modal");
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
 * Open modal in "create class in package" mode.
 * @param {object} params
 * @param {string} params.packageId
 * @param {string} [params.modelId]
 * @param {string} [params.profileId]
 * @param {Set<string>} [params.existingClassNamesNormalized]
 */
export function openCreateClassModal({
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

  const nameInput = document.getElementById("create-cls-name");
  if (nameInput) nameInput.value = "";

  const isAbs = document.getElementById("create-cls-isAbstract");
  const stereo = document.getElementById("create-cls-stereotype");
  const doc = document.getElementById("create-cls-documentation");
  const docRu = document.getElementById("create-cls-documentationRu");
  const details = document.getElementById("create-cls-details");

  if (isAbs) isAbs.checked = false;
  if (stereo) stereo.value = "";
  if (doc) doc.value = "";
  if (docRu) docRu.value = "";
  if (details) details.value = "";

  setNameError("");
  setBusy(false);

  const modal = document.getElementById("create-class-modal");
  if (modal) openModal(modal);

  nameInput?.focus();
}
