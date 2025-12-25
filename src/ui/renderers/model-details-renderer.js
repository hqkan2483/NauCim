 /**
 * Model Details Renderer
 * Renders model details with tabs and tables
 */

import { getAccessRightValue, getLegalStateValue } from "../../enums/enums.js";
import { formatDate } from "../../utils/date.js";

/**
 * Render model details HTML
 * @param {Object} model - Model object
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderModelDetails(model, options = {}) {
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
      <table class="table model-details-table">
        <colgroup>
          <col style="width: 25%;"/>
          <col style="width:  25%;"/>
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
            <td><strong>Дата изменения:</strong></td>
            <td>${formatDate(model.modifyDate)}</td>
          </tr>
          <tr>
            <td><strong>Статус: </strong></td>
            <td>${getLegalStateValue(model.legalState)}</td>
            <td><strong>Права доступа:</strong></td>
            <td>${getAccessRightValue(model.accessRights)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  return html;
}
