/**
 * Profile Editor Details Panel Component
 * Manages the details panel with tabs
 */

import { esc } from "../../utils/text-utils.js";


/**
 * Initialize details panel component
 * @param {string} containerId - Container element ID
 * @param {Object} options - Configuration options
 * @returns {Object} Details panel instance
 */

// todo - не проверял
export function initDetailsPanel(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return null;
  }

  const instance = {
    container,
    options: {
      onTabSwitch: options.onTabSwitch || (() => {}),
      defaultTab: options.defaultTab || "model-item-general",
    },
    currentTab: null,

    /**
     * Initialize panel
     */
    init() {
      this.bindEvents();

      // default: left section -> model, right section -> profile
      this.switchTab("model-item-general", "available-item-details");
      this.switchTab("profile-item-general", "profile-item-details");
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
      container.addEventListener("click", (e) => {
        const target = e.target instanceof HTMLElement ? e.target : null;
        if (!target) return;

        const tabEl = target.closest(".tabs .tab");
        if (!tabEl) return;

        const sectionEl = tabEl.closest(".details-panel-content");
        if (!sectionEl) return;

        const tabName = tabEl.getAttribute("data-tab");
        if (!tabName) return;

        this.switchTab(tabName, sectionEl.id);
      });
    },

    /**
     * Switch to a specific tab
     */
    switchTab(tabName, sectionId = null) {
      const sectionEl = sectionId
        ? container.querySelector(`#${CSS.escape(sectionId)}`)
        : null;

      const scope = sectionEl || container;

      // Remove active only inside this scope
      scope.querySelectorAll(".tabs .tab").forEach((tab) => {
        tab.classList.remove("active");
      });

      const activeTab = scope.querySelector(
        `.tabs .tab[data-tab="${tabName}"]`
      );
      if (activeTab) {
        activeTab.classList.add("active");
      }

      scope.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      const activeContent = scope.querySelector(
        `[data-tab-content="${tabName}"]`
      );
      if (activeContent) {
        activeContent.classList.add("active");
      }

      this.options.onTabSwitch(tabName);
    },

    /**
     * Render item details in model tab
     */
    renderModelDetails(item) {
      const content = container.querySelector('[data-tab-content="model-item-general"]');
      if (!content) return;

      if (!item) {
        content.innerHTML = `
          <div class="text-muted">
            Выберите элемент в дереве для просмотра информации.
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <div class="item-details">
          <h3>${item.name || "Без названия"}</h3>
          <div class="item-property">
            <strong>Тип:</strong> ${item.type || "—"}
          </div>
          <div class="item-property">
            <strong>ID:</strong> ${item.id || "—"}
          </div>
          ${
            item.documentation
              ? `
            <div class="item-property">
              <strong>Описание:</strong>
              <p>${item.documentation}</p>
            </div>
          `
              : ""
          }
          ${
            item.elements && item.elements.length > 0
              ? `
            <div class="item-property">
              <strong>Элементы:</strong> ${item.elements.length}
            </div>
          `
              : ""
          }
        </div>
      `;
    },


    /**
     * Render item details in profile tab
     */
    renderProfileDetails(item) {

      const content = container.querySelector('[data-tab-content="profile-item-general"]');
      if (!content) return;

      if (!item) {
        content.innerHTML = `
          <div class="text-muted">
            Выберите элемент профиля для просмотра информации.
          </div>
        `;
        return;
      }

      content.innerHTML = renderProfileItemForm(item);

      // content.innerHTML = `
      //   <div class="item-details">
      //     <h3>${item.name || "Без названия"}</h3>
      //     <div class="item-property">
      //       <strong>Включено в профиль</strong>
      //     </div>
      //     ${item.documentation ? `
      //       <div class="item-property">
      //         <strong>Описание: </strong>
      //         <p>${item.documentation}</p>
      //       </div>
      //     ` : ""}
      //     ${item.elements && item.elements.length > 0 ? `
      //       <div class="item-property">
      //         <strong>Элементы:</strong> ${item.elements.length}
      //       </div>
      //     ` : ""}
      //     <div class="item-actions" style="margin-top: 15px">
      //       <button class="btn btn-secondary btn-small" onclick="alert('Редактирование в разработке')">
      //         ✏️ Редактировать
      //       </button>
      //       <button class="btn btn-danger btn-small" onclick="alert('Удаление в разработке')">
      //         🗑️ Удалить из профиля
      //       </button>
      //     </div>
      //   </div>
      // `;
    },



    /**
     * Clear details
     */
    clear() {
      this.renderModelDetails(null);
      this.renderProfileDetails(null);
    },

    /**
     * Destroy component
     */
    destroy() {
      console.log("Details panel destroyed");
    },
  };

  // Initialize on creation
  instance.init();

  return instance;
}



/**
 * Render attributes table
 */
// todo - не проверял
export function renderAttributesTable(attributes) {
  if (!attributes || attributes.length === 0) {
    return `
      <div class="attributes-table-empty">
        Нет атрибутов
      </div>
    `;
  }

  let html = `
    <div class="attributes-table">
      <div class="attributes-table-header">
        <div>☑️</div>
        <div>Имя</div>
        <div>Тип</div>
        <div>Множ.</div>
        <div>Описание</div>
      </div>
  `;

  attributes.forEach((attr) => {
    html += `
      <div class="attributes-table-row">
        <div class="attributes-table-cell-checkbox">
          <input type="checkbox" class="attribute-checkbox" data-attr-id="${
            attr.id
          }">
        </div>
        <div class="attributes-table-cell">
          <strong>${attr.name || "—"}</strong>
        </div>
        <div class="attributes-table-cell">
          ${attr.dataType || "—"}
        </div>
        <div class="attributes-table-cell">
          ${attr.multiplicity || "—"}
        </div>
        <div class="attributes-table-cell">
          ${attr.documentation || "—"}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

/**
 * Render links table
 */

// todo - не проверял
export function renderLinksTable(links) {
  if (!links || links.length === 0) {
    return `
      <div class="attributes-table-empty">
        Нет связей
      </div>
    `;
  }

  let html = `
    <div class="attributes-table">
      <div class="attributes-table-header">
        <div>☑️</div>
        <div>Роль</div>
        <div>Тип</div>
        <div>Целевой класс</div>
        <div>Описание</div>
      </div>
  `;

  links.forEach((link) => {
    const icon = link.relationKind === "Generalization" ? "⬆️" : "↔️";

    html += `
      <div class="attributes-table-row">
        <div class="attributes-table-cell-checkbox">
          <input type="checkbox" class="link-checkbox" data-link-id="${
            link.linkId
          }">
        </div>
        <div class="attributes-table-cell">
          <strong>${link.targetClassRoleName || "—"}</strong>
        </div>
        <div class="attributes-table-cell">
          ${icon} ${link.relationKind || "—"}
        </div>
        <div class="attributes-table-cell">
          ${link.targetClassName || "—"}
        </div>
        <div class="attributes-table-cell">
          ${link.targetDescription || "—"}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

export function renderDetailsPanelSection({
  sectionId,
  sectionClass,
  tabsId,
  tabsHtml,
  initialTabName,
  emptyText,
}) {
  return `
    <div class="details-panel-content ${sectionClass}" id="${sectionId}">
      <div class="details-panel-header"> ${
        sectionId === "available-item-details"
          ? "Исходный объект"
          : "Редактируемый профиль"
      } </div>
      <div class="tabs" id="${tabsId}">
        ${tabsHtml}
      </div>

      <div class="tab-content active" data-tab-content="${initialTabName}">
        <div class="empty-state">
          ${emptyText}
        </div>
      </div>
    </div>
  `;
}

export function renderProfileEditorDetailsPanelLayout(
  { availableItem = null, profileItem = null } = {}
) {
  const leftTabs = renderProfileEditorDetailsTabs(availableItem, {
    section: "available",
    activeTab: "model-item-general",
  });

  const rightTabs = renderProfileEditorDetailsTabs(profileItem, {
    section: "profile",
    activeTab: "profile-item-general",
  });

  return `
    ${renderDetailsPanelSection({
      sectionId: "available-item-details",
      sectionClass: "available-item-details",
      tabsId: "available-details-tabs",
      tabsHtml: leftTabs,
      initialTabName: "model-item-general",
      emptyText: "Выберите элемент в дереве для просмотра информации.",
    })}
    <div class="divider mb-20"></div>
    ${renderDetailsPanelSection({
      sectionId: "profile-item-details",
      sectionClass: "profile-item-details",
      tabsId: "profile-details-tabs",
      tabsHtml: rightTabs,
      initialTabName: "profile-item-general",
      emptyText: "Выберите элемент профиля для просмотра информации.",
    })}
  `;
}

export function renderProfileEditorDetailsTabs(
  item,
  { section = "available", activeTab } = {}
) {
  const type = item?.type ?? null;

  const isUnknown = !type;
  const isPackage = type === "Package";
  const isEnumeration = type === "Enumeration";

  const generalTabName = section === "profile" ? "profile-item-general" : "model-item-general";
  const resolvedActiveTab = activeTab || generalTabName;

  const tabs = [
    { name: generalTabName, label: "Общая информация", id: item?.id || "" },
  ];

  if (isUnknown) {
    tabs.push(
      { name: "object-attributes", label: "Атрибуты", id: item?.id || "" },
      { name: "object-links", label: "Связи", id: item?.id || "" },
      { name: "object-enumeration", label: "Значения перечисления", id: item?.id || "" }
    );
  } else if (isPackage) {
    // только общая информация
  } else if (isEnumeration) {
    tabs.push({ name: "object-enumeration", label: "Значения перечисления", id: item?.id || "" });
  } else {
    tabs.push(
      { name: "object-attributes", label: "Атрибуты", id: item?.id || "" },
      { name: "object-links", label: "Связи", id: item?.id || "" }
    );
  }

  let html = `<div class="section-header">
        <div class="section-tabs">
  `;

  html += tabs
    .map(
      (t) =>
        `<div class="tab ${t.name === resolvedActiveTab ? "active" : ""}" data-tab="${t.name}" data-item-id="${t.id}">${t.label}</div>`
    )
    .join("\n");

    return html += `
        </div>
        </div>
  `
}

function renderProfileItemForm(item) {
  let html =
   `
    <form class="item-form" id="profile-item-form" data-item-id="${item.id}">
      <div class="form-section">
        <div class="form-section-title">
          <div class="form-row">
            <div class="form-cell">
              <div class="form-group form-group__line">
                <label class="form-label form-label__title" for="profile-item-name">Класс *</label>
                <input type="text" id="profile-item-name" class="form-input form-input__short"
                       value="${item.name || ''}" required disabled />
              </div>
            </div>

            <div class="form-cell form-cell__line">`
             if (item.type === "Class" || item.type === "Enumeration") { html += `
              <div class="form-group">
                <label class="form-checkbox-label">
                  <span>Абстрактный класс</span>
                  <input type="checkbox" id="profile-item-isAbstract" class="form-checkbox"
                         ${item.isAbstract ? 'checked' : ''} disabled />
                </label>
              </div>
              <div class="form-group form-group__line">
                <label class="form-label" for="profile-item-stereotype">Стереотип</label>
                <input type="text" id="profile-item-stereotype" class="form-input"
                       value="${item.stereotype || ''}" placeholder="Например: rs, rf" disabled />
              </div>
            </div>`
              } else html += `
            </div>`;
        html += `
          </div>
        </div>

        <div class="form-row">
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label" for="profile-item-documentation">Описание</label>
              <textarea id="profile-item-documentation" class="form-textarea" rows="3" disabled>${item.documentation || ''}</textarea>
            </div>
          </div>
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label" for="profile-item-documentationRu">Описание (RU)</label>
              <textarea id="profile-item-documentationRu" class="form-textarea" rows="3">${item.documentationRu || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label" for="profile-item-details">Детали</label>
              <textarea id="profile-item-details" class="form-textarea" rows="4">${item.details || ''}</textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary  btn--class-details">💾 Сохранить изменения</button>
        <button type="button" class="btn btn-secondary btn--class-details" id="cls-cancel-btn">↩️ Отмена</button>
      </div>
    </form>
  `;

  return html;
}

