/**
 * Package Details Renderer
 * Renders package details
 */

/**
 * Render package details HTML
 * @param {Object} pkg - Package object
 * @returns {string} HTML string
 */
function renderPackageDetails(pkg) {
  if (!pkg) {
    return '<div class="text-center">Выберите пакет для просмотра деталей</div>';
  }

  let html = `
    <div class="item-details">
      <div class="item-header">
        <h2 class="item-title">📦 ${pkg.name || "Пакет без названия"}</h2>
        <span class="item-type-badge">Package</span>
      </div>
      
      <div class="item-properties">
        <div class="property-group">
          <div class="property-label">Тип: </div>
          <div class="property-value">${pkg.type || "—"}</div>
        </div>
        
        ${pkg.documentation ? `
          <div class="property-group">
            <div class="property-label">Описание:</div>
            <div class="property-value">${pkg.documentation}</div>
          </div>
        ` : ''}
        
        ${pkg.documentationRu ? `
          <div class="property-group">
            <div class="property-label">Описание (RU):</div>
            <div class="property-value">${pkg.documentationRu}</div>
          </div>
        ` : ''}
        
        ${pkg.details ? `
          <div class="property-group">
            <div class="property-label">Детали:</div>
            <div class="property-value">${pkg.details}</div>
          </div>
        ` : ''}
        
        <div class="property-group">
          <div class="property-label">Классов:</div>
          <div class="property-value">${pkg.classes ? pkg.classes.length : 0}</div>
        </div>
        
        <div class="property-group">
          <div class="property-label">Подпакетов:</div>
          <div class="property-value">${pkg.subPackages ? pkg.subPackages.length : 0}</div>
        </div>
      </div>
      
      ${renderPackageClasses(pkg)}
      ${renderPackageSubPackages(pkg)}
    </div>
  `;

  return html;
}

/**
 * Render package classes list
 */
function renderPackageClasses(pkg) {
  if (!pkg.classes || pkg.classes.length === 0) {
    return '';
  }

  let html = `
    <div class="item-section">
      <h3 class="section-title">Классы (${pkg.classes.length})</h3>
      <div class="classes-list">
  `;

  pkg.classes.forEach(cls => {
    const icon = cls.type === 'Enumeration' ?  '🔢' : (cls.isAbstract ? '📋' : '📄');
    html += `
      <div class="class-item">
        <span class="class-icon">${icon}</span>
        <span class="class-name">${cls.name}</span>
        ${cls.stereotype ? `<span class="class-stereotype">«${cls.stereotype}»</span>` : ''}
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

/**
 * Render package subpackages list
 */
function renderPackageSubPackages(pkg) {
  if (!pkg.subPackages || pkg.subPackages.length === 0) {
    return '';
  }

  let html = `
    <div class="item-section">
      <h3 class="section-title">Подпакеты (${pkg.subPackages.length})</h3>
      <div class="subpackages-list">
  `;

  pkg.subPackages.forEach(subPkg => {
    html += `
      <div class="subpackage-item">
        <span class="subpackage-icon">📦</span>
        <span class="subpackage-name">${subPkg.name}</span>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

export {renderPackageDetails};