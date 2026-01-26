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
 * Tooltip message shown for disabled class checkboxes.
 * @returns {string}
 */
function getDisabledClassTooltip() {
  return "Класс уже включён в профиль";
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
 * @param {{ disabledClassNames?: Set<string> }} [options]
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
 * @param {{ disabledClassNames?: Set<string> }} [options] - Extra rendering options.
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
          const disabledClassNames = options?.disabledClassNames;
          const isDisabled =
            side === "left" &&
            disabledClassNames instanceof Set &&
            disabledClassNames.has(normalizeClassName(cls?.name));

          const disabledTooltip = isDisabled ? getDisabledClassTooltip() : "";

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
