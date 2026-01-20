import { openModal, closeModal } from "../modal.js";
import { renderDataTypePickerTable } from "../renderers/data-type-picker-renderer.js";
import {
  listModelClassesSummary,
  listProfileClassesSummary,
} from "../../services/class-service.js";

let currentProjectId = null;
let onSelectCallback = null;
let currentContext = null; // { kind: 'model'|'profile', id: string }

let items = [];
let filterText = "";
let selectedId = null;

function getEls() {
  return {
    modal: document.getElementById("data-type-picker-modal"),
    search: document.getElementById("data-type-picker-search"),
    table: document.getElementById("data-type-picker-table"),
    chooseBtn: document.getElementById("data-type-picker-choose-btn"),
  };
}

function render() {
  const { table, chooseBtn } = getEls();
  if (table) {
    table.innerHTML = renderDataTypePickerTable(items, {
      filter: filterText,
      selectedId,
    });
  }
  if (chooseBtn) chooseBtn.disabled = !selectedId;
}

function bindOnce() {
  const { search, table, chooseBtn } = getEls();

  if (search && !search.dataset.bound) {
    search.dataset.bound = "1";
    search.addEventListener("input", () => {
      filterText = search.value || "";
      // keep selection if it still exists in filtered list
      render();
    });
  }

  if (table && !table.dataset.bound) {
    table.dataset.bound = "1";
    table.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const row = target.closest(".data-type-picker__row");
      if (!row) return;

      const id = row.getAttribute("data-item-id");
      if (!id) return;

      selectedId = id;
      render();
    });
  }

  if (chooseBtn && !chooseBtn.dataset.bound) {
    chooseBtn.dataset.bound = "1";
    chooseBtn.addEventListener("click", () => {
      if (!selectedId) return;
      const chosen = items.find((it) => String(it.id) === String(selectedId));
      if (!chosen) return;

      const { modal } = getEls();
      if (modal) closeModal(modal);

      if (onSelectCallback) onSelectCallback(chosen);
      onSelectCallback = null;
    });
  }
}

async function loadItemsForContext(projectId, context) {
  if (!context) return [];
  if (context.kind === "model") {
    return await listModelClassesSummary(projectId, context.id, { filters: context.filters || {} });
  }
  if (context.kind === "profile") {
    return await listProfileClassesSummary(projectId, context.id, { filters: context.filters || {} });
  }
  return [];
}

/**
 * Init once per page.
 */
export function initDataTypePickerModal(projectId) {
  currentProjectId = projectId;
  bindOnce();
}

/**
 * Open picker for a specific model/profile.
 * @param {{modelId?: string, profileId?: string, selectedId?: string, filters?: { excludeStereotypes?: string[], includeTypes?: string[], excludeTypes?: string[] }, onSelect: (item)=>void}} opts
 */
export async function openDataTypePickerModal(opts) {
  if (!currentProjectId) return;

  const modelId = opts?.modelId ? String(opts.modelId) : "";
  const profileId = opts?.profileId ? String(opts.profileId) : "";

  const filters = opts?.filters && typeof opts.filters === "object" ? opts.filters : {};

  currentContext = modelId
    ? { kind: "model", id: modelId, filters }
    : profileId
    ? { kind: "profile", id: profileId, filters }
    : null;

  if (!currentContext) return;

  onSelectCallback = typeof opts?.onSelect === "function" ? opts.onSelect : null;

  items = [];
  filterText = "";
  selectedId = opts?.selectedId ? String(opts.selectedId) : null;

  const { modal, search, table, chooseBtn } = getEls();
  if (!modal || !search || !table || !chooseBtn) return;

  // Reset UI
  search.value = "";
  table.innerHTML = `<div class="info-block">Загрузка...</div>`;
  chooseBtn.disabled = true;

  openModal(modal);
  search.focus();

  bindOnce();

  try {
    items = await loadItemsForContext(currentProjectId, currentContext);
  } catch (e) {
    console.error("[openDataTypePickerModal] Failed to load items:", e);
    items = [];
  }

  render();
}
