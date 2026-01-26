/**
 * Editor-tree context menu (UI component)
 *
 * Designed for trees rendered with `.tree-item-with-checkbox[data-item-key]` nodes
 * and canonical UI_DATA_ATTRIBUTES.md `data-*` attributes (`data-type`, ids, context ids).
 *
 * Responsibilities:
 * - Show a custom context menu on right-click for package/diagram nodes
 * - Close on ESC and outside click
 * - Extract context from DOM only (no tree traversal)
 * - Delegate business logic via callbacks
 */

/**
 * @typedef {object} PackageMenuContext
 * @property {"package"} type
 * @property {string} packageId
 * @property {string|null} parentPackageId
 * @property {string} modelId
 * @property {string} profileId
 */

/**
 * @typedef {object} DiagramMenuContext
 * @property {"diagram"} type
 * @property {string} diagramId
 * @property {string} packageId
 * @property {string} modelId
 * @property {string} profileId
 */

function clampToViewport({ x, y, width, height, padding = 8 }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.max(padding, Math.min(x, vw - width - padding));
  const top = Math.max(padding, Math.min(y, vh - height - padding));
  return { left, top };
}

/**
 * @param {HTMLElement} node
 * @returns {PackageMenuContext|null}
 */
function getPackageCtx(node) {
  if (!(node instanceof HTMLElement)) return null;

  const packageId = node.getAttribute("data-package-id") || "";
  if (!packageId) return null;

  const modelId = node.getAttribute("data-model-id") || "";
  const profileId = node.getAttribute("data-profile-id") || "";

  const parentRaw = node.getAttribute("data-parent-package-id") || "";
  const parentPackageId = parentRaw ? parentRaw : null;

  return { type: "package", packageId, parentPackageId, modelId, profileId };
}

/**
 * @param {HTMLElement} node
 * @returns {DiagramMenuContext|null}
 */
function getDiagramCtx(node) {
  if (!(node instanceof HTMLElement)) return null;

  const diagramId = node.getAttribute("data-diagram-id") || "";
  const packageId = node.getAttribute("data-package-id") || "";
  if (!diagramId || !packageId) return null;

  const modelId = node.getAttribute("data-model-id") || "";
  const profileId = node.getAttribute("data-profile-id") || "";

  return { type: "diagram", diagramId, packageId, modelId, profileId };
}

function buildMenuEl() {
  const el = document.createElement("div");
  el.className = "context-menu hidden";
  el.setAttribute("role", "menu");
  el.innerHTML = `
    <button type="button" class="context-menu__item" data-action="create-package" role="menuitem">Создать пакет</button>
    <button type="button" class="context-menu__item" data-action="create-diagram" role="menuitem">Создать диаграмму</button>
    <div class="context-menu__sep" role="separator"></div>
    <button type="button" class="context-menu__item context-menu__item--danger" data-action="delete" role="menuitem">Удалить</button>
  `;
  document.body.appendChild(el);
  return el;
}

/**
 * Initialize right-click context menu for editor-tree nodes.
 *
 * @param {HTMLElement} containerEl Container that holds the rendered tree.
 * @param {object} callbacks
 * @param {(ctx: PackageMenuContext) => void|Promise<void>} [callbacks.onCreatePackage]
 * @param {(ctx: PackageMenuContext) => void|Promise<void>} [callbacks.onCreateDiagram]
 * @param {(ctx: PackageMenuContext) => void|Promise<void>} [callbacks.onDeletePackage]
 * @param {(ctx: DiagramMenuContext) => void|Promise<void>} [callbacks.onDeleteDiagram]
 * @returns {{ destroy: () => void }}
 */
export function initEditorTreeContextMenu(
  containerEl,
  { onCreatePackage, onCreateDiagram, onDeletePackage, onDeleteDiagram } = {}
) {
  if (!(containerEl instanceof HTMLElement)) {
    throw new TypeError("initEditorTreeContextMenu expects containerEl HTMLElement");
  }

  const menuEl = buildMenuEl();

  /** @type {PackageMenuContext|DiagramMenuContext|null} */
  let currentCtx = null;

  const isOpen = () => !menuEl.classList.contains("hidden");

  const close = () => {
    currentCtx = null;
    menuEl.classList.add("hidden");
  };

  const setVisibleForType = (type) => {
    const isPkg = type === "package";

    menuEl
      .querySelector('[data-action="create-package"]')
      ?.classList.toggle("hidden", !isPkg);

    menuEl
      .querySelector('[data-action="create-diagram"]')
      ?.classList.toggle("hidden", !isPkg);

    // Separator should only show for package (it groups create vs delete)
    menuEl.querySelector(".context-menu__sep")?.classList.toggle("hidden", !isPkg);
  };

  const openAt = (x, y, ctx) => {
    currentCtx = ctx;
    setVisibleForType(ctx.type);

    menuEl.classList.remove("hidden");

    // Measure after opening to clamp properly.
    const rect = menuEl.getBoundingClientRect();
    const pos = clampToViewport({ x, y, width: rect.width, height: rect.height });
    menuEl.style.left = `${pos.left}px`;
    menuEl.style.top = `${pos.top}px`;

    menuEl.querySelector(".context-menu__item:not(.hidden)")?.focus();
  };

  const onContainerContextMenu = (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (!target) return;

    const node = target.closest('.tree-item-with-checkbox[data-type]');
    if (!(node instanceof HTMLElement)) return;

    const type = node.getAttribute("data-type") || "";
    if (type !== "package" && type !== "diagram") return;

    const ctx = type === "package" ? getPackageCtx(node) : getDiagramCtx(node);
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

    const action = btn.getAttribute("data-action") || "";
    const ctx = currentCtx;

    close();

    if (!ctx) return;

    if (ctx.type === "package") {
      if (action === "create-package" && typeof onCreatePackage === "function") {
        await onCreatePackage(ctx);
      } else if (action === "create-diagram" && typeof onCreateDiagram === "function") {
        await onCreateDiagram(ctx);
      } else if (action === "delete" && typeof onDeletePackage === "function") {
        await onDeletePackage(ctx);
      }
    } else if (ctx.type === "diagram") {
      if (action === "delete" && typeof onDeleteDiagram === "function") {
        await onDeleteDiagram(ctx);
      }
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
