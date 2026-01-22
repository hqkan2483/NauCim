import { openModal, closeModal } from "../modal.js";

let onSelectHandler = null;

function initLinkTypeModal(callbacks = {}) {
  onSelectHandler = callbacks.onSelect || null;

  const chooseBtn = document.getElementById("link-type-choose-btn");
  if (chooseBtn) {
    chooseBtn.addEventListener("click", () => {
      const select = document.getElementById("link-type-relationKind");
      const value = select ? String(select.value || "") : "";
      const modal = document.getElementById("link-type-modal");

      if (value && onSelectHandler) {
        onSelectHandler(value);
      }

      if (modal) closeModal(modal);
    });
  }
}

function openLinkTypeModal({ defaultType = "Generalization" } = {}) {
  const select = document.getElementById("link-type-relationKind");
  if (select) {
    select.value = defaultType;
  }

  const modal = document.getElementById("link-type-modal");
  if (modal) openModal(modal);
}

export { initLinkTypeModal, openLinkTypeModal };
