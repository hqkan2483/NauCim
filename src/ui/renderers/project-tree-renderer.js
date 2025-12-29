/**
 * Project Tree Renderer
 * Renders hierarchical project structure (models/profiles with packages/classes)
 */

const STORAGE_KEY_EXPANDED = "cim.expandedTreeItems";

/**
 * Render full project tree
 * @param {Object} project - Project object
 * @param {string} projectId - Project ID
 * @returns {string} HTML string
 */
function renderProjectTree(project, projectId) {
  if (!project) return '<div class="no-items text-muted">Проект не найден</div>';

  const expandedProjects = JSON.parse(localStorage.getItem("cim.expandedProjects") || "{}");
  const isExpanded = expandedProjects[projectId];

  let html = `
    <div class="project-tree-item">
      <div class="project-tree-header active">
        <button class="project-expand-btn"
                data-project-id="${projectId}"
                data-action="toggle-project"
                aria-expanded="${isExpanded ? "true" : "false"}">
          <span class="expand-icon">${isExpanded ? "▼" : "▶"}</span>
        </button>
        <span class="project-name" title="${project.name}">
          📦 ${project.name}
        </span>
      </div>
  `;

  if (isExpanded) {
    html += `<div class="project-structure">`;

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

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render model tree
 * @param {Object} model - Model object
 * @param {string} projectId - Project ID
 * @param {number} index - Model index
 * @returns {string} HTML string
 */
function renderModelTree(model, projectId, index) {
  const expandedItems = JSON.parse(localStorage.getItem(STORAGE_KEY_EXPANDED) || "{}");
  const itemId = `model-${projectId}-${index}`;
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

  if (hasChildren && isExpanded) {
    html += `<div class="tree-structure-children">`;
    
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
 * @param {Object} profile - Profile object
 * @param {string} projectId - Project ID
 * @param {number} index - Profile index
 * @returns {string} HTML string
 */
function renderProfileTree(profile, projectId, index) {
  const expandedItems = JSON.parse(localStorage.getItem(STORAGE_KEY_EXPANDED) || "{}");
  const itemId = `profile-${projectId}-${index}`;
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

  if (hasChildren && isExpanded) {
    html += `<div class="tree-structure-children">`;
    
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
 * @param {Object} pkg - Package object
 * @param {string} itemId - Unique item ID
 * @param {string} modelId - Model ID (if part of model)
 * @param {string} profileId - Profile ID (if part of profile)
 * @returns {string} HTML string
 */
function renderPackageTree(pkg, itemId, modelId = null, profileId = null) {
  const expandedItems = JSON.parse(localStorage.getItem(STORAGE_KEY_EXPANDED) || "{}");
  const isExpanded = expandedItems[itemId];
  const hasChildren =
    (pkg.subPackages && pkg.subPackages.length > 0) ||
    (pkg.classes && pkg.classes.length > 0);

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
        <span class="tree-expand-icon">${isExpanded ? "▼" : "▶"}</span>
      </button>
    `;
  } else {
    html += `<span class="tree-expand-spacer"></span>`;
  }

  html += `
        <span class="tree-structure-name"
              data-type="package"
              data-package-id="${pkg.id || ""}"
              data-action="select-package"
              title="${pkg.documentation || pkg.name || ''}">
          ${pkg.name || "Пакет без названия"}
        </span>
      </div>
  `;

  if (hasChildren && isExpanded) {
    html += `<div class="tree-structure-children">`;

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

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render class tree
 * @param {Object} cls - Class object
 * @param {string} itemId - Unique item ID
 * @param {string} modelId - Model ID
 * @param {string} profileId - Profile ID
 * @returns {string} HTML string
 */
function renderClassTree(cls, itemId, modelId = null, profileId = null) {
  const expandedItems = JSON.parse(localStorage.getItem(STORAGE_KEY_EXPANDED) || "{}");
  const isExpanded = expandedItems[itemId];
  
  // ✅ Класс имеет детей, если есть атрибуты ИЛИ связи
  const hasChildren = 
    (cls.attributes && cls.attributes.length > 0) ||
    (cls.links && cls.links.length > 0);

    // Определяем data-атрибуты для CSS
    const isEnumeration = cls.type === "Enumeration";
  const isAbstract = cls.isAbstract;

  // Добавляем стереотип к имени класса
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
              aria-expanded="${isExpanded ? "true" :  "false"}">
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
              data-model-id="${modelId || ""}"
              data-ref-model-id="${cls.modelItemId || ""}"
              data-ref-model-item-id="${cls.modelItemId || ""}"
              data-profile-id="${profileId || ""}"
              data-is-enumeration="${isEnumeration}"
              data-is-abstract="${isAbstract}"
              data-action="select-class"
              title="${cls.documentation || cls.name || ''}">
          ${className}
        </span>
      </div>
  `;

  if (hasChildren && isExpanded) {
    html += `<div class="tree-structure-children">`;
    
    // ✅ Render attributes
    if (cls.attributes && cls.attributes.length > 0) {
      cls.attributes.forEach((attr, idx) => {
        html += renderAttributeTree(attr, `${itemId}-attr-${idx}`);
      });
    }
    
    // ✅ Render links (NEW!)
    if (cls.links && cls.links.length > 0) {
      cls.links.forEach((link, idx) => {
        html += renderLinkTree(link, `${itemId}-link-${idx}`);
      });
    }
    
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render attribute tree (leaf node)
 * @param {Object} attr - Attribute object
 * @param {string} itemId - Unique item ID
 * @returns {string} HTML string
 */
function renderAttributeTree(attr, itemId) {
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
              data-action="select-attribute"
              title="${attr.documentation || attr.name || ''}">
          ${attrName}:  ${attr.dataType || "—"}${multiplicityStr}
        </span>
      </div>
    </div>
  `;
}

/**
 * ✅ Render link tree (NEW!)
 * @param {Object} link - ClassLink object
 * @param {string} itemId - Unique item ID
 * @returns {string} HTML string
 */
function renderLinkTree(link, itemId) {
  // Определяем иконку по типу связи
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

  // Формируем название связи
  let linkName = `${linkPrefix} ${link.targetClassName}`;
  
  // Добавляем multiplicity
  let multiplicityStr = "";
  if (link.multiplicity && link.multiplicity !== "1") {
    multiplicityStr = ` [${link.multiplicity}]`;
  }

  // Добавляем роль целевого класса (если есть)
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
              data-link-kind="${link.relationKind || ""}"
              data-target-class-id="${link.targetClassId || ""}"
              data-action="select-link"
              title="${link.targetDescription || linkName}">
          ${linkIcon} ${linkName}${roleInfo}${multiplicityStr}
        </span>
      </div>
    </div>
  `;
}

/**
 * Toggle tree item (expand/collapse)
 */
function toggleTreeItem(itemId) {
  const expandedItems = JSON.parse(localStorage.getItem(STORAGE_KEY_EXPANDED) || "{}");

  if (expandedItems[itemId]) {
    delete expandedItems[itemId];
  } else {
    expandedItems[itemId] = true;
  }

  localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(expandedItems));
}

/**
 * Toggle project (expand/collapse)
 */
function toggleProject(projectId) {
  const expandedProjects = JSON.parse(localStorage.getItem("cim.expandedProjects") || "{}");

  if (expandedProjects[projectId]) {
    delete expandedProjects[projectId];
  } else {
    expandedProjects[projectId] = true;
  }

  localStorage.setItem("cim.expandedProjects", JSON.stringify(expandedProjects));
}
export { renderProjectTree, toggleTreeItem, toggleProject };