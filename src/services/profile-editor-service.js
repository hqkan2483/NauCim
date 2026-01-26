/**
 * Profile Editor Service
 * Handles logic for transferring items between models/profiles and the profile being edited
 */

/**
 * Transfer selected items to profile
 * @param {Set} selectedItems - Set of selected item keys
 * @param {Array} availableData - Available models/profiles data
 * @param {Object} profileData - Current profile data
 * @returns {Object} Updated profile data
 */
export function transferItemsToProfile(selectedItems, availableData, profileData) {

  if (!Array.isArray(profileData.items)) {
    profileData.items = [];
  }

  const report = {
    transferred: [],
    skipped: [],
    notFound: [],
  };

  const existingClassNames = new Set();
  const existingPackageNames = new Set();
  collectExistingProfileNames(profileData.items, existingPackageNames, existingClassNames);

  const itemKeys = Array.from(selectedItems);

  itemKeys.forEach((itemKey) => {
    const pathInfo = findItemPathByKey(itemKey, availableData);
    if (!pathInfo) {
      console.warn("⚠️ Item not found for transfer:", itemKey);
      report.notFound.push(itemKey);
      return;
    }

    // 1) Если выбран корневой элемент модели/профиля слева — переносим всё содержимое
    if (pathInfo.leafKind === "root") {
      const rootPackages = pathInfo.rootItem?.children || [];
      rootPackages.forEach((pkg) => {
        mergePackageIntoProfile(profileData.items, pkg, existingPackageNames, existingClassNames, profileData.id, report, []);
      });

      const rootName = pathInfo.rootItem?.name ? String(pathInfo.rootItem.name) : "(без имени)";
      report.transferred.push(`Корень: ${rootName}`);
      return;
    }

    // 2) Если выбран пакет
    if (pathInfo.leafKind === "package") {
      const pkg = pathInfo.leafItem;
      const pkgNameKey = normalizeName(pkg?.name);
      const fullPath = formatPath([...pathInfo.packageChain.map((p) => p?.name).filter(Boolean)]);

      // Проверка дубля пакета по имени во всём правом дереве
      if (pkgNameKey && existingPackageNames.has(pkgNameKey)) {
        report.skipped.push({
          kind: "Пакет",
          name: pkg?.name ?? "(без имени)",
          path: fullPath,
          reason: "Совпадение имени: пакет уже есть в профиле",
        });
        return;
      }

      // Создаём цепочку пакетов до выбранного пакета (не включая его), затем мержим выбранный пакет
      const chainRes = ensurePackageChainResult(
        profileData.items,
        pathInfo.packageChain.slice(0, -1),
        profileData.id,
        existingPackageNames
      );

      mergePackageIntoProfile(chainRes.parentArray, pkg, existingPackageNames, existingClassNames, profileData.id, report, pathInfo.packageChain.slice(0, -1));

      report.transferred.push(`Пакет: ${fullPath || (pkg?.name ?? "(без имени)")}`);
      return;
    }

    // 3) Если выбран класс/перечисление
    if (pathInfo.leafKind === "class") {
      const cls = pathInfo.leafItem;
      const clsNameKey = normalizeName(cls?.name);
      const fullPath = formatPath([
        ...pathInfo.packageChain.map((p) => p?.name).filter(Boolean),
        cls?.name,
      ].filter(Boolean));

      // Проверка дубля класса по имени во всём правом дереве
      if (clsNameKey && existingClassNames.has(clsNameKey)) {
        report.skipped.push({
          kind: "Класс",
          name: cls?.name ?? "(без имени)",
          path: fullPath,
          reason: "Совпадение имени: класс уже есть в профиле",
        });
        return;
      }

      // Создаём цепочку пакетов до контейнера класса, затем добавляем класс
      const chainRes = ensurePackageChainResult(
        profileData.items,
        pathInfo.packageChain,
        profileData.id,
        existingPackageNames
      );

      if (chainRes.lastPackage) {
        addClassToPackage(chainRes.lastPackage, cls, existingClassNames, profileData.id);

        report.transferred.push(`Класс: ${fullPath || (cls?.name ?? "(без имени)")}`);
        return;
      }

      // fallback: класс без пакета (нештатно) — кладём в дефолтный пакет
      let defaultPackage = findPackageByName(profileData.items, "Imported Classes");
      if (!defaultPackage) {
        defaultPackage = {
          id: "imported-classes",
          name: "Imported Classes",
          type: "Package",
          documentation: "Автоматически созданный пакет для импортированных классов",
          classes: [],
          subPackages: [],
          profileId: profileData.id,
        };
        profileData.items.push(defaultPackage);
        existingPackageNames.add(normalizeName(defaultPackage.name));
      }
      addClassToPackage(defaultPackage, cls, existingClassNames, profileData.id);

      report.transferred.push(`Класс: ${fullPath || (cls?.name ?? "(без имени)")}`);
      return;
    }
  });

  return { profileData, report };
}

function normalizeName(name) {
  return String(name ?? "").trim().toLowerCase();
}

function getPackageChildren(pkg) {
  return pkg?.subPackages || pkg?.children || [];
}

function getPackageClasses(pkg) {
  return pkg?.classes || pkg?.elements || [];
}

function collectExistingProfileNames(packages, packageNames, classNames) {
  if (!Array.isArray(packages)) return;

  packages.forEach((pkg) => {
    const pkgNameKey = normalizeName(pkg?.name);
    if (pkgNameKey) packageNames.add(pkgNameKey);

    const classes = getPackageClasses(pkg);
    if (Array.isArray(classes)) {
      classes.forEach((cls) => {
        const clsNameKey = normalizeName(cls?.name);
        if (clsNameKey) classNames.add(clsNameKey);
      });
    }

    collectExistingProfileNames(getPackageChildren(pkg), packageNames, classNames);
  });
}

function clonePackageShell(sourcePkg, profileId) {
  const cloned = JSON.parse(JSON.stringify(sourcePkg || {}));
  cloned.profileId = profileId;
  cloned.type = "Package";
  cloned.classes = [];
  cloned.subPackages = [];
  return cloned;
}

function cloneClass(sourceCls, profileId) {
  const cloned = JSON.parse(JSON.stringify(sourceCls || {}));
  cloned.profileId = profileId;
  return cloned;
}

function findPackageByName(packagesArray, pkgName) {
  const nameKey = normalizeName(pkgName);
  if (!nameKey) return null;
  return (packagesArray || []).find((p) => normalizeName(p?.name) === nameKey) || null;
}

function ensurePackageByName(packagesArray, sourcePkg, profileId, existingPackageNames) {
  const existing = findPackageByName(packagesArray, sourcePkg?.name);
  if (existing) return existing;

  const created = clonePackageShell(sourcePkg, profileId);
  packagesArray.push(created);

  const nameKey = normalizeName(created?.name);
  if (nameKey) existingPackageNames.add(nameKey);
  return created;
}

/**
 * Создаёт цепочку пакетов в правом дереве по именам.
 * Возвращает массив пакетов на уровне, где лежит последний пакет цепочки (т.е. массив subPackages родителя).
 */
function ensurePackageChainResult(rootPackagesArray, sourcePackageChain, profileId, existingPackageNames) {
  let currentArray = rootPackagesArray;
  let lastPackage = null;

  if (!Array.isArray(sourcePackageChain) || sourcePackageChain.length === 0) {
    return { parentArray: currentArray, lastPackage };
  }

  sourcePackageChain.forEach((sourcePkg) => {
    lastPackage = ensurePackageByName(currentArray, sourcePkg, profileId, existingPackageNames);
    if (!lastPackage.subPackages) lastPackage.subPackages = [];
    currentArray = lastPackage.subPackages;
  });

  return { parentArray: currentArray, lastPackage };
}

function addClassToPackage(targetPkg, sourceCls, existingClassNames, profileId) {
  if (!targetPkg.classes) targetPkg.classes = [];

  const clsNameKey = normalizeName(sourceCls?.name);
  if (clsNameKey && existingClassNames.has(clsNameKey)) {
    return;
  }

  const cloned = cloneClass(sourceCls, profileId);
  targetPkg.classes.push(cloned);
  if (clsNameKey) existingClassNames.add(clsNameKey);
}

function mergePackageIntoProfile(parentPackagesArray, sourcePkg, existingPackageNames, existingClassNames, profileId, report, parentChain) {
  if (!sourcePkg) return;

  const safeParentArray = Array.isArray(parentPackagesArray) ? parentPackagesArray : [];

  // создаём/находим пакет по имени у текущего родителя
  const targetPkg = ensurePackageByName(safeParentArray, sourcePkg, profileId, existingPackageNames);

  if (report) {
    const pkgNameKey = normalizeName(sourcePkg?.name);
    if (pkgNameKey && existingPackageNames.has(pkgNameKey)) {
      // note: ensurePackageByName already added it; we keep reporting at higher-level to avoid spam
    }
  }

  // переносим классы (пропуская дубли по имени во всём профиле)
  const sourceClasses = getPackageClasses(sourcePkg);
  if (Array.isArray(sourceClasses) && sourceClasses.length > 0) {
    sourceClasses.forEach((cls) => {
      const clsNameKey = normalizeName(cls?.name);
      if (clsNameKey && existingClassNames.has(clsNameKey)) {
        if (report) {
          report.skipped.push({
            kind: "Класс",
            name: cls?.name ?? "(без имени)",
            path: formatPath([
              ...(parentChain || []).map((p) => p?.name).filter(Boolean),
              sourcePkg?.name,
              cls?.name,
            ].filter(Boolean)),
            reason: "Совпадение имени: класс уже есть в профиле",
          });
        }
        return;
      }

      addClassToPackage(targetPkg, cls, existingClassNames, profileId);

      if (report) {
        report.transferred.push(
          `Класс: ${formatPath([
            ...(parentChain || []).map((p) => p?.name).filter(Boolean),
            sourcePkg?.name,
            cls?.name,
          ].filter(Boolean))}`
        );
      }
    });
  }

  // переносим подпакеты рекурсивно (по имени, с merge)
  const sourceSubPackages = getPackageChildren(sourcePkg);
  if (!targetPkg.subPackages) targetPkg.subPackages = [];
  if (Array.isArray(sourceSubPackages) && sourceSubPackages.length > 0) {
    sourceSubPackages.forEach((sp) => {
      const nextChain = [...(parentChain || []), sourcePkg];
      mergePackageIntoProfile(targetPkg.subPackages, sp, existingPackageNames, existingClassNames, profileId, report, nextChain);
    });
  }
}

function formatPath(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return "";
  return parts.map((p) => String(p)).join("/");
}

/**
 * Возвращает путь (цепочку пакетов) и выбранный объект по ключу левого дерева.
 */
function findItemPathByKey(itemKey, availableData) {
  const parts = itemKey.split("-");
  if (parts.length < 3) return null;

  const type = parts[1];
  const pathStartIndex = parts.indexOf("pkg", 2);
  const idParts = pathStartIndex === -1 ? parts.slice(2) : parts.slice(2, pathStartIndex);
  const id = idParts.join("-");

  const rootItem = availableData.find((item) =>
    item.type === type && (item.id === id )
  );
  if (!rootItem) return null;

  if (pathStartIndex === -1) {
    return { leafKind: "root", rootItem, packageChain: [], containerPackage: null, leafItem: rootItem };
  }

  const pathParts = parts.slice(pathStartIndex);
  const res = navigateToChildWithAncestors(rootItem.children, pathParts, []);
  if (!res) return null;

  return {
    leafKind: res.leafKind,
    rootItem,
    packageChain: res.packageChain,
    containerPackage: res.containerPackage,
    leafItem: res.leafItem,
  };
}

function navigateToChildWithAncestors(children, pathParts, ancestors) {
  if (!children || !Array.isArray(children) || pathParts.length === 0) {
    return null;
  }

  const [type, indexStr, ...rest] = pathParts;
  const index = parseInt(indexStr);

  if (type !== "pkg") return null;
  const pkg = children[index];
  if (!pkg) return null;

  const nextAncestors = [...ancestors, pkg];

  if (rest.length === 0) {
    return {
      leafKind: "package",
      packageChain: nextAncestors,
      containerPackage: ancestors.length > 0 ? ancestors[ancestors.length - 1] : null,
      leafItem: pkg,
    };
  }

  const nextType = rest[0];

  if (nextType === "cls" || nextType === "elem") {
    const clsIndex = parseInt(rest[1]);
    const classes = getPackageClasses(pkg);
    const cls = classes[clsIndex];
    if (!cls) return null;

    return {
      leafKind: "class",
      packageChain: nextAncestors,
      containerPackage: pkg,
      leafItem: cls,
    };
  }

  if (nextType === "pkg") {
    const subPackages = getPackageChildren(pkg);
    return navigateToChildWithAncestors(subPackages, rest, nextAncestors);
  }

  return null;
}


/**
 * Remove selected items from profile
 * @param {Set} selectedItems - Set of selected item keys
 * @param {Object} profileData - Current profile data
 * @returns {Object} Updated profile data
 */
export function removeItemsFromProfile(selectedItems, profileData) {
  const itemsToRemove = [];

  selectedItems.forEach(itemKey => {
    // Parse key to find item
    const pathInfo = parseProfileItemKey(itemKey);
    if (pathInfo) {
      itemsToRemove.push(pathInfo);
    }
  });

  // Sort by depth (deepest first) to avoid index shifting issues
  itemsToRemove.sort((a, b) => b.depth - a.depth);

  // Remove items
  itemsToRemove.forEach(pathInfo => {
    removeItemByPath(profileData.items, pathInfo);
  });

  return profileData;
}

/**
 * Parse profile item key to extract path information
 * @param {string} itemKey - Item key (e.g., "profile-root-pkg-1-cls-2")
 * @returns {Object|null} Path information
 */
function parseProfileItemKey(itemKey) {
  const parts = itemKey.split("-");

  // profile-root-pkg-1-cls-2
  // Remove "profile-root"
  if (parts[0] !== "profile" || parts[1] !== "root") {
    return null;
  }

  const pathParts = parts.slice(2);

  return {
    pathParts,
    depth: pathParts.length,
    itemKey
  };
}

/**
 * Remove item by path
 * @param {Array} items - Items array
 * @param {Object} pathInfo - Path information
 */
function removeItemByPath(items, pathInfo) {
  const { pathParts } = pathInfo;

  if (! items || pathParts.length === 0) return;

  const [type, indexStr, ...rest] = pathParts;
  const index = parseInt(indexStr);

  if (type === "pkg") {
    if (rest.length === 0) {
      // Remove package
      const removed = items.splice(index, 1);
    } else {
      const pkg = items[index];
      if (! pkg) return;

      const nextType = rest[0];

      if (nextType === "cls") {
        // Remove class from package
        const clsIndex = parseInt(rest[1]);
        const classes = pkg.classes || [];
        const removed = classes.splice(clsIndex, 1);
      } else if (nextType === "pkg") {
        // Recurse into sub-packages
        const subPackages = pkg.subPackages || pkg.children || [];
        const subPathInfo = {
          pathParts: rest,
          depth: rest.length
        };
        removeItemByPath(subPackages, subPathInfo);
      }
    }
  }
}

/**
 * Find item by key in available data
 * @param {string} itemKey - Item key (e.g., "left-model-3-pkg-1")
 * @param {Array} availableData - Available data
 * @returns {Object|null} Found item or null
 */
function findItemByKey(itemKey, availableData) {
  // Parse key: left-{type}-{id}-{path...}
  // IMPORTANT: {id} can contain dashes (e.g. UUID-like), so we can't assume parts[2] is the full id.
  const parts = itemKey.split("-");

  if (parts.length < 3) {
    console.warn("  ⚠️ Invalid key format");
    return null;
  }

  // parts[0] = "left"
  // parts[1] = "model" or "profile"
  // parts[2..] = id (can include dashes) + optional path starting with "pkg"
  const type = parts[1]; // "model" or "profile"

  const pathStartIndex = parts.indexOf("pkg", 2);
  const idParts = pathStartIndex === -1 ? parts.slice(2) : parts.slice(2, pathStartIndex);
  const id = idParts.join("-");

  // Find root item
  const rootItem = availableData.find(item => {
    const match = item.type === type && (
      item.id === id
    );
    return match;
  });

  if (!rootItem) {
    console.warn("  ⚠️ Root item not found");
    return null;
  }

  // If it's just the root item (e.g., "left-model-<id>")
  if (pathStartIndex === -1) {
    return rootItem;
  }

  // Navigate to child item
  const pathParts = parts.slice(pathStartIndex); // ["pkg", "1", "cls", "2"]

  const childItem = navigateToChild(rootItem.children, pathParts);

  return childItem;
}

/**
 * Navigate to child item using path parts
 * @param {Array} children - Children array
 * @param {Array} pathParts - Path parts (e.g., ["pkg", "1", "cls", "2"])
 * @returns {Object|null} Found item or null
 */
function navigateToChild(children, pathParts) {
  if (!children || ! Array.isArray(children) || pathParts.length === 0) {
    console.warn("  ⚠️ Invalid children or empty path");
    return null;
  }

  const [type, indexStr, ...rest] = pathParts;
  const index = parseInt(indexStr);

  if (type === "pkg") {
    const pkg = children[index];
    if (! pkg) {
      console.warn(`  ⚠️ Package not found at index ${index}`);
      return null;
    }

    // If this is the target
    if (rest.length === 0) {
      return pkg;
    }

    // Continue navigating
    const nextType = rest[0];

    if (nextType === "cls" || nextType === "elem") {
      const clsIndex = parseInt(rest[1]);
      const classes = pkg.classes || pkg.elements || [];

      const cls = classes[clsIndex];
      if (cls) {
      } else {
        console.warn(`  ⚠️ Class not found at index ${clsIndex}`);
      }
      return cls || null;

    } else if (nextType === "dia") {
      const diaIndex = parseInt(rest[1]);
      const diagrams = pkg.diagrams || [];
      const dia = diagrams[diaIndex];
      if (!dia) {
        console.warn(`  ⚠️ Diagram not found at index ${diaIndex}`);
      }
      return dia || null;

    } else if (nextType === "pkg") {
      const subPackages = pkg.subPackages || pkg.children || [];
      return navigateToChild(subPackages, rest);
    } else {
      console.warn("  ⚠️ Unexpected child path type in package:", nextType);
      return null;
    }
  }

  console.warn("  ⚠️ Unexpected path type:", type);
  return null;
}


/**
 * Add package to profile
 * @param {Object} pkg - Package to add
 * @param {Object} profileData - Profile data
 */
function addPackageToProfile(pkg, profileData) {
  if (!profileData.items) {
    profileData.items = [];
  }

  // Check if package already exists
  const exists = profileData.items.some(existingPkg =>
    existingPkg.id === pkg.id
  );

  if (exists) {
    return;
  }

  // Deep clone the package
  const clonedPkg = JSON.parse(JSON.stringify(pkg));

  // Mark as coming from profile (optional)
  clonedPkg.profileId = profileData.id;

  profileData.items.push(clonedPkg);
}

/**
 * Add classes to profile (create a default package if needed)
 * @param {Array} classes - Classes to add
 * @param {Object} profileData - Profile data
 */
function addClassesToProfile(classes, profileData) {
  if (!profileData.items) {
    profileData.items = [];
  }

  // Find or create "Imported Classes" package
  let defaultPackage = profileData.items.find(pkg =>
    pkg.name === "Imported Classes" || pkg.id === "imported-classes"
  );

  if (!defaultPackage) {
    defaultPackage = {
      id:  "imported-classes",
      name: "Imported Classes",
      type: "Package",
      documentation: "Автоматически созданный пакет для импортированных классов",
      classes: [],
      subPackages: []
    };
    profileData.items.push(defaultPackage);
  }

  // Add classes to default package
  classes.forEach(cls => {
    const exists = defaultPackage.classes.some(existingCls =>
      existingCls.id === cls.id
    );

    if (!exists) {
      const clonedCls = JSON.parse(JSON.stringify(cls));
      clonedCls.profileId = profileData.id;
      defaultPackage.classes.push(clonedCls);
    }
  });
}

/**
 * Check if item is already in profile
 * @param {string} itemId - Item ID
 * @param {string} itemType - Item type
 * @param {Object} profileData - Profile data
 * @returns {boolean} True if item is in profile
 */
export function isItemInProfile(itemId, itemType, profileData) {
  if (!profileData.items) return false;

  return profileData.items.some(item =>
    item.id === itemId && item.type === itemType
  );
}

/**
 * Get item details by key
 * @param {string} itemKey - Item key
 * @param {Array} availableData - Available data
 * @param {Object} profileData - Profile data
 * @returns {Object|null} Item details
 */
export function getItemDetailsByKey(itemKey, availableData, profileData) {
  const side = itemKey.startsWith("left") ? "left" : "right";

  if (side === "left") {
    const item = findItemByKey(itemKey, availableData);
    return item;
  } else {
    // Find in profile data
    const parts = itemKey.split("-");

    const pathParts = parts.slice(2); // Remove "profile-root"

    const item = navigateToChild(profileData.items, pathParts);
    return item;
  }
}

/**
 * Filter tree items by search query
 * @param {Array} items - Tree items
 * @param {string} query - Search query
 * @returns {Array} Filtered items
 */
export function filterTreeItems(items, query) {
  if (!query || query.trim() === "") return items;

  const lowerQuery = query.toLowerCase();

  return items.filter(item => {
    // Check if item name matches
    if (item.name?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Check children recursively
    if (item.children) {
      const filteredChildren = filterTreeItems(item.children, query);
      if (filteredChildren.length > 0) {
        return true;
      }
    }

    // Check elements
    if (item.elements) {
      const hasMatchingElement = item.elements.some(elem =>
        elem.name?.toLowerCase().includes(lowerQuery)
      );
      if (hasMatchingElement) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Validate profile before saving
 * @param {Object} profileData - Profile data
 * @returns {Object} Validation result {valid:  boolean, errors: Array}
 */
export function validateProfile(profileData) {
  const errors = [];

  if (!profileData.name || profileData.name.trim() === "") {
    errors.push("Название профиля не может быть пустым");
  }

  if (!profileData.items || profileData.items.length === 0) {
    errors.push("Профиль не может быть пустым");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Prepare profile data for saving
 * @param {Object} profileData - Profile data
 * @param {number} projectId - Project ID
 * @returns {Object} Prepared profile data
 */
export function prepareProfileForSave(profileData, projectId) {
  return {
    id: profileData.id,
    name: profileData.name,
    description: profileData.description || "",
    version: profileData.version || "0.1",
    relatedModels: profileData.relatedModels || [],
    createDate: profileData.createDate || new Date().toISOString(),
    modifyDate: new Date().toISOString(),
    legalState: profileData.legalState || "project",
    legalAct: profileData.legalAct || "",
    accessRights: profileData.accessRights || "readWrite",

    // ✅ NEW STRUCTURE:  Wrap items in rootPackages
    rootPackages: [
      {
        packages: profileData.items || [],
        generalizationsList: [],
        associationList: []
      }
    ]
  };
}
