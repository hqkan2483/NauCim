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
  const itemsToTransfer = [];

  selectedItems.forEach(itemKey => {
    const item = findItemByKey(itemKey, availableData);
    if (item) {
      itemsToTransfer.push(item);
    }
  });

  // Add items to profile
  itemsToTransfer.forEach(item => {
    addItemToProfile(item, profileData);
  });

  return profileData;
}

/**
 * Remove selected items from profile
 * @param {Set} selectedItems - Set of selected item keys
 * @param {Object} profileData - Current profile data
 * @returns {Object} Updated profile data
 */
export function removeItemsFromProfile(selectedItems, profileData) {
  selectedItems.forEach(itemKey => {
    removeItemByKey(itemKey, profileData);
  });

  return profileData;
}

/**
 * Find item by key in available data
 * @param {string} itemKey - Item key (e.g., "left-model-3-pkg-1")
 * @param {Array} availableData - Available data
 * @returns {Object|null} Found item or null
 */
function findItemByKey(itemKey, availableData) {
  console.log("🔎 Finding item by key:", itemKey);

  // Parse key:  left-model-3-pkg-1-cls-2
  // Format: left-{type}-{id}-{path...}

  const parts = itemKey.split("-");
  console.log("  - Parts:", parts);

  if (parts.length < 3) {
    console.warn("  ⚠️ Invalid key format");
    return null;
  }

  // parts[0] = "left"
  // parts[1] = "model" or "profile"
  // parts[2] = id
  // parts[3+] = path

  const type = parts[1]; // "model" or "profile"
  const id = parts[2];   // "3"

  console.log("  - Type:", type);
  console.log("  - ID:", id);

  // Find root item
  const rootItem = availableData.find(item => {
    const match = item.type === type && (
      item.id === id ||
      item.id === parseInt(id) ||
      String(item.id) === id
    );
    console.log(`    Checking ${item.type}-${item.id}:  ${match}`);
    return match;
  });

  if (!rootItem) {
    console.warn("  ⚠️ Root item not found");
    return null;
  }

  console.log("  ✅ Root item found:", rootItem.name);

  // If it's just the root item (e.g., "left-model-3")
  if (parts.length === 3) {
    console.log("  ✅ Returning root item");
    return rootItem;
  }

  // Navigate to child item
  const pathParts = parts.slice(3); // ["pkg", "1", "cls", "2"]
  console.log("  - Path parts:", pathParts);

  const childItem = navigateToChild(rootItem.children, pathParts);
  console.log("  - Child item found:", childItem);

  return childItem;
}

/**
 * Navigate to child item using path parts
 * @param {Array} children - Children array
 * @param {Array} pathParts - Path parts (e.g., ["pkg", "1", "cls", "2"])
 * @returns {Object|null} Found item or null
 */
function navigateToChild(children, pathParts) {
  console.log("🧭 Navigating to child:");
  console.log("  - Children count:", children?.length || 0);
  console.log("  - Path parts:", pathParts);

  if (!children || ! Array.isArray(children) || pathParts.length === 0) {
    console.warn("  ⚠️ Invalid children or empty path");
    return null;
  }

  const [type, indexStr, ...rest] = pathParts;
  const index = parseInt(indexStr);

  console.log(`  - Navigating:  ${type}[${index}]`);

  if (type === "pkg") {
    const pkg = children[index];
    if (! pkg) {
      console.warn(`  ⚠️ Package not found at index ${index}`);
      return null;
    }

    console.log(`  ✅ Found package: ${pkg.name}`);

    // If this is the target
    if (rest.length === 0) {
      return pkg;
    }

    // Continue navigating
    const nextType = rest[0];

    if (nextType === "cls" || nextType === "elem") {
      const clsIndex = parseInt(rest[1]);
      const classes = pkg.classes || pkg.elements || [];

      console.log(`  - Looking for class at index ${clsIndex} (total:  ${classes.length})`);

      const cls = classes[clsIndex];
      if (cls) {
        console.log(`  ✅ Found class: ${cls.name}`);
      } else {
        console.warn(`  ⚠️ Class not found at index ${clsIndex}`);
      }
      return cls || null;

    } else if (nextType === "pkg") {
      const subPackages = pkg.subPackages || pkg.children || [];
      console.log(`  - Recursing into subPackages (${subPackages.length})`);
      return navigateToChild(subPackages, rest);
    }
  }

  console.warn("  ⚠️ Unexpected path type:", type);
  return null;
}


/**
 * Add item to profile
 * @param {Object} item - Item to add
 * @param {Object} profileData - Profile data
 */
function addItemToProfile(item, profileData) {
  if (!profileData.items) {
    profileData.items = [];
  }

  // Check if item already exists
  const exists = profileData.items.some(existingItem =>
    existingItem.id === item.id && existingItem.type === item.type
  );

  if (!exists) {
    // Deep clone the item
    const clonedItem = JSON.parse(JSON.stringify(item));
    profileData.items.push(clonedItem);
  }
}

/**
 * Remove item from profile by key
 * @param {string} itemKey - Item key
 * @param {Object} profileData - Profile data
 */
function removeItemByKey(itemKey, profileData) {
  const parts = itemKey.split("-");

  // Parse key:  profile-root-pkg-0-elem-2
  if (parts.length < 3) return;

  // Navigate and remove
  const pathParts = parts.slice(2); // Remove "profile-root"
  removeFromPath(profileData.items, pathParts);
}

/**
 * Remove item from path
 * @param {Array} items - Items array
 * @param {Array} pathParts - Path parts
 */
function removeFromPath(items, pathParts) {
  if (!items || pathParts.length === 0) return;

  const [type, indexStr, ...rest] = pathParts;
  const index = parseInt(indexStr);

  if (type === "pkg") {
    if (rest.length === 0) {
      // Remove package
      items.splice(index, 1);
    } else {
      const pkg = items[index];
      if (!pkg) return;

      const nextType = rest[0];

      // ✅ Support both "cls" and "elem"
      if (nextType === "cls" || nextType === "elem") {
        const clsIndex = parseInt(rest[1]);
        const classes = pkg.classes || pkg.elements || [];
        classes.splice(clsIndex, 1);
      } else if (nextType === "pkg") {
        const subPackages = pkg.subPackages || pkg.children || [];
        removeFromPath(subPackages, rest);
      }
    }
  }
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
  console.log("🔍 Getting item details for key:", itemKey);
  console.log("  - Available data:", availableData);
  console.log("  - Profile data:", profileData);

  const side = itemKey.startsWith("left") ? "left" : "right";
  console.log("  - Side:", side);

  if (side === "left") {
    const item = findItemByKey(itemKey, availableData);
    console.log("  - Found item (left):", item);
    return item;
  } else {
    // Find in profile data
    const parts = itemKey.split("-");
    console.log("  - Key parts:", parts);

    const pathParts = parts.slice(2); // Remove "profile-root"
    console.log("  - Path parts:", pathParts);

    const item = navigateToChild(profileData.items, pathParts);
    console.log("  - Found item (right):", item);
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
