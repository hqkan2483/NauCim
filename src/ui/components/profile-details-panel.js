/**
 * Profile Details Panel Component
 * Manages the details panel with tabs
 */

/**
 * Initialize details panel component
 * @param {string} containerId - Container element ID
 * @param {Object} options - Configuration options
 * @returns {Object} Details panel instance
 */
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
      this.switchTab(this.options.defaultTab);
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
      const tabs = container.querySelectorAll(".tabs .tab");
      tabs.forEach(tab => {
        tab.addEventListener("click", () => {
          const tabName = tab.getAttribute("data-tab");
          this.switchTab(tabName);
        });
      });
    },

    /**
     * Switch to a specific tab
     */
    switchTab(tabName) {
      if (this.currentTab === tabName) return;

      // Remove active from all tabs
      container.querySelectorAll(".tabs .tab").forEach(tab => {
        tab.classList.remove("active");
      });

      // Add active to selected tab
      const activeTab = container.querySelector(`.tabs .tab[data-tab="${tabName}"]`);
      if (activeTab) {
        activeTab.classList.add("active");
      }

      // Hide all tab content
      container.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
      });

      // Show selected content
      const activeContent = container.querySelector(`[data-tab-content="${tabName}"]`);
      if (activeContent) {
        activeContent.classList.add("active");
      }

      this.currentTab = tabName;
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
