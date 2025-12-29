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

      ${renderClassTabs(cls)}

      <div class="tabs-content">
        ${renderTabContent(cls)}
      </div>
    </div>
  `;

  return html;
}

/**
 * Render class tabs header with buttons
 */
function renderClassTabs(cls) {
  const isEnumeration = cls.type === 'Enumeration';

  let html = `
    <div class="item-section">
      <div class="section-header">
        <div class="section-tabs">
  `;

  // ✅ Для обычного класса:  Атрибуты и Связи
  if (! isEnumeration) {
    html += `
      <div class="section-title tab tab-mini active"
           data-section-tab="item-attributes"
           data-class-id="${cls.id}">
        Атрибуты (${cls.attributes ?  cls.attributes.length : 0})
      </div>
      <div class="section-title tab tab-mini"
           data-section-tab="item-links"
           data-class-id="${cls.id}">
        Связи (${cls.links ? cls.links.length :  0})
      </div>
    `;
  }

  // ✅ Для Enumeration:  только Значения перечисления
  if (isEnumeration) {
    html += `
      <div class="section-title tab tab-mini active"
           data-section-tab="item-literals"
           data-class-id="${cls.id}">
        Значения перечисления (${cls.literals ? cls.literals.length : 0})
      </div>
    `;
  }

  html += `
        </div>
        <div class="section-tab-actions">
  `;

  // ✅ Кнопки для обычного класса
  if (! isEnumeration) {
    html += `
      <button class="btn btn-primary btn-small tab-action-btn"
              id="add-attribute-btn"
              data-class-id="${cls.id}"
              data-tab="item-attributes">
        ➕ Добавить атрибут
      </button>
      <button class="btn btn-primary btn-small tab-action-btn hidden"
              id="add-link-btn"
              data-class-id="${cls.id}"
              data-tab="item-links">
        ➕ Добавить связь
      </button>
    `;
  }

  // ✅ Кнопка для Enumeration
  if (isEnumeration) {
    html += `
      <button class="btn btn-primary btn-small tab-action-btn"
              id="add-literal-btn"
              data-class-id="${cls.id}"
              data-tab="item-literals">
        ➕ Добавить значение
      </button>
    `;
  }

  html += `
        </div>
      </div>
    </div>
  `;

  return html;
}

/**
 * Render tab content (all tabs, visibility controlled by CSS)
 */
function renderTabContent(cls) {
  const isEnumeration = cls.type === 'Enumeration';

  let html = '';

  // ✅ Для обычного класса: Атрибуты и Связи
  if (!isEnumeration) {
    html += `
      <div class="tab-content-section active" data-tab-content="item-attributes">
        ${renderClassAttributes(cls)}
      </div>
      <div class="tab-content-section" data-tab-content="item-links">
        ${renderClassLinks(cls)}
      </div>
    `;
  }

  // ✅ Для Enumeration:  только Литералы
  if (isEnumeration) {
    html += `
      <div class="tab-content-section active" data-tab-content="item-literals">
        ${renderClassLiterals(cls)}
      </div>
    `;
  }

  return html;
}

/**
 * Render class attributes section with management buttons
 */
function renderClassAttributes(cls) {
  let html = ``;

  if (!cls.attributes || cls.attributes.length === 0) {
    html += `
      <div class="no-content">
        <p>Нет атрибутов. Нажмите "Добавить атрибут" для создания. </p>
      </div>
    `;
  } else {
    html += `
      <table class="table attributes-table">
          <colgroup>
            <col style="width: 15%;"/>
            <col style="width: 15%;"/>
            <col style="width: 8%;"/>
            <col style="width: 10%;"/>
            <col style="min-width: 44%;"/>
            <col style="width: 8%;"/>
          </colgroup>
        <thead>
          <tr>
            <th>Имя</th>
            <th>Тип данных</th>
            <th>Мн.</th>
            <th>Стереотип</th>
            <th>Описание</th>
            <th> </th>
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
          <td>${attr.documentation || '—'}</td>
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

  return html;
}

/**
 * Render class links section with management buttons
 */
function renderClassLinks(cls) {
  let html = ``;

  if (!cls.links || cls.links.length === 0) {
    html += `
      <div class="no-content">
        <p>Нет связей. Нажмите "Добавить связь" для создания.</p>
      </div>
    `;
  } else {
    html += `
      <table class="table links-table">
        <colgroup>
          <col style="width: 15%;"/>
          <col style="width: 15%;"/>
          <col style="min-width: 15%;"/>
          <col style="width: 7%;"/>
          <col style="max-width: 40%;"/>
          <col style="width: 8%;"/>
        </colgroup>
        <thead>
          <tr>
            <th>Имя роли</th>
            <th>Тип связи</th>
            <th>Класс назначения</th>
            <th>Мн.</th>
            <th>Описание</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
    `;

    cls.links.forEach(link => {
      const linkIcon = link.relationKind === 'Generalization' ? '⬆️' : '↔️';
      const roleLabel = link.role === 'child' ? '(потомок от)' : (link.role === 'parent' ? '(родитель для)' : (link.role === 'unspecified' ? '' : link.role || ''));

      html += `
        <tr data-link-id="${link.linkId}">
          <td><strong>${link.targetClassRoleName || '—'}</strong></td>
          <td>${linkIcon} ${link.relationKind || '—'} <br> ${roleLabel}</td>
          <td>${link.targetClassName || '—'}</td>
          <td>${link.multiplicity || '—'}</td>
          <td>${link.targetDescription || '—'}</td>
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

  return html;
}

/**
 * Render class literals section (for Enumeration)
 */
function renderClassLiterals(cls) {
  let html = ``;

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
            <th style="width: 30%">Значение</th>
            <th style="width: 40%">Описание</th>
            <th style="width: 15%">Доп. значение</th>
            <th style="width: 15%"></th>
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

  return html;
}

export { renderClassDetails };
