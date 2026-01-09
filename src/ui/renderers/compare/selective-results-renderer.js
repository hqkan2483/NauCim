import { esc } from "../../../utils/text-utils.js";

export function renderSelectiveResultsList(object1, object2, results) {
  if (!Array.isArray(results) || results.length === 0) {
    return '<p class="text-muted">Нет результатов для отображения</p>';
  }

  let diffHtml = "";

  results.forEach((result) => {
    const statusIcon =
      result.status === "identical" ? "✅" : result.status === "not-found" ? "❌" : "⚠️";
    const statusClass =
      result.status === "identical"
        ? "diff-added"
        : result.status === "not-found"
          ? "diff-removed"
          : "badge";

    diffHtml += `
      <div class="card difference-item">
        <h4><span class="${statusClass}">${statusIcon}</span> ${esc(result.name)} (${result.type === "package" ? "Пакет" : result.type === "rootPackage" ? "Root" : "Класс"})</h4>
        <p><strong>${esc(result.message || "")}</strong></p>
    `;

    if (Array.isArray(result.differences) && result.differences.length > 0) {
      diffHtml += `
        <table class="table diff-table">
          <thead>
            <tr>
              <th>Объект и характеристика</th>
              <th>${esc(object1?.name || "")}</th>
              <th>${esc(object2?.name || "")}</th>
              <th>Тип изменения</th>
            </tr>
          </thead>
          <tbody>
      `;

      result.differences.forEach((diff) => {
        const objLabel = formatDifferenceLabel(diff);
        const value1 = formatDifferenceValue(diff.value1);
        const value2 = formatDifferenceValue(diff.value2);
        const changeType = formatChangeType(diff, object1?.name || "", object2?.name || "");

        diffHtml += `
          <tr>
            <td>${objLabel}</td>
            <td>${value1}</td>
            <td>${value2}</td>
            <td>${changeType}</td>
          </tr>
        `;
      });

      diffHtml += `
          </tbody>
        </table>
      `;
    }

    diffHtml += `</div>`;
  });

  return diffHtml;
}

function formatDifferenceLabel(diff) {
  if (!diff) return "";

  if (diff.field === "attributes") {
    if (diff.type === "missing" || diff.type === "added") {
      return `Атрибут "${esc(diff.value1 || diff.value2)}"`;
    }

    const attrName = extractAttributeName(diff.message);

    if (diff.type === "type") return `Атрибут "${attrName}": тип данных`;
    if (diff.type === "multiplicity") return `Атрибут "${attrName}": кратность`;
    if (diff.type === "description") return `Атрибут "${attrName}": описание`;
    if (diff.type === "description_ru") return `Атрибут "${attrName}": описание (рус)`;
  }

  if (diff.field === "links") {
    if (diff.type === "missing" || diff.type === "added") {
      const linkInfo = extractLinkInfo(diff.value1 || diff.value2);
      return `Связь "${esc(linkInfo.target)}"`;
    }

    const linkName = extractLinkName(diff.message);
    if (diff.type === "description") return `Связь "${linkName}": описание`;
    if (diff.type === "target_description") return `Связь "${linkName}": целевой класс`;
  }

  return `Свойство "${esc(diff.field)}"`;
}

function extractAttributeName(message) {
  const match = String(message || "").match(/Атрибут "([^"]+)"/);
  return match ? esc(match[1]) : "";
}

function extractLinkName(message) {
  const match = String(message || "").match(/Связь "([^"]+)"/);
  return match ? esc(match[1]) : "";
}

function extractLinkInfo(valueStr) {
  if (!valueStr) return { target: "" };
  // Format: "role → TargetClass (kind)"
  const match = String(valueStr).match(/(.+?)\s*→\s*(.+?)\s*\(/);
  if (match) return { role: match[1], target: match[2] };
  return { target: String(valueStr) };
}

function formatDifferenceValue(value) {
  if (value === null || value === undefined || value === "(отсутствует)") {
    return '<span class="diff-value-muted">отсутствует</span>';
  }
  if (value === "" || value === "(пусто)") {
    return '<span class="diff-value-muted">(пусто)</span>';
  }
  return esc(String(value));
}

function formatChangeType(diff, obj1Name, obj2Name) {
  if (diff.type === "missing") return `Присутствует только в ${esc(obj1Name)}`;
  if (diff.type === "added") return `Присутствует только в ${esc(obj2Name)}`;
  if (diff.type === "count") return "Изменено количество";
  return "Изменено значение";
}
