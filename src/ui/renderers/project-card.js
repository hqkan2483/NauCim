import { getAccessRightsValue } from "../../enums/enums.js";
import { formatDate } from "../../utils/date.js";
/**
 * Universal Project Card Renderer
 * Renders project cards with flexible options for different contexts
 */

/**
 * Render project card HTML
 * @param {Object} project - Project object
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
function renderProjectCard(project, options = {}) {
  const {
    showActions = true,           // Показывать блок действий (кнопки)
    showDescription = true,        // Показывать описание
    showMeta = true,               // Показывать метаданные (версия, дата)
    showStats = true,              // Показывать статистику (модели/профили)
    currentProjectId = null,       // ID текущего проекта (для highlight)
    cardClickAction = 'select',    // 'select' | 'open' | 'none'
    actionsTemplate = null,        // Кастомный HTML для действий
    compact = false,               // Компактный режим
  } = options;

  const isActive = currentProjectId === project.id;
  const cardClass = `project-card ${isActive ? 'active' : ''} ${compact ? 'project-card-compact' : ''}`;

  let cardDataAttrs = `data-project-id="${project.id}"`;

  // Title click action
  const titleClickAttr = cardClickAction === 'select'
    ? `data-action="select-project" data-project-id="${project.id}"`
    : '';

  // Build HTML
  return `
    <div class="${cardClass}" ${cardDataAttrs}>
      <div class="project-card-content-wrapper">
        <div class="project-card-content">
          <div class="project-card-header">
            <div class="project-card-title" ${titleClickAttr}>
              ${project.name}
            </div>
          </div>

          ${showDescription && project.description ?
            `<div class="project-card-description">${project.description}</div>`
            : ''
          }

        </div>

        ${showActions ?  (actionsTemplate || renderDefaultActions(project)) : ''}
        </div>


      <div class="project-card-meta">
          ${showMeta ?  renderMeta(project) : ''}
          ${showStats ? renderStats(project) : ''}
      </div>
    </div>
  `;
}

/**
 * Render metadata section
 */
function renderMeta(project) {
  return `
      <dl class="project-card-meta_list">
        <div class="project-card-meta_item">
          <dt>📌 Версия</dt>
          <dd>${project.version || '—'}</dd>
        </div>
        <div class="project-card-meta_item">
          <dt>📅 Создан</dt>
          <dd>${formatDate(project.createDate)}</dd>
          </div>
        <div class="project-card-meta_item">
          <dt>🛠️ Изменен</dt>
          <dd>${formatDate(project.modifyDate)}</dd>
        </div>
        <div class="project-card-meta_item">
          <dt>🔑 Доступ</dt>
          <dd>${getAccessRightsValue(project.accessRights)}</dd>
        </div>
      </dl>
  `;
}

/**
 * Render statistics section
 */
function renderStats(project) {
  return `
    <dl class="project-card-meta_list">
      <div class="project-card-meta_item">
        <dt>📋 Моделей</dt>
        <dd>${project.models ? project.models.length : 0}</dd>
      </div>
      <div class="project-card-meta_item">
        <dt>⚙️ Профилей</dt>
        <dd>${project.profiles ? project.profiles.length : 0}</dd>
      </div>
    </dl>
  `;
}

/**
 * Render default actions
 */
function renderDefaultActions(project) {
  return `
    <div class="project-card-actions">
      <button class="btn btn-secondary btn-small project-card-btn"
              data-action="edit-project"
              data-project-id="${project.id}">
        ✏️ Редактировать
      </button>
      <button class="btn btn-secondary btn-small project-card-btn"
              data-action="delete-project"
              data-project-id="${project.id}">
        🗑️ Удалить
      </button>
      <button class="btn btn-primary btn-small project-card-btn"
              data-action="open-project-details"
              data-project-id="${project.id}">
        📂 Открыть проект
      </button>
    </div>
  `;
}


/**
 * Render simple action (for index page)
 */
export function renderSimpleAction(project) {
  return `
    <div class="project-card-actions">
      <button class="btn btn-primary btn-small project-card-btn"
              data-action="open-project-details"
              data-project-id="${project.id}">
        Открыть →
      </button>
    </div>
  `;
}

export { renderProjectCard };
