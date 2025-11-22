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

// ============================================================
// Load focl.json model data
let foclData = null;

async function loadFoclData() {
  try {
    const response = await fetch("./mockdata/focl.json");
    foclData = await response.json();
    console.log("✅ focl.json loaded successfully");
    return foclData;
  } catch (error) {
    console.error("❌ Error loading focl.json:", error);
    return null;
  }
}

// Convert focl.json package structure to model format
function convertFoclPackageToModel(rootPackage) {
  const model = {
    id: rootPackage.id,
    name: rootPackage.name,
    type: "Каноническая модель",
    description: rootPackage.description || "Модель из FOCL",
    classes: rootPackage.elementCount || 0,
    attributes: foclData?.totalAttributes || 0,
    packages: [],
  };

  if (rootPackage.children && rootPackage.children.length > 0) {
    model.packages = rootPackage.children.map((child) =>
      convertFoclPackage(child)
    );
  }

  return model;
}

// Recursively convert focl package structure
function convertFoclPackage(pkg) {
  const convertedPkg = {
    name: pkg.name,
    description: pkg.description,
    classes: [],
    packages: [],
  };

  // Add elements as classes
  if (pkg.elements && pkg.elements.length > 0) {
    convertedPkg.classes = pkg.elements.map((elem) => ({
      name: elem.name,
      type: elem.type,
      description: elem.description,
      isAbstract: elem.isAbstract,
      attributeCount: elem.attributeCount,
    }));
  }

  // Add child packages recursively
  if (pkg.children && pkg.children.length > 0) {
    convertedPkg.packages = pkg.children.map((child) =>
      convertFoclPackage(child)
    );
  }

  return convertedPkg;
}

// Initialize sample data on first load
function loadSampleData() {
  // Check if already initialized in memory
  if (MemoryStore.getProjects().length > 0) {
    console.log("✅ Sample data already loaded in memory");
    return;
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
          id: 1,
          name: "TC57CIM - CIM100",
          type: "Каноническая модель",
          description: "CIM 100 версия IEC 61970/61968, редакция 2025 года",
          classes: 2225,
          attributes: 6328,

          rootPackages: [
            {
              id: "EAPK_A395E6F1_5B32_439a_8A27_2670237584E0",
              name: "TC57CIM",
              type: "Package",
              description:
                "Пакет верхнего уровня для CIM 100. Корневой элемент модели.",
              elementCount: 1,

              elements: [
                {
                  id: "EAID_421FE0F5_637F_4d59_8483_619A82FA3FB6",
                  name: "IEC61968CIMVersion",
                  type: "Class",
                  description:
                    "Номер версии IEC 61968 CIM, присвоенный этой модели UML.",
                  visibility: "public",
                  isAbstract: false,
                  attributeCount: 2,
                  linkCount: 0,
                  attributes: [
                    {
                      name: "date",
                      type: "Date",
                      description:
                        "Форма - ГГГГ-ММ-ДД, например, для 5 января 2009 года это 2009-01-05.",
                      multiplicity: "1",
                      visibility: "public",
                    },
                    {
                      name: "version",
                      type: "String",
                      description:
                        "Форма - IEC61968CIMXXvYY, где XX - основная версия пакета CIM, а YY - младшая версия. Например, IEC61968CIM10v17a.",
                      multiplicity: "1",
                      visibility: "public",
                    },
                  ],
                  links: [],
                },
              ],

              children: [
                {
                  id: "EAPK_F4A98993_8222_43a4_8E1E_B9BDC365F1F9",
                  name: "Base",
                  type: "Package",
                  description:
                    "Содержание базового CIM, опубликованное как IEC 61970-301.",
                  elementCount: 0,
                  elements: [],
                  children: [
                    {
                      id: "EAPK_206781BC_D83E_42bf_8043_1814D42B842D",
                      name: "Domain",
                      type: "Package",
                      description:
                        "Пакет домена определяет примитивные типы данных, которые используются классами в других пакетах. Стереотипы используются для описания типов данных. Определены следующие стереотипы:\n&lt;&lt;enumeration&gt;&gt; Список допустимых постоянных значений.\n&lt;&lt;Primitive&gt;&gt; Самые основные типы данных, используемые для составления всех других типов данных.\n&lt;&lt;CIMDatatype&gt;&gt; Тип данных, содержащий атрибут value, необязательную единицу измерения и множитель единицы измерения. Единица измерения и множитель могут быть указаны как статическая переменная, инициализированная допустимым значением.\n&lt;&lt;Compound&gt;&gt; Составная часть примитива, перечисления, CIMDatatype или других составных классов, при условии, что составные классы не повторяются.\nДля всех типов данных допускаются как положительные, так и отрицательные значения, если для конкретного типа данных не указано иное.",
                      elementCount: 45,
                      classes: [
                        "Asset",
                        "IdentifiedObject",
                        "PowerSystemResource",
                      ],
                    },
                    {
                      id: "EAPK_CE9851B0_8E38_4b48_8F62_E78E9C31767A",
                      name: "Core",
                      type: "Package",
                      description:
                        "Содержит основные объекты PowerSystemResource и ConductingEquipment, общие для всех приложений, а также общие коллекции этих объектов. Не для всех приложений требуются все основные объекты.  Этот пакет не зависит ни от какого другого пакета, кроме пакета домена, но большинство других пакетов имеют ассоциации и обобщения, которые зависят от него.",
                      elementCount: 24,
                      children: [
                        {
                          id: "EAPK_38D068F1_7EB3_431f_AC75_50C618E48644",
                          name: "Wires",
                          type: "Package",
                          description:
                            "Расширение к пакету Core и Topology, которое моделирует информацию об электрических характеристиках сетей передачи и распределения.",
                          elementCount: 70,
                          classes: [
                            "ACLineSegment",
                            "PowerTransformer",
                            "Switch",
                          ],
                          children: [],
                        },

                        {
                          id: "EAPK_8659D928_50B5_43b5_B1EB_DABFA4899FC4",
                          name: "Generation",
                          type: "Package",
                          description:
                            "Этот пакет содержит пакеты, содержащие информацию для ввода в эксплуатацию энергоблоков и экономичной диспетчеризации гидроэлектростанций и тепловых электростанций, Прогнозирования нагрузки, автоматического управления генерацией и моделирования энергоблоков для обучающего моделирования.",
                          classes: [
                            "GeneratingUnit",
                            "SynchronousMachine",
                            "ThermalGeneratingUnit",
                          ],
                          children: [],
                        },
                      ],
                    },
                  ],
                },
                {
                  name: "IEC61968",
                  packages: [
                    {
                      id: "EAPK_94FB7462_43A1_4334_B899_194EBCADF5E9",
                      name: "InfAssetInfo",
                      type: "Package",
                      description:
                        "Общие дополнительные технические параметры коммутационных аппаратов.",
                      classes: [
                        "AssetInfo",
                        "RotatingMachineInfo",
                        "TransformerInfo",
                      ],
                      children: [],
                    },
                    {
                      id: "EAPK_E1CF8707_303E_43fd_9E2C_7BABF3B7D04A",
                      name: "PaymentMetering",
                      type: "Package",
                      description:
                        "Этот пакет содержит информационные классы, которые поддерживают специализированные приложения, такие как учет предварительной оплаты. Эти классы, как правило, связаны с мониторингом и анализом поступлений от клиента за предоставленную услугу.",
                      elementCount: 2,
                      packages: [
                        {
                          id: "EAPK_00CC6185_D562_4605_942E_EF2FA3BB8E54",
                          name: "Metering",
                          type: "Package",
                          description:
                            "Этот пакет содержит основные информационные классы, которые поддерживают приложения для конечных устройств со специализированными классами для устройств измерения и локальной сети, а также функции удаленного считывания. Эти классы обычно связаны с точкой, в которой услуга предоставляется клиенту.",
                          classes: [
                            "MeterReading",
                            "Reading",
                            "IntervalReading",
                          ],
                        },
                      ],
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],

          //скобка конца модели
        },
        //вторая  модель
        // {
        //   id: 2,
        //   name: "GOSTExtension",
        //   type: "Расширение модели",
        //   description: "Расширения для российских ГОСТов",
        //   classes: 87,
        //   attributes: 345,
        //   packages: [
        //     {
        //       name: "RussianExtensions",
        //       packages: [
        //         {
        //           name: "AssetInfo",
        //           classes: [
        //             "RotatingMachineInfo",
        //             "SynchronousMachineInfo",
        //             "RotorInfo",
        //           ],
        //         },
        //         {
        //           name: "GovernanceExtensions",
        //           packages: [
        //             {
        //               name: "Regulations",
        //               classes: ["RegulatoryRequirement", "ComplianceRecord"],
        //             },
        //           ],
        //         },
        //       ],
        //     },
        //   ],
        // },
      ],
      profiles: [
        {
          id: 1,
          name: "GOST-58651.2",
          description: "Профиль обмена данными об электрооборудовании",
          baseModel: "TC57CIM",
          version: "1.0",
          classes: 45,
          attributes: 234,
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
          id: 2,
          name: "GOST-58651.3",
          description: "Профиль передачи телеметрии",
          baseModel: "TC57CIM",
          version: "1.1",
          classes: 32,
          attributes: 178,
        },
      ],
    },
    // {
    //   id: 2,
    //   name: "Профили электросчётчиков",
    //   description: "Профили для систем АИИС КУЭ",
    //   version: "1.5",
    //   createdAt: "2024-10-01",
    //   models: [
    //     {
    //       id: 3,
    //       name: "IEC61968",
    //       type: "Каноническая модель",
    //       description: "Модель для учета электроэнергии",
    //       classes: 267,
    //       attributes: 1523,
    //       packages: [
    //         {
    //           name: "Metering",
    //           classes: ["Meter", "EndDevice", "Reading", "MeterReading"],
    //         },
    //       ],
    //     },
    //   ],
    //   profiles: [
    //     {
    //       id: 3,
    //       name: "MeterProfile",
    //       description: "Профиль обмена данными электросчётчиков",
    //       baseModel: "IEC61968",
    //       version: "2.0",
    //       classes: 28,
    //       attributes: 156,
    //     },
    //   ],
    // },
  ];

  // Initialize MemoryStore instead of localStorage
  MemoryStore.initialize({
    projects: sampleProjects,
    currentProjectId: 1,
  });
}

// Initialize FOCL project with data from focl.json
async function initializeFoclProject() {
  const data = await loadFoclData();
  if (!data || !data.rootPackages || data.rootPackages.length === 0) {
    console.warn("No FOCL data available");
    return;
  }

  // Create a project with FOCL data
  const foclProject = {
    id: 999,
    name: "FOCL - Волоконно-оптические линии",
    description: "Проект с данными из FOCL.json",
    version: "1.0",
    createdAt: new Date().toISOString().split("T")[0],
    models: [],
    profiles: [],
  };

  // Convert each root package to a model
  data.rootPackages.forEach((rootPkg, idx) => {
    const model = convertFoclPackageToModel(rootPkg);
    model.id = 999 + idx;
    foclProject.models.push(model);
  });

  // Add to projects using MemoryStore
  const existingProject = MemoryStore.getProject(999);
  if (existingProject) {
    MemoryStore.updateProject(999, foclProject);
  } else {
    MemoryStore.addProject(foclProject);
  }
  console.log("✅ FOCL project initialized");
}

// Get FOCL data
function getFoclData() {
  return foclData;
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
  return MemoryStore.getCurrentProjectId();
}

function setCurrentProject(projectId) {
  MemoryStore.setCurrentProjectId(projectId);
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
