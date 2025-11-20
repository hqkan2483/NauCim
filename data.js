// Nautilus.CIM Data Management Library

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
                    name: "TC57CIM",
                    type: "Каноническая модель",
                    description: "CIM версия IEC 61970/61968",
                    classes: 523,
                    attributes: 2847,
                    packages: [
                        {
                            name: "IEC61970",
                            classes: ["Asset", "PowerSystemResource", "Equipment", "ConductingEquipment"]
                        },
                        {
                            name: "IEC61968", 
                            classes: ["AssetInfo", "RotatingMachineInfo", "TransformerInfo"]
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
                            name: "AssetInfo",
                            classes: ["RotatingMachineInfo", "SynchronousMachineInfo"]
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

    localStorage.setItem('nautilus-projects', JSON.stringify(sampleProjects));
    localStorage.setItem('nautilus-current-project', '1');
}

// Project Management
function getProjects() {
    const data = localStorage.getItem('nautilus-projects');
    return data ? JSON.parse(data) : [];
}

function getAllProjects() {
    return getProjects();
}

function saveProjects(projects) {
    localStorage.setItem('nautilus-projects', JSON.stringify(projects));
}

function getProject(id) {
    const projects = getProjects();
    return projects.find(p => p.id === id);
}

function getCurrentProjectId() {
    return parseInt(localStorage.getItem('nautilus-current-project'));
}

function setCurrentProject(projectId) {
    localStorage.setItem('nautilus-current-project', projectId.toString());
}

function getCurrentProject() {
    const id = getCurrentProjectId();
    return id ? getProject(id) : null;
}

// Model Management
function getModels(projectId) {
    const project = getProject(projectId);
    return project ? project.models : [];
}

function addModel(projectId, model) {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
        model.id = Math.max(...project.models.map(m => m.id), 0) + 1;
        project.models.push(model);
        saveProjects(projects);
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
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
        profile.id = Math.max(...project.profiles.map(p => p.id), 0) + 1;
        project.profiles.push(profile);
        saveProjects(projects);
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

console.log('✅ Nautilus.CIM Data Library loaded');
