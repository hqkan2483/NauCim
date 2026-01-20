import { openModal, closeModal } from "../modal.js";
import { showToast } from "./toast.js";
import { normalizeName } from "../../utils/project-traversal.js";

/**
 * Create Package Modal (UI component)
 *
 * Responsibilities:
 * - Collect package fields from user (based on package form fields)
 * - Perform client-side validation, including sibling-name uniqueness
 * - Delegate persistence to the caller via `onCreate`
 */

let currentProjectId = null;
let ctx = null; // { modelId, profileId, parentPackageId }
let existingSiblingNamesNormalized = new Set();
let onCreateCallback = null;

/**
 * Set/clear name field error state.
 * @param {string} message
 */
function setNameError(message) {
  const input = document.getElementById("create-pkg-name");
  const errorEl = document.getElementById("create-pkg-name-error");

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
  const input = document.getElementById("create-pkg-name");
  if (!input) return false;

  setNameError("");

  const name = String(input.value || "").trim();
  if (!name) {
    setNameError("Введите имя пакета.");
    return false;
  }

  const normalized = normalizeName(name);
  if (normalized && existingSiblingNamesNormalized.has(normalized)) {
    setNameError("Имя пакета должно быть уникальным среди подпакетов этого пакета.");
    return false;
  }

  return true;
}

function setBusy(isBusy) {
  const btn = document.getElementById("create-pkg-save-btn");
  if (btn) btn.disabled = Boolean(isBusy);
}

async function handleCreate() {
  if (!currentProjectId || !ctx) return;

  const nameInput = document.getElementById("create-pkg-name");
  if (!nameInput) return;

  if (!validate()) {
    nameInput.focus();
    return;
  }

  const payload = {
    name: nameInput.value.trim(),
    documentation: document.getElementById("create-pkg-documentation")?.value?.trim() || "",
    documentationRu: document.getElementById("create-pkg-documentationRu")?.value?.trim() || "",
    details: document.getElementById("create-pkg-details")?.value?.trim() || "",
  };

  setBusy(true);

  try {
    if (typeof onCreateCallback !== "function") return;
    await onCreateCallback({ ...ctx, payload });

    const modal = document.getElementById("create-package-modal");
    if (modal) closeModal(modal);
  } catch (err) {
    // Backend enforces uniqueness too.
    if (err?.status === 409) {
      setNameError(err.message || "Имя пакета уже существует.");
    } else {
      showToast(err?.message || "Не удалось создать пакет", { type: "error" });
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
export function initCreatePackageModal(projectId, callbacks = {}) {
  currentProjectId = projectId;
  onCreateCallback = callbacks.onCreate || null;

  const saveBtn = document.getElementById("create-pkg-save-btn");
  if (saveBtn) saveBtn.addEventListener("click", handleCreate);

  const nameInput = document.getElementById("create-pkg-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      setNameError("");
      validate();
    });
  }

  const modal = document.getElementById("create-package-modal");
  if (modal) {
    modal.addEventListener("modal:afterclose", () => {
      ctx = null;
      existingSiblingNamesNormalized = new Set();
      setNameError("");
      setBusy(false);
    });
  }
}

/**
 * Open modal in "create subpackage" mode.
 * @param {object} params
 * @param {string} params.parentPackageId
 * @param {string} [params.modelId]
 * @param {string} [params.profileId]
 * @param {Set<string>} [params.existingSiblingNamesNormalized]
 */
export function openCreatePackageModal({
  parentPackageId,
  modelId = "",
  profileId = "",
  existingSiblingNamesNormalized: existing = new Set(),
} = {}) {
  if (!currentProjectId) return;
  if (!parentPackageId) return;

  ctx = {
    parentPackageId: String(parentPackageId),
    modelId: modelId ? String(modelId) : "",
    profileId: profileId ? String(profileId) : "",
  };

  existingSiblingNamesNormalized = existing instanceof Set ? existing : new Set();

  const nameInput = document.getElementById("create-pkg-name");
  if (nameInput) nameInput.value = "";

  const doc = document.getElementById("create-pkg-documentation");
  const docRu = document.getElementById("create-pkg-documentationRu");
  const details = document.getElementById("create-pkg-details");
  if (doc) doc.value = "";
  if (docRu) docRu.value = "";
  if (details) details.value = "";

  setNameError("");
  setBusy(false);

  const modal = document.getElementById("create-package-modal");
  if (modal) openModal(modal);

  nameInput?.focus();
}
