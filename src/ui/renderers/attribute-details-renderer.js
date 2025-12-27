/**
 * Attribute Details Renderer
 * Renders attribute details
 */

/**
 * Render attribute details HTML
 * @param {Object} attr - Attribute object
 * @returns {string} HTML string
 */
function renderAttributeDetails(attr) {
  if (!attr) {
    return '<div class="text-center">Выберите атрибут для просмотра деталей</div>';
  }

  let html = `
    <div class="item-details">
      <div class="item-header">
        <h2 class="item-title">🔹 ${attr.name || "Атрибут без названия"}</h2>
        <span class="item-type-badge">Attribute</span>
        ${attr.stereotype ? `<span class="item-stereotype-badge">«${attr.stereotype}»</span>` : ''}
      </div>
      
      <div class="item-properties">
        <div class="property-group">
          <div class="property-label">Тип данных:</div>
          <div class="property-value">${attr.dataType || "—"}</div>
        </div>
        
        ${attr.dataTypeId ? `
          <div class="property-group">
            <div class="property-label">ID типа данных:</div>
            <div class="property-value"><code>${attr.dataTypeId}</code></div>
          </div>
        ` : ''}
        
        <div class="property-group">
          <div class="property-label">Multiplicity:</div>
          <div class="property-value">${attr.multiplicity || "—"}</div>
        </div>
        
        ${attr.visibility ? `
          <div class="property-group">
            <div class="property-label">Видимость:</div>
            <div class="property-value">${attr.visibility}</div>
          </div>
        ` : ''}
        
        ${attr.initialValue ? `
          <div class="property-group">
            <div class="property-label">Начальное значение:</div>
            <div class="property-value"><code>${attr.initialValue}</code></div>
          </div>
        ` : ''}
        
        ${attr.documentation ?  `
          <div class="property-group full-width">
            <div class="property-label">Описание:</div>
            <div class="property-value">${attr.documentation}</div>
          </div>
        ` : ''}
        
        ${attr.documentationRu ? `
          <div class="property-group full-width">
            <div class="property-label">Описание (RU):</div>
            <div class="property-value">${attr.documentationRu}</div>
          </div>
        ` : ''}
        
        ${attr.details ? `
          <div class="property-group full-width">
            <div class="property-label">Детали:</div>
            <div class="property-value">${attr.details}</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  return html;
}

export { renderAttributeDetails };
