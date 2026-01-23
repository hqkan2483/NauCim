/**
 * Project Tree Renderer
 * Renders hierarchical project structure (models/profiles with packages/classes)
 * ALL nodes are rendered, visibility controlled by CSS
 */

import { buildTitleAttribute } from "../../utils/title-attribute-builder.js";
import { TREE_STORAGE_KEYS } from "../trees/tree-storage-keys.js";

/**
 * Render full project tree
 */
function renderProjectTree(project, projectId) {
  if (!project) return '<div class="no-items text-muted">Проект не найден</div>';

  const expandedProjects = JSON.parse(
    localStorage.getItem(TREE_STORAGE_KEYS.expandedProjects) || "{}"
  );
  const isExpanded = expandedProjects[projectId];

  let html = `
    <div class="project-tree-item">
      <div class="project-tree-header active">
        <button class="project-expand-btn"
                data-project-id="${projectId}"
                data-action="toggle-project"
                aria-expanded="${isExpanded ?  "true" : "false"}">
          <span class="tree-expand-icon">${isExpanded ? "▼" : "▶"}</span>
        </button>
        <span class="project-name" title="${project.name}">
          📦 ${project.name}
        </span>
      </div>
  `;

  // ✅ Always render structure, control visibility with CSS
  const structureClass = isExpanded ? "" : "hidden";
  html += `<div class="project-structure ${structureClass}">`;

  // Render Models
  if (project.models && project.models.length > 0) {
    html += `
      <div class="structure-section">
        <div class="structure-title">📋 Модели (${project.models.length})</div>
        <div class="structure-items">
    `;

    project.models.forEach((m, idx) => {
      html += renderModelTree(m, projectId, idx);
    });

    html += `
        </div>
      </div>
    `;
  }

  // Render Profiles
  if (project.profiles && project.profiles.length > 0) {
    html += `
      <div class="structure-section">
        <div class="structure-title">⚙️ Профили (${project.profiles.length})</div>
        <div class="structure-items">
    `;

    project.profiles.forEach((p, idx) => {
      html += renderProfileTree(p, projectId, idx);
    });

    html += `
        </div>
      </div>
    `;
  }

  // No items message
  if (
    (! project.models || project.models.length === 0) &&
    (!project.profiles || project.profiles.length === 0)
  ) {
    html += `<div class="structure-empty">Нет моделей и профилей</div>`;
  }

  html += `</div>`; // project-structure
  html += `</div>`; // project-tree-item
  return html;
}

/**
 * Render model tree
 */
function renderModelTree(model, projectId, index) {
  const expandedItems = JSON.parse(
    localStorage.getItem(TREE_STORAGE_KEYS.expandedTreeItems) || "{}"
  );
  const itemId = `model-${projectId}-${model.id}`;
  const isExpanded = expandedItems[itemId];

  const hasChildren =
    model.rootPackages &&
    model.rootPackages.length > 0 &&
    model.rootPackages[0].packages &&
    model.rootPackages[0].packages.length > 0;

  let html = `
    <div class="tree-structure-item">
      <div class="tree-structure-header">
        <button class="tree-expand-btn"
                data-item-id="${itemId}"
                data-action="toggle-tree-item"
                aria-expanded="${isExpanded ? "true" : "false"}">
          <span class="tree-expand-icon">${isExpanded ? "▼" : "▶"}</span>
        </button>
        <span class="tree-structure-name"
              data-type="model"
              data-model-id="${model.id}"
              data-action="select-model"
              title="${model.description || model.name || ''}">
          ${model.name || "Модель без названия"}
        </span>
      </div>
  `;

  // ✅ Always render children, control visibility with CSS
  if (hasChildren) {
    const childrenClass = isExpanded ?  "" : "hidden";
    html += `<div class="tree-structure-children ${childrenClass}">`;

    const rootPackage = model.rootPackages[0];
    if (rootPackage.packages) {
      rootPackage.packages.forEach((pkg, idx) => {
        html += renderPackageTree(pkg, `${itemId}-pkg-${idx}`, model.id);
      });
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render profile tree
 */
function renderProfileTree(profile, projectId, index) {
  const expandedItems = JSON.parse(
    localStorage.getItem(TREE_STORAGE_KEYS.expandedTreeItems) || "{}"
  );
  const itemId = `profile-${projectId}-${profile.id}`;
  const isExpanded = expandedItems[itemId];

  const hasChildren =
    profile.rootPackages &&
    profile.rootPackages.length > 0 &&
    profile.rootPackages[0].packages &&
    profile.rootPackages[0].packages.length > 0;

  let html = `
    <div class="tree-structure-item">
      <div class="tree-structure-header">
        <button class="tree-expand-btn"
                data-item-id="${itemId}"
                data-action="toggle-tree-item"
                aria-expanded="${isExpanded ? "true" : "false"}">
          <span class="tree-expand-icon">${isExpanded ? "▼" : "▶"}</span>
        </button>
        <span class="tree-structure-name"
              data-type="profile"
              data-profile-id="${profile.id}"
              data-action="select-profile"
              title="${profile.description || profile.name || ''}">
          ${profile.name || "Профиль без названия"}
        </span>
      </div>
  `;

  // ✅ Always render children, control visibility with CSS
  if (hasChildren) {
    const childrenClass = isExpanded ? "" : "hidden";
    html += `<div class="tree-structure-children ${childrenClass}">`;

    const rootPackage = profile.rootPackages[0];
    if (rootPackage.packages) {
      rootPackage.packages.forEach((pkg, idx) => {
        html += renderPackageTree(pkg, `${itemId}-pkg-${idx}`, null, profile.id);
      });
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render package tree
 */
function renderPackageTree(pkg, itemId, modelId = null, profileId = null) {
  const expandedItems = JSON.parse(
    localStorage.getItem(TREE_STORAGE_KEYS.expandedTreeItems) || "{}"
  );
  const isExpanded = expandedItems[itemId];
  const hasChildren =
    (pkg.subPackages && pkg.subPackages.length > 0) ||
    (pkg.classes && pkg.classes.length > 0) ||
    (pkg.diagrams && pkg.diagrams.length > 0);

  let html = `
    <div class="tree-structure-item">
      <div class="tree-structure-header">
  `;

  if (hasChildren) {
    html += `
      <button class="tree-expand-btn"
              data-item-id="${itemId}"
              data-action="toggle-tree-item"
              aria-expanded="${isExpanded ? "true" : "false"}">
        <span class="tree-expand-icon">${isExpanded ?  "▼" : "▶"}</span>
      </button>
    `;
  } else {
    html += `<span class="tree-expand-spacer"></span>`;
  }

  html += `
        <span class="tree-structure-name"
              data-type="package"
              data-package-id="${pkg.id || ""}"
            data-parent-package-id="${pkg.parentPackageId || ""}"
              data-model-id="${pkg.modelId || ""}"
              data-profile-id="${pkg.profileId || ""}"
              data-action="select-package"
              title="${buildTitleAttribute(pkg.documentation, pkg.documentationRu, pkg.name)}">
          ${pkg.name || "Пакет без названия"}
        </span>
      </div>
  `;

  // ✅ Always render children, control visibility with CSS
  if (hasChildren) {
    const childrenClass = isExpanded ? "" : "hidden";
    html += `<div class="tree-structure-children ${childrenClass}">`;

    // Render subpackages first
    if (pkg.subPackages && pkg.subPackages.length > 0) {
      pkg.subPackages.forEach((subPkg, idx) => {
        html += renderPackageTree(subPkg, `${itemId}-sub-${idx}`, modelId, profileId);
      });
    }

    // Then render classes
    if (pkg.classes && pkg.classes.length > 0) {
      pkg.classes.forEach((cls, idx) => {
        html += renderClassTree(cls, `${itemId}-cls-${idx}`, modelId, profileId);
      });
    }

    // Then render diagrams
    if (pkg.diagrams && pkg.diagrams.length > 0) {
      pkg.diagrams.forEach((d, idx) => {
        html += renderDiagramTree(d, `${itemId}-dia-${idx}`, modelId, profileId);
      });
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render diagram tree (leaf node).
 *
 * Important UI contract:
 * - `data-package-id` is the diagram's parent package id.
 * - Source of truth is the export payload: `diagram.packageId` (filled from Prisma).
 * Contract: `diagram.packageId` must be present in the export payload.
 */
function renderDiagramTree(
  diagram,
  itemId,
  modelId = null,
  profileId = null
) {
  const name = diagram?.diagramName || "Диаграмма";
  const type = diagram?.diagramType || "";

  const label = type ? `📐 ${name} (${type})` : `📐 ${name}`;

  return `
    <div class="tree-structure-item">
      <div class="tree-structure-header">
        <span class="tree-expand-spacer"></span>
        <span class="tree-structure-name"
              data-type="diagram"
              data-diagram-id="${diagram?.id || ""}"
            data-package-id="${diagram?.packageId || ""}"
            data-contract-missing-package-id="${diagram?.packageId ? "" : "1"}"
              data-model-id="${modelId || ""}"
              data-profile-id="${profileId || ""}"
              data-action="select-diagram"
              title="${buildTitleAttribute(diagram?.documentation, null, name)}">
          ${label}
        </span>
      </div>
    </div>
  `;
}

/**
 * Render class tree.
 *
 * Important UI contract:
 * - `data-package-id` is the class's parent package id.
 * - Source of truth is the export payload: `cls.packageId` (filled from Prisma).
 * Contract: `cls.packageId` must be present in the export payload.
 */
function renderClassTree(
  cls,
  itemId,
  modelId = null,
  profileId = null
) {
  const expandedItems = JSON.parse(
    localStorage.getItem(TREE_STORAGE_KEYS.expandedTreeItems) || "{}"
  );
  const isExpanded = expandedItems[itemId];

  // ✅ Class has children if it has attributes, links, OR literals
  const hasChildren =
    (cls.attributes && cls.attributes.length > 0) ||
    (cls.links && cls.links.length > 0) ||
    (cls.literals && cls.literals.length > 0); // ✅ Added literals

  const isEnumeration = cls.type === "Enumeration";
  const isAbstract = cls.isAbstract;

  let className = cls.name || "Класс без названия";
  if (cls.stereotype) {
    className = `«${cls.stereotype}» ${className}`;
  }

  let html = `
    <div class="tree-structure-item">
      <div class="tree-structure-header">
  `;

  if (hasChildren) {
    html += `
      <button class="tree-expand-btn"
              data-item-id="${itemId}"
              data-action="toggle-tree-item"
              aria-expanded="${isExpanded ?  "true" : "false"}">
        <span class="tree-expand-icon">${isExpanded ? "▼" : "▶"}</span>
      </button>
    `;
  } else {
    html += `<span class="tree-expand-spacer"></span>`;
  }

  html += `
        <span class="tree-structure-name"
              data-type="class"
              data-class-id="${cls.id || ""}"
              data-package-id="${cls.packageId || ""}"
              data-contract-missing-package-id="${cls.packageId ? "" : "1"}"
              data-model-id="${modelId || ""}"
              data-ref-model-id="${cls.refModelId || ""}"
              data-ref-model-item-id="${cls.refModelItemId || ""}"
              data-profile-id="${profileId || ""}"
              data-is-enumeration="${isEnumeration}"
              data-is-abstract="${isAbstract}"
            data-action="${isEnumeration ? "select-enumeration" : "select-class"}"
              title="${buildTitleAttribute(cls.documentation, cls.documentationRu, cls.name)}">
          ${className}
        </span>
      </div>
  `;

  if (hasChildren) {
    const childrenClass = isExpanded ? "" : "hidden";
    html += `<div class="tree-structure-children ${childrenClass}">`;

    // ✅ For Enumeration:  render ONLY literals
    if (isEnumeration && cls.literals && cls.literals.length > 0) {
      cls.literals.forEach((literal, idx) => {
        html += renderLiteralTree(literal, `${itemId}-lit-${idx}`, cls.id, modelId, profileId);
      });
    }

    // ✅ For regular classes: render attributes and links
    if (! isEnumeration) {
      // Render attributes
      if (cls.attributes && cls.attributes.length > 0) {
        cls.attributes.forEach((attr, idx) => {
          html += renderAttributeTree(attr, `${itemId}-attr-${idx}`, cls.id, modelId, profileId);
        });
      }

      // Render links
      if (cls.links && cls.links.length > 0) {
        cls.links.forEach((link, idx) => {
          html += renderLinkTree(link, `${itemId}-link-${idx}`, cls.id, modelId, profileId);
        });
      }
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render attribute tree (leaf node).
 *
 * Data/UI contract:
 * - Renders `data-class-id` for the attribute's parent class.
 * - `attr.classId` is preferred (canonical export contract).
 * - `parentClassId` is a renderer fallback for legacy payloads.
 */
function renderAttributeTree(attr, itemId, parentClassId, modelId = null, profileId = null) {
  const classId = attr?.classId || parentClassId || "";
  let attrName = attr.name || "Атрибут";
  if (attr.stereotype) {
    attrName = `«${attr.stereotype}» ${attrName}`;
  }

  let multiplicityStr = "";
  if (attr.multiplicity && attr.multiplicity !== "1") {
    multiplicityStr = ` [${attr.multiplicity}]`;
  }

  return `
    <div class="tree-structure-item">
      <div class="tree-structure-header">
        <span class="tree-expand-spacer"></span>
        <span class="tree-structure-name"
              data-type="attribute"
              data-attr-id="${attr.id || ""}"
            data-class-id="${classId}"
            data-model-id="${modelId || ""}"
            data-profile-id="${profileId || ""}"
              data-action="select-attribute"
              title="${buildTitleAttribute(attr.documentation, attr.documentationRu, attr.name)}">
          ${attrName}:  ${attr.dataType || "—"}${multiplicityStr}
        </span>
      </div>
    </div>
  `;
}

/**
 * Render link tree
 */
function renderLinkTree(link, itemId, parentClassId, modelId = null, profileId = null) {
  let linkIcon = "🔗";
  let linkPrefix = "";

  if (link.relationKind === "Generalization" && link.role === "child") {
    linkIcon = "⬆️";
    linkPrefix = "наследуется от";
  } else if (link.relationKind === "Association") {
    linkIcon = "↔️";
    linkPrefix = "связан с";
  } else if (link.relationKind === "Generalization" && link.role === "parent") {
    linkIcon = "⬇️";
    linkPrefix = "родитель для";
  }

  let linkName = `${linkPrefix} ${link.targetClassName}`;

  let multiplicityStr = "";
  if (link.multiplicity && link.multiplicity !== "1") {
    multiplicityStr = ` [${link.multiplicity}]`;
  }

  let roleInfo = "";
  if (link.targetClassRoleName) {
    roleInfo = ` → ${link.targetClassRoleName}`;
  }

  return `
    <div class="tree-structure-item">
      <div class="tree-structure-header">
        <span class="tree-expand-spacer"></span>
        <span class="tree-structure-name"
              data-type="link"
              data-link-id="${link.linkId || ""}"
              data-relation-kind="${link.relationKind || ""}"
              data-target-class-id="${link.targetClassId || ""}"
            data-class-id="${parentClassId || ""}"
            data-model-id="${modelId || ""}"
            data-profile-id="${profileId || ""}"
              data-action="select-link"
              title="${link.targetDescription || linkName}">
          ${linkIcon} ${linkName}${roleInfo}${multiplicityStr}
        </span>
      </div>
    </div>
  `;
}

/**
 * Render literal tree (for Enumeration classes)
 * @param {Object} literal - Literal object
 * @param {string} itemId - Unique item ID
 *
 * Data/UI contract:
 * - Renders `data-class-id` for the literal's parent class.
 * - `literal.classId` is preferred (canonical export contract).
 * - `parentClassId` is a renderer fallback for legacy payloads.
 * @returns {string} HTML string
 */
function renderLiteralTree(literal, itemId, parentClassId, modelId = null, profileId = null) {
  const classId = literal?.classId || parentClassId || "";
  let literalName = literal.name || "Значение";

  let descriptionStr = "";
  if (literal.documentation) {
    descriptionStr = ` — ${literal.documentation}`;
  }

  return `
    <div class="tree-structure-item">
      <div class="tree-structure-header">
        <span class="tree-expand-spacer"></span>
        <span class="tree-structure-name"
              data-type="literal"
              data-literal-id="${literal.id || ""}"
            data-class-id="${classId}"
            data-model-id="${modelId || ""}"
            data-profile-id="${profileId || ""}"
              data-action="select-literal"
              title="${buildTitleAttribute(literal.documentation, literal.documentationRu, literal.name)}">
          🔢 ${literalName}${descriptionStr}
        </span>
      </div>
    </div>
  `;
}

/**
 * Toggle tree item (expand/collapse) - NOW ONLY TOGGLES CSS CLASS
 */
function toggleTreeItem(itemId) {
  const expandedItems = JSON.parse(
    localStorage.getItem(TREE_STORAGE_KEYS.expandedTreeItems) || "{}"
  );

  if (expandedItems[itemId]) {
    delete expandedItems[itemId];
  } else {
    expandedItems[itemId] = true;
  }

  localStorage.setItem(
    TREE_STORAGE_KEYS.expandedTreeItems,
    JSON.stringify(expandedItems)
  );
}

/**
 * Toggle project (expand/collapse)
 */
function toggleProject(projectId) {
  const expandedProjects = JSON.parse(
    localStorage.getItem(TREE_STORAGE_KEYS.expandedProjects) || "{}"
  );

  if (expandedProjects[projectId]) {
    delete expandedProjects[projectId];
  } else {
    expandedProjects[projectId] = true;
  }

  localStorage.setItem(
    TREE_STORAGE_KEYS.expandedProjects,
    JSON.stringify(expandedProjects)
  );
}

export { renderProjectTree, toggleTreeItem, toggleProject };
