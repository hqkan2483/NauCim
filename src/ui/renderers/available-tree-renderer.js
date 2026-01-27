/**
 * Available Tree Renderer
 * Renders the left panel tree (available models and profiles)
 */

import {
  buildContextDataAttrs,
  buildPackageContractAttrs,
  buildClassContractAttrs,
  buildDiagramContractAttrs,
} from "./tree-contract-attrs.js";

/**
 * Normalize a class name for safe comparisons.
 *
 * This is intentionally small and renderer-local: the controller/service layer
 * provides the canonical set of already-in-profile names, while the renderer
 * normalizes current node labels for lookup.
 *
 * @param {string} name
 * @returns {string}
 */
function normalizeClassName(name) {
  return String(name ?? "").trim().toLowerCase();
}

/**
 * Profile inclusion state of a left-tree class relative to the current profile.
 *
 * @typedef {"not-in-profile" | "in-profile" | "in-profile-other-model"} LeftClassProfileState
 */

/**
 * Tooltip message shown for disabled class checkboxes.
 *
 * @param {LeftClassProfileState} state
 * @returns {string}
 */
function getDisabledClassTooltip(state) {
  if (state === "in-profile") return "Класс уже включён в профиль";
  if (state === "in-profile-other-model") {
    return "В профиле уже есть класс с таким именем (из другой модели)";
  }
  return "";
}

/**
 * Resolve profile inclusion state for a class node rendered in the LEFT tree.
 *
 * A class is:
 * - not-in-profile: no class with that name exists in the profile
 * - in-profile: profile contains a class with the same name AND matching refModelId/refModelItemId
 * - in-profile-other-model: profile contains a class with the same name, but ref ids do not match
 *
 * @param {any} cls
 * @param {{ modelId?: string }} ctx
 * @param {{
 *   profileClassRefIndex?: Map<string, Array<{ refModelId: string, refModelItemId: string }>>,
 *   disabledClassNames?: Set<string>
 * }} options
 * @returns {LeftClassProfileState}
 */
function resolveLeftClassProfileState(cls, ctx, options = {}) {
  const nameKey = normalizeClassName(cls?.name);
  if (!nameKey) return "not-in-profile";

  const index = options?.profileClassRefIndex;
  if (index instanceof Map && index.has(nameKey)) {
    const entries = Array.isArray(index.get(nameKey)) ? index.get(nameKey) : [];
    const leftModelId = String(ctx?.modelId ?? "").trim();
    const leftItemId = String(cls?.id ?? "").trim();

    const exactMatch = entries.some((e) => {
      const refModelId = String(e?.refModelId ?? "").trim();
      const refModelItemId = String(e?.refModelItemId ?? "").trim();
      return Boolean(refModelId && refModelItemId && refModelId === leftModelId && refModelItemId === leftItemId);
    });

    return exactMatch ? "in-profile" : "in-profile-other-model";
  }

  // Backward compatible fallback: if we only have a name set, treat as included.
  const disabledNames = options?.disabledClassNames;
  if (disabledNames instanceof Set && disabledNames.has(nameKey)) {
    return "in-profile";
  }

  return "not-in-profile";
}

function buildItemDataAttrs(item) {
  return `
    data-item-id="${item?.id || ""}"
    data-item-type="${item?.type || ""}"
  `;
}

function renderRootItem(item, selectedItems, expandedItems, activeItem, options = {}) {
  const itemKey = `left-${item.type}-${item.id}`;
  const isChecked = selectedItems.has(itemKey);
  const isExpanded = expandedItems.has(itemKey);
  const isActive = activeItem === itemKey;
  const icon = item.type === "model" ? "📋" : "⚙️";
  const hasChildren = item.children && item.children.length > 0;

  const ctx =
    item.type === "model"
      ? { modelId: item.id, profileId: "" }
      : { modelId: "", profileId: item.id };

  return `
    <div class="tree-item-with-checkbox ${isActive ? "tree-item-selected" : ""}"
         data-item-key="${itemKey}"
         ${buildItemDataAttrs(item)}
         ${buildContextDataAttrs(ctx)}>
      <span class="tree-toggle" data-action="toggle-expand">
        ${hasChildren ? (isExpanded ? "▼" : "▶") : " "}
      </span>
      <input type="checkbox" class="tree-item-checkbox"
             ${isChecked ? "checked" : ""}
             data-action="toggle-select">
      <span class="tree-item-label" draggable="true">
        ${icon} ${item.name} ${item.type === "model" ? "(Модель)" : "(Профиль)"}
      </span>
    </div>
    ${
      hasChildren
        ? `<div class="tree-children ${isExpanded ? "" : "collapsed"}" data-parent="${itemKey}">
            ${renderTreeChildren(
              item.children,
              itemKey,
              "left",
              selectedItems,
              expandedItems,
              activeItem,
              { ...ctx, parentPackageId: "" },
              options
            )}
          </div>`
        : ""
    }
  `;
}

/**
 * Render available models and profiles tree
 * @param {Array} availableData - Available data
 * @param {Set} selectedItems - Selected items
 * @param {Set} expandedItems - Expanded items
 * @param {string} activeItem - Active item key
 * @param {{
 *  disabledClassNames?: Set<string>,
 *  profileClassRefIndex?: Map<string, Array<{ refModelId: string, refModelItemId: string }>>
 * }} [options]
 * @returns {string} HTML string
 */
export function renderAvailableTree(
  availableData,
  selectedItems,
  expandedItems,
  activeItem,
  options = {}
) {
  if (! availableData || availableData.length === 0) {
    return '<div class="text-center text-muted">Нет доступных данных</div>';
  }

  return availableData
    .map((item) => renderRootItem(item, selectedItems, expandedItems, activeItem, options))
    .join("");
}

/**
 * Render tree children recursively
 * @param {Array} items - Child items
 * @param {string} parentKey - Parent item key
 * @param {string} side - "left" or "right"
 * @param {Set} selectedItems - Selected items
 * @param {Set} expandedItems - Expanded items
 * @param {string} activeItem - Active item key
 * @param {object} context - Rendering context (model/profile ids, parent ids, flags)
 * @param {{
 *   disabledClassNames?: Set<string>,
 *   profileClassRefIndex?: Map<string, Array<{ refModelId: string, refModelItemId: string }>>
 * }} [options] - Extra rendering options.
 * @returns {string} HTML string
 */
export function renderTreeChildren(
  items,
  parentKey,
  side,
  selectedItems,
  expandedItems,
  activeItem,
  context = {},
  options = {}
) {
  let html = "";

  if (! items || ! Array.isArray(items)) {
    return html;
  }

  items.forEach((item, index) => {
    const itemKey = `${parentKey}-pkg-${index}`;
    const isChecked = selectedItems.has(itemKey);
    const isExpanded = expandedItems.has(itemKey);
    const isActive = activeItem === itemKey;

    const ctx = {
      modelId: context?.modelId ?? item?.modelId ?? "",
      profileId: context?.profileId ?? item?.profileId ?? "",
      parentPackageId: context?.parentPackageId ?? "",
      includeDiagrams: context?.includeDiagrams === true,
    };

    // ✅ Support both "classes" (from data) and "elements" (legacy)
    const classes = item.classes || [];
    const subPackages = item.subPackages || [];
    const includeDiagrams = ctx.includeDiagrams === true;
    const diagrams = includeDiagrams ? item.diagrams || [] : [];
    const hasChildren = classes.length > 0 || subPackages.length > 0 || diagrams.length > 0;

    html += `
      <div class="tree-item-with-checkbox ${isActive ? "tree-item-selected" : ""}"
           data-item-key="${itemKey}"
           data-side="${side}"
           ${buildItemDataAttrs(item)}
           ${buildPackageContractAttrs(item, ctx)}>
        <span class="tree-toggle" data-action="toggle-expand">
          ${hasChildren ? (isExpanded ? "▼" : "▶") : " "}
        </span>
        <input type="checkbox" class="tree-item-checkbox"
               ${isChecked ? "checked" :  ""}
               data-action="toggle-select">
        <span class="tree-item-label" draggable="true">
          📦 ${item.name || "Пакет"}
        </span>
      </div>
    `;

    if (hasChildren) {
      html += `<div class="tree-children ${isExpanded ? "" : "collapsed"}" data-parent="${itemKey}">`;

      // ✅ Render classes with "cls" key (not "elem")
      if (classes.length > 0) {
        classes.forEach((cls, clsIndex) => {
          const clsKey = `${itemKey}-cls-${clsIndex}`; // ✅ Use "cls"
          /** @type {LeftClassProfileState} */
          const profileState =
            side === "left" ? resolveLeftClassProfileState(cls, ctx, options) : "not-in-profile";

          // Checkboxes are enabled only for classes fully absent in the profile.
          const isDisabled = side === "left" && profileState !== "not-in-profile";
          const disabledTooltip = isDisabled ? getDisabledClassTooltip(profileState) : "";

          // Disabled nodes are explicitly not selectable.
          const clsChecked = !isDisabled && selectedItems.has(clsKey);
          const clsActive = activeItem === clsKey;

          const classLabel = cls.stereotype
            ? `«${cls.stereotype}» ${cls.name}`
            : cls.name;

          html += `
            <div class="tree-item-with-checkbox ${clsActive ?  "tree-item-selected" :  ""} ${isDisabled ? "tree-item-with-checkbox--disabled" : ""}"
                 data-item-key="${clsKey}"
                 data-side="${side}"
                 ${side === "left" ? `data-profile-class-state="${profileState}"` : ""}
                 ${disabledTooltip ? `title="${disabledTooltip}"` : ""}
               ${buildItemDataAttrs(cls)}
               ${buildClassContractAttrs(cls, { ...ctx, packageId: item?.id ?? "" })}>
              <span class="tree-toggle"> </span>
              <input type="checkbox" class="tree-item-checkbox"
                     ${clsChecked ? "checked" :  ""}
                     ${isDisabled ? "disabled" : ""}
                     ${disabledTooltip ? `title="${disabledTooltip}"` : ""}
                     data-action="toggle-select">
              <span class="tree-item-label" draggable="true">
                📄 ${classLabel || "Класс"}
              </span>
            </div>
          `;
        });
      }

      // ✅ Render diagrams (optional)
      if (diagrams.length > 0) {
        diagrams.forEach((diagram, dIndex) => {
          const diaKey = `${itemKey}-dia-${dIndex}`;
          const diaChecked = selectedItems.has(diaKey);
          const diaActive = activeItem === diaKey;

          const name = diagram?.diagramName || "Диаграмма";
          const type = diagram?.diagramType || "";
          const label = type ? `📐 ${name} (${type})` : `📐 ${name}`;

          html += `
            <div class="tree-item-with-checkbox ${diaActive ? "tree-item-selected" : ""}"
                 data-item-key="${diaKey}"
                 data-side="${side}"
                 ${buildItemDataAttrs(diagram)}
                 ${buildDiagramContractAttrs(diagram, { ...ctx, packageId: item?.id ?? "" })}>
              <span class="tree-toggle"> </span>
              <input type="checkbox" class="tree-item-checkbox"
                     ${diaChecked ? "checked" : ""}
                     data-action="toggle-select">
              <span class="tree-item-label" draggable="true">
                ${label}
              </span>
            </div>
          `;
        });
      }

      // Render sub-packages recursively
      if (subPackages.length > 0) {
        html += renderTreeChildren(
          subPackages,
          itemKey,
          side,
          selectedItems,
          expandedItems,
          activeItem,
          { ...ctx, parentPackageId: item?.id ?? "" },
          options
        );
      }

      html += `</div>`;
    }
  });

  return html;
}
