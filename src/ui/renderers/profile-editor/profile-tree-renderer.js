// /**
//  * Рендер правого дерева (содержимое профиля).
//  * Ожидаемая структура rootPackages: [{ name, type, children, elements }]
//  * Ключи: profile-pkg-{idx}-...-elem-{idx}
//  */
// export function renderProfileTree({ rootPackages, ui }) {
//   const { selectedKeys, expandedKeys, activeKey, filterText = "" } = ui;

//   if (!rootPackages || rootPackages.length === 0) {
//     return `<div class="empty-state">Профиль пуст. Выберите элементы слева и перенесите их в профиль.</div>`;
//   }

//   const html = renderPackages(rootPackages, "profile", {
//     side: "right",
//     selectedKeys,
//     expandedKeys,
//     activeKey,
//     filterText: filterText.toLowerCase(),
//   });

//   return html || `<div class="empty-state">Профиль пуст после фильтра.</div>`;
// }

// function renderPackages(packages, parentKey, ctx) {
//   const { side, selectedKeys, expandedKeys, activeKey, filterText } = ctx;

//   return (packages || [])
//     .map((pkg, idx) => {
//       const pkgKey = `${parentKey}-pkg-${idx}`;
//       const isExpanded = expandedKeys.has(pkgKey);
//       const isChecked = selectedKeys.has(pkgKey);
//       const isActive = activeKey === pkgKey;

//       const name = pkg.name || "Package";
//       const children = pkg.children || [];
//       const elements = pkg.elements || [];
//       const hasChildren = children.length > 0 || elements.length > 0;

//       const selfVisible = matchesFilter(name, filterText);

//       const childrenHtml = renderPackages(children, pkgKey, ctx);
//       const elementsHtml = elements
//         .map((elem, elemIdx) => renderElement(elem, `${pkgKey}-elem-${elemIdx}`, ctx))
//         .filter(Boolean)
//         .join("");

//       const hasVisibleChildren = !!(childrenHtml || elementsHtml);

//       if (!selfVisible && !hasVisibleChildren) return "";

//       return `
//         <div class="tree-item-with-checkbox ${isActive ? "tree-item-selected" : ""}"
//              data-pe="tree-item" data-side="${side}" data-key="${pkgKey}">
//           <span class="tree-toggle" data-action="tree-toggle-expand">
//             ${hasChildren ? (isExpanded ? "▼" : "▶") : " "}
//           </span>
//           <input type="checkbox" class="tree-item-checkbox" data-action="tree-toggle-check"
//                  ${isChecked ? "checked" : ""} />
//           <span class="tree-item-label">📦 ${escapeHtml(name)}</span>
//         </div>
//         ${
//           hasChildren
//             ? `<div class="tree-children ${isExpanded ? "" : "collapsed"}">${childrenHtml}${elementsHtml}</div>`
//             : ""
//         }
//       `;
//     })
//     .join("");
// }

// function renderElement(elem, key, ctx) {
//   const { side, selectedKeys, activeKey, filterText } = ctx;
//   const name = elem.name || "Class";
//   if (!matchesFilter(name, filterText)) return "";

//   const isChecked = selectedKeys.has(key);
//   const isActive = activeKey === key;

//   return `
//     <div class="tree-item-with-checkbox ${isActive ? "tree-item-selected" : ""}"
//          data-pe="tree-item" data-side="${side}" data-key="${key}">
//       <span class="tree-toggle"> </span>
//       <input type="checkbox" class="tree-item-checkbox" data-action="tree-toggle-check"
//              ${isChecked ? "checked" : ""} />
//       <span class="tree-item-label">📄 ${escapeHtml(name)}</span>
//     </div>
//   `;
// }

// function matchesFilter(name = "", filter = "") {
//   if (!filter) return true;
//   return name.toLowerCase().includes(filter);
// }

// function escapeHtml(str = "") {
//   return String(str)
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }
