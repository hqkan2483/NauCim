/**
 * Profile Editor Service
 *
 * Kept intentionally small:
 * - resolve item objects by tree keys
 * - validate profile before save
 * - prepare payload for save
 */

/**
 * Get item details by tree key.
 *
 * @param {string} itemKey - Tree item key
 * @param {Array} availableData - Available data for the left tree
 * @param {Object} profileData - Current profile data for the right tree
 * @returns {Object|null} Resolved item or null
 */
export function getItemDetailsByKey(itemKey, availableData, profileData) {
  const key = String(itemKey ?? "");
  if (!key) return null;

  if (key.startsWith("left")) {
    return findItemByKey(key, Array.isArray(availableData) ? availableData : []);
  }

  // Right tree keys are "profile-root-..."
  const parts = key.split("-");
  if (parts[0] !== "profile" || parts[1] !== "root") return null;

  const pathParts = parts.slice(2);
  const root = Array.isArray(profileData?.items) ? profileData.items : [];
  return navigateToChild(root, pathParts);
}

/**
 * Find item by key in available data.
 * Supports ids that contain dashes.
 *
 * @param {string} itemKey
 * @param {Array} availableData
 * @returns {Object|null}
 */
function findItemByKey(itemKey, availableData) {
  const parts = String(itemKey ?? "").split("-");
  if (parts.length < 3) return null;

  const type = parts[1]; // "model" or "profile"

  const pathStartIndex = parts.indexOf("pkg", 2);
  const idParts = pathStartIndex === -1 ? parts.slice(2) : parts.slice(2, pathStartIndex);
  const id = idParts.join("-");

  const rootItem = availableData.find((item) => item?.type === type && item?.id === id);
  if (!rootItem) return null;

  if (pathStartIndex === -1) return rootItem;

  const pathParts = parts.slice(pathStartIndex);
  return navigateToChild(rootItem.children, pathParts);
}

/**
 * Navigate to a child item using path parts.
 *
 * @param {Array} children
 * @param {Array} pathParts
 * @returns {Object|null}
 */
function navigateToChild(children, pathParts) {
  if (!Array.isArray(children) || !Array.isArray(pathParts) || pathParts.length === 0) {
    return null;
  }

  const [type, indexStr, ...rest] = pathParts;
  const index = Number.parseInt(indexStr, 10);
  if (!Number.isFinite(index)) return null;

  if (type !== "pkg") return null;

  const pkg = children[index];
  if (!pkg) return null;

  if (rest.length === 0) return pkg;

  const nextType = rest[0];

  if (nextType === "cls" || nextType === "elem") {
    const clsIndex = Number.parseInt(rest[1], 10);
    if (!Number.isFinite(clsIndex)) return null;
    const classes = pkg.classes || pkg.elements || [];
    return classes[clsIndex] || null;
  }

  if (nextType === "dia") {
    const diaIndex = Number.parseInt(rest[1], 10);
    if (!Number.isFinite(diaIndex)) return null;
    const diagrams = pkg.diagrams || [];
    return diagrams[diaIndex] || null;
  }

  if (nextType === "pkg") {
    const subPackages = pkg.subPackages || pkg.children || [];
    return navigateToChild(subPackages, rest);
  }

  return null;
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
