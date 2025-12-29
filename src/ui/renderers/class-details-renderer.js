/**
 * Class Details Renderer
 * Renders editable class form with attributes and links management
 */

/**
 * Render class details HTML (editable form)
 * @param {Object} cls - Class object
 * @returns {string} HTML string
 */
function renderClassDetails(cls) {
  if (!cls) {
    return '<div class="text-center">Выберите класс для просмотра деталей</div>';
  }

  const icon = cls.type === 'Enumeration' ? '🔢' : (cls.isAbstract ? '📋' : '📄');
  const typeName = cls.type === 'Enumeration' ?  'Enumeration' : (cls.isAbstract ? 'Abstract Class' : 'Class');

  let html = `
    <div class="item-details">
      <form class="item-form" id="class-form" data-class-id="${cls.id}">
        <div class="form-section">
          <div class="form-section-title">
            <div class="form-row">
              <div class="form-cell">
                <div class="form-group form-group__line">
                    <label class="form-label form-label__title" for="cls-name">Класс *</label>
                    <input
                      type="text"
                      id="cls-name"
                      class="form-input form-input__short"
                      value="${cls.name || ''}"
                      required
                    />
                </div>
              </div>

              <div class="form-group form-group__line">
                <div class="form-cell form-cell__line">
                 <div class="form-group">
                  <label class="form-checkbox-label">
                    <span>Абстрактный класс</span>
                    <input
                      type="checkbox"
                      id="cls-isAbstract"
                      class="form-checkbox"
                      ${cls.isAbstract ? 'checked' : ''}
                    />

                  </label>
                  </div>
                  <div class="form-group form-group__line">
                    <label class="form-label" for="cls-stereotype">Стереотип</label>
                    <input
                      type="text"
                      id="cls-stereotype"
                      class="form-input"
                      value="${cls.stereotype || ''}"
                      placeholder="Например: rs, rf"
                    />
                  </div>


                </div>

              </div>
            </div>
          </div>


          <div class="form-row">
             <div class="form-cell">
              <div class="form-group">
                <label class="form-label" for="cls-documentation">Описание</label>
                <textarea
                  id="cls-documentation"
                  class="form-textarea"
                  rows="3"
                >${cls.documentation || ''}</textarea>
              </div>
            </div>

            <div class="form-cell">
              <div class="form-group">
                <label class="form-label" for="cls-documentationRu">Описание (RU)</label>
                <textarea
                  id="cls-documentationRu"
                  class="form-textarea"
                  rows="3"
                >${cls.documentationRu || ''}</textarea>
              </div>
            </div>
          </div>

          <div class="form-row">
             <div class="form-cell">
              <div class="form-group">
                <label class="form-label" for="cls-details">Детали</label>
                <textarea
                  id="cls-details"
                  class="form-textarea"
                  rows="4"
                >${cls.details || ''}</textarea>
              </div>
            </div>
          </div>
          
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            💾 Сохранить изменения
          </button>
          <button type="button" class="btn btn-secondary" id="cls-cancel-btn">
            ↩️ Отмена
          </button>
        </div>
      </form>

      ${renderClassAttributes(cls)}
      ${renderClassLinks(cls)}
      ${cls.type === 'Enumeration' ? renderClassLiterals(cls) : ''}
    </div>
  `;

  return html;
}

/**
 * Render class attributes section with management buttons
 */
function renderClassAttributes(cls) {
  let html = `
    <div class="item-section">
      <div class="section-header">
        <h3 class="section-title">Атрибуты (${cls.attributes ?  cls.attributes.length : 0})</h3>
        <button class="btn btn-primary btn-small" id="add-attribute-btn" data-class-id="${cls.id}">
          ➕ Добавить атрибут
        </button>
      </div>
  `;

  if (!cls.attributes || cls.attributes.length === 0) {
    html += `
      <div class="no-content">
        <p>Нет атрибутов.  Нажмите "Добавить атрибут" для создания. </p>
      </div>
    `;
  } else {
    html += `
      <table class="table attributes-table">
        <thead>
          <tr>
            <th style="width: 25%">Имя</th>
            <th style="width:  15%">Тип данных</th>
            <th style="width: 10%">Multiplicity</th>
            <th style="width: 10%">Стереотип</th>
            <th style="width: 25%">Описание</th>
            <th style="width:  15%">Действия</th>
          </tr>
        </thead>
        <tbody>
    `;

    cls.attributes.forEach(attr => {
      html += `
        <tr data-attr-id="${attr.id}">
          <td><strong>${attr.name || '—'}</strong></td>
          <td>${attr.dataType || '—'}</td>
          <td>${attr.multiplicity || '—'}</td>
          <td>${attr.stereotype ?  `«${attr.stereotype}»` : '—'}</td>
          <td class="text-truncate" title="${attr.documentation || ''}">${attr.documentation || '—'}</td>
          <td>
            <div class="table-actions">
              <button class="btn-icon"
                      data-action="edit-attribute"
                      data-attr-id="${attr.id}"
                      title="Редактировать">
                ✏️
              </button>
              <button class="btn-icon btn-icon-danger"
                      data-action="delete-attribute"
                      data-attr-id="${attr.id}"
                      title="Удалить">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
  }

  html += `</div>`;
  return html;
}

/**
 * Render class links section with management buttons
 */
function renderClassLinks(cls) {
  let html = `
    <div class="item-section">
      <div class="section-header">
        <h3 class="section-title">Связи (${cls.links ? cls.links.length : 0})</h3>
        <button class="btn btn-primary btn-small" id="add-link-btn" data-class-id="${cls.id}">
          ➕ Добавить связь
        </button>
      </div>
  `;

  if (!cls.links || cls.links.length === 0) {
    html += `
      <div class="no-content">
        <p>Нет связей. Нажмите "Добавить связь" для создания.</p>
      </div>
    `;
  } else {
    html += `
      <table class="table links-table">
        <thead>
          <tr>
            <th style="width: 15%">Тип связи</th>
            <th style="width: 10%">Роль</th>
            <th style="width: 20%">Целевой класс</th>
            <th style="width: 15%">Имя роли</th>
            <th style="width: 10%">Multiplicity</th>
            <th style="width: 20%">Описание</th>
            <th style="width:  10%">Действия</th>
          </tr>
        </thead>
        <tbody>
    `;

    cls.links.forEach(link => {
      const linkIcon = link.relationKind === 'Generalization' ? '⬆️' : '↔️';
      const roleLabel = link.role === 'child' ? 'Потомок' : (link.role === 'parent' ? 'Родитель' : link.role || '—');

      html += `
        <tr data-link-id="${link.linkId}">
          <td>${linkIcon} ${link.relationKind || '—'}</td>
          <td>${roleLabel}</td>
          <td><strong>${link.targetClassName || '—'}</strong></td>
          <td>${link.targetClassRoleName || '—'}</td>
          <td>${link.multiplicity || '—'}</td>
          <td class="text-truncate" title="${link.targetDescription || ''}">${link.targetDescription || '—'}</td>
          <td>
            <div class="table-actions">
              <button class="btn-icon"
                      data-action="edit-link"
                      data-link-id="${link.linkId}"
                      title="Редактировать">
                ✏️
              </button>
              <button class="btn-icon btn-icon-danger"
                      data-action="delete-link"
                      data-link-id="${link.linkId}"
                      title="Удалить">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
  }

  html += `</div>`;
  return html;
}

/**
 * Render class literals section (for Enumeration)
 */
function renderClassLiterals(cls) {
  let html = `
    <div class="item-section">
      <div class="section-header">
        <h3 class="section-title">Значения перечисления (${cls.literals ? cls.literals.length : 0})</h3>
        <button class="btn btn-primary btn-small" id="add-literal-btn" data-class-id="${cls.id}">
          ➕ Добавить значение
        </button>
      </div>
  `;

  if (!cls.literals || cls.literals.length === 0) {
    html += `
      <div class="no-content">
        <p>Нет значений. Нажмите "Добавить значение" для создания.</p>
      </div>
    `;
  } else {
    html += `
      <table class="table literals-table">
        <thead>
          <tr>
            <th style="width:  30%">Имя</th>
            <th style="width: 40%">Описание</th>
            <th style="width: 15%">Значение</th>
            <th style="width:  15%">Действия</th>
          </tr>
        </thead>
        <tbody>
    `;

    cls.literals.forEach(lit => {
      html += `
        <tr data-literal-id="${lit.id}">
          <td><strong>${lit.name || '—'}</strong></td>
          <td>${lit.documentation || '—'}</td>
          <td>${lit.initialValue || '—'}</td>
          <td>
            <div class="table-actions">
              <button class="btn-icon"
                      data-action="edit-literal"
                      data-literal-id="${lit.id}"
                      title="Редактировать">
                ✏️
              </button>
              <button class="btn-icon btn-icon-danger"
                      data-action="delete-literal"
                      data-literal-id="${lit.id}"
                      title="Удалить">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
  }

  html += `</div>`;
  return html;
}

export { renderClassDetails };
