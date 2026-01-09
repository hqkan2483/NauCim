import {
  appDataInit,
  getAllProjects,
  getProjectById,
  getCurrentProject,
} from "../../../services/project-service.js";
import { esc } from "../../../utils/text-utils.js";
import { renderSelectiveTree } from "../../../ui/renderers/compare/selective-tree-renderer.js";
import { renderSelectiveResultsList } from "../../../ui/renderers/compare/selective-results-renderer.js";

// ============================================================
// STATE
// ============================================================
let lastComparisonResults = null;

let selectiveExpanded = new Set();
let selectiveSelected = new Set();
let selectiveDiffKeys = new Set();

let currentObject1 = null;
let currentObject2 = null;

let selectiveKeyIndex1 = new Map();
let selectiveKeyIndex2 = new Map();

// ============================================================
// INIT
// ============================================================
export async function initComparePage() {
  await appDataInit();

  updateCurrentProjectDisplay();
  loadAllObjectOptions();
  bindEvents();

  // Apply initial mode (default checked)
  const checked = document.querySelector('input[name="compareMode"]:checked');
  applyMode(checked ? checked.value : "full");

  console.log("Compare Page Module Loaded");
}

// ============================================================
// UI
// ============================================================
function updateCurrentProjectDisplay() {
  const currentProjectEl = document.getElementById("current-project");
  if (!currentProjectEl) return;
  const project = getCurrentProject();
  if (project) {
    currentProjectEl.classList.remove("sidebar__section-info");
    currentProjectEl.classList.add("sidebar__section-data");
    currentProjectEl.innerHTML = `<span>${esc(project.name)}</span>`;
  } else {
    currentProjectEl.classList.remove("sidebar__section-data");
    currentProjectEl.classList.add("sidebar__section-info");
    currentProjectEl.innerHTML = `<span>Нет проекта</span>`;
  }
}

function bindEvents() {
  // Compare buttons
  document.getElementById("compare-btn")?.addEventListener("click", compareProfiles);
  document
    .getElementById("compare-btn-top")
    ?.addEventListener("click", compareProfiles);

  // Show results
  document
    .getElementById("show-results-btn")
    ?.addEventListener("click", showComparisonResults);

  // Save results
  document
    .getElementById("save-results-btn")
    ?.addEventListener("click", saveComparisonResults);

  // Mode radios
  const radios = document.querySelectorAll('input[name="compareMode"]');
  radios.forEach((r) => {
    r.addEventListener("change", (e) => applyMode(e.target.value));
  });

  // Object selection changes
  const profile1Select = document.getElementById("profile1");
  const profile2Select = document.getElementById("profile2");

  profile1Select?.addEventListener("change", () => {
    // Object 1 change invalidates selection/index
    resetSelectiveState();
    const mode = getSelectedMode();
    if (mode === "selective" || mode === "analysis") applyMode(mode);
  });

  profile2Select?.addEventListener("change", () => {
    const mode = getSelectedMode();
    if (mode === "analysis") applyMode("analysis");
  });

  // Delegated tree events
  const objOneContent = document.getElementById("compare-object-one-content");
  const objTwoContent = document.getElementById("compare-object-two-content");

  objOneContent?.addEventListener("click", (e) => handleTreeClick(e, "one"));
  objTwoContent?.addEventListener("click", (e) => handleTreeClick(e, "two"));

  objOneContent?.addEventListener("change", (e) => handleTreeChange(e, "one"));
  objTwoContent?.addEventListener("change", (e) => handleTreeChange(e, "two"));
}

function getSelectedMode() {
  return document.querySelector('input[name="compareMode"]:checked')?.value || "full";
}

function applyMode(mode) {
  const objOneContent = document.getElementById("compare-object-one-content");
  const objTwoContent = document.getElementById("compare-object-two-content");

  if (!objOneContent || !objTwoContent) return;

  if (mode === "full") {
    objOneContent.classList.add("hidden");
    objOneContent.innerHTML = "";
    objTwoContent.classList.add("hidden");
    objTwoContent.innerHTML = "";
    return;
  }

  if (mode === "selective") {
    const obj1 = parseSelectedObject("profile1");
    if (!obj1) {
      alert("Выберите объект 1 для выборочного сравнения");
      objOneContent.classList.add("hidden");
      objOneContent.innerHTML = "";
      objTwoContent.classList.add("hidden");
      objTwoContent.innerHTML = "";
      return;
    }

    currentObject1 = obj1;
    currentObject2 = null;

    objOneContent.classList.remove("hidden");
    objOneContent.innerHTML = renderObjectTreePanel(obj1, "one");

    objTwoContent.classList.add("hidden");
    objTwoContent.innerHTML = "";
    return;
  }

  if (mode === "analysis") {
    const obj1 = parseSelectedObject("profile1");
    const obj2 = parseSelectedObject("profile2");

    if (!obj1 || !obj2) {
      alert("Выберите оба объекта для режима анализа");
      objOneContent.classList.add("hidden");
      objOneContent.innerHTML = "";
      objTwoContent.classList.add("hidden");
      objTwoContent.innerHTML = "";
      return;
    }

    currentObject1 = obj1;
    currentObject2 = obj2;

    objOneContent.classList.remove("hidden");
    objOneContent.innerHTML = renderObjectTreePanel(obj1, "one");

    objTwoContent.classList.remove("hidden");
    objTwoContent.innerHTML = renderObjectTreePanel(obj2, "two");

    return;
  }
}

function renderObjectTreePanel(obj, side) {
  const state = {
    expandedKeys: selectiveExpanded,
    selectedKeys: side === "one" ? selectiveSelected : new Set(),
    diffKeys: selectiveDiffKeys,
  };

  const rendered = renderSelectiveTree(obj, state);
  if (side === "one") selectiveKeyIndex1 = rendered.keyIndex;
  if (side === "two") selectiveKeyIndex2 = rendered.keyIndex;

  return `
    <div class="card">
      <div class="editor-panel-content">${rendered.html}</div>
    </div>
  `;
}

function handleTreeClick(event, side) {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;

  const expandEl = target.closest('[data-action="toggle-expand"]');
  if (expandEl) {
    const key = expandEl.getAttribute("data-key");
    if (!key) return;

    // Render full tree once; then toggle UI state without re-rendering.
    const isExpanded = selectiveExpanded.has(key);
    if (isExpanded) selectiveExpanded.delete(key);
    else selectiveExpanded.add(key);

    const containerId = side === "one" ? "compare-object-one-content" : "compare-object-two-content";
    const container = document.getElementById(containerId);
    if (!container) return;

    const cssEscape =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape
        : (v) => String(v).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");

    const children = container.querySelector(`[data-children-for="${cssEscape(key)}"]`);
    if (children) {
      children.classList.toggle("collapsed", isExpanded);
      // Update arrow icon (only if there are children)
      expandEl.textContent = isExpanded ? "▸" : "▾";
    }

    event.stopPropagation();
  }
}

function handleTreeChange(event, side) {
  if (side !== "one") return; // selection currently only used for object 1

  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;

  const checkbox = target.closest('input[data-action="toggle-check"]');
  if (!checkbox) return;

  const key = checkbox.getAttribute("data-key");
  if (!key) return;

  if (checkbox instanceof HTMLInputElement) {
    if (checkbox.checked) selectiveSelected.add(key);
    else selectiveSelected.delete(key);
  }

  event.stopPropagation();
}

function resetSelectiveState() {
  selectiveExpanded = new Set();
  selectiveSelected = new Set();
  selectiveDiffKeys = new Set();
  selectiveKeyIndex1 = new Map();
  selectiveKeyIndex2 = new Map();
  lastComparisonResults = null;

  document.getElementById("show-results-btn")?.classList.add("hidden");
  document.getElementById("comparison-results")?.classList.add("hidden");
}

// ============================================================
// OPTIONS
// ============================================================
function loadAllObjectOptions() {
  const projects = getAllProjects();

  let options = '<option value="">-- Выберите объект --</option>';

  projects.forEach((project) => {
    if (Array.isArray(project.models) && project.models.length > 0) {
      options += `<optgroup label="${esc(project.name)} - Модели">`;
      project.models.forEach((model) => {
        options += `<option value="${encodeOptionValue({ objectType: "model", projectId: project.id, objectId: model.id })}">${esc(model.name)} (${esc(model.type || "")})</option>`;
      });
      options += "</optgroup>";
    }

    if (Array.isArray(project.profiles) && project.profiles.length > 0) {
      options += `<optgroup label="${esc(project.name)} - Профили">`;
      project.profiles.forEach((profile) => {
        const v = profile.version ? ` v${profile.version}` : "";
        options += `<option value="${encodeOptionValue({ objectType: "profile", projectId: project.id, objectId: profile.id })}">${esc(profile.name)}${esc(v)}</option>`;
      });
      options += "</optgroup>";
    }
  });

  const sel1 = document.getElementById("profile1");
  const sel2 = document.getElementById("profile2");

  if (sel1) sel1.innerHTML = options;
  if (sel2) sel2.innerHTML = options;
}

function encodeOptionValue(payload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function decodeOptionValue(value) {
  try {
    if (!value) return null;
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

function parseSelectedObject(selectId) {
  const value = document.getElementById(selectId)?.value || "";
  const parsed = decodeOptionValue(value);
  if (!parsed) return null;

  const { objectType, projectId, objectId } = parsed;
  if (!objectType || !projectId || !objectId) return null;

  const project = getProjectById(projectId);
  if (!project) return null;

  if (objectType === "model") {
    const model = project.models?.find((m) => String(m.id) === String(objectId));
    if (!model) return null;
    return {
      ...model,
      objectType: "model",
      projectId: String(projectId),
      projectName: project.name,
    };
  }

  if (objectType === "profile") {
    const profile = project.profiles?.find((p) => String(p.id) === String(objectId));
    if (!profile) return null;
    return {
      ...profile,
      objectType: "profile",
      projectId: String(projectId),
      projectName: project.name,
    };
  }

  return null;
}

// ============================================================
// COMPARE
// ============================================================
function compareProfiles() {
  const object1 = parseSelectedObject("profile1");
  const object2 = parseSelectedObject("profile2");

  if (!object1 || !object2) {
    alert("Выберите два объекта для сравнения");
    return;
  }

  if (
    object1.objectType === object2.objectType &&
    String(object1.id) === String(object2.id) &&
    String(object1.projectId) === String(object2.projectId)
  ) {
    alert("Выберите разные объекты");
    return;
  }

  const mode = getSelectedMode();

  if (mode === "selective") {
    performSelectiveComparison(object1, object2);
    return;
  }

  if (mode === "analysis") {
    performAnalysisComparison(object1, object2);
    return;
  }

  renderComparison(object1, object2);
}

function performSelectiveComparison(object1, object2) {
  if (selectiveSelected.size === 0) {
    alert("Выберите элементы для сравнения в дереве объекта 1");
    return;
  }

  const results = [];
  selectiveDiffKeys.clear();

  selectiveSelected.forEach((key) => {
    const item = selectiveKeyIndex1.get(key);
    if (!item) return;

    const matchingItem = findMatchingItemInObject(item, object2);

    if (!matchingItem) {
      results.push({
        itemKey: key,
        name: item.name,
        type: item.type,
        status: "not-found",
        message: `Объект не найден в ${object2.objectType === "model" ? "модели" : "профиле"} "${object2.name}"`,
      });
      addDiffKeyWithParents(key);
      return;
    }

    const differences = compareItems(item.data, matchingItem);
    const status = differences.length > 0 ? "different" : "identical";

    results.push({
      itemKey: key,
      name: item.name,
      type: item.type,
      status,
      differences,
      message:
        differences.length === 0
          ? "Расхождений не обнаружено"
          : `Найдено расхождений: ${differences.length}`,
    });

    if (differences.length > 0) addDiffKeyWithParents(key);
  });

  lastComparisonResults = { object1, object2, results };

  // Update diff icons in-place (no re-render)
  syncTreeDiffIcons("one");

  // Show results button, keep results hidden until requested
  document.getElementById("show-results-btn")?.classList.remove("hidden");
  document.getElementById("comparison-results")?.classList.add("hidden");
}

function addDiffKeyWithParents(key) {
  if (!key) return;
  const parts = String(key).split("|");
  for (let i = 1; i <= parts.length; i += 1) {
    selectiveDiffKeys.add(parts.slice(0, i).join("|"));
  }
}

function syncTreeDiffIcons(side) {
  const containerId = side === "one" ? "compare-object-one-content" : "compare-object-two-content";
  const container = document.getElementById(containerId);
  if (!container) return;

  const rows = container.querySelectorAll('.tree-item-with-checkbox[data-key]');
  rows.forEach((row) => {
    const key = row.getAttribute("data-key") || "";
    const label = row.querySelector(".tree-item-label");
    if (!label) return;

    const existing = label.querySelector('[data-role="diff-icon"]');
    const shouldHave = selectiveDiffKeys.has(key);

    if (shouldHave && !existing) {
      label.insertAdjacentHTML(
        "beforeend",
        '<span class="tree-item-error-icon" data-role="diff-icon" title="Обнаружены различия">⚠️</span>'
      );
    }

    if (!shouldHave && existing) {
      existing.remove();
    }
  });
}

function findMatchingItemInObject(sourceItem, targetObject) {
  // Search packages/classes recursively (canonical structure only)
  const roots = Array.isArray(targetObject?.rootPackages) ? targetObject.rootPackages : [];

  // Canonical RootPackage[]
  const rootPkgs =
    roots.length > 0 && typeof roots[0] === "object" && Array.isArray(roots[0].packages)
      ? roots
      : null;

  if (rootPkgs) {
    for (const rp of rootPkgs) {
      const hit = searchPackagesForMatch(sourceItem, Array.isArray(rp.packages) ? rp.packages : []);
      if (hit) return hit;
    }
    return null;
  }

  return null;
}

function searchPackagesForMatch(sourceItem, packages) {
  if (!Array.isArray(packages)) return null;

  for (const pkg of packages) {
    if (sourceItem.type === "package" && pkg?.name === sourceItem.name) return pkg;

    const classes =
      (Array.isArray(pkg?.classes) && pkg.classes) || [];

    if (sourceItem.type === "class") {
      const match = classes.find((c) => (c?.name || c?.className) === sourceItem.name);
      if (match) return match;
    }

    const children =
      (Array.isArray(pkg?.subPackages) && pkg.subPackages) || [];

    const childHit = searchPackagesForMatch(sourceItem, children);
    if (childHit) return childHit;
  }

  return null;
}

// Compare two items and return list of differences
function compareItems(item1, item2) {
  const differences = [];
  if (!item1 || !item2) return differences;

  const compareProps = [
    "name",
    "className",
    "type",
    "description",
    "description_ru",
    "isAbstract",
    "multiplicity",
  ];

  compareProps.forEach((prop) => {
    const val1 = item1[prop];
    const val2 = item2[prop];

    if (val1 !== val2 && (val1 !== undefined || val2 !== undefined)) {
      differences.push({
        field: prop,
        type: "property",
        value1: val1 === undefined ? "(отсутствует)" : val1,
        value2: val2 === undefined ? "(отсутствует)" : val2,
        message: `Свойство "${prop}": "${val1 || "(пусто)"}" → "${val2 || "(пусто)"}"`,
      });
    }
  });

  // Attributes
  const attrs1 = Array.isArray(item1.attributes) ? item1.attributes : [];
  const attrs2 = Array.isArray(item2.attributes) ? item2.attributes : [];

  if (attrs1.length !== attrs2.length) {
    differences.push({
      field: "attributes",
      type: "count",
      value1: attrs1.length,
      value2: attrs2.length,
      message: `Количество атрибутов: ${attrs1.length} → ${attrs2.length}`,
    });
  }

  attrs1.forEach((attr1) => {
    const attr2 = attrs2.find((a) => a.name === attr1.name);
    if (!attr2) {
      differences.push({
        field: "attributes",
        type: "missing",
        value1: attr1.name,
        value2: null,
        message: `Атрибут "${attr1.name}" отсутствует во втором объекте`,
      });
      return;
    }

    if (attr1.type !== attr2.type || attr1.dataType !== attr2.dataType) {
      differences.push({
        field: "attributes",
        type: "type",
        value1: attr1.type || attr1.dataType,
        value2: attr2.type || attr2.dataType,
        message: `Атрибут "${attr1.name}": тип "${attr1.type || attr1.dataType}" → "${attr2.type || attr2.dataType}"`,
      });
    }

    if (attr1.multiplicity !== attr2.multiplicity) {
      differences.push({
        field: "attributes",
        type: "multiplicity",
        value1: attr1.multiplicity,
        value2: attr2.multiplicity,
        message: `Атрибут "${attr1.name}": кратность "${attr1.multiplicity || "(не указана)"}" → "${attr2.multiplicity || "(не указана)"}"`,
      });
    }

    const desc1 = attr1.description || "";
    const desc2 = attr2.description || "";
    if (desc1 !== desc2) {
      differences.push({
        field: "attributes",
        type: "description",
        value1: desc1,
        value2: desc2,
        message: `Атрибут "${attr1.name}": description "${desc1 || "(пусто)"}" → "${desc2 || "(пусто)"}"`,
      });
    }

    const descRu1 = attr1.description_ru || "";
    const descRu2 = attr2.description_ru || "";
    if (descRu1 !== descRu2) {
      differences.push({
        field: "attributes",
        type: "description_ru",
        value1: descRu1,
        value2: descRu2,
        message: `Атрибут "${attr1.name}": description_ru "${descRu1 || "(пусто)"}" → "${descRu2 || "(пусто)"}"`,
      });
    }
  });

  attrs2.forEach((attr2) => {
    const attr1 = attrs1.find((a) => a.name === attr2.name);
    if (!attr1) {
      differences.push({
        field: "attributes",
        type: "added",
        value1: null,
        value2: attr2.name,
        message: `Атрибут "${attr2.name}" присутствует только во втором объекте`,
      });
    }
  });

  // Links
  const links1 = Array.isArray(item1.links) ? item1.links : [];
  const links2 = Array.isArray(item2.links) ? item2.links : [];

  if (links1.length !== links2.length) {
    differences.push({
      field: "links",
      type: "count",
      value1: links1.length,
      value2: links2.length,
      message: `Количество связей: ${links1.length} → ${links2.length}`,
    });
  }

  links1.forEach((link1) => {
    const link2 = links2.find(
      (l) =>
        l.target_class_name === link1.target_class_name &&
        l.relation_kind === link1.relation_kind &&
        l.target_class_role_name === link1.target_class_role_name
    );

    if (!link2) {
      differences.push({
        field: "links",
        type: "missing",
        value1: `${link1.target_class_role_name || ""} → ${link1.target_class_name} (${link1.relation_kind})`,
        value2: null,
        message: `Связь "${link1.target_class_role_name || ""}" → "${link1.target_class_name}" (${link1.relation_kind}) отсутствует во втором объекте`,
      });
      return;
    }

    const desc1 = link1.description || "";
    const desc2 = link2.description || "";
    if (desc1 !== desc2) {
      differences.push({
        field: "links",
        type: "description",
        value1: desc1,
        value2: desc2,
        message: `Связь "${link1.target_class_role_name || ""}" → "${link1.target_class_name}": description "${desc1 || "(пусто)"}" → "${desc2 || "(пусто)"}"`,
      });
    }

    const targetDesc1 = link1.target_description || "";
    const targetDesc2 = link2.target_description || "";
    if (targetDesc1 !== targetDesc2) {
      differences.push({
        field: "links",
        type: "target_description",
        value1: targetDesc1,
        value2: targetDesc2,
        message: `Связь "${link1.target_class_role_name || ""}" → "${link1.target_class_name}": target_description "${targetDesc1 || "(пусто)"}" → "${targetDesc2 || "(пусто)"}"`,
      });
    }
  });

  links2.forEach((link2) => {
    const link1 = links1.find(
      (l) =>
        l.target_class_name === link2.target_class_name &&
        l.relation_kind === link2.relation_kind &&
        l.target_class_role_name === link2.target_class_role_name
    );

    if (!link1) {
      differences.push({
        field: "links",
        type: "added",
        value1: null,
        value2: `${link2.target_class_role_name || ""} → ${link2.target_class_name} (${link2.relation_kind})`,
        message: `Связь "${link2.target_class_role_name || ""}" → "${link2.target_class_name}" (${link2.relation_kind}) присутствует только во втором объекте`,
      });
    }
  });

  return differences;
}

function showComparisonResults() {
  if (!lastComparisonResults) return;
  const { object1, object2, results } = lastComparisonResults;

  renderSelectiveComparisonResults(object1, object2, results);

  document.getElementById("comparison-results")?.scrollIntoView({ behavior: "smooth" });
}

function renderSelectiveComparisonResults(object1, object2, results) {
  const resultsEl = document.getElementById("comparison-results");
  if (!resultsEl) return;

  resultsEl.classList.remove("hidden");

  const identical = results.filter((r) => r.status === "identical").length;
  const different = results.filter((r) => r.status === "different").length;
  const notFound = results.filter((r) => r.status === "not-found").length;

  const p1Name = document.getElementById("profile1-name");
  const p2Name = document.getElementById("profile2-name");
  if (p1Name) {
    p1Name.textContent = `${object1.name} (${object1.objectType === "model" ? "Модель" : "Профиль"})`;
  }
  if (p2Name) {
    p2Name.textContent = `${object2.name} (${object2.objectType === "model" ? "Модель" : "Профиль"})`;
  }

  const p1Details = document.getElementById("profile1-details");
  const p2Details = document.getElementById("profile2-details");

  if (p1Details) {
    p1Details.innerHTML =
      `<p><strong>Выбрано для сравнения:</strong> ${results.length} объект(ов)</p>` +
      `<p><strong>Идентичных:</strong> ${identical}</p>` +
      `<p><strong>С различиями:</strong> ${different}</p>` +
      `<p><strong>Не найдено:</strong> ${notFound}</p>`;
  }

  if (p2Details) {
    p2Details.innerHTML =
      `<p><strong>Проект:</strong> ${esc(object2.projectName)}</p>` +
      `<p><strong>Тип:</strong> ${esc(object2.objectType === "model" ? object2.type : "Профиль")}</p>`;
  }

  const diffsEl = document.getElementById("differences-list");
  if (diffsEl) {
    diffsEl.innerHTML = renderSelectiveResultsList(object1, object2, results);
  }
}

function saveComparisonResults() {
  if (!lastComparisonResults) {
    alert("Нет результатов для сохранения");
    return;
  }

  const { object1, object2, results } = lastComparisonResults;

  let reportText = `ОТЧЕТ О СРАВНЕНИИ\n`;
  reportText += `${"=".repeat(80)}\n\n`;
  reportText += `Дата сравнения: ${new Date().toLocaleString("ru-RU")}\n\n`;
  reportText += `Объект 1: ${object1.name} (${object1.objectType === "model" ? "Модель" : "Профиль"})\n`;
  reportText += `Проект: ${object1.projectName}\n\n`;
  reportText += `Объект 2: ${object2.name} (${object2.objectType === "model" ? "Модель" : "Профиль"})\n`;
  reportText += `Проект: ${object2.projectName}\n\n`;
  reportText += `${"=".repeat(80)}\n\n`;

  const identical = results.filter((r) => r.status === "identical").length;
  const different = results.filter((r) => r.status === "different").length;
  const notFound = results.filter((r) => r.status === "not-found").length;

  reportText += `СТАТИСТИКА\n`;
  reportText += `${"-".repeat(80)}\n`;
  reportText += `Всего объектов сравнено: ${results.length}\n`;
  reportText += `Идентичных: ${identical}\n`;
  reportText += `С различиями: ${different}\n`;
  reportText += `Не найдено: ${notFound}\n\n`;
  reportText += `${"=".repeat(80)}\n\n`;

  reportText += `ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ\n`;
  reportText += `${"=".repeat(80)}\n\n`;

  results.forEach((result, index) => {
    reportText += `${index + 1}. ${result.name} (${result.type === "package" ? "Пакет" : "Класс"})\n`;
    reportText += `   Статус: ${result.status === "identical" ? "Идентичен" : result.status === "not-found" ? "Не найден" : "Имеет различия"}\n`;
    reportText += `   ${result.message}\n`;

    if (Array.isArray(result.differences) && result.differences.length > 0) {
      reportText += `\n   Обнаруженные различия:\n`;
      result.differences.forEach((diff, diffIndex) => {
        reportText += `   ${diffIndex + 1}) ${diff.message}\n`;
      });
    }

    reportText += `\n${"-".repeat(80)}\n\n`;
  });

  const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comparison_${object1.name}_vs_${object2.name}_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function performAnalysisComparison() {
  alert("Режим анализа будет реализован позже");
}

function renderComparison(obj1, obj2) {
  const resultsEl = document.getElementById("comparison-results");
  if (!resultsEl) return;
  resultsEl.classList.remove("hidden");

  document.getElementById("profile1-name").textContent = `${obj1.name} (${obj1.objectType === "model" ? "Модель" : "Профиль"})`;
  document.getElementById("profile2-name").textContent = `${obj2.name} (${obj2.objectType === "model" ? "Модель" : "Профиль"})`;

  const td = (label, value) => `<tr><td class="compare-k">${esc(label)}</td><td>${esc(value)}</td></tr>`;

  document.getElementById("profile1-details").innerHTML =
    `<table class="table">` +
    td("Проект", obj1.projectName) +
    td("Тип", obj1.objectType === "model" ? obj1.type : "Профиль") +
    (obj1.objectType === "profile" && obj1.baseModel ? td("Базовая модель", obj1.baseModel) : "") +
    (obj1.version ? td("Версия", obj1.version) : "") +
    td("Классов", String(obj1.classes || 0)) +
    td("Атрибутов", String(obj1.attributes || 0)) +
    (obj1.description ? td("Описание", obj1.description) : "") +
    `</table>`;

  document.getElementById("profile2-details").innerHTML =
    `<table class="table">` +
    td("Проект", obj2.projectName) +
    td("Тип", obj2.objectType === "model" ? obj2.type : "Профиль") +
    (obj2.objectType === "profile" && obj2.baseModel ? td("Базовая модель", obj2.baseModel) : "") +
    (obj2.version ? td("Версия", obj2.version) : "") +
    td("Классов", String(obj2.classes || 0)) +
    td("Атрибутов", String(obj2.attributes || 0)) +
    (obj2.description ? td("Описание", obj2.description) : "") +
    `</table>`;

  // Current behavior: demo differences
  const differences = [
    {
      type: "added",
      text: "Класс <strong>RotatingMachineInfo</strong> присутствует только в профиле 2",
    },
    {
      type: "removed",
      text: "Класс <strong>TransformerInfo</strong> присутствует только в профиле 1",
    },
    {
      type: "modified",
      text: "Атрибут <strong>rotorGD2</strong> имеет разную множественность: [0..1] в профиле 1, [1] в профиле 2",
    },
    {
      type: "added",
      text: "Атрибут <strong>ratedVoltage</strong> добавлен в профиле 2",
    },
  ];

  const diffHtml = differences
    .map((d) => {
      const cls = d.type === "added" ? "diff-added" : d.type === "removed" ? "diff-removed" : "badge";
      const icon = d.type === "added" ? "➕" : d.type === "removed" ? "➖" : "🔄";
      return `<div class="card difference-item"><span class="${cls} difference-icon">${icon}</span>${d.text}</div>`;
    })
    .join("");

  document.getElementById("differences-list").innerHTML = diffHtml;
}
