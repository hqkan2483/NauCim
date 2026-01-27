/**
 * Profile editor details tables renderer
 * Pure rendering functions (no DOM operations)
 */

import { esc } from "../../utils/text-utils.js";

/**
 * Render attributes table.
 *
 * @param {Array} attributes
 * @param {{ selectable?: boolean }} [options]
 * @returns {string}
 */
export function renderAttributesTable(attributes, options = {}) {
  if (!Array.isArray(attributes) || attributes.length === 0) {
    return `<div class="attributes-table-empty">Нет атрибутов</div>`;
  }

  const selectable = options?.selectable !== false;

  let html = `
    <div class="attributes-table">
      <div class="attributes-table-header">
        <div>${selectable ? "☑️" : ""}</div>
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
          ${selectable ? `<input type="checkbox" class="attribute-checkbox" data-attr-id="${id}">` : ""}
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
 * Render links table.
 *
 * @param {Array} links
 * @param {{ selectable?: boolean }} [options]
 * @returns {string}
 */
export function renderLinksTable(links, options = {}) {
  if (!Array.isArray(links) || links.length === 0) {
    return `
      <div class="attributes-table-empty">
        Нет связей
      </div>
    `;
  }

  const selectable = options?.selectable !== false;

  let html = `
    <div class="links-table">
      <div class="links-table-header">
        <div>${selectable ? "☑️" : ""}</div>
        <div>Роль</div>
        <div>Тип</div>
        <div>Целевой класс</div>
        <div>Мн.</div>
        <div>Описание</div>
      </div>
  `;

  links.forEach((link) => {
    const icon = link?.relationKind === "Generalization" ? "⬆️" : "↔️";

    const linkId = esc(link?.linkId ?? "");
    const targetClassRoleName = esc(link?.targetClassRoleName ?? "—");
    const relationKind = esc(link?.relationKind ?? "—");
    const targetClassName = esc(link?.targetClassName ?? "—");
    const multiplicity = esc(link?.multiplicity ?? "—");
    const targetDescription = esc(link?.targetDescription ?? "—");

    html += `
      <div class="links-table-row">
        <div class="links-table-cell-checkbox">
          ${selectable ? `<input type="checkbox" class="link-checkbox" data-link-id="${linkId}">` : ""}
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
