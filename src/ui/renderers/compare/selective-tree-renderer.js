import { esc } from "../../../utils/text-utils.js";

function getRootNodes(objectData) {
  const rootPackages = Array.isArray(objectData?.rootPackages) ? objectData.rootPackages : [];
  if (rootPackages.length === 0) return [];

  // Canonical: RootPackage[] where each root has { name, packages: Package[] }
  const first = rootPackages[0];
  const looksLikeRootPackage =
    first &&
    typeof first === "object" &&
    Array.isArray(first.packages);

  if (looksLikeRootPackage) {
    // Render RootPackage as top-level grouping node
    return rootPackages.map((rp) => ({
      _kind: "rootPackage",
      name: rp.name || "Root",
      packages: Array.isArray(rp.packages) ? rp.packages : [],
      raw: rp,
    }));
  }

  // Legacy/test: rootPackages is already an array of packages
  return rootPackages.map((p) => ({
    _kind: "package",
    name: p?.name || "Без имени",
    raw: p,
  }));
}

function getSubPackages(pkgLike) {
  if (!pkgLike || typeof pkgLike !== "object") return [];
  return (
    (Array.isArray(pkgLike.subPackages) && pkgLike.subPackages) ||
    (Array.isArray(pkgLike.children) && pkgLike.children) ||
    (Array.isArray(pkgLike.packages) && pkgLike.packages) ||
    []
  );
}

function getClasses(pkgLike) {
  if (!pkgLike || typeof pkgLike !== "object") return [];
  return (
    (Array.isArray(pkgLike.classes) && pkgLike.classes) ||
    (Array.isArray(pkgLike.elements) && pkgLike.elements) ||
    []
  );
}

function makeKey(parts) {
  // Stable delimiter (no split-by-hyphen issues). Keys are used in data-key attrs.
  return parts.join("|");
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
  const roots = getRootNodes(objectData);

  let html = "";
  roots.forEach((rootNode, idx) => {
    const rootKey = makeKey(["root", String(objectData?.id || "obj"), rootNode._kind, String(idx)]);
    html += renderNode(rootNode, rootKey);
  });

  if (!html) {
    html = '<div class="text-center text-muted">Нет данных для отображения</div>';
  }

  return { html, keyIndex };

  function renderNode(node, nodeKey) {
    if (!node) return "";

    if (node._kind === "rootPackage") {
      const childrenPkgs = node.packages || [];
      const hasChildren = childrenPkgs.length > 0;
      const isExpanded = expanded.has(nodeKey);

      const errorIcon = diffKeys.has(nodeKey)
        ? '<span class="tree-item-error-icon" title="Обнаружены различия">⚠️</span>'
        : "";

      keyIndex.set(nodeKey, { name: node.name, type: "rootPackage", data: node.raw });

      let out = `
        <div class="tree-item-with-checkbox" data-key="${esc(nodeKey)}">
          <span class="tree-toggle" data-action="toggle-expand" data-key="${esc(nodeKey)}">${hasChildren ? (isExpanded ? "▾" : "▸") : ""}</span>
          <input type="checkbox" class="tree-item-checkbox" data-action="toggle-check" data-key="${esc(nodeKey)}" ${selected.has(nodeKey) ? "checked" : ""}>
          <span class="tree-item-label">🧩 ${esc(node.name)}${errorIcon}</span>
        </div>
      `;

      if (hasChildren) {
        out += `<div class="tree-children ${isExpanded ? "" : "collapsed"}" data-children-for="${esc(nodeKey)}">`;
        childrenPkgs.forEach((p, pidx) => {
          const childKey = makeKey([nodeKey, "pkg", String(pidx)]);
          out += renderPackage(p, childKey);
        });
        out += `</div>`;
      }
      return out;
    }

    // Package (canonical or legacy)
    if (node._kind === "package") {
      return renderPackage(node.raw, nodeKey);
    }

    return "";
  }

  function renderPackage(pkg, pkgKey) {
    const name = esc(pkg?.name || pkg?.className || "Без имени");
    const childPkgs = getSubPackages(pkg);
    const classes = getClasses(pkg);

    const hasChildren = childPkgs.length > 0 || classes.length > 0;
    const isExpanded = expanded.has(pkgKey);

    const errorIcon = diffKeys.has(pkgKey)
      ? '<span class="tree-item-error-icon" title="Обнаружены различия">⚠️</span>'
      : "";

    keyIndex.set(pkgKey, { name: pkg?.name || pkg?.className || "Без имени", type: "package", data: pkg });

    let out = `
      <div class="tree-item-with-checkbox" data-key="${esc(pkgKey)}">
        <span class="tree-toggle" data-action="toggle-expand" data-key="${esc(pkgKey)}">${hasChildren ? (isExpanded ? "▾" : "▸") : ""}</span>
        <input type="checkbox" class="tree-item-checkbox" data-action="toggle-check" data-key="${esc(pkgKey)}" ${selected.has(pkgKey) ? "checked" : ""}>
        <span class="tree-item-label">📦 ${name}${errorIcon}</span>
      </div>
    `;

    if (hasChildren) {
      out += `<div class="tree-children ${isExpanded ? "" : "collapsed"}" data-children-for="${esc(pkgKey)}">`;

      // Classes first
      classes.forEach((cls, cidx) => {
        const classKey = makeKey([pkgKey, "class", String(cidx)]);
        const className = esc(cls?.name || cls?.className || "Без имени");
        const classErrorIcon = diffKeys.has(classKey)
          ? '<span class="tree-item-error-icon" title="Обнаружены различия">⚠️</span>'
          : "";

        keyIndex.set(classKey, { name: cls?.name || cls?.className || "Без имени", type: "class", data: cls });

        out += `
          <div class="tree-item-with-checkbox" data-key="${esc(classKey)}">
            <span class="tree-toggle"></span>
            <input type="checkbox" class="tree-item-checkbox" data-action="toggle-check" data-key="${esc(classKey)}" ${selected.has(classKey) ? "checked" : ""}>
            <span class="tree-item-label">📄 ${className}${classErrorIcon}</span>
          </div>
        `;
      });

      // Subpackages
      childPkgs.forEach((p, pidx) => {
        const childKey = makeKey([pkgKey, "pkg", String(pidx)]);
        out += renderPackage(p, childKey);
      });

      out += `</div>`;
    }

    return out;
  }
}
