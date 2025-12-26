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
      createDate: "2024-09-15",
      modifyDate: "",
      accessRights: "custom",
      models: [
        // первая модель
        {
          id: "2",
          name: "TC57CIM - CIM100",
          description: "CIM 100 версия IEC 61970/61968, редакция 2025 года",
          type: "Каноническая модель",
          version: "2025.0",
          createDate: "2024-11-20",
          modifyDate: null,
          legalState: "project",
          legalAct: "",
          accessRights: "readOnly",
          relatedProfiles: [],
          rootPackages: CIM100Model,
        },
        //вторая  модель
        {
          id: "3",
          name: "GOSTExtension",
          description: "Расширения для российских ГОСТов",
          type: "Расширение модели RU",
          version: "1.0",
          createDate: "2024-11-20",
          modifyDate: "2025-10-10",
          legalState: "project",
          legalAct: "",
          accessRights: "readWrite",
          relatedProfiles: [
            { id: "4", name: "GOST-XXXXX.2" },
            { id: "5", name: "Проект ГОСТ-XXXXX.Х" },
          ],
          rootPackages: gostrExtModel,
        },
      ],
      profiles: [
        {
          id: "4",
          name: "GOST-XXXXX.2",
          description: "Базисный профиль информационной модели",
          version: "1.0",
          relatedModels: [
            { id: "3", name: "GOSTExtension" },
          ],

          createDate: "2024-11-20",
          modifyDate: "2025-10-10",
          legalState: "project",
          legalAct: "",
          accessRights: "readWrite",
          rootPackages: GOST_X_2_profile,
        },
        {
          id: "5",
          name: "Проект ГОСТ-XXXXX.Х",
          description: "Профиль модели ЛЭП",
          version: "1.1",
          relatedModels: [
            { id: "3", name: "GOSTExtension" },
          ],
          createDate: "2025-09-21",
          modifyDate: "2025-10-10",
          legalState: "project",
          legalAct: "",
          accessRights: "readWrite",
          rootPackages: GOST_X_1_profile,
        },
      ],
    },
    {
      id: "6",
      name: "Профили электросчётчиков",
      description: "Профили для систем АИИС КУЭ",
      version: "1.5",
      createDate: "2024-10-01",
      modifyDate: "",
      accessRights: "readWrite",
      models: [
        {
          id: "7",
          name: "CIM16",
          description: "Модель для учета электроэнергии",
          type: "Каноническая модель. Расширение Системного оператора",
          version: "1.101",
          createDate: "2025-08-11",
          modifyDate: "2025-09-10",
          legalState: "project",
          legalAct: "",
          accessRights: "readWrite",
          relatedProfiles: [{ id: "8", name: "MeterProfile" }],
          rootPackages: CIM16Model,
        },
      ],
      profiles: [
        {
          id: "8",
          name: "MeterProfile",
          description: "Профиль обмена данными электросчётчиков",
          version: "2.0",
          relatedModels: [
            { id: "7", name: "CIM16" },
          ],

          createDate: "2025-08-11",
          modifyDate: "2025-09-10",
          legalState: "project",
          legalAct: "",
          accessRights: "readWrite",
          rootPackages: [],
        },
      ],
    },
    {
      id: "9",
      name: "Волоконно-оптические линии",
      description: "Проект расширения CIM для волоконно-оптических линий связи",
      version: "1.0",
      createDate: "2025-10-01",
      modifyDate: "",
      accessRights: "readWrite",
      models: [
        {
          id: "10",
          name: "CIM-FiberOptic",
          description:
            "Проект модели для волоконно-оптических линий связи, включая оконечное оборудование",
          type: "Расширение для волоконно-оптических линий связи",
          version: "0.101",
          createDate: "2025-05-11",
          modifyDate: "2025-09-10",
          legalState: "project",
          legalAct: "",
          accessRight: "readWrite",
          relatedProfiles: [{ id: "11", name: "FOProfile" }],
          rootPackages: foclModel,
        },
      ],
      profiles: [
        {
          id: "11",
          name: "FOProfile",
          description: "Профиль для волоконно-оптических линий связи",
          version: "0.0.1",
          relatedModels: [
            { id: "10", name: "CIM-FiberOptic" },
          ],

          createDate: "2025-09-11",
          modifyDate: "2025-09-11",
          legalState: "project",
          legalAct: "",
          accessRights: "readWrite",
          rootPackages: [],
        },
      ],
    },
  ];

  return testProjects;
}

export { loadTestData };
