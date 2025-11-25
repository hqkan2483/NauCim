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
    const response = await fetch('./models-data/cim100.json');
    tc57cimRootPackages = await response.json();
    console.log("✅ cim100.json loaded successfully");
  } catch (error) {
    console.error("❌ Error loading cim100.json:", error);
  }

    let gostExtRootPackages = [];
  try {
    const response = await fetch('./models-data/GOSTRExtension.json');
    gostExtRootPackages = await response.json();
    console.log("✅ GOSTRExtension.json loaded successfully");
  } catch (error) {
    console.error("❌ Error loading GOSTRExtension.json:", error);
  }

      let CIM16RootPackages = [];
  try {
    const response = await fetch('./models-data/CIM16.json');
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
    console.error("❌ Error loading focl.json:", error);
  }


  const sampleProjects = [
    {
      id: 1,
      name: "Россети - Профили обмена данными",
      description:
        "Разработка профилей для обмена данными между информационными системами Россетей",
      version: "2.0",
      createdAt: "2024-09-15",
      models: [
        {
          id: 2,
          name: "TC57CIM - CIM100",
          type: "Каноническая модель",
          description: "CIM 100 версия IEC 61970/61968, редакция 2025 года",
          classes: 2225,
          attributes: 6328,
          rootPackages: tc57cimRootPackages,

        },
        //вторая  модель
        {
          id: 3,
          name: "GOSTExtension",
          type: "Расширение модели RU",
          description: "Расширения для российских ГОСТов",
          classes: 87,
          attributes: 345,
          rootPackages: gostExtRootPackages,

        },
      ],
      profiles: [
        {
          id: 4,
          name: "GOST-58651.2",
          description: "Базисный профиль информационной модели",
          baseModel: "GOSTExtension",
          baseModelId: 3,
          version: "1.0",
          classes: 45,
          attributes: 234,
         rootPackages: profile58651_2RootPackages,
          xsd: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="AssetInfo" type="AssetInfoType"/>
  <xs:complexType name="AssetInfoType">
    <xs:sequence>
      <xs:element name="rotorGD2" type="xs:float" minOccurs="0"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`,
        },
        {
          id: 5,
          name: "GOST-58651.3",
          description: "Профиль модели ЛЭП 110-750 кВ",
          baseModel: "GOSTExtension",
          baseModelId: 3,
          version: "1.1",
          classes: 32,
          attributes: 178,
          rootPackages: []
        },
      ],
    },
    {
      id: 6,
      name: "Профили электросчётчиков",
      description: "Профили для систем АИИС КУЭ",
      version: "1.5",
      createdAt: "2024-10-01",
      models: [
        {
          id: 7,
          name: "CIM16",
          type: "Каноническая модель. Расширение Системного оператора",
          description: "Модель для учета электроэнергии",
          classes: 267,
          attributes: 1523,
          rootPackages: CIM16RootPackages,
        },    
          ],
      profiles: [
        {
          id: 8,
          name: "MeterProfile",
          description: "Профиль обмена данными электросчётчиков",
          baseModel: "IEC61968",
          version: "2.0",
          classes: 28,
          attributes: 156,
        },
      ],
    },
    {
      id: 9,
      name: "Волоконно-оптические линии",
      description: "Проект расширения CIM для волоконно-оптических линий связи",
      version: "1.0",
      createdAt: "2025-10-01",
      models: [
        {
          id: 10,
          name: "CIM-FiberOptic",
          type: "Расширение для волоконно-оптических линий связи",
          description: "Проект модели для волоконно-оптических линий связи, включая оконечное оборудование",
          classes: 267,
          attributes: 1523,
          rootPackages: foclRootPackages,
        },    
          ],
      profiles: [
        {
          id: 11,
          name: "FOProfile",
          description: "Профиль для волоконно-оптических линий связи",
          baseModel: "CIM-FiberOptic",
          version: "1.0",
          classes: 28,
          attributes: 156,
        },
      ],
    },
  ];

  // Initialize MemoryStore instead of localStorage
  // Try to restore currentProjectId from localStorage
  const savedProjectId = localStorage.getItem('currentProjectId');
  const initialProjectId = savedProjectId ? parseInt(savedProjectId) : 1;
  
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
    const savedId = localStorage.getItem('currentProjectId');
    if (savedId) {
      id = parseInt(savedId);
      MemoryStore.setCurrentProjectId(id);
    }
  }
  return id;
}

function setCurrentProject(projectId) {
  MemoryStore.setCurrentProjectId(projectId);
  // Also save to localStorage for persistence across page loads
  if (projectId) {
    localStorage.setItem('currentProjectId', projectId);
  } else {
    localStorage.removeItem('currentProjectId');
  }
}

function getCurrentProject() {
  return MemoryStore.getCurrentProject();
}

// Model Management
function getModels(projectId) {
  const project = getProject(projectId);
  return project ? project.models : [];
}

function addModel(projectId, model) {
  const project = MemoryStore.getProject(projectId);
  if (project) {
    model.id = Math.max(...project.models.map((m) => m.id), 0) + 1;
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
    profile.id = Math.max(...project.profiles.map((p) => p.id), 0) + 1;
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
  document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

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

// Sample class structure for tree view
function getSampleClassStructure() {
  return {
    TC57CIM: [
      {
        name: "IEC61970",
        type: "package",
        children: [
          {
            name: "Core",
            type: "package",
            children: [
              {
                name: "IdentifiedObject",
                type: "class",
                attributes: [
                  { name: "mRID", type: "String", multiplicity: "1" },
                  { name: "name", type: "String", multiplicity: "0..1" },
                  { name: "description", type: "String", multiplicity: "0..1" },
                ],
              },
              {
                name: "PowerSystemResource",
                type: "class",
                parent: "IdentifiedObject",
                attributes: [],
              },
            ],
          },
        ],
      },
      {
        name: "IEC61968",
        type: "package",
        children: [
          {
            name: "AssetInfo",
            type: "package",
            children: [
              {
                name: "RotatingMachineInfo",
                type: "class",
                stereotype: "rf",
                attributes: [
                  {
                    name: "rotorGD2",
                    type: "Torque",
                    multiplicity: "0..1",
                    description: "Маховой момент ротора генератора, т·м²",
                  },
                ],
                associations: [
                  {
                    name: "TestInfo",
                    type: "Association",
                    target: "TestInfo",
                    multiplicity: "0..*",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
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
