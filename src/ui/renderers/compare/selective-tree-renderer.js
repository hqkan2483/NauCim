import { esc } from "../../../utils/text-utils.js";
import {
  buildPackageContractAttrs,
  buildClassContractAttrs,
} from "../tree-contract-attrs.js";

/**
 * Build generic item metadata attributes used by compare UI.
 * @param {Object} item - Any item.
 * @returns {string} HTML attributes.
 */
function buildItemDataAttrs(item) {
  return `
    data-item-id="${esc(item?.id || "")}" 
    data-item-type="${esc(item?.type || "")}" 
  `;
}

function getTopLevelPackages(objectData) {
  const rootPackages = Array.isArray(objectData?.rootPackages) ? objectData.rootPackages : [];
  if (rootPackages.length === 0) return [];

  // Canonical: RootPackage[] where each root has { name, packages: Package[] }
  const first = rootPackages[0];
  const looksLikeRootPackage =
    first &&
    typeof first === "object" &&
    Array.isArray(first.packages);

  if (looksLikeRootPackage) {
    // Do NOT render synthetic root nodes; render only items that exist in data.
    return rootPackages.flatMap((rp) => (Array.isArray(rp?.packages) ? rp.packages : []));
  }

  // We only support the canonical data structure.
  return [];
}

function getSubPackages(pkgLike) {
  if (!pkgLike || typeof pkgLike !== "object") return [];
  return Array.isArray(pkgLike.subPackages) ? pkgLike.subPackages : [];
}

function getClasses(pkgLike) {
  if (!pkgLike || typeof pkgLike !== "object") return [];
  return Array.isArray(pkgLike.classes) ? pkgLike.classes : [];
}

function makeKey(parts) {
  // Stable delimiter (avoids split-by-hyphen issues). Keys are used in data-key attrs.
  return parts.join("|");
}

function makeItemKey(parentKey, kind, item, fallbackIndex) {
  const id = item?.id;
  const name = item?.name;
  const token =
    id !== undefined && id !== null && String(id) !== ""
      ? `id:${String(id)}`
      : name
        ? `name:${String(name)}`
        : `idx:${String(fallbackIndex)}`;

  return parentKey ? makeKey([parentKey, `${kind}:${token}`]) : makeKey([`${kind}:${token}`]);
}

/**
 * Render selectable tree for object.
 * Returns { html, keyIndex } where keyIndex maps key -> { name, type, data }
 */
export function renderSelectiveTree(objectData, state) {
  const expanded = state?.expandedKeys instanceof Set ? state.expandedKeys : new Set();
  const selected = state?.selectedKeys instanceof Set ? state.selectedKeys : new Set();
  const diffKeys = state?.diffKeys instanceof Set ? state.diffKeys : new Set();
  const side = state?.side || "";
  const isSelectable = side === "one";

  const keyIndex = new Map();
  const topPackages = getTopLevelPackages(objectData);
  const baseKey = makeKey(["obj", String(objectData?.id || "obj")]);

  const ctxBase =
    objectData?.objectType === "model"
      ? { modelId: objectData?.id ?? "", profileId: "" }
      : { modelId: "", profileId: objectData?.id ?? "" };

  let html = "";
  topPackages.forEach((pkg, idx) => {
    const pkgKey = makeItemKey(baseKey, "pkg", pkg, idx);
    html += renderPackage(pkg, pkgKey, "");
  });

  if (!html) {
    html = '<div class="text-center text-muted">Нет данных для отображения</div>';
  }

  return { html, keyIndex };

  function renderPackage(pkg, pkgKey, parentPackageId) {
    const name = esc(pkg?.name || "Без имени");
    const childPkgs = getSubPackages(pkg);
    const classes = getClasses(pkg);

    const hasChildren = childPkgs.length > 0 || classes.length > 0;
    const isExpanded = expanded.has(pkgKey);

    const errorIcon = diffKeys.has(pkgKey)
      ? '<span class="tree-item-error-icon" data-role="diff-icon" title="Обнаружены различия">⚠️</span>'
      : "";

    keyIndex.set(pkgKey, { name: pkg?.name || "Без имени", type: "package", data: pkg });

    let out = `
      <div class="tree-item-with-checkbox"
           data-item-key="${esc(pkgKey)}"
           data-side="${esc(side)}"
           ${buildItemDataAttrs(pkg)}
           ${buildPackageContractAttrs(pkg, {
             ...ctxBase,
             parentPackageId,
           })}>
        <span class="tree-toggle" data-action="toggle-expand">${hasChildren ? (isExpanded ? "▼" : "▶") : " "}</span>
        <input type="checkbox" class="tree-item-checkbox" data-action="toggle-select" ${selected.has(pkgKey) ? "checked" : ""} ${isSelectable ? "" : "disabled"}>
        <span class="tree-item-label" draggable="true">📦 ${name}${errorIcon}</span>
      </div>
    `;

    if (hasChildren) {
      out += `<div class="tree-children ${isExpanded ? "" : "collapsed"}" data-parent="${esc(pkgKey)}">`;

      // Classes first
      classes.forEach((cls, cidx) => {
        const classKey = makeItemKey(pkgKey, "class", cls, cidx);
        const className = esc(cls?.name || "Без имени");
        const classErrorIcon = diffKeys.has(classKey)
          ? '<span class="tree-item-error-icon" data-role="diff-icon" title="Обнаружены различия">⚠️</span>'
          : "";

        keyIndex.set(classKey, { name: cls?.name || "Без имени", type: "class", data: cls });

        out += `
          <div class="tree-item-with-checkbox"
               data-item-key="${esc(classKey)}"
               data-side="${esc(side)}"
               ${buildItemDataAttrs(cls)}
               ${buildClassContractAttrs(cls, {
                 ...ctxBase,
                 packageId: pkg?.id ?? "",
               })}>
            <span class="tree-toggle"> </span>
            <input type="checkbox" class="tree-item-checkbox" data-action="toggle-select" ${selected.has(classKey) ? "checked" : ""} ${isSelectable ? "" : "disabled"}>
            <span class="tree-item-label" draggable="true">📄 ${className}${classErrorIcon}</span>
          </div>
        `;
      });

      // Subpackages
      childPkgs.forEach((p, pidx) => {
        const childKey = makeItemKey(pkgKey, "pkg", p, pidx);
        out += renderPackage(p, childKey, pkg?.id ?? "");
      });

      out += `</div>`;
    }

    return out;
  }
}
