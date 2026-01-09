import { esc } from "../../../utils/text-utils.js";

function buildItemDataAttrs(item) {
  // Keep attribute names consistent with available-tree-renderer.js
  return `
    data-item-id="${esc(item?.id || "")}"
    data-item-type="${esc(item?.type || "")}"
    data-model-id="${esc(item?.modelId || "")}"
    data-profile-id="${esc(item?.profileId || "")}"
    data-ref-model-id="${esc(item?.refModelId || "")}"
    data-ref-model-item-id="${esc(item?.refModelItemId || "")}"
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

  const keyIndex = new Map();
  const topPackages = getTopLevelPackages(objectData);
  const baseKey = makeKey(["obj", String(objectData?.id || "obj")]);

  let html = "";
  topPackages.forEach((pkg, idx) => {
    const pkgKey = makeItemKey(baseKey, "pkg", pkg, idx);
    html += renderPackage(pkg, pkgKey);
  });

  if (!html) {
    html = '<div class="text-center text-muted">Нет данных для отображения</div>';
  }

  return { html, keyIndex };

  function renderPackage(pkg, pkgKey) {
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
      <div class="tree-item-with-checkbox" data-key="${esc(pkgKey)}" ${buildItemDataAttrs(pkg)}>
        <span class="tree-toggle" data-action="toggle-expand" data-key="${esc(pkgKey)}">${hasChildren ? (isExpanded ? "▾" : "▸") : ""}</span>
        <input type="checkbox" class="tree-item-checkbox" data-action="toggle-check" data-key="${esc(pkgKey)}" ${selected.has(pkgKey) ? "checked" : ""}>
        <span class="tree-item-label">📦 ${name}${errorIcon}</span>
      </div>
    `;

    if (hasChildren) {
      out += `<div class="tree-children ${isExpanded ? "" : "collapsed"}" data-children-for="${esc(pkgKey)}">`;

      // Classes first
      classes.forEach((cls, cidx) => {
        const classKey = makeItemKey(pkgKey, "class", cls, cidx);
        const className = esc(cls?.name || "Без имени");
        const classErrorIcon = diffKeys.has(classKey)
          ? '<span class="tree-item-error-icon" data-role="diff-icon" title="Обнаружены различия">⚠️</span>'
          : "";

        keyIndex.set(classKey, { name: cls?.name || "Без имени", type: "class", data: cls });

        out += `
          <div class="tree-item-with-checkbox" data-key="${esc(classKey)}" ${buildItemDataAttrs(cls)}>
            <span class="tree-toggle"></span>
            <input type="checkbox" class="tree-item-checkbox" data-action="toggle-check" data-key="${esc(classKey)}" ${selected.has(classKey) ? "checked" : ""}>
            <span class="tree-item-label">📄 ${className}${classErrorIcon}</span>
          </div>
        `;
      });

      // Subpackages
      childPkgs.forEach((p, pidx) => {
        const childKey = makeItemKey(pkgKey, "pkg", p, pidx);
        out += renderPackage(p, childKey);
      });

      out += `</div>`;
    }

    return out;
  }
}
