let modalSystemInitialized = false;

const DRAG_STATE = {
  initialized: new WeakSet(),
};

const DEFAULTS = {
  activeClass: "active",
  closeOnEsc: true,
  closeOnOverlayClick: true,
  lockBodyScroll: true,
  bodyOpenClass: "modal-open",
  overlayCloseAttribute: "data-overlay-close",
};

function assertModalEl(modalEl) {
  if (!(modalEl instanceof HTMLElement)) {
    throw new TypeError("openModal/closeModal expect an HTMLElement (modal element).");
  }
  return modalEl;
}

function getActiveModals(activeClass = DEFAULTS.activeClass) {
  return Array.from(document.querySelectorAll(`.modal.${activeClass}`));
}

function syncBodyScrollLock(cfg) {
  if (! cfg.lockBodyScroll) return;
  const hasOpen = getActiveModals(cfg.activeClass).length > 0;
  document.body.classList.toggle(cfg.bodyOpenClass, hasOpen);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(n, max));
}

function resetModalContentPosition(modalEl) {
  const content = modalEl.querySelector(".modal-content");
  if (!content) return;

  content.style.position = "";
  content.style.left = "";
  content.style.top = "";
  content.style.margin = "";
  content.style.transform = "";
}

function ensureDraggableModal(modalEl) {
  if (!(modalEl instanceof HTMLElement)) return;
  if (DRAG_STATE.initialized.has(modalEl)) return;

  DRAG_STATE.initialized.add(modalEl);

  modalEl.classList.add("modal--draggable");

  modalEl.addEventListener("pointerdown", (e) => {
    if (!(e.target instanceof HTMLElement)) return;

    // Only left button drag (mouse). For touch, button is typically -1.
    if (typeof e.button === "number" && e.button !== 0 && e.pointerType === "mouse") return;

    const handle = e.target.closest("[data-modal-drag-handle], .modal-title");
    if (!handle) return;

    // Don't start drag from inside inputs/buttons etc.
    if (e.target.closest("input, textarea, select, button, a")) return;

    const content = modalEl.querySelector(".modal-content");
    if (!content) return;
    if (!modalEl.classList.contains(DEFAULTS.activeClass)) return;

    const rect = content.getBoundingClientRect();

    // Switch to fixed positioning so we can move it.
    content.style.position = "fixed";
    content.style.left = `${rect.left}px`;
    content.style.top = `${rect.top}px`;
    content.style.margin = "0";

    // Prevent selecting title text while dragging.
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = rect.left;
    const startTop = rect.top;
    const padding = 8;

    const onMove = (ev) => {
      if (ev.pointerId !== e.pointerId) return;

      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const maxLeft = Math.max(padding, vw - rect.width - padding);
      const maxTop = Math.max(padding, vh - rect.height - padding);

      const nextLeft = clamp(startLeft + dx, padding, maxLeft);
      const nextTop = clamp(startTop + dy, padding, maxTop);

      content.style.left = `${nextLeft}px`;
      content.style.top = `${nextTop}px`;
    };

    const stop = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", stop, true);
      window.removeEventListener("pointercancel", stop, true);
    };

    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", stop, true);
    window.addEventListener("pointercancel", stop, true);
  });

  // Cleanup/reset on close so next open starts centered.
  modalEl.addEventListener("modal:afterclose", () => {
    resetModalContentPosition(modalEl);
  });
}

function openModal(modalEl, options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  const modal = assertModalEl(modalEl);

  ensureDraggableModal(modal);
  resetModalContentPosition(modal);

  // Dispatch event before opening
  const event = new CustomEvent("modal:beforeopen", {
    detail: { modalId: modal.id },
    bubbles: true,
    cancelable: false,
  });
  modal.dispatchEvent(event);

  modal.classList.add(cfg.activeClass);
  syncBodyScrollLock(cfg);
}

function closeModal(modalEl, options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  const modal = assertModalEl(modalEl);

  modal.classList.remove(cfg.activeClass);
  syncBodyScrollLock(cfg);

  // Dispatch event after closing
  const event = new CustomEvent("modal:afterclose", {
    detail: { modalId: modal.id },
    bubbles: true,
    cancelable: false,
  });
  modal.dispatchEvent(event);
}

/**
 * One-time global init:
 * - ESC closes topmost modal
 * - overlay click closes ONLY modals with [data-overlay-close]
 */
function initModalSystem(options = {}) {
  if (modalSystemInitialized) return;
  const cfg = { ...DEFAULTS, ...options };

  if (cfg.closeOnEsc) {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      const open = getActiveModals(cfg.activeClass);
      const top = open[open.length - 1];
      if (! top) return;

      closeModal(top, cfg);
      e.preventDefault();
    });
  }

  if (cfg.closeOnOverlayClick) {
    document.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (! target) return;

      const modal = target.closest(".modal");
      if (! modal) return;

      // Only overlay click (not inside .modal-content)
      if (target !== modal) return;

      // default:  do NOT close unless modal has [data-overlay-close]
      if (!modal.hasAttribute(cfg.overlayCloseAttribute)) return;

      if (modal.classList.contains(cfg.activeClass)) {
        closeModal(modal, cfg);
        e.preventDefault();
      }
    });
  }

  modalSystemInitialized = true;
}

/**
 * Optional: data-attribute bindings (HTMLElement-only).
 * Supports:
 * - [data-modal-open="modal-id"] (auto-prefixes # if plain id)
 * - [data-modal-open="#custom-selector"] or [data-modal-open=".class"]
 * - [data-modal-close] closes nearest modal
 * - [data-modal-close="modal-id"] closes targeted modal
 */
function bindModalTriggers(root = document, options = {}) {
  const cfg = { ...DEFAULTS, ...options };

  root.addEventListener("click", (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (!target) return;

    const openEl = target.closest("[data-modal-open]");
    if (openEl) {
      const value = openEl.getAttribute("data-modal-open");
      if (!value) return;

      // Auto-prefix # if it's a plain id (not a CSS selector)
      const selector = value.startsWith("#") || value.startsWith(".") || value.startsWith("[")
        ? value
        : `#${value}`;

      const modal = document.querySelector(selector);
      if (modal) openModal(modal, cfg);
      e.preventDefault();
      return;
    }

    const closeEl = target.closest("[data-modal-close]");
    if (closeEl) {
      const value = closeEl.getAttribute("data-modal-close");

      if (value) {
        // Auto-prefix # if plain id
        const selector = value.startsWith("#") || value.startsWith(".") || value.startsWith("[")
          ? value
          : `#${value}`;

        const modal = document.querySelector(selector);
        if (modal) closeModal(modal, cfg);
      } else {
        // No value:  close nearest modal
        const modal = closeEl.closest(".modal");
        if (modal) closeModal(modal, cfg);
      }
      e.preventDefault();
    }
  });
}

export { initModalSystem, bindModalTriggers, openModal, closeModal };
