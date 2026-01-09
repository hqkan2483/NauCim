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
      const content = container.querySelector(
        '[data-tab-content="model-item-general"]'
      );
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
      const content = container.querySelector(
        '[data-tab-content="profile-item-general"]'
      );
      if (!content) return;

      if (!item) {
        content.innerHTML = `
          <div class="text-muted">
           Данный объект не найден в редактируемом профиле. Вы можете добавить его, используя кнопку "→ Перенести в профиль".
          </div>
        `;
        return;
      }

      content.innerHTML = renderProfileItemDetailsForm(item);
    },

    renderProfileAttributes(item) {
      // выбираем узел в HTML
      const content = container.querySelector(
        '[data-tab-content="profile-item-attributes"]'
      );
      if (!content) return;

      // что делать если объекта нет
      if (!item) {
        content.innerHTML = `
          <div class="text-muted">
            Объект отсутствует в профиле. Перенесите объект в профиль, чтобы работать с его атрибутами.
          </div>
        `;
        return;
      }

      content.innerHTML = renderAttributesTable(item.attributes);

    },

    renderProfileLinks(item) {
  const content = container.querySelector(
    '[data-tab-content="profile-item-links"]'
  );
  if (!content) return;

  if (!item) {
    content.innerHTML = `
      <div class="text-muted">
        Объект отсутствует в профиле. Перенесите объект в профиль, чтобы работать с его связями.
      </div>
    `;
    return;
  }

  // В данных классов связи обычно лежат в item.links
  content.innerHTML = renderLinksTable(item.links);
},

renderProfileEnumeration(item) {
  const content = container.querySelector(
    '[data-tab-content="profile-item-enumeration"]'
  );
  if (!content) return;

  if (!item) {
    content.innerHTML = `
      <div class="text-muted">
        Объект отсутствует в профиле. Перенесите объект в профиль, чтобы работать со значениями перечисления.
      </div>
    `;
    return;
  }

  if (item.type !== "Enumeration") {
    content.innerHTML = `
      <div class="text-muted">
        Значения перечисления доступны только для объектов типа "Enumeration".
      </div>
    `;
    return;
  }

  content.innerHTML = renderLiteralsTable(item.literals);
},

    /**
     * Clear details
     */
    clear() {
      this.renderModelDetails(null);
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

/**
 * Render attributes table
 */
export function renderAttributesTable(attributes) {
  if (!Array.isArray(attributes) || attributes.length === 0) {
    return `<div class="attributes-table-empty">Нет атрибутов</div>`;
  }

  let html = `
    <div class="attributes-table">
      <div class="attributes-table-header">
        <div>☑️</div>
        <div>Имя</div>
        <div>Тип</div>
        <div>Мн.</div>
        <div>Описание</div>
      </div>
  `;

  attributes.forEach((attribute) => {
    const id = esc(attribute?.id ?? "");
    const name = esc(attribute?.name ?? "—");
    const dataType = esc(attribute?.dataType ?? "—");
    const multiplicity = esc(attribute?.multiplicity ?? "—");
    const doc = esc(attribute?.documentation ?? "—");
    html += `
      <div class="attributes-table-row">
        <div class="attributes-table-cell-checkbox">
          <input type="checkbox" class="attribute-checkbox" data-attr-id="${id}">
        </div>
        <div class="attributes-table-cell">
          <strong>${name}</strong>
        </div>
        <div class="attributes-table-cell">
          ${dataType}
        </div>
        <div class="attributes-table-cell">
          ${multiplicity}
        </div>
        <div class="attributes-table-cell">
          ${doc}
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
  if (!Array.isArray(links) || links.length === 0) {
    return `
      <div class="attributes-table-empty">
        Нет связей
      </div>
    `;
  }

  let html = `
    <div class="links-table">
      <div class="links-table-header">
        <div>☑️</div>
        <div>Роль</div>
        <div>Тип</div>
        <div>Целевой класс</div>
        <div>Мн.</div>
        <div>Описание</div>
      </div>
  `;

  links.forEach((link) => {
    const icon = link.relationKind === "Generalization" ? "⬆️" : "↔️";

    const linkId = esc(link?.linkId ?? "");
    const targetClassRoleName = esc(link?.targetClassRoleName ?? "—");
    const relationKind = esc(link?.relationKind ?? "—");
    const targetClassName = esc(link?.targetClassName ?? "—");
    const multiplicity = esc(link?.multiplicity ?? "—");
    const targetDescription = esc(link?.targetDescription ?? "—");
    html += `
      <div class="links-table-row">
        <div class="links-table-cell-checkbox">
          <input type="checkbox" class="link-checkbox" data-link-id="${
            linkId
          }">
        </div>
        <div class="links-table-cell">
          <strong>${targetClassRoleName || "—"}</strong>
        </div>
        <div class="links-table-cell">
          ${icon} ${relationKind || "—"}
        </div>
        <div class="links-table-cell">
          ${targetClassName || "—"}
        </div>
        <div class="links-table-cell">
          ${multiplicity || "—"}
        </div>
        <div class="links-table-cell">
          ${targetDescription || "—"}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}


export function renderLiteralsTable(literals) {
  if (!Array.isArray(literals) || literals.length === 0) {
    return `<div class="attributes-table-empty">Нет значений перечисления</div>`;
  }

  let html = `
    <table class="table literals-table">
      <thead>
        <tr>
          <th style="width: 30%">Значение</th>
          <th style="width: 45%">Описание</th>
          <th style="width: 20%">Доп. значение</th>
        </tr>
      </thead>
      <tbody>
  `;

  literals.forEach((lit) => {
    const id = esc(lit?.id ?? "");
    const name = esc(lit?.name ?? "—");
    const doc = esc(lit?.documentation ?? "—");
    const initialValue = esc(lit?.initialValue ?? "—");

    html += `
      <tr data-literal-id="${id}">
        <td><strong>${name}</strong></td>
        <td>${doc}</td>
        <td>${initialValue}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  return html;
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
    <div class="divider mb-20"></div>
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

function renderProfileItemDetailsForm(item) {
  let html = renderItemForm(item);

  html += `
      <div class="form-actions">
        <button type="submit" class="btn btn-primary  btn--class-details" id="profile-details-save-btn">💾 Сохранить изменения</button>
        <button type="button" class="btn btn-secondary btn--class-details" id="profile-details-cancel-btn">↩️ Отмена</button>
      </div>
    </form>
  `;

  return html;
}

function renderItemForm(item) {
  let html = `
    <form class="item-form" id="profile-item-form" data-item-id="${item.id}">
      <div class="form-section">
        <div class="form-section-title">
          <div class="form-row">
            <div class="form-cell">
              <div class="form-group form-group__line">
                <label class="form-label form-label__title" for="profile-item-name">
                  ${item.type === "Enumeration" ? "Перечисление*" : item.type === "Package" ? "Пакет*" :  "Класс*"}
                </label>
                <input type="text" id="profile-item-name" class="form-input form-input__short"
                  value="${item.name || ""}" required disabled />
              </div>
            </div>

            <div class="form-cell form-cell__line">`;

  if (item.type === "Class" || item.type === "Enumeration") {
    html += `
              <div class="form-group">
                <label class="form-checkbox-label">
                  <span>Абстрактный класс</span>
                  <input type="checkbox" id="profile-item-isAbstract" class="form-checkbox"
                         ${item.isAbstract ? "checked" : ""} disabled />
                </label>
              </div>
              <div class="form-group form-group__line">
                <label class="form-label" for="profile-item-stereotype">Стереотип</label>
                <input type="text" id="profile-item-stereotype" class="form-input"
                       value="${
                         item.stereotype || ""
                       }" placeholder="Например: rs, rf" disabled />
              </div>
            </div>`;
  } else
    html += `
            </div>`;
  html += `
          </div>
        </div>

        <div class="form-row">
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label" for="profile-item-documentation">Описание</label>
              <textarea id="profile-item-documentation" class="form-textarea" rows="3" disabled>${
                item.documentation || ""
              }</textarea>
            </div>
          </div>
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label" for="profile-item-documentationRu">Описание (RU)</label>
              <textarea id="profile-item-documentationRu" class="form-textarea" rows="3">${
                item.documentationRu || ""
              }</textarea>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label" for="profile-item-addInfo">Детали</label>
              <textarea id="profile-item-addInfo" class="form-textarea" rows="4">${
                item.details || ""
              }</textarea>
            </div>
          </div>
        </div>
      </div>`;

  return html;
}
