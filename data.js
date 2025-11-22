// Nautilus.CIM Data Management Library

// ============================================================
// MEMORY STORE - Global In-Memory Data Storage
// ============================================================
const MemoryStore = {
    // In-memory storage for all data
    store: {
        projects: [],
        currentProjectId: null
    },

    // Initialize store with sample data
    initialize(data) {
        this.store.projects = data.projects || [];
        this.store.currentProjectId = data.currentProjectId || null;
        console.log('✅ MemoryStore initialized with', this.store.projects.length, 'projects');
    },

    // Get all projects
    getProjects() {
        return this.store.projects || [];
    },

    // Get single project by ID
    getProject(id) {
        return this.store.projects.find(p => p.id === id) || null;
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
        this.store.projects = this.store.projects.filter(p => p.id !== id);
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
    }
};

// ============================================================
// Load focl.json model data
let foclData = null;

async function loadFoclData() {
    try {
        const response = await fetch('./mockdata/focl.json');
        foclData = await response.json();
        console.log('✅ focl.json loaded successfully');
        return foclData;
    } catch (error) {
        console.error('❌ Error loading focl.json:', error);
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
        packages: []
    };

    if (rootPackage.children && rootPackage.children.length > 0) {
        model.packages = rootPackage.children.map(child => convertFoclPackage(child));
    }

    return model;
}

// Recursively convert focl package structure
function convertFoclPackage(pkg) {
    const convertedPkg = {
        name: pkg.name,
        description: pkg.description,
        classes: [],
        packages: []
    };

    // Add elements as classes
    if (pkg.elements && pkg.elements.length > 0) {
        convertedPkg.classes = pkg.elements.map(elem => ({
            name: elem.name,
            type: elem.type,
            description: elem.description,
            isAbstract: elem.isAbstract,
            attributeCount: elem.attributeCount
        }));
    }

    // Add child packages recursively
    if (pkg.children && pkg.children.length > 0) {
        convertedPkg.packages = pkg.children.map(child => convertFoclPackage(child));
    }

    return convertedPkg;
}

// Initialize sample data on first load
function loadSampleData() {
    if (localStorage.getItem('nautilus-projects')) return;

    const sampleProjects = [
        {
            id: 1,
            name: "Россети - Профили обмена данными",
            description: "Разработка профилей для обмена данными между информационными системами Россетей",
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
                    packages: [
                        {
                            name: "IEC61970",
                            packages: [
                                {
                                    name: "Core",
                                    classes: ["Asset", "IdentifiedObject", "PowerSystemResource"]
                                },
                                {
                                    name: "Equipment",
                                    packages: [
                                        {
                                            name: "ConductingEquipment",
                                            classes: ["ACLineSegment", "PowerTransformer", "Switch"]
                                        },
                                        {
                                            name: "Generation",
                                            classes: ["GeneratingUnit", "SynchronousMachine", "ThermalGeneratingUnit"]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "IEC61968", 
                            packages: [
                                {
                                    name: "AssetInfo",
                                    classes: ["AssetInfo", "RotatingMachineInfo", "TransformerInfo"]
                                },
                                {
                                    name: "Metering",
                                    packages: [
                                        {
                                            name: "MeterReading",
                                            classes: ["MeterReading", "Reading", "IntervalReading"]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 2,
                    name: "GOSTExtension",
                    type: "Расширение модели",
                    description: "Расширения для российских ГОСТов",
                    classes: 87,
                    attributes: 345,
                    packages: [
                        {
                            name: "RussianExtensions",
                            packages: [
                                {
                                    name: "AssetInfo",
                                    classes: ["RotatingMachineInfo", "SynchronousMachineInfo", "RotorInfo"]
                                },
                                {
                                    name: "GovernanceExtensions",
                                    packages: [
                                        {
                                            name: "Regulations",
                                            classes: ["RegulatoryRequirement", "ComplianceRecord"]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
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
</xs:schema>`
                },
                {
                    id: 2,
                    name: "GOST-58651.3",
                    description: "Профиль передачи телеметрии",
                    baseModel: "TC57CIM",
                    version: "1.1",
                    classes: 32,
                    attributes: 178
                }
            ]
        },
        {
            id: 2,
            name: "Профили электросчётчиков",
            description: "Профили для систем АИИС КУЭ",
            version: "1.5",
            createdAt: "2024-10-01",
            models: [
                {
                    id: 3,
                    name: "IEC61968",
                    type: "Каноническая модель",
                    description: "Модель для учета электроэнергии",
                    classes: 267,
                    attributes: 1523,
                    packages: [
                        {
                            name: "Metering",
                            classes: ["Meter", "EndDevice", "Reading", "MeterReading"]
                        }
                    ]
                }
            ],
            profiles: [
                {
                    id: 3,
                    name: "MeterProfile",
                    description: "Профиль обмена данными электросчётчиков",
                    baseModel: "IEC61968",
                    version: "2.0",
                    classes: 28,
                    attributes: 156
                }
            ]
        }
    ];

    // Initialize MemoryStore instead of localStorage
    MemoryStore.initialize({
        projects: sampleProjects,
        currentProjectId: 1
    });
}

// Initialize FOCL project with data from focl.json
async function initializeFoclProject() {
    const data = await loadFoclData();
    if (!data || !data.rootPackages || data.rootPackages.length === 0) {
        console.warn('No FOCL data available');
        return;
    }

    // Create a project with FOCL data
    const foclProject = {
        id: 999,
        name: "FOCL - Волоконно-оптические линии",
        description: "Проект с данными из FOCL.json",
        version: "1.0",
        createdAt: new Date().toISOString().split('T')[0],
        models: [],
        profiles: []
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
    console.log('✅ FOCL project initialized');
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
        model.id = Math.max(...project.models.map(m => m.id), 0) + 1;
        project.models.push(model);
        return model;
    }
    return null;
}

function getModel(projectId, modelId) {
    const models = getModels(projectId);
    return models.find(m => m.id === modelId);
}

// Profile Management
function getProfiles(projectId) {
    const project = getProject(projectId);
    return project ? project.profiles : [];
}

function addProfile(projectId, profile) {
    const project = MemoryStore.getProject(projectId);
    if (project) {
        profile.id = Math.max(...project.profiles.map(p => p.id), 0) + 1;
        project.profiles.push(profile);
        return profile;
    }
    return null;
}

function getProfile(projectId, profileId) {
    const profiles = getProfiles(projectId);
    return profiles.find(p => p.id === profileId);
}

// UI Helpers
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function updateCurrentProject() {
    const project = getCurrentProject();
    const elem = document.getElementById('current-project');
    if (elem) {
        elem.textContent = project ? project.name : 'Нет проекта';
        elem.style.color = project ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
    }
}

// Sample class structure for tree view
function getSampleClassStructure() {
    return {
        "TC57CIM": [
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
                                    { name: "description", type: "String", multiplicity: "0..1" }
                                ]
                            },
                            {
                                name: "PowerSystemResource",
                                type: "class",
                                parent: "IdentifiedObject",
                                attributes: []
                            }
                        ]
                    }
                ]
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
                                    { name: "rotorGD2", type: "Torque", multiplicity: "0..1", description: "Маховой момент ротора генератора, т·м²" }
                                ],
                                associations: [
                                    { name: "TestInfo", type: "Association", target: "TestInfo", multiplicity: "0..*" }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

// ============================================================
// DEBUG UTILITIES
// ============================================================
function debugStore() {
    console.group('MemoryStore Debug Info');
    console.log('Projects count:', MemoryStore.getProjects().length);
    console.log('Current project ID:', MemoryStore.getCurrentProjectId());
    console.log('All projects:', MemoryStore.getProjects());
    console.log('Current project:', MemoryStore.getCurrentProject());
    console.groupEnd();
}

console.log('✅ Nautilus.CIM Data Library loaded');
