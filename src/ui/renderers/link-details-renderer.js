/**
 * Link Details Renderer
 * Renders class link (relationship) details
 */

/**
 * Render link details HTML
 * @param {Object} link - ClassLink object
 * @returns {string} HTML string
 */
function renderLinkDetails(link) {
  if (!link) {
    return '<div class="text-center">Выберите связь для просмотра деталей</div>';
  }

  const linkIcon = link.relationKind === 'Generalization' ? '⬆️' : '↔️';
  const linkColor = link.relationKind === 'Generalization' ? '#add8e6' : '#90ee90';

  let html = `
    <div class="item-details">
      <div class="item-header">
        <h2 class="item-title" style="color: ${linkColor}">
          ${linkIcon} ${link.relationKind || "Связь"}
        </h2>
        <span class="item-type-badge">${link.relationKind || "Link"}</span>
      </div>
      
      <div class="item-properties">
        <div class="property-group">
          <div class="property-label">Тип связи:</div>
          <div class="property-value">${link.relationKind || "—"}</div>
        </div>
        
        <div class="property-group">
          <div class="property-label">Роль:</div>
          <div class="property-value">${getRoleLabel(link.role)}</div>
        </div>
        
        <div class="property-group">
          <div class="property-label">Целевой класс:</div>
          <div class="property-value"><strong>${link.targetClassName || "—"}</strong></div>
        </div>
        
        ${link.targetClassId ? `
          <div class="property-group">
            <div class="property-label">ID целевого класса:</div>
            <div class="property-value"><code>${link.targetClassId}</code></div>
          </div>
        ` : ''}
        
        <div class="property-group">
          <div class="property-label">Multiplicity:</div>
          <div class="property-value">${link.multiplicity || "—"}</div>
        </div>
        
        ${link.targetClassRoleName ? `
          <div class="property-group">
            <div class="property-label">Имя роли (target):</div>
            <div class="property-value">${link.targetClassRoleName}</div>
          </div>
        ` : ''}
        
        ${link.srcClassRoleName ? `
          <div class="property-group">
            <div class="property-label">Имя роли (source):</div>
            <div class="property-value">${link.srcClassRoleName}</div>
          </div>
        ` : ''}
        
        ${link.targetDescription ? `
          <div class="property-group full-width">
            <div class="property-label">Описание:</div>
            <div class="property-value">${link.targetDescription}</div>
          </div>
        ` : ''}
      </div>
      
      ${renderLinkDiagram(link)}
    </div>
  `;

  return html;
}

/**
 * Get human-readable role label
 */
function getRoleLabel(role) {
  const roleMap = {
    'child': 'Потомок (наследуется от целевого класса)',
    'parent': 'Родитель (является базовым для целевого класса)',
    'unspecified': 'Неопределённая',
    'source': 'Источник',
    'target': 'Цель'
  };
  
  return roleMap[role] || role || "—";
}

/**
 * Render simple ASCII diagram for link
 */
function renderLinkDiagram(link) {
  let diagram = '';
  
  if (link.relationKind === 'Generalization') {
    // Inheritance diagram
    diagram = `
      <div class="link-diagram">
        <div class="diagram-title">Диаграмма наследования: </div>
        <pre class="diagram-content">
    ${link.role === 'child' ? 'Текущий класс' : link.targetClassName}
           │
           │ (наследует)
           ▼
    ${link.role === 'child' ? link.targetClassName : 'Текущий класс'}
        </pre>
      </div>
    `;
  } else if (link.relationKind === 'Association') {
    // Association diagram
    const srcRole = link.srcClassRoleName || 'source';
    const targetRole = link.targetClassRoleName || 'target';
    const multiplicity = link.multiplicity || '*';
    
    diagram = `
      <div class="link-diagram">
        <div class="diagram-title">Диаграмма ассоциации: </div>
        <pre class="diagram-content">
    Текущий класс ──────────── ${link.targetClassName}
         (${srcRole})              (${targetRole})
                               [${multiplicity}]
        </pre>
      </div>
    `;
  }
  
  return diagram;
}

export { renderLinkDetails };
