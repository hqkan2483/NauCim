import { initDataTypePickerModal, openDataTypePickerModal } from "./data-type-picker-modal.js";

/**
 * Bind a reusable "pick class/enumeration" icon button to a text input.
 *
 * Responsibilities (UI layer):
 * - Wire button click -> open Data Type Picker modal
 * - Pass the current context (model/profile) to the picker
 * - On choose: write selected item name/id into configured inputs
 *
 * Notes:
 * - The actual list of items comes from the backend (via data-type-picker-modal -> service layer).
 * - Filtering (e.g. exclude stereotypes) is passed as picker `filters`.
 *
 * @param {string} projectId
 * @param {object} opts
 * @param {string} opts.buttonId DOM id of the icon button
 * @param {string} opts.nameInputId DOM id of the visible name input
 * @param {string} [opts.idInputId] DOM id of hidden input to store selected id
 * @param {() => ({modelId?: string, profileId?: string} | null)} opts.getContext
 * @param {object} [opts.filters]
 * @param {string[]} [opts.filters.excludeStereotypes]
 * @param {string[]} [opts.filters.includeTypes]
 * @param {string[]} [opts.filters.excludeTypes]
 * @param {() => (string|null)} [opts.getSelectedId] Optional getter for selected id (if you store it in JS)
 * @param {(id: string|null) => void} [opts.setSelectedId] Optional setter for selected id (if you store it in JS)
 * @param {(item: any) => void} [opts.onSelect] Optional hook called after selection was applied
 */
export function bindClassPickerInput(projectId, {
  buttonId,
  nameInputId,
  idInputId = "",
  getContext,
  filters = {},
  getSelectedId,
  setSelectedId,
  onSelect,
} = {}) {
  if (!projectId) return;

  const btn = document.getElementById(buttonId);
  if (!btn || btn.dataset.bound) return;

  const nameInput = document.getElementById(nameInputId);
  if (!nameInput) return;

  btn.dataset.bound = "1";

  btn.addEventListener("click", async () => {
    const ctx = typeof getContext === "function" ? getContext() : null;
    const modelId = ctx?.modelId ? String(ctx.modelId) : "";
    const profileId = ctx?.profileId ? String(ctx.profileId) : "";

    if (!modelId && !profileId) return;

    initDataTypePickerModal(String(projectId));

    const idInput = idInputId ? document.getElementById(idInputId) : null;
    const selectedId = typeof getSelectedId === "function"
      ? (getSelectedId() ? String(getSelectedId()) : null)
      : (idInput?.value ? String(idInput.value) : null);

    await openDataTypePickerModal({
      modelId,
      profileId,
      selectedId,
      filters,
      onSelect: (item) => {
        nameInput.value = String(item?.name ?? "");
        const pickedId = item?.id ? String(item.id) : null;
        if (idInput) idInput.value = pickedId ? String(pickedId) : "";
        if (typeof setSelectedId === "function") setSelectedId(pickedId);

        if (typeof onSelect === "function") onSelect(item);

        // keep focus on the edited field
        nameInput.focus();
      },
    });
  });
}
