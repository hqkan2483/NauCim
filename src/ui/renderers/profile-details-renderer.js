/**
 * Profile Details Renderer
 * Renders profile details with tabs and tables
 */

import { getAccessRightValue, getLegalStateValue } from "../../enums/enums.js";
import { formatDate } from "../../utils/date.js";

/**
 * Render profile details HTML
 * @param {Object} profile - Profile object
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderProfileDetails(profile, options = {}) {
  const {
    showTabs = true,
    activeTab = 'properties',
  } = options;

  if (!profile) {
    return '<div class="text-center">Выберите профиль для просмотра деталей</div>';
  }

  let html = '';

  // Tabs
  if (showTabs) {
    html += `
      <div class="tabs">
        <div class="tab ${activeTab === 'properties' ? 'active' : ''}">Свойства</div>
      </div>
    `;
  }

  // Properties table
  html += `
    <div class="tab-content active">
      <table class="table profile-details-table">
        <colgroup>
          <col style="width: 25%;"/>
          <col style="width:  25%;"/>
          <col style="width: 20%;"/>
          <col style="width:  30%;"/>
        </colgroup>
        <tbody>
          <tr>
            <td colspan="1"><strong>Описание</strong></td>
            <td colspan="3">${profile.description || "—"}</td>
          </tr>
          <tr>
            <td colspan="1"><strong>Версия</strong></td>
            <td colspan="3">${profile.version || "—"}</td>
          </tr>
          <tr>
            <td colspan="1"><strong>Основан на моделях</strong></td>
            <td colspan="3">${
              profile.relatedModels && profile.relatedModels.length > 0
                ? profile.relatedModels.map((m) => m.name).join(", ")
                : "—"
            }</td>
          </tr>
          <tr>
            <td><strong>Дата создания:</strong></td>
            <td>${formatDate(profile.createDate)}</td>
            <td><strong>Дата изменения:</strong></td>
            <td>${formatDate(profile.modifyDate)}</td>
          </tr>
          <tr>
            <td><strong>Статус:</strong></td>
            <td>${getLegalStateValue(profile.legalState)}</td>
            <td><strong>Права доступа:</strong></td>
            <td>${getAccessRightValue(profile.accessRights)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  return html;
}


