/**
 * Class Details Renderer
 * Renders class details with attributes and links
 */

/**
 * Render class details HTML
 * @param {Object} cls - Class object
 * @returns {string} HTML string
 */
function renderClassDetails(cls) {
  if (!cls) {
    return '<div class="text-center">Выберите класс для просмотра деталей</div>';
  }

  const icon = cls.type === 'Enumeration' ?  '🔢' : (cls.isAbstract ? '📋' : '📄');
  const typeName = cls.type === 'Enumeration' ? 'Enumeration' : (cls.isAbstract ? 'Abstract Class' : 'Class');

  let html = `
    <div class="item-details">
      <div class="item-header">
        <h2 class="item-title">${icon} ${cls.name || "Класс без названия"}</h2>
        <span class="item-type-badge">${typeName}</span>
        ${cls.stereotype ? `<span class="item-stereotype-badge">«${cls.stereotype}»</span>` : ''}
      </div>
      
      <div class="item-properties">
        <div class="property-group">
          <div class="property-label">Тип:</div>
          <div class="property-value">${cls.type || "—"}</div>
        </div>
        
        <div class="property-group">
          <div class="property-label">Абстрактный:</div>
          <div class="property-value">${cls.isAbstract ?  "Да" : "Нет"}</div>
        </div>
        
        ${cls.documentation ? `
          <div class="property-group full-width">
            <div class="property-label">Описание:</div>
            <div class="property-value">${cls.documentation}</div>
          </div>
        ` : ''}
        
        ${cls.documentationRu ? `
          <div class="property-group full-width">
            <div class="property-label">Описание (RU):</div>
            <div class="property-value">${cls.documentationRu}</div>
          </div>
        ` : ''}
        
        ${cls.details ? `
          <div class="property-group full-width">
            <div class="property-label">Детали:</div>
            <div class="property-value">${cls.details}</div>
          </div>
        ` : ''}
      </div>
      
      ${renderClassAttributes(cls)}
      ${renderClassLinks(cls)}
      ${cls.type === 'Enumeration' ?  renderClassLiterals(cls) : ''}
    </div>
  `;

  return html;
}

/**
 * Render class attributes table
 */
function renderClassAttributes(cls) {
  if (!cls.attributes || cls.attributes.length === 0) {
    return '';
  }

  let html = `
    <div class="item-section">
      <h3 class="section-title">Атрибуты (${cls.attributes.length})</h3>
      <table class="table attributes-table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Тип данных</th>
            <th>Multiplicity</th>
            <th>Стереотип</th>
            <th>Описание</th>
          </tr>
        </thead>
        <tbody>
  `;

  cls.attributes.forEach(attr => {
    html += `
      <tr>
        <td><strong>${attr.name || "—"}</strong></td>
        <td>${attr.dataType || "—"}</td>
        <td>${attr.multiplicity || "—"}</td>
        <td>${attr.stereotype ?  `«${attr.stereotype}»` : "—"}</td>
        <td>${attr.documentation || "—"}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/**
 * ✅ Render class links table (NEW!)
 */
function renderClassLinks(cls) {
  if (!cls.links || cls.links.length === 0) {
    return '';
  }

  let html = `
    <div class="item-section">
      <h3 class="section-title">Связи (${cls.links.length})</h3>
      <table class="table links-table">
        <thead>
          <tr>
            <th>Тип связи</th>
            <th>Роль</th>
            <th>Целевой класс</th>
            <th>Имя роли</th>
            <th>Multiplicity</th>
            <th>Описание</th>
          </tr>
        </thead>
        <tbody>
  `;

  cls.links.forEach(link => {
    const linkIcon = link.relationKind === 'Generalization' ? '⬆️' : '↔️';
    const roleLabel = link.role === 'child' ? 'Потомок' : (link.role === 'parent' ? 'Родитель' : link.role || '—');
    
    html += `
      <tr>
        <td>${linkIcon} ${link.relationKind || "—"}</td>
        <td>${roleLabel}</td>
        <td><strong>${link.targetClassName || "—"}</strong></td>
        <td>${link.targetClassRoleName || "—"}</td>
        <td>${link.multiplicity || "—"}</td>
        <td>${link.targetDescription || "—"}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/**
 * Render class literals (for Enumeration)
 */
function renderClassLiterals(cls) {
  if (!cls.literals || cls.literals.length === 0) {
    return '';
  }

  let html = `
    <div class="item-section">
      <h3 class="section-title">Значения (${cls.literals.length})</h3>
      <table class="table literals-table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Описание</th>
            <th>Значение</th>
          </tr>
        </thead>
        <tbody>
  `;

  cls.literals.forEach(lit => {
    html += `
      <tr>
        <td><strong>${lit.name || "—"}</strong></td>
        <td>${lit.documentation || "—"}</td>
        <td>${lit.initialValue || "—"}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

export {renderClassDetails};
