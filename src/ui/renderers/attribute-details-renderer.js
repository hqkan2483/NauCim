/**
 * Attribute Details Renderer
 * Renders editable attribute form
 */

/**
 * Render attribute details HTML (editable form)
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
        <h2 class="item-title">🔹 Редактирование атрибута</h2>
        <span class="item-type-badge">Attribute</span>
      </div>
      
      <form class="item-form" id="attribute-form" data-attr-id="${attr.id}">
        <div class="form-section">
          <h3 class="form-section-title">Свойства атрибута</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="attr-name">Название атрибута *</label>
              <input 
                type="text" 
                id="attr-name" 
                class="form-input" 
                value="${attr.name || ''}"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label" for="attr-dataType">Тип данных *</label>
              <input 
                type="text" 
                id="attr-dataType" 
                class="form-input" 
                value="${attr.dataType || ''}"
                required
                placeholder="Например: String, Float, Integer"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="attr-multiplicity">Multiplicity</label>
              <input 
                type="text" 
                id="attr-multiplicity" 
                class="form-input" 
                value="${attr.multiplicity || '0..1'}"
                placeholder="Например: 1, 0..1, 0..*"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label" for="attr-stereotype">Стереотип</label>
              <input 
                type="text" 
                id="attr-stereotype" 
                class="form-input" 
                value="${attr.stereotype || ''}"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="attr-visibility">Видимость</label>
              <select id="attr-visibility" class="form-select">
                <option value="public" ${attr.visibility === 'public' ? 'selected' : ''}>public</option>
                <option value="private" ${attr.visibility === 'private' ? 'selected' : ''}>private</option>
                <option value="protected" ${attr.visibility === 'protected' ? 'selected' : ''}>protected</option>
                <option value="package" ${attr.visibility === 'package' ? 'selected' :  ''}>package</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="attr-initialValue">Начальное значение</label>
              <input 
                type="text" 
                id="attr-initialValue" 
                class="form-input" 
                value="${attr.initialValue || ''}"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="attr-dataTypeId">ID типа данных</label>
            <input 
              type="text" 
              id="attr-dataTypeId" 
              class="form-input" 
              value="${attr.dataTypeId || ''}"
              placeholder="Идентификатор пользовательского типа"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label" for="attr-documentation">Описание</label>
            <textarea 
              id="attr-documentation" 
              class="form-textarea"
              rows="3"
            >${attr.documentation || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="attr-documentationRu">Описание (RU)</label>
            <textarea 
              id="attr-documentationRu" 
              class="form-textarea"
              rows="3"
            >${attr.documentationRu || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="attr-details">Детали</label>
            <textarea 
              id="attr-details" 
              class="form-textarea"
              rows="4"
            >${attr.details || ''}</textarea>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            💾 Сохранить изменения
          </button>
          <button type="button" class="btn btn-secondary" id="attr-cancel-btn">
            ↩️ Отмена
          </button>
        </div>
      </form>
    </div>
  `;

  return html;
}

export { renderAttributeDetails };
