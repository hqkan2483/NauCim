/**
 * Profile editor item form renderer
 * Pure rendering functions (no DOM operations)
 */

import { esc } from "../../utils/text-utils.js";

function renderItemFormInner(item, { isProfile }) {
  const name = esc(item?.name ?? "");
  const documentation = esc(item?.documentation ?? "");
  const documentationRu = esc(item?.documentationRu ?? "");
  const details = esc(item?.details ?? "");
  const stereotype = esc(item?.stereotype ?? "");
  const isAbstract = Boolean(item?.isAbstract);

  const idPrefix = isProfile ? "profile-item" : "model-item";
  const ids = {
    name: `${idPrefix}-name`,
    isAbstract: `${idPrefix}-isAbstract`,
    stereotype: `${idPrefix}-stereotype`,
    documentation: `${idPrefix}-documentation`,
    documentationRu: `${idPrefix}-documentationRu`,
    details: `${idPrefix}-addInfo`,
  };

  const formId = isProfile ? "profile-item-form" : "model-item-form";
  const itemId = esc(item?.id ?? "");

  const titleLabel =
    item?.type === "Enumeration"
      ? "Перечисление*"
      : item?.type === "Package"
        ? "Пакет*"
        : "Класс*";

  const canShowClassFields = item?.type === "Class" || item?.type === "Enumeration";

  return `
    <form class="item-form" id="${formId}" data-item-id="${itemId}">
      <div class="form-section">
        <div class="form-section-title">
          <div class="form-row">
            <div class="form-cell">
              <div class="form-group form-group__line">
                <label class="form-label form-label__title" for="${ids.name}">
                  ${titleLabel}
                </label>
                <input type="text" id="${ids.name}" class="form-input form-input__short"
                  value="${name}" required disabled />
              </div>
            </div>

            <div class="form-cell form-cell__line">
              ${
                canShowClassFields
                  ? `
              <div class="form-group">
                <label class="form-checkbox-label">
                  <span>Абстрактный класс</span>
                  <input type="checkbox" id="${ids.isAbstract}" class="form-checkbox"
                         ${isAbstract ? "checked" : ""} disabled />
                </label>
              </div>
              <div class="form-group form-group__line">
                <label class="form-label" for="${ids.stereotype}">Стереотип</label>
                <input type="text" id="${ids.stereotype}" class="form-input"
                       value="${stereotype}" placeholder="Например: rs, rf" disabled />
              </div>
            `
                  : ``
              }
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label" for="${ids.documentation}">Описание</label>
              <textarea id="${ids.documentation}" class="form-textarea" rows="3" disabled>${documentation}</textarea>
            </div>
          </div>
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label" for="${ids.documentationRu}">Описание (RU)</label>
              <textarea id="${ids.documentationRu}" class="form-textarea" rows="3" ${isProfile ? "" : "disabled"}>${documentationRu}</textarea>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label" for="${ids.details}">Детали</label>
              <textarea id="${ids.details}" class="form-textarea" rows="3" ${isProfile ? "" : "disabled"}>${details}</textarea>
            </div>
          </div>
        </div>
      </div>
    </form>
  `;
}

export function renderModelItemDetailsForm(item) {
  return renderItemFormInner(item, { isProfile: false });
}

export function renderProfileItemDetailsForm(item) {
  let html = renderItemFormInner(item, { isProfile: true });

  html = html.replace(
    "</form>",
    `
      <div class="form-actions">
        <button type="submit" class="btn btn-primary btn--class-details" id="profile-details-save-btn">💾 Сохранить изменения</button>
        <button type="button" class="btn btn-secondary btn--class-details" id="profile-details-cancel-btn">↩️ Отмена</button>
      </div>
    </form>
    `
  );

  return html;
}
