// Универсальная загрузка JSON (rootPackages) с логированием и fallback
async function fetchPackages(url, fallback, { expectArray = false } = {}) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    const data = await response.json();

    if (expectArray && !Array.isArray(data)) {
      console.warn(`⚠️ ${url} returned non-array JSON. Using fallback.`);
      return fallback;
    }

    console.log(`✅ ${url} loaded successfully`);
    return data;
  } catch (error) {
    console.error(`❌ Error loading ${url}:`, error);
    return fallback;
  }
}

async function loadTestData() {
  const [
    CIM100Model,
    gostrExtModel,
    CIM16Model,
    foclModel,
    GOST_X_2_profile,
    GOST_X_1_profile,
  ] = await Promise.all([
    fetchPackages("./models-data/CIM100-model.json", [], { expectArray: true }),
    fetchPackages("./models-data/GOSTRExt-model.json", [], { expectArray: true }),
    fetchPackages("./models-data/CIM16-model.json", [], { expectArray: true }),
    fetchPackages("./models-data/focl-model.json", [], { expectArray: true }),
    fetchPackages("./models-data/GOST-XXXXX.2-profile.json", [], { expectArray: true }),
    fetchPackages("./models-data/GOST-XXXXX.1-profile.json", [], { expectArray: true }),
  ]);

  const testProjects = [
    {
      id: "1",
      name: "Россети - Профили обмена данными",
      description:
        "Разработка профилей для обмена данными между информационными системами Россетей",
      version: "2.0",
      createdAt: "2024-09-15",
      models: [
        // первая модель
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
          rootPackages: CIM100Model,
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
          rootPackages: gostrExtModel,
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
          rootPackages: GOST_X_2_profile,
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
          rootPackages: GOST_X_1_profile,
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
          rootPackages: CIM16Model,
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
          rootPackages: foclModel,
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

  return testProjects;
}

export { loadTestData };
