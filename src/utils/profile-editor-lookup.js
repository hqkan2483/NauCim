/**
 * Profile Editor Lookup Utils
 *
 * Pure helper functions used by profile-editor UI to locate profile objects
 * by their display names.
 *
 * No DOM access. No persistence. Safe to reuse in other UI modules.
 */

/**
 * Normalize a name for case-insensitive comparison.
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeName(name) {
  return String(name ?? "").trim().toLowerCase();
}

/**
 * Find the first profile class by name.
 *
 * The search is recursive across the whole profile package tree.
 *
 * @param {Array} packages Profile packages root list.
 * @param {string} className Class name to search.
 * @returns {object|null} Class object when found.
 */
export function findProfileClassByName(packages, className) {
  const target = normalizeName(className);
  if (!target) return null;

  const walk = (pkgs) => {
    if (!Array.isArray(pkgs)) return null;

    for (const pkg of pkgs) {
      const classes = Array.isArray(pkg?.classes) ? pkg.classes : [];
      for (const cls of classes) {
        if (normalizeName(cls?.name) === target) return cls;
      }

      const found = walk(pkg?.subPackages);
      if (found) return found;
    }

    return null;
  };

  return walk(packages);
}

/**
 * Find the first profile package by name.
 *
 * The search is recursive across the whole profile package tree.
 *
 * @param {Array} packages Profile packages root list.
 * @param {string} packageName Package name to search.
 * @returns {object|null} Package object when found.
 */
export function findProfilePackageByName(packages, packageName) {
  const target = normalizeName(packageName);
  if (!target) return null;

  const walk = (pkgs) => {
    if (!Array.isArray(pkgs)) return null;

    for (const pkg of pkgs) {
      if (normalizeName(pkg?.name) === target) return pkg;

      const found = walk(pkg?.subPackages);
      if (found) return found;
    }

    return null;
  };

  return walk(packages);
}

/**
 * Resolve a model display name by its id from the left-tree available data.
 *
 * @param {Array} availableData Array containing model/profile roots.
 * @param {string|number|null|undefined} modelId Model id to resolve.
 * @returns {string} Model name or empty string when not found.
 */
export function findModelNameById(availableData, modelId) {
  const mid = String(modelId ?? "").trim();
  if (!mid) return "";

  const list = Array.isArray(availableData) ? availableData : [];
  const model = list.find((x) => x?.type === "model" && String(x?.id ?? "") === mid);
  return model?.name ? String(model.name) : "";
}

/**
 * Find package candidates by name across all available roots (models + other profiles).
 *
 * This is used for "Показать в модели" for profile packages:
 * - We search by name.
 * - There may be multiple matches across different models/profiles.
 *
 * @param {Array} availableData Available roots (items with {type,id,name,children}).
 * @param {string} packageName Package name to search.
 * @returns {Array<{ contextType: "model"|"profile", contextId: string, contextName: string, packageId: string, packageName: string }>} Candidates.
 */
export function findAvailablePackageCandidatesByName(availableData, packageName) {
  const target = normalizeName(packageName);
  if (!target) return [];

  const roots = Array.isArray(availableData) ? availableData : [];
  /** @type {Array<{ contextType: "model"|"profile", contextId: string, contextName: string, packageId: string, packageName: string }>} */
  const results = [];

  const walk = (pkgs, ctx) => {
    if (!Array.isArray(pkgs)) return;
    for (const pkg of pkgs) {
      const name = String(pkg?.name ?? "").trim();
      if (normalizeName(name) === target) {
        const id = String(pkg?.id ?? "").trim();
        if (id) {
          results.push({
            contextType: ctx.contextType,
            contextId: ctx.contextId,
            contextName: ctx.contextName,
            packageId: id,
            packageName: name,
          });
        }
      }
      walk(pkg?.subPackages, ctx);
    }
  };

  for (const root of roots) {
    const contextType = root?.type === "profile" ? "profile" : "model";
    const contextId = String(root?.id ?? "").trim();
    const contextName = String(root?.name ?? "").trim();
    if (!contextId) continue;

    walk(root?.children, { contextType, contextId, contextName });
  }

  return results;
}
