/**
 * Class tree context menu (UI component)
 *
 * Responsibilities:
 * - Show a custom context menu on right-click for class nodes in the project tree
 * - Close on ESC and outside click
 * - Call provided callbacks (business logic remains in the page/controller)
 */

/**
 * @typedef {object} ClassContext
 * @property {string} classId
 * @property {string|null} [packageId] - Parent package id from DOM (`data-package-id`).
 * @property {string} modelId
 * @property {string} profileId
 */

/**
 * Extracts class context from a rendered project-tree DOM node.
 *
 * UI-layer helper only: it reads `data-*` attributes emitted by renderers.
 * Business logic should be implemented in the page/controller via callbacks.
 *
 * @param {HTMLElement} node - `.tree-structure-name[data-type="class"]` element.
 * @returns {ClassContext|null}
 */
function getClassContextFromTreeNode(node) {
  if (!(node instanceof HTMLElement)) return null;
  const classId = node.getAttribute("data-class-id") || "";
  if (!classId) return null;

  const modelId = node.getAttribute("data-model-id") || "";
  const profileId = node.getAttribute("data-profile-id") || "";

  // `data-package-id` is rendered by the tree renderer. Empty string means "unknown/not provided".
  const packageIdRaw = node.getAttribute("data-package-id") || "";
  const packageId = packageIdRaw ? packageIdRaw : null;

  return { classId, packageId, modelId, profileId };
}

function clampToViewport({ x, y, width, height, padding = 8 }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.max(padding, Math.min(x, vw - width - padding));
  const top = Math.max(padding, Math.min(y, vh - height - padding));
  return { left, top };
}

function buildMenuEl() {
  const el = document.createElement("div");
  el.className = "context-menu hidden";
  el.setAttribute("role", "menu");
  el.innerHTML = `
    <button type="button" class="context-menu__item" data-action="view-properties" role="menuitem">Просмотреть свойства</button>
    <button type="button" class="context-menu__item context-menu__item--danger" data-action="delete-class" role="menuitem">Удалить</button>
  `;
  document.body.appendChild(el);
  return el;
}

/**
 * Initialize right-click context menu for class nodes.
 *
 * @param {HTMLElement} containerEl Element that contains the rendered project tree.
 * @param {object} callbacks
 * @param {(ctx: ClassContext) => void|Promise<void>} [callbacks.onViewProperties]
 * @param {(ctx: ClassContext) => void|Promise<void>} [callbacks.onDeleteClass]
 * @returns {{ destroy: () => void }}
 */
export function initClassTreeContextMenu(
  containerEl,
  { onViewProperties, onDeleteClass } = {}
) {
  if (!(containerEl instanceof HTMLElement)) {
    throw new TypeError("initClassTreeContextMenu expects containerEl HTMLElement");
  }

  const menuEl = buildMenuEl();
  /** @type {ClassContext|null} */
  let currentCtx = null;

  const isOpen = () => !menuEl.classList.contains("hidden");

  const close = () => {
    currentCtx = null;
    menuEl.classList.add("hidden");
  };

  const openAt = (x, y, ctx) => {
    currentCtx = ctx;
    menuEl.classList.remove("hidden");

    // Measure after opening to clamp properly.
    const rect = menuEl.getBoundingClientRect();
    const pos = clampToViewport({ x, y, width: rect.width, height: rect.height });
    menuEl.style.left = `${pos.left}px`;
    menuEl.style.top = `${pos.top}px`;

    // Focus first item for keyboard users.
    menuEl.querySelector(".context-menu__item")?.focus();
  };

  const onContainerContextMenu = (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (!target) return;

    const node = target.closest('.tree-structure-name[data-type="class"]');
    if (!node) return;

    const ctx = getClassContextFromTreeNode(node);
    if (!ctx) return;

    e.preventDefault();
    e.stopPropagation();

    openAt(e.clientX, e.clientY, ctx);
  };

  const onDocMouseDown = (e) => {
    if (!isOpen()) return;
    const t = e.target instanceof HTMLElement ? e.target : null;
    if (!t) return;
    if (t.closest(".context-menu") === menuEl) return;
    close();
  };

  const onDocKeyDown = (e) => {
    if (!isOpen()) return;
    if (e.key !== "Escape") return;
    close();
    e.preventDefault();
  };

  const onMenuClick = async (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (!target) return;

    const btn = target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const ctx = currentCtx;
    close();

    if (!ctx) return;

    if (action === "view-properties" && typeof onViewProperties === "function") {
      await onViewProperties(ctx);
    } else if (action === "delete-class" && typeof onDeleteClass === "function") {
      await onDeleteClass(ctx);
    }

    e.preventDefault();
  };

  containerEl.addEventListener("contextmenu", onContainerContextMenu);
  document.addEventListener("mousedown", onDocMouseDown, true);
  document.addEventListener("keydown", onDocKeyDown, true);
  menuEl.addEventListener("click", onMenuClick);

  return {
    destroy: () => {
      containerEl.removeEventListener("contextmenu", onContainerContextMenu);
      document.removeEventListener("mousedown", onDocMouseDown, true);
      document.removeEventListener("keydown", onDocKeyDown, true);
      menuEl.removeEventListener("click", onMenuClick);
      menuEl.remove();
    },
  };
}
