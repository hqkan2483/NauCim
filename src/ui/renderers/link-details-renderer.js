/**
 * Link Details Renderer
 * Renders editable link (relationship) form
 */

/**
 * Render link details HTML (editable form)
 * @param {Object} link - ClassLink object
 * @returns {string} HTML string
 */
function renderLinkDetails(link) {
  if (!link) {
    return '<div class="text-center">Выберите связь для просмотра деталей</div>';
  }

  const linkIcon = link.relationKind === 'Generalization' ? '⬆️' : '↔️';

  let html = `
    <div class="item-details">
      <div class="item-header">
        <h2 class="item-title">${linkIcon} Редактирование связи</h2>
        <span class="item-type-badge">${link.relationKind || 'Link'}</span>
      </div>
      
      <form class="item-form" id="link-form" data-link-id="${link.linkId}">
        <div class="form-section">
          <h3 class="form-section-title">Свойства связи</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="link-relationKind">Тип связи *</label>
              <select id="link-relationKind" class="form-select" required>
                <option value="Generalization" ${link.relationKind === 'Generalization' ? 'selected' : ''}>Generalization (Наследование)</option>
                <option value="Association" ${link.relationKind === 'Association' ? 'selected' : ''}>Association (Ассоциация)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="link-role">Роль</label>
              <select id="link-role" class="form-select">
                <option value="child" ${link.role === 'child' ? 'selected' : ''}>child (Потомок)</option>
                <option value="parent" ${link.role === 'parent' ? 'selected' : ''}>parent (Родитель)</option>
                <option value="unspecified" ${link.role === 'unspecified' ? 'selected' : ''}>unspecified</option>
                <option value="source" ${link.role === 'source' ? 'selected' :  ''}>source</option>
                <option value="target" ${link.role === 'target' ? 'selected' : ''}>target</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="link-targetClassName">Целевой класс *</label>
              <input 
                type="text" 
                id="link-targetClassName" 
                class="form-input" 
                value="${link.targetClassName || ''}"
                required
                placeholder="Название целевого класса"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label" for="link-targetClassId">ID целевого класса</label>
              <input 
                type="text" 
                id="link-targetClassId" 
                class="form-input" 
                value="${link.targetClassId || ''}"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="link-multiplicity">Multiplicity</label>
              <input 
                type="text" 
                id="link-multiplicity" 
                class="form-input" 
                value="${link.multiplicity || '1'}"
                placeholder="Например:  1, 0..1, 0..*"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label" for="link-targetClassRoleName">Имя роли (target)</label>
              <input 
                type="text" 
                id="link-targetClassRoleName" 
                class="form-input" 
                value="${link.targetClassRoleName || ''}"
                placeholder="Название роли целевого класса"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="link-srcClassRoleName">Имя роли (source)</label>
            <input 
              type="text" 
              id="link-srcClassRoleName" 
              class="form-input" 
              value="${link.srcClassRoleName || ''}"
              placeholder="Название роли класса-источника"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label" for="link-targetDescription">Описание</label>
            <textarea 
              id="link-targetDescription" 
              class="form-textarea"
              rows="3"
            >${link.targetDescription || ''}</textarea>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            💾 Сохранить изменения
          </button>
          <button type="button" class="btn btn-secondary" id="link-cancel-btn">
            ↩️ Отмена
          </button>
        </div>
      </form>
    </div>
  `;

  return html;
}

export { renderLinkDetails };
