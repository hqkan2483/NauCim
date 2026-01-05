 /**
 * Model Details Renderer
 * Renders model details with tabs and tables
 */

import { getAccessRightsValue, getLegalStateValue } from "../../enums/enums.js";
import { formatDate } from "../../utils/date.js";

/**
 * Render model details HTML
 * @param {Object} model - Model object
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
function renderModelDetails(model, options = {}) {
  const {
    showTabs = true,
    activeTab = 'properties',
  } = options;

  if (!model) {
    return '<div class="text-center">Выберите модель для просмотра деталей</div>';
  }

  let html = '';

  // Tabs
  if (showTabs) {
    html += `
      <div class="tabs">
        <div class="tab ${activeTab === 'properties' ?  'active' : ''}">Свойства</div>
      </div>
    `;
  }

  // Properties table
  html += `
    <div class="tab-content active">
      <table class="table project-details-table">
        <colgroup>
          <col style="width: 25%;"/>
          <col style="width: 25%;"/>
          <col style="width: 20%;"/>
          <col style="width: 30%;"/>
        </colgroup>
        <tbody>
          <tr>
            <td colspan="1"><strong>Описание</strong></td>
            <td colspan="3">${model.description || "—"}</td>
          </tr>
          <tr>
            <td colspan="1"><strong>Версия</strong></td>
            <td colspan="3">${model.version || "—"}</td>
          </tr>
          <tr>
            <td colspan="1"><strong>Используется в профилях</strong></td>
            <td colspan="3">${
              model.relatedProfiles && model.relatedProfiles.length > 0
                ? model.relatedProfiles.map((p) => p.name).join(", ")
                : "—"
            }</td>
          </tr>
          <tr>
            <td><strong>Дата создания: </strong></td>
            <td>${formatDate(model.createDate)}</td>
            <td><strong>Дата изменения: </strong></td>
            <td>${formatDate(model.modifyDate)}</td>
          </tr>
          <tr>
            <td><strong>Статус: </strong></td>
            <td>${getLegalStateValue(model.legalState)}</td>
            <td><strong>Права доступа: </strong></td>
            <td>${getAccessRightsValue(model.accessRights)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/**
 * Render model controls (action buttons)
 * @param {Object} model - Model object
 * @returns {string} HTML string
 */
function renderModelControls(model) {

  if (!model) {
    return ;
  }

  let html = '';

  if (model.accessRights === 'readWrite') {
    html += `
      <button class="btn btn-primary" data-action="edit-model" data-model-id="${model.id}">✏️ Редактировать описание</button>
    `;
  } else html += `<button class="btn btn-secondary" disabled>✏️ Редактировать описание</button>`;

  if (model.accessRights === 'readWrite') {
    html += `
      <button class="btn btn-primary" data-action="import-model"data-model-id="${model.id}">📥 Импорт</button>
    `;
  } else html += `<button class="btn btn-secondary" disabled>📥 Импорт</button>`;

  html += ` <button class="btn btn-primary" data-action="export-model" data-model-id="${model.id}">📤 Экспорт</button>
   <button class="btn btn-primary" data-action="check-model" data-model-id="${model.id}">✓ Проверка</button>`;

  if (model.accessRights === 'readWrite') {
    html += `
      <button class="btn btn-primary" data-action="delete-model" data-model-id="${model.id}">🗑️ Удалить</button>
    `;
  } else html += `<button class="btn btn-secondary" disabled>🗑️ Удалить</button>`;

  return html;
}

export { renderModelDetails, renderModelControls };
