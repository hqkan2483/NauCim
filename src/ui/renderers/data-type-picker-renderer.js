import { escapeHtml } from "../../utils/text-utils.js";

/**
 * Data Type Picker Renderer
 * Renders a selectable table of Class/Enumeration items.
 */

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function joinDescription(documentation, documentationRu) {
  const a = String(documentation ?? "").trim();
  const b = String(documentationRu ?? "").trim();
  if (a && b) return `${a} / ${b}`;
  return a || b || "";
}

export function renderDataTypePickerTable(
  items,
  { filter = "", selectedId = null } = {},
) {
  const f = normalizeText(filter);
  const filtered = (items || []).filter((it) =>
    normalizeText(it.name).includes(f),
  );

  if (!filtered.length) {
    return `
      <div class="info-block">
        Ничего не найдено
      </div>
    `;
  }

  const rows = filtered
    .map((it) => {
      const isSelected = selectedId && String(it.id) === String(selectedId);
      const desc = joinDescription(it.documentation, it.documentationRu);
      return `
        <tr class="data-type-picker__row${isSelected ? " is-selected" : ""}" data-item-id="${it.id}">
          <td>${escapeHtml(it.name)}</td>
          <td>${escapeHtml(it.type ?? "")}</td>
          <td>${escapeHtml(it.stereotype ?? "")}</td>
          <td class="data-type-picker__desc">${escapeHtml(desc)}</td>
        </tr>
      `;
    })
    .join("\n");

  return `
    <table class="table data-type-picker__table">
      <colgroup>
        <col style="width: 25%;"/>
        <col style="width:  15%;"/>
        <col style="width: 15%;"/>
        <col style="width: 45%;"/>
      </colgroup>
      <thead>
        <tr>
          <th>Имя</th>
          <th>Тип</th>
          <th>Стереотип</th>
          <th>Описание</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}
