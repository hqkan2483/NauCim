/**
 * Package Details Renderer
 * Renders editable package form
 */

import { buildTitleAttribute } from '../../utils/title-attribute-builder.js';

function renderPackageForm(pkg) {
  return `

      <form class="item-form" id="package-form" data-package-id="${pkg.id}">
        <div class="form-section">
          <div class="form-section-title">
            <div class="form-row">
              <div class="form-cell">
                <div class="form-group form-group__line">
                  <label class="form-label form-label__title" for="pkg-name">Пакет *</label>
                    <input
                      type="text"
                      id="pkg-name"
                      class="form-input form-input__short"
                      value="${pkg.name || ''}"
                      required
                    />
                </div>
              </div>
              <div class="form-cell form-cell__line">
                <div class="form-group">
                </div>
              </div>
            </div>
          </div>

            <div class="form-row">
              <div class="form-cell">
                <div class="form-group">
                  <label class="form-label" for="pkg-documentation">Описание</label>
                  <textarea
                    id="pkg-documentation"
                    class="form-textarea"
                    rows="3"
                  >${pkg.documentation || ''}</textarea>
                </div>
              </div>
              <div class="form-cell">
                <div class="form-group">
                  <label class="form-label" for="pkg-documentationRu">Описание (RU)</label>
                  <textarea
                    id="pkg-documentationRu"
                    class="form-textarea"
                    rows="3"
                  >${pkg.documentationRu || ''}</textarea>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-cell">
                <div class="form-group">
                  <label class="form-label" for="pkg-details">Детали</label>
                  <textarea
                    id="pkg-details"
                    class="form-textarea"
                    rows="4"
                  >${pkg.details || ''}</textarea>
                </div>
              </div>
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

  `;
}

function renderPackageDetailsTabs(pkg) {
  const tabName = "pkg-general";

  let html = `
    <div class="item-section package-contents">
      <div class="section-header">
        <div class="section-tabs">
          <div class="section-title tab active"
               data-section-tab="${tabName}">
            Общая информация
          </div>
        </div>
      </div>

      <div class="tabs-content">
        <div class="tab-content active" data-tab-content="${tabName}">
          ${renderPackageForm(pkg)}
        </div>
      </div>
    </div>
  `;

  return html;
}

/**
 * Render package details HTML (editable form)
 * @param {Object} pkg - Package object
 * @param {Object} [options]
 * @param {('standard'|'diagram')} [options.viewMode]
 * @returns {string} HTML string
 */
function renderPackageDetails(pkg, { viewMode = 'standard' } = {}) {
  if (!pkg) {
    return '<div class="text-center">Выберите пакет для просмотра деталей</div>';
  }

  if (viewMode === 'diagram') {
    return renderPackageDetailsTabs(pkg);
  }

  return `${renderPackageForm(pkg)}${renderPackageContents(pkg)}`;
}

/**
 * Render package contents (subpackages and classes)
 */
function renderPackageContents(pkg) {
  let html = `
    <div class="item-section package-contents">
     <div class="section-header">
      <h3 class="section-name">Содержимое пакета</h3>
    </div>
  `;

  // Subpackages
  if (pkg.subPackages && pkg.subPackages.length > 0) {
    html += `
      <div class="content-group">
        <h4 class="content-group-title">Вложенные пакеты (${pkg.subPackages.length})</h4>
        <div class="subpackages-list">
    `;

    pkg.subPackages.forEach(subPkg => {
      html += `
        <div class="subpackage-item"
             data-action="navigate-to-package"
             data-package-id="${subPkg.id}"
             data-model-id="${subPkg.modelId || ''}"
             data-profile-id="${subPkg.profileId || ''}"
             title="${buildTitleAttribute(subPkg.documentation, subPkg.documentationRu, subPkg.name)}">
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
        <div class="class-item"
             data-action="navigate-to-class"
             data-class-id="${cls.id}"
             data-model-id="${cls.modelId || ''}"
             data-profile-id="${cls.profileId || ''}"
             data-ref-model-id="${cls.refModelId || ''}"
             data-ref-model-item-id="${cls.refModelItemId || ''}"
             title="${buildTitleAttribute(cls.documentation, cls.documentationRu, cls.name)}">
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
