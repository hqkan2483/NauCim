/**
 * Profile Editor Details Panel Component
 * Manages the details panel with tabs
 */

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
      defaultTab: options.defaultTab || "model",
    },
    currentTab: null,

    /**
     * Initialize panel
     */
    init() {
      this.bindEvents();

  // default: left section -> model, right section -> profile
  this.switchTab("model", "available-item-details");
  this.switchTab("profile", "profile-item-details");
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

  const activeTab = scope.querySelector(`.tabs .tab[data-tab="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.add("active");
  }

  scope.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  const activeContent = scope.querySelector(`[data-tab-content="${tabName}"]`);
  if (activeContent) {
    activeContent.classList.add("active");
  }

  this.options.onTabSwitch(tabName);
},

    /**
     * Render item details in model tab
     */
    renderModelDetails(item) {
      const content = container.querySelector('[data-tab-content="model"]');
      if (!content) return;

      if (! item) {
        content.innerHTML = `
          <div class="text-muted" style="padding: 10px 0">
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
          ${item.documentation ? `
            <div class="item-property">
              <strong>Описание:</strong>
              <p>${item.documentation}</p>
            </div>
          ` : ""}
          ${item.elements && item.elements.length > 0 ? `
            <div class="item-property">
              <strong>Элементы:</strong> ${item.elements.length}
            </div>
          ` : ""}
        </div>
      `;
    },

    /**
     * Render item details in profile tab
     */
    renderProfileDetails(item) {
      const content = container.querySelector('[data-tab-content="profile"]');
      if (!content) return;

      if (!item) {
        content.innerHTML = `
          <div class="text-muted" style="padding: 10px 0">
            Выберите элемент профиля для просмотра информации.
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <div class="item-details">
          <h3>${item.name || "Без названия"}</h3>
          <div class="item-property">
            <strong>Включено в профиль</strong>
          </div>
          ${item.documentation ? `
            <div class="item-property">
              <strong>Описание: </strong>
              <p>${item.documentation}</p>
            </div>
          ` : ""}
          ${item.elements && item.elements.length > 0 ? `
            <div class="item-property">
              <strong>Элементы:</strong> ${item.elements.length}
            </div>
          ` : ""}
          <div class="item-actions" style="margin-top: 15px">
            <button class="btn btn-secondary btn-small" onclick="alert('Редактирование в разработке')">
              ✏️ Редактировать
            </button>
            <button class="btn btn-danger btn-small" onclick="alert('Удаление в разработке')">
              🗑️ Удалить из профиля
            </button>
          </div>
        </div>
      `;
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
    }
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

  attributes.forEach(attr => {
    html += `
      <div class="attributes-table-row">
        <div class="attributes-table-cell-checkbox">
          <input type="checkbox" class="attribute-checkbox" data-attr-id="${attr.id}">
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

  links.forEach(link => {
    const icon = link.relationKind === "Generalization" ? "⬆️" : "↔️";

    html += `
      <div class="attributes-table-row">
        <div class="attributes-table-cell-checkbox">
          <input type="checkbox" class="link-checkbox" data-link-id="${link.linkId}">
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

export function renderProfileEditorDetailsPanelLayout() {
  const commonTabs = `
    <div class="tab" data-tab="object-attributes">Атрибуты</div>
    <div class="tab" data-tab="object-links">Связи</div>
    <div class="tab" data-tab="object-enumeration">Значения перечисления</div>
  `;

  const leftTabs = `
    <div class="tab active" data-tab="model">Информация об объекте модели</div>
    ${commonTabs}
  `;

  const rightTabs = `
    <div class="tab active" data-tab="profile">Информация об объекте профиля</div>
    ${commonTabs}
  `;

  return `
    ${renderDetailsPanelSection({
      sectionId: "available-item-details",
      sectionClass: "available-item-details",
      tabsId: "available-details-tabs",
      tabsHtml: leftTabs,
      initialTabName: "model",
      emptyText: "Выберите элемент в дереве для просмотра информации.",
    })}
    ${renderDetailsPanelSection({
      sectionId: "profile-item-details",
      sectionClass: "profile-item-details",
      tabsId: "details-tabs",
      tabsHtml: rightTabs,
      initialTabName: "profile",
      emptyText: "Выберите элемент профиля для просмотра информации.",
    })}
  `;
}
