/**
 * Available Tree Renderer
 * Renders the left panel tree (available models and profiles)
 */

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

  let html = "";

  availableData.forEach((item) => {
    const itemKey = `left-${item.type}-${item.id}`;
    const isChecked = selectedItems.has(itemKey);
    const isExpanded = expandedItems.has(itemKey);
    const isActive = activeItem === itemKey;
    const icon = item.type === "model" ? "📋" : "⚙️";
    const hasChildren = item.children && item.children.length > 0;

    html += `
      <div class="tree-item-with-checkbox ${isActive ? "tree-item-selected" : ""}"
           data-item-key="${itemKey}"
           data-item-id="${item.id || ""}"
           data-item-type="${item.type || ""}"
           data-model-id="${item.modelId || ""}"
           data-profile-id="${item.profileId || ""}"
           data-ref-model-id="${item.refModelId || ""}"
           data-ref-model-item-id="${item.refModelItemId || ""}">
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
    `;

    // ✅ ALWAYS render children, control visibility with CSS
    if (hasChildren) {
      html += `<div class="tree-children ${isExpanded ? "" : "collapsed"}" data-parent="${itemKey}">`;
      html += renderTreeChildren(item.children, itemKey, "left", selectedItems, expandedItems, activeItem);
      html += `</div>`;
    }
  });

  return html;
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
export function renderTreeChildren(items, parentKey, side, selectedItems, expandedItems, activeItem) {
  let html = "";

  if (! items || ! Array.isArray(items)) {
    return html;
  }

  items.forEach((item, index) => {
    const itemKey = `${parentKey}-pkg-${index}`;
    const isChecked = selectedItems.has(itemKey);
    const isExpanded = expandedItems.has(itemKey);
    const isActive = activeItem === itemKey;

    // ✅ Support both "classes" (from data) and "elements" (legacy)
    const classes = item.classes || [];
    const subPackages = item.subPackages || [];
    const hasChildren = classes.length > 0 || subPackages.length > 0;

    html += `
      <div class="tree-item-with-checkbox ${isActive ? "tree-item-selected" : ""}"
           data-item-key="${itemKey}"
           data-side="${side}"
           data-item-id="${item.id || ""}"
           data-item-type="${item.type || ""}"
           data-model-id="${item.modelId || ""}"
           data-profile-id="${item.profileId || ""}"
           data-ref-model-id="${item.refModelId || ""}"
           data-ref-model-item-id="${item.refModelItemId || ""}"
           >
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
                 data-item-id="${cls.id || ""}"
           data-item-type="${cls.type || ""}"
           data-model-id="${cls.modelId || ""}"
           data-profile-id="${cls.profileId || ""}"
           data-ref-model-id="${cls.refModelId || ""}"
           data-ref-model-item-id="${cls.refModelItemId || ""}">
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
        html += renderTreeChildren(subPackages, itemKey, side, selectedItems, expandedItems, activeItem);
      }

      html += `</div>`;
    }
  });

  return html;
}
