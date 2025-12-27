/**
 * Package Details Renderer
 * Renders editable package form
 */

/**
 * Render package details HTML (editable form)
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
        <h2 class="item-title">📦 Редактирование пакета</h2>
        <span class="item-type-badge">Package</span>
      </div>
      
      <form class="item-form" id="package-form" data-package-id="${pkg.id}">
        <div class="form-section">
          <h3 class="form-section-title">Основные свойства</h3>
          
          <div class="form-group">
            <label class="form-label" for="pkg-name">Название пакета *</label>
            <input 
              type="text" 
              id="pkg-name" 
              class="form-input" 
              value="${pkg.name || ''}"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="form-label" for="pkg-type">Тип</label>
            <input 
              type="text" 
              id="pkg-type" 
              class="form-input" 
              value="${pkg.type || 'Package'}"
              readonly
            />
          </div>
          
          <div class="form-group">
            <label class="form-label" for="pkg-documentation">Описание</label>
            <textarea 
              id="pkg-documentation" 
              class="form-textarea"
              rows="3"
            >${pkg.documentation || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="pkg-documentationRu">Описание (RU)</label>
            <textarea 
              id="pkg-documentationRu" 
              class="form-textarea"
              rows="3"
            >${pkg.documentationRu || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="pkg-details">Детали</label>
            <textarea 
              id="pkg-details" 
              class="form-textarea"
              rows="4"
            >${pkg.details || ''}</textarea>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            💾 Сохранить изменения
          </button>
          <button type="button" class="btn btn-secondary" id="pkg-cancel-btn">
            ↩️ Отмена
          </button>
        </div>
      </form>
      
      ${renderPackageContents(pkg)}
    </div>
  `;

  return html;
}

/**
 * Render package contents (subpackages and classes)
 */
function renderPackageContents(pkg) {
  let html = `
    <div class="item-section">
      <h3 class="section-title">Содержимое пакета</h3>
  `;

  // Subpackages
  if (pkg.subPackages && pkg.subPackages.length > 0) {
    html += `
      <div class="content-group">
        <h4 class="content-group-title">Подпакеты (${pkg.subPackages.length})</h4>
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
  }

  // Classes
  if (pkg.classes && pkg.classes.length > 0) {
    html += `
      <div class="content-group">
        <h4 class="content-group-title">Классы (${pkg.classes.length})</h4>
        <div class="classes-list">
    `;

    pkg.classes.forEach(cls => {
      const icon = cls.type === 'Enumeration' ? '🔢' : (cls.isAbstract ? '📋' : '📄');
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
  }

  // Empty state
  if ((! pkg.subPackages || pkg.subPackages.length === 0) && 
      (!pkg.classes || pkg.classes.length === 0)) {
    html += `
      <div class="no-content">
        <p>Пакет пуст (нет подпакетов и классов)</p>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

export { renderPackageDetails };