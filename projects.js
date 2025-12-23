// Nautilus.CIM - Projects Page Script

let currentEditProjectId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadSampleData();
  updateCurrentProject();
  renderProjects();
  renderProjectsTree();
  restoreSidebarState();
  restoreProjectsTreeState();
});

let selectedProjectId = null;
let selectedModelId = null;
let selectedProfileId = null;

// Функция рендеринга списка проектов
// общий список проектов. почти как на главной
// такой же рендеринг, как и в рендеринге фильтрованных проектов ниже. функция: filterProjects
function renderProjects() {
  // Don't re-render if we're viewing project details
  if (selectedProjectId !== null) {
    return;
  }

  // все проекты
  const projects = getProjects();
  const html = projects
    .map(
      (p) => `
        <div class="project-card">
            <div class="flex-between mb-10">
                <div>
                    <div class="project-card-title" style="cursor:pointer;" onclick="viewProjectDetails(${
                      p.id
                    })">${p.name}</div>
                    <div class="project-card-meta"><span>📌</span> Версия ${
                      p.version
                    } • <span>📅</span> Создан: ${p.createdAt || "N/A"}</div>
                </div>
                <div class="project-card-actions">
                    <button class="btn btn-secondary btn-small" onclick="editProject(${
                      p.id
                    })">✏️ Изменить</button>
                    <button class="btn btn-primary btn-small" onclick="openProject(${
                      p.id
                    })">Открыть →</button>
                </div>
            </div>
            <div class="project-card-description" >
                ${p.description || "Нет описания"}
            </div>
            <div style="margin-top:15px; display:flex; gap:15px; font-size:14px;">
                <span>📋 Модели: <strong>${p.models.length}</strong></span>
                <span>⚙️ Профили: <strong>${p.profiles.length}</strong></span>
            </div>
        </div>
    `
    )
    .join("");

  document.getElementById("projects-list").innerHTML =
    html ||
    '<div style="text-align:center; color:var(--text-secondary); padding:40px;">Нет проектов</div>';
}

// Просмотр деталей проекта - скрывает перечень проектов и показывает модели и профили внутри выбранного проекта
function viewProjectDetails(projectId) {
  selectedProjectId = projectId;

  // Reset selection when switching projects
  selectedModelId = null;
  selectedProfileId = null;

  // Hide search and projects list
  document.getElementById("search-box").classList.add("hidden");
  document.getElementById("projects-list").classList.add("hidden");

  // Show models and profiles containers
  document.getElementById("models-container").classList.remove("hidden");
  document.getElementById("profiles-container").classList.remove("hidden");

  // Show open project button
  document.getElementById("open-project-action").classList.remove("hidden");

  // Clear details panels
  document.getElementById("model-details").innerHTML =
    '<div class="text-center">Выберите модель для просмотра деталей</div>';
  document.getElementById("profile-details").innerHTML =
    '<div class="text-center">Выберите профиль для просмотра деталей</div>';

  // Render project details
  renderModels(projectId);
  renderProfiles(projectId);
}

// Возврат к списку проектов. Скрывает детали проекта и показывает перечень всех проектов
function showProjectsList() {
  // Hide models and profiles containers
  document.getElementById("models-container").classList.add("hidden");
  document.getElementById("profiles-container").classList.add("hidden");

  // Hide open project button
  document.getElementById("open-project-action").classList.add("hidden");

  // Show search and projects list
  document.getElementById("search-box").classList.remove("hidden");
  document.getElementById("projects-list").classList.remove("hidden");

  selectedProjectId = null;
  selectedModelId = null;
  selectedProfileId = null;
}

// рендерит список моделей

function renderModels(projectId) {
  // получаем модели проекта - массив моделей. полная информация о моделях внутри проекта
  const models = getModels(projectId);
  // создает список моделей в html, если модель выбрана - ставим selected класс, вешаем обработчик для выбора модели.
  const html = models
    .map(
      (m) => `
        <div class="tree-item ${
          selectedModelId === m.id ? "selected" : ""
        }" onclick="selectModel(${m.id})">
            📦 ${m.name}
        </div>
    `
    )
    .join("");

  document.getElementById("models-list").innerHTML =
    html || '<div class="no-items text-muted">Нет моделей</div>';
}

// рендерит список профилей аналогично моделям
function renderProfiles(projectId) {
  const profiles = getProfiles(projectId);
  const html = profiles
    .map(
      (p) => `
        <div class="tree-item ${
          selectedProfileId === p.id ? "selected" : ""
        }" onclick="selectProfile(${p.id})">
            ⚙️ ${p.name}
        </div>
    `
    )
    .join("");

  document.getElementById("profiles-list").innerHTML =
    html || '<div class="no-items text-muted">Нет профилей</div>';
}

// обработчик выбора модели
function selectModel(modelId) {
  selectedModelId = modelId;
  renderModels(selectedProjectId);
  renderModelDetails();
}

// обработчик выбора профиля
function selectProfile(profileId) {
  selectedProfileId = profileId;
  renderProfiles(selectedProjectId);
  renderProfileDetails();
}

// Функция получения значения из legalStateList по ключу
function getLegalStateValue(key) {
  const legalStateList = [{ project: "В разработке" }];
  if (!key) return "---";

  for (const item of legalStateList) {
    if (item[key]) {
      return item[key];
    }
  }
  return "---";
}

// Функция получения значения из accessRightList по ключу
function getAccessRightValue(key) {
  const accessRightList = [
    { readOnly: "Только чтение" },
    { readWrite: "Чтение и запись" },
  ];
  if (!key) return "---";

  for (const item of accessRightList) {
    if (item[key]) {
      return item[key];
    }
  }
  return "---";
}

// рендерит подробное описание модели
function renderModelDetails() {
  const model = getModel(selectedProjectId, selectedModelId);
  if (!model) return;

  const html = `
        <div class="tabs">
            <div class="tab active">Свойства</div>
        </div>
        <div class="tab-content active">

            <table class="table model-details-table">
                <colgroup>
                    <col style="width: 15%;"/>
                    <col style="width: 15%;"/>
                    <col style="width: 15%;"/>
                    <col style="min-width: 50%;"/>
                </colgroup>
                <tr>
                    <td colspan="2">Описание</td>
                    <td colspan="2">${model.description}</td>
                </tr>
                 <tr>
                    <td colspan="2">Используется в профилях</td>
                    <td colspan="2">${
                      model.relatedProfiles && model.relatedProfiles.length > 0
                        ? model.relatedProfiles.map((p) => p.name).join(", ")
                        : "---"
                    }</td>
                </tr>
                <tr>
                    <td>Дата создания/загрузки: </td>
                    <td><span>${model.createDate || "---"}</span></td>
                    <td>Дата изменения: </td>
                    <td><span>${model.modifyDate || "---"}</span></td>
                </tr>
                <tr>
                    <td>Статус: </td>
                    <td><span>${getLegalStateValue(
                      model.legalState
                    )}</span></td>
                    <td>Права доступа: </td>
                    <td><span>${getAccessRightValue(
                      model.accessRight
                    )}</span></td>
                </tr>

            </table>
        </div>
    `;

  document.getElementById("model-details").innerHTML = html;
}

// рендерит подробное описание профиля
function renderProfileDetails() {
  const profile = getProfile(selectedProjectId, selectedProfileId);
  if (!profile) return;

  const html = `
        <div class="tabs">
            <div class="tab active">Свойства</div>
        </div>
        <div class="tab-content active">

            <table class="table profile-details-table">
                <colgroup>
                    <col style="width: 15%;"/>
                    <col style="width: 15%;"/>
                    <col style="width: 15%;"/>
                    <col style="min-width: 50%;"/>
                </colgroup>

                 <tr>
                    <td class="table-label" >Описание</td>
                    <td colspan="3">${profile.description}</td>
                </tr>
                <tr>
                    <td class="table-label">Версия</td>
                    <td  colspan="3">${profile.version}</td>
                </tr>
                <tr>
                    <td class="table-label" >Используется модель</td>
                    <td colspan="3"><span>${profile.baseModel}</span></td>
                </tr>
                <tr>
                    <td>Дата создания/загрузки: </td>
                    <td><span>${profile.createDate || "---"}</span></td>
                    <td>Дата изменения: </td>
                    <td><span>${profile.modifyDate || "---"}</span></td>
                </tr>
                <tr>
                    <td>Статус: </td>
                    <td><span>${getLegalStateValue(
                      profile.legalState
                    )}</span></td>
                    <td>Права доступа: </td>
                    <td><span>${getAccessRightValue(
                      profile.accessRight
                    )}</span></td>
                </tr>
            </table>
        </div>
    `;

  document.getElementById("profile-details").innerHTML = html;
}

//Фильтрация проектов по поисковому запросу
function filterProjects() {
  const query = document.getElementById("search-projects").value.toLowerCase();
  const projects = getProjects();
  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
  );

  // один и тот же код, что и в renderProjects, но с filtered вместо projects
  const html = filtered
    .map(
      (p) => `
      <div class="project-card">
            <div class="flex-between mb-10">
                <div>
                    <div class="project-card-title" style="cursor:pointer;" onclick="viewProjectDetails(${
                      p.id
                    })">${p.name}</div>
                    <div class="project-card-meta"><span>📌</span> Версия ${
                      p.version
                    } • <span>📅</span> Создан: ${p.createdAt || "N/A"}</div>
                </div>
                <div class="project-card-actions">
                    <button class="btn btn-secondary btn-small" onclick="editProject(${
                      p.id
                    })">✏️ Изменить</button>
                    <button class="btn btn-primary btn-small" onclick="openProject(${
                      p.id
                    })">Открыть →</button>
                </div>
            </div>
            <div class="project-card-description" >
                ${p.description || "Нет описания"}
            </div>
            <div style="margin-top:15px; display:flex; gap:15px; font-size:14px;">
                <span>📋 Модели: <strong>${p.models.length}</strong></span>
                <span>⚙️ Профили: <strong>${p.profiles.length}</strong></span>
            </div>
        </div>
    `
    )
    .join("");

  document.getElementById("projects-list").innerHTML =
    html ||
    '<div style="text-align:center; color:var(--text-secondary); padding:40px;">Проекты не найдены</div>';
}

// создание нового проекта
function createProject() {
  const name = document.getElementById("project-name").value.trim();
  if (!name) {
    alert("Введите название проекта");
    return;
  }

  const projects = getProjects();
  const newProject = {
    id: Math.max(...projects.map((p) => p.id), 0) + 1,
    name: name,
    description: document.getElementById("project-desc").value,
    version: document.getElementById("project-version").value,
    createdAt: new Date().toISOString().split("T")[0],
    models: [],
    profiles: [],
  };

  projects.push(newProject);
  saveProjects(projects);
  closeModal("new-project-modal");

  // Clear form
  document.getElementById("project-name").value = "";
  document.getElementById("project-desc").value = "";
  document.getElementById("project-version").value = "1.0";

  renderProjects();
  renderProjectsTree();
  alert("Проект успешно создан!");
}

// редактирование описания существующего проекта
function editProject(projectId) {
  currentEditProjectId = projectId;
  const project = getProject(projectId);

  document.getElementById("edit-project-name").value = project.name;
  document.getElementById("edit-project-desc").value =
    project.description || "";
  document.getElementById("edit-project-version").value = project.version;

  openModal("edit-project-modal");
}

// сохранение изменений после редактирования проекта
function saveProjectEdit() {
  if (!currentEditProjectId) return;

  const projects = getProjects();
  const project = projects.find((p) => p.id === currentEditProjectId);

  project.name = document.getElementById("edit-project-name").value;
  project.description = document.getElementById("edit-project-desc").value;
  project.version = document.getElementById("edit-project-version").value;

  saveProjects(projects);
  closeModal("edit-project-modal");
  renderProjects();
  renderProjectsTree();
  alert("Проект успешно обновлён!");
}

// открывает страницу проекта по его id
function openProject(projectId) {
  setCurrentProject(projectId);
  window.location.href = "project-details.html";
}

// открываает страницу текущего проекта
function openCurrentProject() {
  if (selectedProjectId) {
    setCurrentProject(selectedProjectId);
    window.location.href = "project-details.html";
  }
}

// Sidebar toggle functionality
// Функции переведены в sidebar.js

function selectProject(projectId) {
  // Если мы на странице projects.html, показать детали проекта
  if (window.location.pathname.includes("projects.html")) {
    viewProjectDetails(projectId);
    return;
  }

  // Сохранить выбранный проект
  setCurrentProject(projectId);

  // Обновить отображение
  updateCurrentProject();
  renderProjects();
  renderProjectsTree();
}
