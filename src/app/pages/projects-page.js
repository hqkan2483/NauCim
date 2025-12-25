import {
  getAllProjects,
  getProjectById,
  getCurrentProject,
  appDataInit,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/project-service.js";
import { getCurrentProjectId, setCurrentProjectId } from "../../state/current-project-state.js";
import { initModalSystem, bindModalTriggers, openModal, closeModal } from "../../ui/modal.js";
import { initSidebarResize, initSidebarToggle, restoreSidebarState } from "../../ui/sidebar/index.js";
import { initProjectsTree, renderProjectsTree } from "../../ui/sidebar/index.js";
import { getModels, getModel } from "../../services/model-service.js";
import { getProfiles, getProfile } from "../../services/profile-service.js";

// ============================================================
// STATE
// ============================================================
let editingProjectId = null;
let editingModelId = null;
let selectedModelId = null;
let selectedProfileId = null;
let searchQuery = "";

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize data
  await appDataInit();

  // 2. Initialize UI systems
  initModalSystem();
  bindModalTriggers(document);

  restoreSidebarState();
  initSidebarToggle();
  initSidebarResize();

  initProjectsTree({
    getProjects: getAllProjects,
    getCurrentProjectId: getCurrentProjectId,
    onProjectSelect: (projectId) => {
      selectProject(projectId);
    },
    onLabelClick: () => {
      showProjectsList();
    },
  });

  // 3. Bind page-specific events
  bindEvents();

  // 4. Initial render
  renderProjectsList();
  updateCurrentProjectDisplay();
});

// ============================================================
// EVENT BINDINGS
// ============================================================
function bindEvents() {
  // Search
  const searchInput = document.getElementById("search-projects");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value. toLowerCase();
      renderProjectsList();
    });
  }

  // Create project
  const createBtn = document.getElementById("create-project-btn");
  if (createBtn) {
    createBtn.addEventListener("click", handleCreateProject);
  }

  // Save project edit
  const saveEditBtn = document.getElementById("save-project-edit-btn");
  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", handleSaveProjectEdit);
  }

  // Open current project
  const openProjectBtn = document.getElementById("open-current-project-btn");
  if (openProjectBtn) {
    openProjectBtn.addEventListener("click", handleOpenCurrentProject);
  }

  // Back to projects list
  const backBtn = document.getElementById("back-to-projects-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showProjectsList();
    });
  }

  // // Create model
  // const createModelBtn = document.getElementById("create-model-btn");
  // if (createModelBtn) {
  //   createModelBtn.addEventListener("click", handleCreateModel);
  // }

  // // Save model edit
  // const saveModelEditBtn = document.getElementById("save-model-edit-btn");
  // if (saveModelEditBtn) {
  //   saveModelEditBtn.addEventListener("click", handleSaveModelEdit);
  // }

  // Clear modal forms on open
  document.addEventListener("modal:beforeopen", (e) => {
    const modalId = e.detail.modalId;

    if (modalId === "new-project-modal") {
      clearNewProjectModal();
    }
    // else if (modalId === "new-model-modal") {
    //   clearNewModelModal();
    // }
    // Note: edit modals are NOT cleared (they're pre-filled)
  });

  // Delegated events on projects list (open, edit, delete, select)
  const projectsListEl = document.getElementById("projects-list");
  if (projectsListEl) {
    projectsListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (! target) return;

      // Open project details page
      const openBtn = target.closest("[data-action='open-project-details']");
      if (openBtn) {
        const projectId = openBtn.getAttribute("data-project-id");
        if (projectId) {
          window.location.href = `project-details. html?id=${projectId}`;
        }
        return;
      }

      // Delete project
      const deleteBtn = target.closest("[data-action='delete-project']");
      if (deleteBtn) {
        const projectId = deleteBtn.getAttribute("data-project-id");
        if (projectId) handleDeleteProject(projectId);
        return;
      }

      // Edit project
      const editBtn = target.closest("[data-action='edit-project']");
      if (editBtn) {
        const projectId = editBtn.getAttribute("data-project-id");
        if (projectId) handleEditProject(projectId);
        return;
      }

      // Select project (click on title)
      const selectEl = target.closest("[data-action='select-project']");
      if (selectEl) {
        const projectId = selectEl.getAttribute("data-project-id");
        if (projectId) selectProject(projectId);
        return;
      }
    });
  }

  // Delegated events on models list (select, edit, delete)
  const modelsListEl = document.getElementById("models-list");
  if (modelsListEl) {
    modelsListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      // // Delete model
      // const deleteBtn = target.closest("[data-action='delete-model']");
      // if (deleteBtn) {
      //   const modelId = deleteBtn.getAttribute("data-model-id");
      //   if (modelId) handleDeleteModel(modelId);
      //   return;
      // }

      // // Edit model
      // const editBtn = target.closest("[data-action='edit-model']");
      // if (editBtn) {
      //   const modelId = editBtn.getAttribute("data-model-id");
      //   if (modelId) handleEditModel(modelId);
      //   return;
      // }

      // Select model
      const selectEl = target.closest("[data-action='select-model']");
      if (selectEl) {
        const modelId = selectEl.getAttribute("data-model-id");
        if (modelId) selectModel(modelId);
        return;
      }
    });
  }

   // Delegated events on models list (select, edit, delete)
  const profilesListEl = document.getElementById("profiles-list");
  if (profilesListEl) {
    profilesListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      // // Delete model
      // const deleteBtn = target.closest("[data-action='delete-model']");
      // if (deleteBtn) {
      //   const modelId = deleteBtn.getAttribute("data-model-id");
      //   if (modelId) handleDeleteModel(modelId);
      //   return;
      // }

      // // Edit model
      // const editBtn = target.closest("[data-action='edit-model']");
      // if (editBtn) {
      //   const modelId = editBtn.getAttribute("data-model-id");
      //   if (modelId) handleEditModel(modelId);
      //   return;
      // }

      // Select model
      const selectEl = target.closest("[data-action='select-profile']");
      if (selectEl) {
        const profileId = selectEl.getAttribute("data-profile-id");
        if (profileId) selectProfile(profileId);
        return;
      }
    });
  }
}

// ============================================================
// RENDER - PROJECTS
// ============================================================
function renderProjectsList() {
  const container = document.getElementById("projects-list");
  if (!container) return;

  const projects = getAllProjects();
  const currentProjectId = getCurrentProjectId();

  // Filter
  const filtered = projects.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery) ||
      (p.description && p.description. toLowerCase().includes(searchQuery))
    );
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-data">Проекты не найдены</div>';
    return;
  }

  const html = filtered
    .map((p) => {
      const isActive = p.id === currentProjectId;
      return `
      <div class="project-card ${isActive ? "active" : ""}" data-project-id="${
        p.id
      }">
      <div class="project-card-content">
        <div class="project-card-header">
          <div class="project-card-title"
             data-action="select-project"
             data-project-id="${p.id}">
             ${p.name}
        </div>
        </div>
        ${
          p.description
            ? `<div class="project-card-description">${p.description}</div>`
            : ""
        }
        <div class="project-card-meta">
        <div class="project-card-meta_item">
          <span>📌 Версия: ${p.version || "—"}</span>
          <span>📅 Создан: ${
            p.createDate ? new Date(p.createDate).toLocaleDateString() : "—"
          }</span>
          </div>
        <div class="project-card-meta_item">
          <span>📋 Моделей: ${p.models ? p.models.length : 0}</span>
          <span>⚙️ Профилей: ${p.profiles ? p.profiles.length : 0}</span>
          </div>
        </div>

      </div>
      <div class="project-card-actions">
        <button class="btn btn-secondary btn-small" data-action="edit-project" data-project-id="${
          p.id
        }">✏️ Редактировать</button>
        <button class="btn btn-secondary btn-small" data-action="delete-project" data-project-id="${
          p.id
        }">🗑️ Удалить</button>
        <button class="btn btn-primary btn-small" data-action="open-project-details" data-project-id="${
          p.id
        }" title="Открыть">📂 Открыть проект</button>

      </div>

    </div>
    `;
    })
    .join("");

  container.innerHTML = html;
}

function updateCurrentProjectDisplay() {
  const currentProjectEl = document.getElementById("current-project");
  if (!currentProjectEl) return;

  const project = getCurrentProject();
  if (project) {
    currentProjectEl.textContent = project.name;
    currentProjectEl.style.color = "rgba(255, 255, 255, 0.95)";
  } else {
    currentProjectEl.textContent = "Нет проекта";
    currentProjectEl.style.color = "rgba(255, 255, 255, 0.7)";
  }
}

function selectProject(projectId) {
  setCurrentProjectId(projectId);

  // Re-render to highlight selected
  renderProjectsList();
  updateCurrentProjectDisplay();

  // Re-render tree to update active state
  renderProjectsTree();

  // Hide projects list
  hideProjectsList();

  // Show project details (models/profiles)
  showProjectDetails(projectId);

  // Show "Open project" button
  const openProjectAction = document.getElementById("open-project-action");
  if (openProjectAction) {
    openProjectAction.classList.remove("hidden");
  }
}

function showProjectDetails(projectId) {
  const project = getProjectById(projectId);
  if (!project) return;

  // Reset selection
  selectedModelId = null;
  selectedProfileId = null;

  // Show models
  const modelsContainer = document.getElementById("models-container");
  const modelsList = document.getElementById("models-list");
  if (modelsContainer && modelsList) {
    modelsContainer.classList.remove("hidden");
    renderModelsList();
  }

  // Show profiles
  const profilesContainer = document.getElementById("profiles-container");
  const profilesList = document.getElementById("profiles-list");
  if (profilesContainer && profilesList) {
    profilesContainer.classList.remove("hidden");
    renderProfilesList();
  }

  // Clear details
  const modelDetails = document.getElementById("model-details");
  if (modelDetails) {
    modelDetails.innerHTML = '<div class="text-center">Выберите модель для просмотра деталей</div>';
  }

  const profileDetails = document.getElementById("profile-details");
  if (profileDetails) {
    profileDetails. innerHTML = '<div class="text-center">Выберите профиль для просмотра деталей</div>';
  }
}

function showProjectsList() {
  // Show projects list
  const projectsListContainer = document.getElementById("projects-list");
  if (projectsListContainer) {
    projectsListContainer.classList.remove("hidden");
  }

  const backNav = document.getElementById("back-navigation");
  if (backNav) {
    backNav.classList. add("hidden");
  }

  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.classList. remove("hidden");
  }

  // Hide details
  const modelsContainer = document.getElementById("models-container");
  const profilesContainer = document.getElementById("profiles-container");
  const openProjectAction = document.getElementById("open-project-action");

  if (modelsContainer) modelsContainer.classList.add("hidden");
  if (profilesContainer) profilesContainer.classList.add("hidden");
  if (openProjectAction) openProjectAction.classList.add("hidden");

  // Reset selections
  selectedModelId = null;
  selectedProfileId = null;
}

function hideProjectsList() {
  const projectsListContainer = document.getElementById("projects-list");
  if (projectsListContainer) {
    projectsListContainer.classList. add("hidden");
  }

  const backNav = document.getElementById("back-navigation");
  if (backNav) {
    backNav.classList.remove("hidden");
  }

  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.classList. add("hidden");
  }
}

// ============================================================
// RENDER - MODELS
// ============================================================
function renderModelsList() {
  console.log("Rendering models list...");
  const projectId = getCurrentProjectId();
  if (!projectId) return;

  const modelsList = document.getElementById("models-list");
  if (!modelsList) return;

  const models = getModels(projectId);

  if (! models || models.length === 0) {
    modelsList.innerHTML = '<div class="no-data">Нет моделей</div>';
    return;
  }

  const html = models
    .map((m) => {
      const isSelected = selectedModelId === m.id;
      return `
      <div class="list-item ${isSelected ? "selected" : ""}"
           data-action="select-model"
           data-model-id="${m. id}">
        <div class="list-item-header">
          <div class="list-item-title"><span>📦 </span> <span>${m.name || "Модель без названия"}</span></div>
          <!--
          <div class="list-item-actions">
            <button class="btn-icon btn-icon-small" data-action="edit-model" data-model-id="${m.id}" title="Редактировать">✏️</button>
            <button class="btn-icon btn-icon-small" data-action="delete-model" data-model-id="${m.id}" title="Удалить">🗑️</button>
          </div>
          -->
        </div>
        <!-- ${m.description ? `<div class="list-item-description">${m.description}</div>` : ""}  -->
      </div>
    `;
    })
    .join("");

  modelsList.innerHTML = html;
}

function selectModel(modelId) {
  selectedModelId = modelId;

  // Re-render models list to highlight selected
  renderModelsList();

  // Render model details
  renderModelDetails();
}

function renderModelDetails() {
  const projectId = getCurrentProjectId();
  const model = getModel(projectId, selectedModelId);

  const detailsContainer = document.getElementById("model-details");
  if (!detailsContainer) return;

  if (! model) {
    detailsContainer.innerHTML = '<div class="text-center">Выберите модель для просмотра деталей</div>';
    return;
  }

  const html = `
    <div class="tabs">
      <div class="tab active">Свойства</div>
    </div>
    <div class="tab-content active">
      <table class="table model-details-table">
        <colgroup>
          <col style="width: 25%;"/>
          <col style="width: 25%;"/>
          <col style="width: 20%;"/>
          <col style="width: 30%;"/>
        </colgroup>
        <tbody>
          <tr>
            <td colspan="1"><strong>Описание</strong></td>
            <td colspan="3">${model.description || "—"}</td>
          </tr>
          <tr>
            <td colspan="1"><strong>Используется в профилях</strong></td>
            <td colspan="3">${
              model.relatedProfiles && model.relatedProfiles.length > 0
                ? model. relatedProfiles.map((p) => p.name).join(", ")
                : "—"
            }</td>
          </tr>
          <tr>
            <td><strong>Дата создания: </strong></td>
            <td>${formatDate(model.createDate)}</td>
            <td><strong>Дата изменения:</strong></td>
            <td>${formatDate(model.modifyDate)}</td>
          </tr>
          <tr>
            <td><strong>Статус: </strong></td>
            <td>${getLegalStateValue(model.legalState)}</td>
            <td><strong>Права доступа:</strong></td>
            <td>${getAccessRightValue(model.accessRight)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  detailsContainer.innerHTML = html;
}


// ============================================================
// RENDER - PROFILES
// ============================================================
function renderProfilesList() {
  console.log("Rendering profiles list...");
  const projectId = getCurrentProjectId();
  if (!projectId) return;

  const profilesList = document.getElementById("profiles-list");
  if (!profilesList) return;

  const profiles = getProfiles(projectId);

  if (! profiles || profiles.length === 0) {
    profilesList.innerHTML = '<div class="no-data">Нет профилей</div>';
    return;
  }

  const html = profiles
    .map((p) => {
      const isSelected = selectedProfileId === p.id;
      return `
      <div class="list-item ${isSelected ? "selected" : ""}"
           data-action="select-profile"
           data-profile-id="${p.id}">
        <div class="list-item-header">
          <div class="list-item-title"><span>⚙️ </span> <span>${p.name || "Профиль без названия"}</span></div>
          <!--
          <div class="list-item-actions">
            <button class="btn-icon btn-icon-small" data-action="edit-profile" data-profile-id="${p.id}" title="Редактировать">✏️</button>
            <button class="btn-icon btn-icon-small" data-action="delete-profile" data-profile-id="${p.id}" title="Удалить">🗑️</button>
          </div>
          -->
        </div>
        <!-- ${p.description ? `<div class="list-item-description">${p.description}</div>` : ""}  -->
      </div>
    `;
    })
    .join("");

  profilesList.innerHTML = html;
}

function selectProfile(profileId) {
  selectedProfileId = profileId;
  // Re-render profiles list to highlight selected
  renderProfilesList();

  // Render profile details
  renderProfileDetails();
}

function renderProfileDetails() {
  const projectId = getCurrentProjectId();
  const profile = getProfile(projectId, selectedProfileId);

  const detailsContainer = document.getElementById("profile-details");
  if (!detailsContainer) return;

  if (! profile) {
    detailsContainer.innerHTML = '<div class="text-center">Выберите профиль для просмотра деталей</div>';
    return;
  }

  const html = `
    <div class="tabs">
      <div class="tab active">Свойства</div>
    </div>
    <div class="tab-content active">
      <table class="table profile-details-table">
        <colgroup>
          <col style="width: 25%;"/>
          <col style="width: 25%;"/>
          <col style="width: 20%;"/>
          <col style="width: 30%;"/>
        </colgroup>
        <tbody>
          <tr>
            <td colspan="1"><strong>Описание</strong></td>
            <td colspan="3">${profile.description || "—"}</td>
          </tr>
          <tr>
            <td colspan="1"><strong>Используется в профилях</strong></td>
            <td colspan="3">${
              profile.relatedModels && profile.relatedModels.length > 0
                ? profile.relatedModels.map((p) => p.name).join(", ")
                : "—"
            }</td>
          </tr>
          <tr>
            <td><strong>Дата создания: </strong></td>
            <td>${formatDate(profile.createDate)}</td>
            <td><strong>Дата изменения:</strong></td>
            <td>${formatDate(profile.modifyDate)}</td>
          </tr>
          <tr>
            <td><strong>Статус: </strong></td>
            <td>${getLegalStateValue(profile.legalState)}</td>
            <td><strong>Права доступа:</strong></td>
            <td>${getAccessRightValue(profile.accessRight)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  detailsContainer.innerHTML = html;
}

// ============================================================
// MODAL HELPERS
// ============================================================
function clearNewProjectModal() {
  const nameInput = document.getElementById("project-name");
  const descInput = document.getElementById("project-desc");
  const versionInput = document.getElementById("project-version");

  if (nameInput) nameInput.value = "";
  if (descInput) descInput.value = "";
  if (versionInput) versionInput.value = "1.0";
}

// function clearNewModelModal() {
//   const nameInput = document.getElementById("model-name");
//   const descInput = document.getElementById("model-desc");
//   const typeSelect = document.getElementById("model-type");
//   const legalStateSelect = document.getElementById("model-legal-state");
//   const accessRightSelect = document. getElementById("model-access-right");

//   if (nameInput) nameInput.value = "";
//   if (descInput) descInput.value = "";
//   if (typeSelect) typeSelect.value = "CIM";
//   if (legalStateSelect) legalStateSelect.value = "project";
//   if (accessRightSelect) accessRightSelect.value = "readWrite";
// }

// ============================================================
// CRUD HANDLERS - PROJECTS
// ============================================================
function handleCreateProject() {
  const nameInput = document.getElementById("project-name");
  const descInput = document.getElementById("project-desc");
  const versionInput = document.getElementById("project-version");

  if (! nameInput) return;

  const name = nameInput.value.trim();
  if (!name) {
    alert("Введите название проекта");
    return;
  }

  const payload = {
    name,
    description: descInput ?  descInput.value.trim() : "",
    version: versionInput ?  versionInput.value. trim() : "1.0",
  };

  const newProject = createProject(payload);

  if (newProject) {
    // Close modal
    const modal = document.getElementById("new-project-modal");
    if (modal) closeModal(modal);

    // Re-render
    renderProjectsList();
    renderProjectsTree();

    // Select new project
    selectProject(newProject.id);
  }
}

function handleEditProject(projectId) {
  const project = getProjectById(projectId);
  if (!project) return;

  // Fill modal
  const nameInput = document.getElementById("edit-project-name");
  const descInput = document.getElementById("edit-project-desc");
  const versionInput = document.getElementById("edit-project-version");

  if (nameInput) nameInput.value = project.name;
  if (descInput) descInput.value = project.description || "";
  if (versionInput) versionInput.value = project.version || "1.0";

  editingProjectId = projectId;

  // Open modal
  const modal = document. getElementById("edit-project-modal");
  if (modal) openModal(modal);
}

function handleSaveProjectEdit() {
  if (!editingProjectId) return;

  const nameInput = document.getElementById("edit-project-name");
  const descInput = document.getElementById("edit-project-desc");
  const versionInput = document.getElementById("edit-project-version");

  if (!nameInput) return;

  const name = nameInput.value. trim();
  if (!name) {
    alert("Введите название проекта");
    return;
  }

  const updates = {
    name,
    description: descInput ? descInput. value.trim() : "",
    version: versionInput ? versionInput.value.trim() : "1.0",
  };

  const updated = updateProject(editingProjectId, updates);

  if (updated) {
    // Close modal
    const modal = document.getElementById("edit-project-modal");
    if (modal) closeModal(modal);

    editingProjectId = null;

    // Re-render
    renderProjectsList();
    renderProjectsTree();
    updateCurrentProjectDisplay();
  }
}

function handleDeleteProject(projectId) {
  const project = getProjectById(projectId);
  if (!project) return;

  const confirmed = confirm(`Удалить проект "${project.name}"?`);
  if (! confirmed) return;

  deleteProject(projectId);

  // Re-render
  renderProjectsList();
  renderProjectsTree();
  updateCurrentProjectDisplay();

  // Hide details if deleted project was selected
  if (getCurrentProjectId() === projectId) {
    showProjectsList();
  }
}

function handleOpenCurrentProject() {
  const currentProjectId = getCurrentProjectId();
  if (! currentProjectId) {
    alert("Не выбран текущий проект");
    return;
  }

  window.location.href = `project-details.html?id=${currentProjectId}`;
}

// ============================================================
// CRUD HANDLERS - MODELS
// ============================================================
// function handleCreateModel() {
//   const projectId = getCurrentProjectId();
//   if (!projectId) {
//     alert("Не выбран проект");
//     return;
//   }

//   const nameInput = document.getElementById("model-name");
//   const descInput = document.getElementById("model-desc");
//   const typeSelect = document. getElementById("model-type");
//   const legalStateSelect = document. getElementById("model-legal-state");
//   const accessRightSelect = document.getElementById("model-access-right");

//   if (!nameInput) return;

//   const name = nameInput.value.trim();
//   if (!name) {
//     alert("Введите название модели");
//     return;
//   }

//   const payload = {
//     name,
//     description: descInput ? descInput.value.trim() : "",
//     type: typeSelect ? typeSelect.value : "CIM",
//     legalState:  legalStateSelect ? legalStateSelect.value : "project",
//     accessRight: accessRightSelect ? accessRightSelect.value :  "readWrite",
//   };

//   const newModel = createModel(projectId, payload);

//   if (newModel) {
//     // Close modal
//     const modal = document. getElementById("new-model-modal");
//     if (modal) closeModal(modal);

//     // Re-render
//     renderModelsList();

//     // Select new model
//     selectModel(newModel.id);
//   }
// }

// function handleEditModel(modelId) {
//   const projectId = getCurrentProjectId();
//   const model = getModel(projectId, modelId);
//   if (!model) return;

//   // Fill modal
//   const nameInput = document.getElementById("edit-model-name");
//   const descInput = document.getElementById("edit-model-desc");
//   const typeSelect = document.getElementById("edit-model-type");
//   const legalStateSelect = document.getElementById("edit-model-legal-state");
//   const accessRightSelect = document.getElementById("edit-model-access-right");

//   if (nameInput) nameInput.value = model.name;
//   if (descInput) descInput.value = model.description || "";
//   if (typeSelect) typeSelect.value = model.type || "CIM";
//   if (legalStateSelect) legalStateSelect.value = model.legalState || "project";
//   if (accessRightSelect) accessRightSelect.value = model.accessRight || "readWrite";

//   editingModelId = modelId;

//   // Open modal
//   const modal = document.getElementById("edit-model-modal");
//   if (modal) openModal(modal);
// }

// function handleSaveModelEdit() {
//   const projectId = getCurrentProjectId();
//   if (!projectId || !editingModelId) return;

//   const nameInput = document. getElementById("edit-model-name");
//   const descInput = document. getElementById("edit-model-desc");
//   const typeSelect = document. getElementById("edit-model-type");
//   const legalStateSelect = document.getElementById("edit-model-legal-state");
//   const accessRightSelect = document.getElementById("edit-model-access-right");

//   if (!nameInput) return;

//   const name = nameInput.value.trim();
//   if (!name) {
//     alert("Введите название модели");
//     return;
//   }

//   const updates = {
//     name,
//     description: descInput ? descInput.value.trim() : "",
//     type: typeSelect ? typeSelect.value : "CIM",
//     legalState: legalStateSelect ? legalStateSelect.value : "project",
//     accessRight: accessRightSelect ? accessRightSelect.value : "readWrite",
//   };

//   const updated = updateModel(projectId, editingModelId, updates);

//   if (updated) {
//     // Close modal
//     const modal = document.getElementById("edit-model-modal");
//     if (modal) closeModal(modal);

//     editingModelId = null;

//     // Re-render
//     renderModelsList();
//     renderModelDetails();
//   }
// }

// function handleDeleteModel(modelId) {
//   const projectId = getCurrentProjectId();
//   const model = getModel(projectId, modelId);
//   if (!model) return;

//   const confirmed = confirm(`Удалить модель "${model.name}"?`);
//   if (!confirmed) return;

//   deleteModel(projectId, modelId);

//   // Re-render
//   renderModelsList();

//   // Clear details if deleted model was selected
//   if (selectedModelId === modelId) {
//     selectedModelId = null;
//     const detailsContainer = document.getElementById("model-details");
//     if (detailsContainer) {
//       detailsContainer.innerHTML = '<div class="text-center">Выберите модель для просмотра деталей</div>';
//     }
//   }
// }

// ============================================================
// HELPERS
// ============================================================
function getLegalStateValue(key) {
  const legalStateList = [{ project: "В разработке" }];
  if (! key) return "—";
  for (const item of legalStateList) {
    if (item[key]) return item[key];
  }
  return "—";
}

function getAccessRightValue(key) {
  const accessRightList = [
    { readOnly: "Только чтение" },
    { readWrite: "Чтение и запись" },
  ];
  if (!key) return "—";
  for (const item of accessRightList) {
    if (item[key]) return item[key];
  }
  return "—";
}

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  } catch {
    return dateString;
  }
}

console.log("Projects Page Module Loaded");
