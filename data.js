// Nautilus.CIM Data Management Library

// ============================================================
// MEMORY STORE - Global In-Memory Data Storage
// ============================================================
const MemoryStore = {
  // In-memory storage for all data
  store: {
    projects: [],
    currentProjectId: null,
  },

  // Initialize store with sample data
  initialize(data) {
    this.store.projects = data.projects || [];
    this.store.currentProjectId = data.currentProjectId || null;
    console.log(
      "✅ MemoryStore initialized with",
      this.store.projects.length,
      "projects"
    );
  },

  // Get all projects
  getProjects() {
    return this.store.projects || [];
  },

  // Get single project by ID
  getProject(id) {
    return this.store.projects.find((p) => p.id === id) || null;
  },

  // Add project
  addProject(project) {
    this.store.projects.push(project);
    return project;
  },

  // Update project
  updateProject(id, updates) {
    const project = this.getProject(id);
    if (project) {
      Object.assign(project, updates);
    }
    return project;
  },

  // Delete project
  deleteProject(id) {
    this.store.projects = this.store.projects.filter((p) => p.id !== id);
  },

  // Get current project ID
  getCurrentProjectId() {
    return this.store.currentProjectId;
  },

  // Set current project ID
  setCurrentProjectId(id) {
    this.store.currentProjectId = id;
  },

  // Get current project
  getCurrentProject() {
    const id = this.getCurrentProjectId();
    return id ? this.getProject(id) : null;
  },
};

// Initialize sample data on first load
async function loadSampleData() {
  // Check if already initialized in memory
  if (MemoryStore.getProjects().length > 0) {
    console.log("✅ Sample data already loaded in memory");
    return;
  }

  // Load rootPackages from external JSON file
  let tc57cimRootPackages = [];
  try {
    const response = await fetch("./models-data/CIM100.json");
    tc57cimRootPackages = await response.json();
    console.log("✅ cim100.json loaded successfully");
  } catch (error) {
    console.error("❌ Error loading cim100.json:", error);
  }

  let gostExtRootPackages = [];
  try {
    const response = await fetch("./models-data/GOSTRExtension.json");
    gostExtRootPackages = await response.json();
    console.log("✅ GOSTRExtension.json loaded successfully");
  } catch (error) {
    console.error("❌ Error loading GOSTRExtension.json:", error);
  }

  let CIM16RootPackages = [];
  try {
    const response = await fetch("./models-data/CIM16.json");
    CIM16RootPackages = await response.json();
    console.log("✅ CIM16.json loaded successfully");
  } catch (error) {
    console.error("❌ Error loading CIM16.json:", error);
  }

  let foclRootPackages = [];

  try {
    const response = await fetch("./models-data/focl.json");
    foclRootPackages = await response.json();
    console.log("✅ focl.json loaded successfully");
  } catch (error) {
    console.error("❌ Error loading focl.json:", error);
  }

  let profile58651_2RootPackages = [];

  try {
    const response = await fetch("./models-data/profile-test.json");
    profile58651_2RootPackages = await response.json();
    console.log("✅ profile-test.json loaded successfully");
  } catch (error) {
    console.error("❌ Error loading profile-test.json:", error);
  }

  let profile58651_test = [];

  try {
    const response = await fetch("./models-data/profile-test2.json");
    profile58651_test = await response.json();
    console.log("✅ profile-test2.json loaded successfully");
  } catch (error) {
    console.error("❌ Error loading profile-test2.json:", error);
  }

  const sampleProjects = [
    {
      id: "1",
      name: "Россети - Профили обмена данными",
      description:
        "Разработка профилей для обмена данными между информационными системами Россетей",
      version: "2.0",
      createdAt: "2024-09-15",
      models: [
        {
          id: "2",
          name: "TC57CIM - CIM100",
          type: "Каноническая модель",
          description: "CIM 100 версия IEC 61970/61968, редакция 2025 года",
          relatedProfiles: [],
          createDate: "2024-11-20",
          modifyDate: null,
          legalState: "project",
          legalAct: "",
          accessRight: "readOnly",
          rootPackages: tc57cimRootPackages,
        },
        //вторая  модель
        {
          id: "3",
          name: "GOSTExtension",
          type: "Расширение модели RU",
          description: "Расширения для российских ГОСТов",
          relatedProfiles: [
            { id: "4", name: "GOST-XXXXX.2" },
            { id: "5", name: "Проект ГОСТ-XXXXX.Х" },
          ],
          version: "1.0",
          createDate: "2024-11-20",
          modifyDate: "2025-10-10",
          legalState: "project",
          legalAct: "",
          accessRight: "readWrite",
          rootPackages: gostExtRootPackages,
        },
      ],
      profiles: [
        {
          id: "4",
          name: "GOST-XXXXX.2",
          description: "Базисный профиль информационной модели",
          baseModel: "GOSTExtension",
          baseModelId: "3",
          version: "1.0",
          createDate: "2024-11-20",
          modifyDate: "2025-10-10",
          legalState: "project",
          legalAct: "",
          accessRight: "readWrite",
          rootPackages: profile58651_2RootPackages,
        },
        {
          id: "5",
          name: "Проект ГОСТ-XXXXX.Х",
          description: "Профиль модели ЛЭП",
          baseModel: "GOSTExtension",
          baseModelId: "3",
          version: "1.1",
          createDate: "2025-09-21",
          modifyDate: "2025-10-10",
          legalState: "project",
          legalAct: "",
          accessRight: "readWrite",
          rootPackages: profile58651_test,
        },
      ],
    },
    {
      id: "6",
      name: "Профили электросчётчиков",
      description: "Профили для систем АИИС КУЭ",
      version: "1.5",
      createdAt: "2024-10-01",
      models: [
        {
          id: "7",
          name: "CIM16",
          type: "Каноническая модель. Расширение Системного оператора",
          description: "Модель для учета электроэнергии",
          relatedProfiles: [{ id: "8", name: "MeterProfile" }],
          version: "1.101",
          createDate: "2025-08-11",
          modifyDate: "2025-09-10",
          legalState: "project",
          legalAct: "",
          accessRight: "readWrite",
          rootPackages: CIM16RootPackages,
        },
      ],
      profiles: [
        {
          id: "8",
          name: "MeterProfile",
          description: "Профиль обмена данными электросчётчиков",
          baseModel: "CIM16",
          baseModelId: "7",
          version: "2.0",
          createDate: "2025-08-11",
          modifyDate: "2025-09-10",
          legalState: "project",
          legalAct: "",
          accessRight: "readWrite",
          rootPackages: [],
        },
      ],
    },
    {
      id: "9",
      name: "Волоконно-оптические линии",
      description: "Проект расширения CIM для волоконно-оптических линий связи",
      version: "1.0",
      createdAt: "2025-10-01",
      models: [
        {
          id: "10",
          name: "CIM-FiberOptic",
          type: "Расширение для волоконно-оптических линий связи",
          description:
            "Проект модели для волоконно-оптических линий связи, включая оконечное оборудование",

          relatedProfiles: [{ id: "11", name: "FOProfile" }],
          version: "0.101",
          createDate: "2025-05-11",
          modifyDate: "2025-09-10",
          legalState: "project",
          legalAct: "",
          accessRight: "readWrite",
          rootPackages: foclRootPackages,
        },
      ],
      profiles: [
        {
          id: "11",
          name: "FOProfile",
          description: "Профиль для волоконно-оптических линий связи",
          baseModel: "CIM-FiberOptic",
          baseModelId: "10",
          version: "0.0.1",
          createDate: "2025-09-11",
          modifyDate: "2025-09-11",
          legalState: "project",
          legalAct: "",
          accessRight: "readWrite",
          rootPackages: [],
        },
      ],
    },
  ];

  // Initialize MemoryStore instead of localStorage
  // Try to restore currentProjectId from localStorage
  const savedProjectId = localStorage.getItem("currentProjectId");
  const initialProjectId = savedProjectId || "1";

  MemoryStore.initialize({
    projects: sampleProjects,
    currentProjectId: initialProjectId,
  });
}

// Project Management
function getProjects() {
  return MemoryStore.getProjects();
}

function getAllProjects() {
  return MemoryStore.getProjects();
}

function saveProjects(projects) {
  // Projects are automatically saved in MemoryStore
  // This function is kept for compatibility
}

function getProject(id) {
  return MemoryStore.getProject(id);
}

function getCurrentProjectId() {
  let id = MemoryStore.getCurrentProjectId();
  // If not in memory, try to restore from localStorage
  if (!id) {
    const savedId = localStorage.getItem("currentProjectId");
    if (savedId) {
      id = savedId;
      MemoryStore.setCurrentProjectId(id);
    }
  }
  return id;
}

function setCurrentProject(projectId) {
  MemoryStore.setCurrentProjectId(projectId);
  // Also save to localStorage for persistence across page loads
  if (projectId) {
    localStorage.setItem("currentProjectId", projectId);
  } else {
    localStorage.removeItem("currentProjectId");
  }
}

function getCurrentProject() {
  return MemoryStore.getCurrentProject();
}

// UUID Generation
function generateUUID() {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Model Management
// возвращаем модели проекта - массив всех моделей внутри проекта или пустой массив
function getModels(projectId) {
  const project = getProject(projectId);
  return project ? project.models : [];
}

function addModel(projectId, model) {
  const project = MemoryStore.getProject(projectId);
  if (project) {
    model.id = generateUUID();
    project.models.push(model);
    return model;
  }
  return null;
}

function getModel(projectId, modelId) {
  const models = getModels(projectId);
  return models.find((m) => m.id === modelId);
}

// Profile Management
function getProfiles(projectId) {
  const project = getProject(projectId);
  return project ? project.profiles : [];
}

function addProfile(projectId, profile) {
  const project = MemoryStore.getProject(projectId);
  if (project) {
    profile.id = generateUUID();
    project.profiles.push(profile);
    return profile;
  }
  return null;
}

function getProfile(projectId, profileId) {
  const profiles = getProfiles(projectId);
  return profiles.find((p) => p.id === profileId);
}

// UI Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add("active");
}

function initGlobalModalHandlers() {
  if (window.__globalModalHandlersInitialized) return;

  // Close modal when clicking on backdrop
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      // Backdrop click means the click target is the modal overlay itself
      if (target.classList.contains("modal") && target.classList.contains("active")) {
        const modalId = target.id;
        if (modalId && typeof closeModal === "function") {
          closeModal(modalId);
        }
      }
    },
    true
  );

  // Close the topmost active modal on Escape
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape" && e.key !== "Esc") return;

      const activeModals = Array.from(document.querySelectorAll(".modal.active"));
      const activeModal = activeModals[activeModals.length - 1];
      if (activeModal && activeModal.id && typeof closeModal === "function") {
        closeModal(activeModal.id);
        e.preventDefault();
      }
    },
    true
  );

  window.__globalModalHandlersInitialized = true;
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("active");

  // Universal behavior: if user closes a modal without saving, clear inputs.
  // We reset to the HTML defaults so fields with preset values keep them.
  modal.querySelectorAll("input, textarea, select").forEach((control) => {
    const tag = (control.tagName || "").toLowerCase();

    if (tag === "input") {
      const type = (control.getAttribute("type") || "text").toLowerCase();
      if (type === "button" || type === "submit" || type === "reset" || type === "hidden") {
        return;
      }

      if (type === "checkbox" || type === "radio") {
        control.checked = control.defaultChecked;
        return;
      }

      control.value = control.defaultValue ?? "";
      return;
    }

    if (tag === "textarea") {
      control.value = control.defaultValue ?? "";
      return;
    }

    if (tag === "select") {
      const defaultIndex = Array.from(control.options).findIndex(
        (opt) => opt.defaultSelected
      );
      control.selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
    }
  });

  // Hide validation messages (common pattern in this project)
  modal.querySelectorAll(".form-error").forEach((el) => {
    el.style.display = "none";
  });
}

// Ensure modals behave consistently across all pages that include data.js
initGlobalModalHandlers();

function updateCurrentProject() {
  const project = getCurrentProject();
  const elem = document.getElementById("current-project");
  if (elem) {
    elem.textContent = project ? project.name : "Нет проекта";
    elem.style.color = project
      ? "rgba(255,255,255,0.9)"
      : "rgba(255,255,255,0.5)";
  }
}

// ============================================================
// DEBUG UTILITIES
// ============================================================
function debugStore() {
  console.group("MemoryStore Debug Info");
  console.log("Projects count:", MemoryStore.getProjects().length);
  console.log("Current project ID:", MemoryStore.getCurrentProjectId());
  console.log("All projects:", MemoryStore.getProjects());
  console.log("Current project:", MemoryStore.getCurrentProject());
  console.groupEnd();
}

console.log("✅ Nautilus.CIM Data Library loaded");
