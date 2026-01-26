/**
 * Project traversal helpers
 *
 * These functions provide read-only traversal and lookup utilities over the
 * exported project structure (models/profiles -> rootPackages -> packages).
 *
 * Purpose:
 * - Keep traversal logic out of UI components and pages
 * - Support client-side uniqueness checks (before hitting backend)
 * - Support locating newly created items in the refreshed `exportProject` payload
 */

/**
 * Normalize a human name for case-insensitive uniqueness comparisons.
 * @param {unknown} name
 * @returns {string}
 */
export function normalizeName(name) {
  return String(name ?? "").trim().toLocaleLowerCase();
}

/**
 * Walk package trees depth-first.
 * @param {Array<object>} packages
 * @param {(pkg: any) => void} visitor
 */
export function walkPackages(packages, visitor) {
  if (!Array.isArray(packages)) return;
  for (const pkg of packages) {
    visitor(pkg);
    if (Array.isArray(pkg.subPackages) && pkg.subPackages.length > 0) {
      walkPackages(pkg.subPackages, visitor);
    }
  }
}

/**
 * Get the root package list for a specific context.
 * @param {object} project
 * @param {{context: 'model'|'profile', modelId?: string, profileId?: string}} params
 * @returns {Array<object>}
 */
export function getContextRootPackages(project, { context, modelId = "", profileId = "" } = {}) {
  if (!project || !context) return [];

  if (context === "model") {
    const model = project.models?.find((m) => String(m.id) === String(modelId));
    return model?.rootPackages?.[0]?.packages || [];
  }

  if (context === "profile") {
    const profile = project.profiles?.find((p) => String(p.id) === String(profileId));
    return profile?.rootPackages?.[0]?.packages || [];
  }

  return [];
}

/**
 * Find a package by id within a context.
 * @param {object} project
 * @param {{context: 'model'|'profile', modelId?: string, profileId?: string, packageId: string}} params
 * @returns {object|null}
 */
export function findPackageInContext(project, { context, modelId = "", profileId = "", packageId } = {}) {
  if (!project || !packageId) return null;

  const roots = getContextRootPackages(project, { context, modelId, profileId });

  let found = null;
  walkPackages(roots, (pkg) => {
    if (found) return;
    if (String(pkg.id) === String(packageId)) found = pkg;
  });

  return found;
}

/**
 * Collect normalized names of subpackages directly under a parent package.
 * Used for sibling package uniqueness checks.
 * @param {object} project
 * @param {{context: 'model'|'profile', modelId?: string, profileId?: string, parentPackageId: string}} params
 * @returns {Set<string>}
 */
export function getSubpackageNameSet(project, { context, modelId = "", profileId = "", parentPackageId } = {}) {
  const parent = findPackageInContext(project, {
    context,
    modelId,
    profileId,
    packageId: parentPackageId,
  });

  const set = new Set();
  const list = parent?.subPackages || [];
  for (const pkg of list) {
    const n = normalizeName(pkg?.name);
    if (n) set.add(n);
  }
  return set;
}

/**
 * Collect normalized class names within a context (model or profile).
 * Used for "unique across entire model/profile" validation.
 * @param {object} project
 * @param {{context: 'model'|'profile', modelId?: string, profileId?: string}} params
 * @returns {Set<string>}
 */
export function getClassNameSet(project, { context, modelId = "", profileId = "" } = {}) {
  const roots = getContextRootPackages(project, { context, modelId, profileId });
  const set = new Set();

  walkPackages(roots, (pkg) => {
    const classes = pkg?.classes || [];
    for (const cls of classes) {
      const n = normalizeName(cls?.name);
      if (n) set.add(n);
    }
  });

  return set;
}

/**
 * Collect normalized diagram names within a context (model or profile).
 * Used for "unique across entire model/profile" validation.
 * @param {object} project
 * @param {{context: 'model'|'profile', modelId?: string, profileId?: string}} params
 * @returns {Set<string>}
 */
export function getDiagramNameSet(project, { context, modelId = "", profileId = "" } = {}) {
  const roots = getContextRootPackages(project, { context, modelId, profileId });
  const set = new Set();

  walkPackages(roots, (pkg) => {
    const diagrams = pkg?.diagrams || [];
    for (const d of diagrams) {
      const n = normalizeName(d?.diagramName);
      if (n) set.add(n);
    }
  });

  return set;
}

/**
 * Find subpackage id by name under a given parent.
 * @param {object} project
 * @param {{context: 'model'|'profile', modelId?: string, profileId?: string, parentPackageId: string, name: string}} params
 * @returns {string|null}
 */
export function findSubpackageIdByName(project, { context, modelId = "", profileId = "", parentPackageId, name } = {}) {
  const parent = findPackageInContext(project, {
    context,
    modelId,
    profileId,
    packageId: parentPackageId,
  });

  const normalized = normalizeName(name);
  if (!normalized) return null;

  const list = parent?.subPackages || [];
  const found = list.find((p) => normalizeName(p?.name) === normalized);
  return found?.id ? String(found.id) : null;
}

/**
 * Find class id by name within a context.
 * @param {object} project
 * @param {{context: 'model'|'profile', modelId?: string, profileId?: string, name: string}} params
 * @returns {string|null}
 */
export function findClassIdByName(project, { context, modelId = "", profileId = "", name } = {}) {
  const roots = getContextRootPackages(project, { context, modelId, profileId });
  const normalized = normalizeName(name);
  if (!normalized) return null;

  let foundId = null;
  walkPackages(roots, (pkg) => {
    if (foundId) return;
    const classes = pkg?.classes || [];
    const cls = classes.find((c) => normalizeName(c?.name) === normalized);
    if (cls?.id) foundId = String(cls.id);
  });

  return foundId;
}

/**
 * Find diagram id by name within a context.
 * @param {object} project
 * @param {{context: 'model'|'profile', modelId?: string, profileId?: string, name: string}} params
 * @returns {string|null}
 */
export function findDiagramIdByName(project, { context, modelId = "", profileId = "", name } = {}) {
  const roots = getContextRootPackages(project, { context, modelId, profileId });
  const normalized = normalizeName(name);
  if (!normalized) return null;

  let foundId = null;
  walkPackages(roots, (pkg) => {
    if (foundId) return;
    const diagrams = pkg?.diagrams || [];
    const d = diagrams.find((x) => normalizeName(x?.diagramName) === normalized);
    if (d?.id) foundId = String(d.id);
  });

  return foundId;
}

/**
 * Returns true if a package contains any subpackages, classes or diagrams.
 *
 * Used to show an extra confirmation prompt before deleting a package.
 *
 * @param {object} pkg
 * @returns {boolean}
 */
export function packageHasContents(pkg) {
  if (!pkg) return false;
  if (Array.isArray(pkg.subPackages) && pkg.subPackages.length > 0) return true;
  if (Array.isArray(pkg.classes) && pkg.classes.length > 0) return true;
  if (Array.isArray(pkg.diagrams) && pkg.diagrams.length > 0) return true;
  return false;
}
