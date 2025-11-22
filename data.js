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
                      elements: [
                        {
                          id: "EAID_7B1D2B24_5A8E_4fb9_B5F3_EA0025B03A1B",
                          name: "ActivePower",
                          type: "Class",
                          description:
                            "Произведение действующего значения напряжения на действующее значение совпадающей с ним по фазе составляющей тока.",
                          visibility: "public",
                          isAbstract: false,
                          attributeCount: 3,
                          linkCount: 0,
                          attributes: [
                            {
                              name: "multiplier",
                              type: "UnitMultiplier",
                              description: null,
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                            {
                              name: "unit",
                              type: "UnitSymbol",
                              description: null,
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                            {
                              name: "value",
                              type: "Float",
                              description: null,
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                          ],
                          links: [],
                        },
                        {
                          id: "EAID_A19BEF63_4709_404e_80B9_BFA86CC59688",
                          name: "ActivePowerChangeRate",
                          type: "Class",
                          description:
                            "Скорость изменения активной мощности в секунду.",
                          visibility: "public",
                          isAbstract: false,
                          attributeCount: 3,
                          linkCount: 0,
                          attributes: [
                            {
                              name: "multiplier",
                              type: "UnitMultiplier",
                              description: null,
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                            {
                              name: "unit",
                              type: "UnitSymbol",
                              description: null,
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                            {
                              name: "value",
                              type: "Float",
                              description: null,
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                          ],
                          links: [],
                        },
                        {
                          id: "EAID_D8333F0C_B805_4b59_879D_B951B82F152B",
                          name: "AngleDegrees",
                          type: "Class",
                          description: "Угол в градусах.",
                          visibility: "public",
                          isAbstract: false,
                          attributeCount: 3,
                          linkCount: 0,
                          attributes: [
                            {
                              name: "multiplier",
                              type: "UnitMultiplier",
                              description: null,
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                            {
                              name: "unit",
                              type: "UnitSymbol",
                              description: null,
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                            {
                              name: "value",
                              type: "Float",
                              description: null,
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                          ],
                          links: [],
                        },
                      ],
                    },
                    {
                      id: "EAPK_CE9851B0_8E38_4b48_8F62_E78E9C31767A",
                      name: "Core",
                      type: "Package",
                      description:
                        "Содержит основные объекты PowerSystemResource и ConductingEquipment, общие для всех приложений, а также общие коллекции этих объектов. Не для всех приложений требуются все основные объекты.  Этот пакет не зависит ни от какого другого пакета, кроме пакета домена, но большинство других пакетов имеют ассоциации и обобщения, которые зависят от него.",
                      elementCount: 24,
                      elements: [
                        {
                          id: "EAID_354F3161_B347_492e_AA95_DF9E00BCCB2E",
                          name: " PowerSystemResource",
                          type: "Class",
                          description: "Обобщенный объект энергосистемы.",
                          visibility: "public",
                          isAbstract: true,
                          attributeCount: 0,
                          linkCount: 6,
                          attributes: [],
                          links: [
                            {
                              assoc_id:
                                "EAID_F59A1021_3375_49d9_AC73_E12D4C8B0287",
                              relation_kind: "Generalization",
                              role: "child",
                              target_class_id:
                                "EAID_69526261_F2D9_4f06_86B3_638695E07849",
                              target_class_name: "IdentifiedObject",
                              target_class_role_name: null,
                              src_class_role_name: null,
                              target_description: null,
                              multiplicity: "1",
                            },
                            {
                              assoc_id:
                                "EAID_09E1D860_72D5_481e_911A_CD6DD254B5E9",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_4B0D8650_9FAB_4469_B419_929D38AB2EF7",
                              target_class_name: "PSRType",
                              target_class_role_name: "PSRType",
                              src_class_role_name: "PowerSystemResources",
                              target_description:
                                "Дополнительный классификатор",
                              multiplicity: "0..1",
                            },
                            {
                              assoc_id:
                                "EAID_A3484315_CE18_4e75_A28D_8C52818F9862",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_1D1470F1_F5C8_4731_94E4_19A25CA7FEEE",
                              target_class_name: "Measurement",
                              target_class_role_name: "Measurements",
                              src_class_role_name: "PowerSystemResource",
                              target_description:
                                "Параметры измерений, которые относятся к обобщенному объекту энергосистемы.",
                              multiplicity: "0..*",
                            },
                            {
                              assoc_id:
                                "EAID_225423CB_CE47_4a28_9EE3_6D19E58F0B8B",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_2855D338_0ACD_4a6e_9B09_C2942CFD2FD5",
                              target_class_name: "Location",
                              target_class_role_name: "Location",
                              src_class_role_name: "PowerSystemResources",
                              target_description:
                                "Расположение объекта энергосистемы.",
                              multiplicity: "0..1",
                            },
                            {
                              assoc_id:
                                "EAID_61E1954E_F09E_4e1d_A079_6DF5E8C00743",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_F9A5606C_0571_43e1_A21A_7691F2583BC6",
                              target_class_name: "Asset",
                              target_class_role_name: "Assets",
                              src_class_role_name: "PowerSystemResources",
                              target_description:
                                "Материальные объекты, ассоциированные с объектом энергосистемы.",
                              multiplicity: "0..*",
                            },
                            {
                              assoc_id:
                                "EAID_FCB32C14_7DFC_4ed7_87AF_C0D6202E0644",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_F3903666_388F_4547_8970_C989D7A0D873",
                              target_class_name: "AssetInfo",
                              target_class_role_name: "AssetDatasheet",
                              src_class_role_name: "PowerSystemResources",
                              target_description:
                                "Информация о материальном объекте для соответствующего объекта, потомка обощенного объекта энергосистемы.",
                              multiplicity: "0..1",
                            },
                          ],
                        },
                        {
                          id: "EAID_54896FF0_3E97_4762_8929_9BAB337953B0",
                          name: "ACDCTerminal",
                          type: "Class",
                          description: "Полюс постоянного и переменного тока.",
                          visibility: "public",
                          isAbstract: true,
                          attributeCount: 1,
                          linkCount: 3,
                          attributes: [
                            {
                              name: "sequenceNumber",
                              type: "Integer",
                              description:
                                "Порядковый номер полюса электропроводящего оборудования",
                              multiplicity: "1",
                              visibility: "public",
                            },
                          ],
                          links: [
                            {
                              assoc_id:
                                "EAID_30261C98_0E2F_491a_B1D8_7151B6F1B294",
                              relation_kind: "Generalization",
                              role: "child",
                              target_class_id:
                                "EAID_69526261_F2D9_4f06_86B3_638695E07849",
                              target_class_name: "IdentifiedObject",
                              target_class_role_name: null,
                              src_class_role_name: null,
                              target_description: null,
                              multiplicity: "1",
                            },
                            {
                              assoc_id:
                                "EAID_070BF7E4_D276_45e4_8DE2_2A9F91BBA734",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_A4B2659A_BFE2_41d0_A195_281C431BB1B8",
                              target_class_name: "OperationalLimitSet",
                              target_class_role_name: "OperationalLimitSet",
                              src_class_role_name: "Terminal",
                              target_description:
                                "Эксплуатационные ограничения/пределы, относящиеся к полюсу.",
                              multiplicity: "0..*",
                            },
                            {
                              assoc_id:
                                "EAID_3A42799F_3A9A_4a1e_AB49_9CD4330CA115",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_1D1470F1_F5C8_4731_94E4_19A25CA7FEEE",
                              target_class_name: "Measurement",
                              target_class_role_name: "Measurements",
                              src_class_role_name: "Terminal",
                              target_description:
                                "Параметры измерений, которые относятся к полюсу электропроводящего оборудования.",
                              multiplicity: "0..*",
                            },
                          ],
                        },
                        {
                          id: "EAID_A40E5870_2CE1_4630_B472_C63241F9603D",
                          name: "BaseVoltage",
                          type: "Class",
                          description: "Стандартное номинальное напряжение.",
                          visibility: "public",
                          isAbstract: false,
                          attributeCount: 2,
                          linkCount: 5,
                          attributes: [
                            {
                              name: "isDC",
                              type: "Boolean",
                              description:
                                "Признак того, что значение номинального напряжения является напряжением постоянного тока.",
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                            {
                              name: "nominalVoltage",
                              type: "Voltage",
                              description:
                                "Значение номинального напряжения, кВ.",
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                          ],
                          links: [
                            {
                              assoc_id:
                                "EAID_F0C4E4E3_B263_493e_86B5_AF2E155DEF53",
                              relation_kind: "Generalization",
                              role: "child",
                              target_class_id:
                                "EAID_69526261_F2D9_4f06_86B3_638695E07849",
                              target_class_name: "IdentifiedObject",
                              target_class_role_name: null,
                              src_class_role_name: null,
                              target_description: null,
                              multiplicity: "1",
                            },
                            {
                              assoc_id:
                                "EAID_DC1595E5_36B4_47e8_9E17_7E9256621B9F",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_EB534BB1_4810_421d_8CAB_CC1D40CA4015",
                              target_class_name: "ConductingEquipment",
                              target_class_role_name: "ConductingEquipment",
                              src_class_role_name: "BaseVoltage",
                              target_description:
                                "Электропроводящее оборудование, относящееся к стандартному номинальному напряжению.",
                              multiplicity: "0..*",
                            },
                            {
                              assoc_id:
                                "EAID_4436BBC3_93D6_4303_A79E_FA505428543A",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_F911C51B_57D4_4433_BE3D_63CB46669482",
                              target_class_name: "VoltageLevel",
                              target_class_role_name: "VoltageLevel",
                              src_class_role_name: "BaseVoltage",
                              target_description:
                                "Распределительные устройства, относящиеся к стандартному номинальному напряжению.",
                              multiplicity: "0..*",
                            },
                            {
                              assoc_id:
                                "EAID_A7013730_399F_4301_87BA_6835642CE860",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_6A2D54CE_9CBC_4434_A9B7_480ACAD0062A",
                              target_class_name: "AssetDeployment",
                              target_class_role_name: "NetworkAssetDeployment",
                              src_class_role_name: "BaseVoltage",
                              target_description:
                                "Материальные объекты, внедряемые на номинальном напряжении.",
                              multiplicity: "0..*",
                            },
                            {
                              assoc_id:
                                "EAID_EB209A92_4EE6_4b61_BCEF_9A6D1E63ABEA",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_8C09CC0E_835B_4120_BF44_93D1EAC112DA",
                              target_class_name: "TransformerEnd",
                              target_class_role_name: "TransformerEnds",
                              src_class_role_name: "BaseVoltage",
                              target_description:
                                "Вводы трансформатора, относящиеся к стандартному номинальному напряжению.",
                              multiplicity: "0..*",
                            },
                          ],
                        },
                        {
                          id: "EAID_47E8E46F_3163_4ab0_995E_F6E2F40491B1",
                          name: "Bay",
                          type: "Class",
                          description: "Ячейка распределительного устройства.",
                          visibility: "public",
                          isAbstract: false,
                          attributeCount: 2,
                          linkCount: 2,
                          attributes: [
                            {
                              name: "breakerConfiguration",
                              type: "BreakerConfiguration",
                              description:
                                "Конфигурация соединения выключателей.",
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                            {
                              name: "busBarConfiguration",
                              type: "BusbarConfiguration",
                              description: "Конфигурация шин присоединения.",
                              multiplicity: "0..1",
                              visibility: "public",
                            },
                          ],
                          links: [
                            {
                              assoc_id:
                                "EAID_060370F6_EFCA_4fb0_B85D_FA444E979230",
                              relation_kind: "Generalization",
                              role: "child",
                              target_class_id:
                                "EAID_ABB9B11C_E9F2_4890_A8DF_235EE5DF89EA",
                              target_class_name: "EquipmentContainer",
                              target_class_role_name: null,
                              src_class_role_name: null,
                              target_description: null,
                              multiplicity: "1",
                            },
                            {
                              assoc_id:
                                "EAID_DE7E59D5_4421_4fbf_9FA9_AAA3A14901AD",
                              relation_kind: "Association",
                              role: "unspecified",
                              target_class_id:
                                "EAID_F911C51B_57D4_4433_BE3D_63CB46669482",
                              target_class_name: "VoltageLevel",
                              target_class_role_name: "VoltageLevel",
                              src_class_role_name: "Bays",
                              target_description:
                                "Распределительное устройство, к которому относится присоединение.",
                              multiplicity: "1",
                            },
                          ],
                        },
                      ],
                      children: [
                        {
                          id: "EAPK_38D068F1_7EB3_431f_AC75_50C618E48644",
                          name: "Wires",
                          type: "Package",
                          description:
                            "Расширение к пакету Core и Topology, которое моделирует информацию об электрических характеристиках сетей передачи и распределения.",
                          elementCount: 70,
                          elements: [
                            {
                              id: "EAID_DB1BE59A_9417_4a12_9A53_17007675EEA5",
                              name: "ACLineSegment",
                              type: "Class",
                              description: "Участок линии переменного тока.",
                              visibility: "public",
                              isAbstract: false,
                              attributeCount: 8,
                              linkCount: 4,
                              attributes: [
                                {
                                  name: "b0ch",
                                  type: "Susceptance",
                                  description:
                                    "Реактивная проводимость на землю нулевой последовательности, См.",
                                  multiplicity: "0..1",
                                  visibility: "public",
                                },
                                {
                                  name: "bch",
                                  type: "Susceptance",
                                  description:
                                    "Реактивная проводимость на землю прямой последовательности, См.",
                                  multiplicity: "0..1",
                                  visibility: "public",
                                },
                                {
                                  name: "g0ch",
                                  type: "Conductance",
                                  description:
                                    "Активная проводимость на землю нулевой последовательности, См.",
                                  multiplicity: "0..1",
                                  visibility: "public",
                                },
                                {
                                  name: "gch",
                                  type: "Conductance",
                                  description:
                                    "Активная проводимость на землю прямой последовательности, См.",
                                  multiplicity: "0..1",
                                  visibility: "public",
                                },
                                {
                                  name: "r",
                                  type: "Resistance",
                                  description:
                                    "Активное сопротивление прямой последовательности, Ом.",
                                  multiplicity: "0..1",
                                  visibility: "public",
                                },
                                {
                                  name: "r0",
                                  type: "Resistance",
                                  description:
                                    "Активное сопротивление нулевой последовательности, Ом.",
                                  multiplicity: "0..1",
                                  visibility: "public",
                                },
                                {
                                  name: "x",
                                  type: "Reactance",
                                  description:
                                    "Реактивное сопротивление прямой последовательности, Ом.",
                                  multiplicity: "0..1",
                                  visibility: "public",
                                },
                                {
                                  name: "x0",
                                  type: "Reactance",
                                  description:
                                    "Реактивное сопротивление нулевой последовательности, Ом.",
                                  multiplicity: "0..1",
                                  visibility: "public",
                                },
                              ],
                              links: [
                                {
                                  assoc_id:
                                    "EAID_F48E9924_E3D5_4346_9592_2EA06A43D01E",
                                  relation_kind: "Generalization",
                                  role: "child",
                                  target_class_id:
                                    "EAID_83CEE48A_D9B5_4e8e_B638_B9EC10E64CFD",
                                  target_class_name: "Conductor",
                                  target_class_role_name: null,
                                  src_class_role_name: null,
                                  target_description: null,
                                  multiplicity: "1",
                                },
                                {
                                  assoc_id:
                                    "EAID_72DC4CC5_D689_4a6e_BDDA_A8A57335A2AA",
                                  relation_kind: "Association",
                                  role: "unspecified",
                                  target_class_id:
                                    "EAID_6EEDE91F_AF99_49f7_9009_B98D33FE1C02",
                                  target_class_name: "ACLineSeriesSection",
                                  target_class_role_name:
                                    "ACLineSeriesSections",
                                  src_class_role_name: "ACLineSegment",
                                  target_description:
                                    "Сегменты участка линии переменного тока.",
                                  multiplicity: "0..*",
                                },
                                {
                                  assoc_id:
                                    "EAID_79AFE40F_EF83_430a_8C6C_6805845870AA",
                                  relation_kind: "Association",
                                  role: "unspecified",
                                  target_class_id:
                                    "EAID_816F25E3_E985_41a8_9ECF_CAB3A6D9F943",
                                  target_class_name: "PerLengthImpedance",
                                  target_class_role_name: "PerLengthImpedance",
                                  src_class_role_name: "ACLineSegments",
                                  target_description:
                                    "Удельные параметры участка линии переменного тока.",
                                  multiplicity: "0..1",
                                },
                                {
                                  assoc_id:
                                    "EAID_7AA850F3_77FD_4b93_AF1E_483B66C66A7F",
                                  relation_kind: "Association",
                                  role: "unspecified",
                                  target_class_id:
                                    "EAID_E3CD7975_020D_4f10_8E77_E7DF88BB018C",
                                  target_class_name: "ACLineSegmentPhase",
                                  target_class_role_name: "ACLineSegmentPhases",
                                  src_class_role_name: "ACLineSegment",
                                  target_description:
                                    "Фаза участка линии переменного тока.",
                                  multiplicity: "0..*",
                                },
                              ],
                            },
                          ],
                          children: [],
                        },

                        {
                          id: "EAPK_8659D928_50B5_43b5_B1EB_DABFA4899FC4",
                          name: "Generation",
                          type: "Package",
                          description:
                            "Этот пакет содержит пакеты, содержащие информацию для ввода в эксплуатацию энергоблоков и экономичной диспетчеризации гидроэлектростанций и тепловых электростанций, Прогнозирования нагрузки, автоматического управления генерацией и моделирования энергоблоков для обучающего моделирования.",
                          elementCount: 0,
                          elements: [],
                          children: [
                            {
                              id: "EAPK_3BDC9BFB_D60A_4684_B1D8_9D18AE75A873",
                              name: "GenerationTrainingSimulation",
                              type: "Package",
                              description:
                                "Пакет Generation Trainingsimulation содержит первичные двигатели, такие как турбины и котлы, которые необходимы для моделирования и образовательных целей.",
                              elementCount: 13,
                              elements: [
                                {
                                  id: "EAID_667873FB_BB4F_411d_8BAA_5179780AA931",
                                  name: "BWRSteamSupply",
                                  type: "Class",
                                  description: "Кипящий водо-водяной реактор.",
                                  visibility: "public",
                                  isAbstract: false,
                                  attributeCount: 0,
                                  linkCount: 1,
                                  attributes: [],
                                  links: [
                                    {
                                      assoc_id:
                                        "EAID_6DF23B2C_8DCC_42cc_8996_F6423F4F34C6",
                                      relation_kind: "Generalization",
                                      role: "child",
                                      target_class_id:
                                        "EAID_BBEDB211_CA96_4ee1_830D_A4746B6FCCC7",
                                      target_class_name: "SteamSupply",
                                      target_class_role_name: null,
                                      src_class_role_name: null,
                                      target_description: null,
                                      multiplicity: "1",
                                    },
                                  ],
                                },
                                {
                                  id: "EAID_1993A138_EC75_4d3d_B257_5437704A7948",
                                  name: "CombustionTurbine",
                                  type: "Class",
                                  description: "Газовая турбина.",
                                  visibility: "public",
                                  isAbstract: false,
                                  attributeCount: 0,
                                  linkCount: 2,
                                  attributes: [],
                                  links: [
                                    {
                                      assoc_id:
                                        "EAID_4DA0C915_1F76_4e88_BE56_80118574687E",
                                      relation_kind: "Generalization",
                                      role: "child",
                                      target_class_id:
                                        "EAID_32673BB0_AE9B_4d02_B476_BB3AB3D8DF0B",
                                      target_class_name: "PrimeMover",
                                      target_class_role_name: null,
                                      src_class_role_name: null,
                                      target_description: null,
                                      multiplicity: "1",
                                    },
                                    {
                                      assoc_id:
                                        "EAID_18DD14AD_4805_42f7_AAEA_A625230228EA",
                                      relation_kind: "Association",
                                      role: "unspecified",
                                      target_class_id:
                                        "EAID_6D747A43_42B4_4a80_8B17_CEC42B611156",
                                      target_class_name: "HeatRecoveryBoiler",
                                      target_class_role_name:
                                        "HeatRecoveryBoiler",
                                      src_class_role_name: "CombustionTurbines",
                                      target_description:
                                        "Котел утилизатор газовой турбины.",
                                      multiplicity: "0..1",
                                    },
                                  ],
                                },
                                {
                                  id: "EAID_44B8A75F_2DCD_482b_9A0C_B518EA1A06DE",
                                  name: "DrumBoiler",
                                  type: "Class",
                                  description: "Барабанный котел.",
                                  visibility: "public",
                                  isAbstract: false,
                                  attributeCount: 0,
                                  linkCount: 1,
                                  attributes: [],
                                  links: [
                                    {
                                      assoc_id:
                                        "EAID_F1A9D668_3F1A_440e_A01F_772CDD78D95B",
                                      relation_kind: "Generalization",
                                      role: "child",
                                      target_class_id:
                                        "EAID_850D820D_7835_4259_A624_69C8FFD1D875",
                                      target_class_name: "FossilSteamSupply",
                                      target_class_role_name: null,
                                      src_class_role_name: null,
                                      target_description: null,
                                      multiplicity: "1",
                                    },
                                  ],
                                },
                                {
                                  id: "EAID_850D820D_7835_4259_A624_69C8FFD1D875",
                                  name: "FossilSteamSupply",
                                  type: "Class",
                                  description: "Котел на ископаемом топливе.",
                                  visibility: "public",
                                  isAbstract: true,
                                  attributeCount: 0,
                                  linkCount: 1,
                                  attributes: [],
                                  links: [
                                    {
                                      assoc_id:
                                        "EAID_990D22B1_EA4E_4d2d_B8EC_CD0221D899D6",
                                      relation_kind: "Generalization",
                                      role: "child",
                                      target_class_id:
                                        "EAID_BBEDB211_CA96_4ee1_830D_A4746B6FCCC7",
                                      target_class_name: "SteamSupply",
                                      target_class_role_name: null,
                                      src_class_role_name: null,
                                      target_description: null,
                                      multiplicity: "1",
                                    },
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
