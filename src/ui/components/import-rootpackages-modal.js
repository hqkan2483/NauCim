import { openModal, closeModal } from "../modal.js";
import { showToast } from "./toast.js";
import { importModelRootPackages } from "../../services/model-service.js";
import { importProfileRootPackages } from "../../services/profile-service.js";

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function normalizeRootPackagesJson(json) {
  // The common format in /models-data is: [ { packages: [...], ... } ]
  // i.e. rootPackages array. Also accept a single rootPackage object.
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    if (Array.isArray(json.rootPackages)) return json.rootPackages;
    return json;
  }
  return null;
}

function setBusy(btn, busy) {
  if (!(btn instanceof HTMLButtonElement)) return;
  btn.disabled = !!busy;
  btn.dataset.busy = busy ? "1" : "0";
  if (busy) btn.textContent = "Импорт...";
  else btn.textContent = btn.dataset.originalText || btn.textContent;
}

function bindImportModal({
  modalId,
  pathInputId,
  fileInputId,
  submitBtnId,
  onOpen,
  onSubmit,
}) {
  const modal = document.getElementById(modalId);
  if (!(modal instanceof HTMLElement)) return null;

  const pathInput = document.getElementById(pathInputId);
  const fileInput = document.getElementById(fileInputId);
  const submitBtn = document.getElementById(submitBtnId);

  if (submitBtn instanceof HTMLButtonElement && !submitBtn.dataset.originalText) {
    submitBtn.dataset.originalText = submitBtn.textContent || "";
  }

  let currentTargetId = null;

  const open = (targetId) => {
    currentTargetId = targetId ? String(targetId) : null;

    if (pathInput instanceof HTMLInputElement) pathInput.value = "";
    if (fileInput instanceof HTMLInputElement) fileInput.value = "";

    onOpen?.({ targetId: currentTargetId });

    openModal(modal);
  };

  if (submitBtn instanceof HTMLElement) {
    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (submitBtn.dataset.busy === "1") return;
      if (!currentTargetId) {
        showToast("Не выбран целевой объект для импорта", { type: "error" });
        return;
      }

      const pathValue = pathInput instanceof HTMLInputElement ? pathInput.value.trim() : "";
      const file =
        fileInput instanceof HTMLInputElement && fileInput.files && fileInput.files.length > 0
          ? fileInput.files[0]
          : null;

      if (!pathValue && !file) {
        showToast("Укажите путь до .json или выберите файл", { type: "error" });
        return;
      }

      setBusy(submitBtn, true);

      try {
        let payload = null;

        if (file) {
          const text = await readFileAsText(file);
          const parsed = JSON.parse(text);
          const normalized = normalizeRootPackagesJson(parsed);
          if (normalized === null) {
            showToast("Некорректный JSON: ожидается rootPackage/rootPackages", { type: "error" });
            return;
          }
          payload = { rootPackages: normalized };
        } else {
          payload = { path: pathValue };
        }

        const project = await onSubmit({ targetId: currentTargetId, payload });
        if (!project) {
          showToast("Импорт не выполнен (см. консоль)", { type: "error" });
          return;
        }

        closeModal(modal);
        showToast("Импорт успешно завершён", { type: "success" });
      } catch (err) {
        const msg = err?.message ? String(err.message) : "Ошибка импорта";
        showToast(msg, { type: "error" });
      } finally {
        setBusy(submitBtn, false);
      }
    });
  }

  return { open };
}

let modelModalApi = null;
let profileModalApi = null;

export function initModelImportModal(projectId, { onImported } = {}) {
  modelModalApi = bindImportModal({
    modalId: "import-model-modal",
    pathInputId: "import-model-path",
    fileInputId: "import-model-file",
    submitBtnId: "import-model-submit-btn",
    onSubmit: async ({ targetId, payload }) => {
      const project = await importModelRootPackages(projectId, targetId, payload);
      if (project) onImported?.(project, targetId);
      return project;
    },
  });
}

export function openModelImportModal(modelId) {
  if (!modelModalApi) return;
  modelModalApi.open(modelId);
}

export function initProfileImportModal(projectId, { onImported } = {}) {
  profileModalApi = bindImportModal({
    modalId: "import-profile-modal",
    pathInputId: "import-profile-path",
    fileInputId: "import-profile-file",
    submitBtnId: "import-profile-submit-btn",
    onSubmit: async ({ targetId, payload }) => {
      const project = await importProfileRootPackages(projectId, targetId, payload);
      if (project) onImported?.(project, targetId);
      return project;
    },
  });
}

export function openProfileImportModal(profileId) {
  if (!profileModalApi) return;
  profileModalApi.open(profileId);
}
