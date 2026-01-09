/**
 * Profile Editor Details Panel Component
 * Manages the details panel with tabs
 */

import {
  renderAttributesTable,
  renderLinksTable,
  renderLiteralsTable,
} from "../renderers/profile-editor-details-tables-renderer.js";
import {
  renderModelItemDetailsForm,
  renderProfileItemDetailsForm,
} from "../renderers/profile-editor-item-form-renderer.js";

export { renderAttributesTable, renderLinksTable, renderLiteralsTable };

function renderEmpty(text) {
  return `
    <div class="text-muted">
      ${text}
    </div>
  `;
}

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

  const TAB_RENDERERS = {
    "model-item-general": (item) =>
      item
        ? renderModelItemDetailsForm(item)
        : renderEmpty("Выберите элемент в дереве для просмотра информации."),

    "model-item-attributes": (item) =>
      item
        ? renderAttributesTable(item.attributes)
        : renderEmpty("Выберите элемент в дереве для просмотра атрибутов."),

    "model-item-links": (item) =>
      item
        ? renderLinksTable(item.links)
        : renderEmpty("Выберите элемент в дереве для просмотра связей."),

    "model-item-enumeration": (item) => {
      if (!item) {
        return renderEmpty(
          "Выберите элемент в дереве для просмотра значений перечисления."
        );
      }
      if (item.type !== "Enumeration") {
        return renderEmpty(
          'Значения перечисления доступны только для объектов типа "Enumeration".'
        );
      }
      return renderLiteralsTable(item.literals);
    },

    "profile-item-general": (item) =>
      item
        ? renderProfileItemDetailsForm(item)
        : renderEmpty(
            'Данный объект не найден в редактируемом профиле. Вы можете добавить его, используя кнопку "→ Перенести в профиль".'
          ),

    "profile-item-attributes": (item) =>
      item
        ? renderAttributesTable(item.attributes)
        : renderEmpty(
            "Объект отсутствует в профиле. Перенесите объект в профиль, чтобы работать с его атрибутами."
          ),

    "profile-item-links": (item) =>
      item
        ? renderLinksTable(item.links)
        : renderEmpty(
            "Объект отсутствует в профиле. Перенесите объект в профиль, чтобы работать с его связями."
          ),

    "profile-item-enumeration": (item) => {
      if (!item) {
        return renderEmpty(
          "Объект отсутствует в профиле. Перенесите объект в профиль, чтобы работать со значениями перечисления."
        );
      }
      if (item.type !== "Enumeration") {
        return renderEmpty(
          'Значения перечисления доступны только для объектов типа "Enumeration".'
        );
      }
      return renderLiteralsTable(item.literals);
    },
  };

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

    renderTabContent(tabName, item) {
      const content = container.querySelector(`[data-tab-content="${tabName}"]`);
      if (!content) return;

      const renderer = TAB_RENDERERS[tabName];
      if (!renderer) {
        content.innerHTML = renderEmpty("Вкладка не поддерживается.");
        return;
      }

      content.innerHTML = renderer(item);
    },

    /**
     * Render item details in model tab
     */
    renderModelDetails(item) {
      this.renderTabContent("model-item-general", item);
    },

    renderModelAttributes(item) {
      this.renderTabContent("model-item-attributes", item);
    },

    renderModelLinks(item) {
      this.renderTabContent("model-item-links", item);
    },

    renderModelEnumeration(item) {
      this.renderTabContent("model-item-enumeration", item);
    },

    /**
     * Render item details in profile tab
     */
    renderProfileDetails(item) {
      this.renderTabContent("profile-item-general", item);
    },

    renderProfileAttributes(item) {
      this.renderTabContent("profile-item-attributes", item);
    },

    renderProfileLinks(item) {
      this.renderTabContent("profile-item-links", item);
},

renderProfileEnumeration(item) {
      this.renderTabContent("profile-item-enumeration", item);
},

    /**
     * Clear details
     */
    clear() {
      this.renderModelDetails(null);
      this.renderModelAttributes(null);
      this.renderModelLinks(null);
      this.renderModelEnumeration(null);
      this.renderProfileDetails(null);
      this.renderProfileAttributes(null);
      this.renderProfileLinks(null);
      this.renderProfileEnumeration(null);
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

// рендерит секцию панели деталей с вкладками

export function renderDetailsPanelSection({
  sectionId,
  sectionClass,
  tabsId,
  tabsHtml,
  initialTabName,
  emptyText,
  tabContentNames = [initialTabName],
}) {
  const uniqueTabs = Array.from(new Set(tabContentNames));

  return `
    <div class="details-panel-content ${sectionClass}" id="${sectionId}">
      <div class="details-panel-header">
        ${
          sectionId === "available-item-details"
            ? "Исходный объект"
            : "Редактируемый профиль"
        }
      </div>

      <div class="tabs" id="${tabsId}">
        ${tabsHtml}
      </div>

      ${uniqueTabs
        .map(
          (tabName) => `
            <div class="tab-content ${
              tabName === initialTabName ? "active" : ""
            }" data-tab-content="${tabName}">
              <div class="empty-state">${emptyText}</div>
            </div>
          `
        )
        .join("")}

        ${sectionId === "available-item-details" ? `
          <div class="details-panel-footer">

            <button type="button" class="btn btn-primary btn--class-details" id="transfer-to-profile-btn">→ Перенести в профиль</button>
            <button type="button" class="btn btn-primary btn--class-details" id="edit-profile-btn"> Редактировать в модели </button>

            <button type="button" class="btn btn-primary btn--class-details" id="show-in-profile-btn"> Показать в профиле </button>
            </div>

          </div>
        ` : `<div class="details-panel-footer">

             <button type="button" class="btn btn-primary btn--class-details" id="show-in-model-btn"> Показать в модели </button>

          </div>`}

    </div>
  `;
}

export function renderProfileEditorDetailsPanelLayout({
  availableItem = null,
  profileItem = null,
} = {}) {
  const leftTabContentNames = [
    "model-item-general",
    "model-item-attributes",
    "model-item-links",
    "model-item-enumeration",
  ];

  const rightTabContentNames = [
    "profile-item-general",
    "profile-item-attributes",
    "profile-item-links",
    "profile-item-enumeration",
  ];

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
      tabContentNames: leftTabContentNames,
    })}
    <div class="divider divider--details-panel mb-20"></div>
    ${renderDetailsPanelSection({
      sectionId: "profile-item-details",
      sectionClass: "profile-item-details",
      tabsId: "profile-details-tabs",
      tabsHtml: rightTabs,
      initialTabName: "profile-item-general",
      emptyText: "Выберите элемент профиля для просмотра информации.",
      tabContentNames: rightTabContentNames,
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

  const generalTabName =
    section === "profile" ? "profile-item-general" : "model-item-general";

  const attributeTabName =
    section === "profile" ? "profile-item-attributes" : "model-item-attributes";
  const resolvedActiveTab = activeTab || generalTabName;
  const linksTabName =
    section === "profile" ? "profile-item-links" : "model-item-links";
  const enumerationTabName =
    section === "profile"
      ? "profile-item-enumeration"
      : "model-item-enumeration";

  const tabs = [
    { name: generalTabName, label: "Общая информация", id: item?.id || "" },
  ];

  if (isUnknown) {
    tabs.push(
      { name: attributeTabName, label: "Атрибуты", id: item?.id || "" },
      { name: linksTabName, label: "Связи", id: item?.id || "" },
      {
        name: enumerationTabName,
        label: "Значения перечисления",
        id: item?.id || "",
      }
    );
  } else if (isPackage) {
    // только общая информация
  } else if (isEnumeration) {
    tabs.push({
      name: enumerationTabName,
      label: "Значения перечисления",
      id: item?.id || "",
    });
  } else {
    tabs.push(
      { name: attributeTabName, label: "Атрибуты", id: item?.id || "" },
      { name: linksTabName, label: "Связи", id: item?.id || "" }
    );
  }

  let html = `<div class="section-header">
        <div class="section-tabs">
  `;

  html += tabs
    .map(
      (t) =>
        `<div class="tab ${
          t.name === resolvedActiveTab ? "active" : ""
        }" data-tab="${t.name}" data-item-id="${t.id}">${t.label}</div>`
    )
    .join("\n");

  return (html += `
        </div>
        </div>
  `);
}
