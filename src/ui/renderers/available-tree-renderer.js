/**
 * Available Tree Renderer
 * Renders the left panel tree (available models and profiles)
 */

/**
 * Convert any id value to a canonical string id.
 * @param {string|number|null|undefined} value - Raw id value.
 * @returns {string} Canonical id string (or empty string).
 */
function toIdString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

/**
 * Build canonical model/profile context attributes.
 * @param {{modelId?: string|number, profileId?: string|number}} ctx - Context ids.
 * @returns {string} HTML attributes.
 */
function buildContextDataAttrs(ctx = {}) {
  return `
    data-model-id="${toIdString(ctx.modelId)}"
    data-profile-id="${toIdString(ctx.profileId)}"
  `;
}

/**
 * Build canonical package node attributes per UI_DATA_ATTRIBUTES.md.
 * @param {Object} pkg - Package-like item.
 * @param {{modelId?: string|number, profileId?: string|number, parentPackageId?: string|number}} ctx - Context.
 * @returns {string} HTML attributes.
 */
function buildPackageContractAttrs(pkg, ctx = {}) {
  const packageId = toIdString(pkg?.id);
  const parentPackageId = toIdString(ctx.parentPackageId);

  // Contract marker (diagnostics only)
  const missingPkgIdMarker = packageId ? "" : 'data-contract-missing-package-id="1"';

  return `
    data-type="package"
    data-action="select-package"
    data-package-id="${packageId}"
    data-parent-package-id="${parentPackageId}"
    ${buildContextDataAttrs(ctx)}
    ${missingPkgIdMarker}
  `;
}

/**
 * Build canonical class node attributes per UI_DATA_ATTRIBUTES.md.
 * @param {Object} cls - Class-like item.
 * @param {{modelId?: string|number, profileId?: string|number, packageId?: string|number}} ctx - Context.
 * @returns {string} HTML attributes.
 */
function buildClassContractAttrs(cls, ctx = {}) {
  const classId = toIdString(cls?.id);
  const packageId = toIdString(ctx.packageId);

  const isEnumeration =
    cls?.isEnumeration === true ||
    cls?.type === "enumeration" ||
    String(cls?.stereotype || "").toLowerCase() === "enumeration";

  const isAbstract = cls?.isAbstract === true;
  const action = isEnumeration ? "select-enumeration" : "select-class";

  return `
    data-type="class"
    data-action="${action}"
    data-class-id="${classId}"
    data-package-id="${packageId}"
    data-is-enumeration="${isEnumeration ? "1" : "0"}"
    data-is-abstract="${isAbstract ? "1" : "0"}"
    ${buildContextDataAttrs(ctx)}
  `;
}

function buildItemDataAttrs(item) {
  return `
    data-item-id="${item?.id || ""}"
    data-item-type="${item?.type || ""}"
    data-ref-model-id="${item?.refModelId || ""}"
    data-ref-model-item-id="${item?.refModelItemId || ""}"
  `;
}

function renderRootItem(item, selectedItems, expandedItems, activeItem) {
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
              { ...ctx, parentPackageId: "" }
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
 * @returns {string} HTML string
 */
export function renderAvailableTree(availableData, selectedItems, expandedItems, activeItem) {
  if (! availableData || availableData.length === 0) {
    return '<div class="text-center text-muted">Нет доступных данных</div>';
  }

  return availableData
    .map((item) => renderRootItem(item, selectedItems, expandedItems, activeItem))
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
 * @returns {string} HTML string
 */
export function renderTreeChildren(
  items,
  parentKey,
  side,
  selectedItems,
  expandedItems,
  activeItem,
  context = {}
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
    };

    // ✅ Support both "classes" (from data) and "elements" (legacy)
    const classes = item.classes || [];
    const subPackages = item.subPackages || [];
    const hasChildren = classes.length > 0 || subPackages.length > 0;

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
          const clsChecked = selectedItems.has(clsKey);
          const clsActive = activeItem === clsKey;

          const classLabel = cls.stereotype
            ? `«${cls.stereotype}» ${cls.name}`
            : cls.name;

          html += `
            <div class="tree-item-with-checkbox ${clsActive ?  "tree-item-selected" :  ""}"
                 data-item-key="${clsKey}"
                 data-side="${side}"
               ${buildItemDataAttrs(cls)}
               ${buildClassContractAttrs(cls, { ...ctx, packageId: item?.id ?? "" })}>
              <span class="tree-toggle"> </span>
              <input type="checkbox" class="tree-item-checkbox"
                     ${clsChecked ? "checked" :  ""}
                     data-action="toggle-select">
              <span class="tree-item-label" draggable="true">
                📄 ${classLabel || "Класс"}
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
          { ...ctx, parentPackageId: item?.id ?? "" }
        );
      }

      html += `</div>`;
    }
  });

  return html;
}
