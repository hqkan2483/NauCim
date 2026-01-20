import {
  updateModelClass as repoUpdateModelClass,
  updateProfileClass as repoUpdateProfileClass,
  createModelClass as repoCreateModelClass,
  createProfileClass as repoCreateProfileClass,
  listModelClassesSummary as repoListModelClassesSummary,
  listProfileClassesSummary as repoListProfileClassesSummary,
} from "./repositories/class-repository.js";

/**
 * Class Service - Service Layer
 * Updates classes in model/profile trees.
 * Backend returns the full updated project.
 */

// Cache for lightweight class lookup lists (per model/profile)
const _classSummaryCache = new Map();
const _CLASS_SUMMARY_TTL_MS = 30_000;

function _stableFiltersKey(filters) {
  if (!filters || typeof filters !== "object") return "";
  const exclude = Array.isArray(filters.excludeStereotypes) ? filters.excludeStereotypes : [];
  const includeTypes = Array.isArray(filters.includeTypes) ? filters.includeTypes : [];
  const excludeTypes = Array.isArray(filters.excludeTypes) ? filters.excludeTypes : [];

  const cleanedExclude = exclude.map((x) => String(x)).filter(Boolean).sort();
  const cleanedIncludeTypes = includeTypes.map((x) => String(x)).filter(Boolean).sort();
  const cleanedExcludeTypes = excludeTypes.map((x) => String(x)).filter(Boolean).sort();

  const parts = [];
  if (cleanedExclude.length) parts.push(`excludeStereotypes=${cleanedExclude.join(",")}`);
  if (cleanedIncludeTypes.length) parts.push(`includeTypes=${cleanedIncludeTypes.join(",")}`);
  if (cleanedExcludeTypes.length) parts.push(`excludeTypes=${cleanedExcludeTypes.join(",")}`);

  return parts.join("&");
}

function _cacheKey(context, id, filters) {
  const suffix = _stableFiltersKey(filters);
  return suffix ? `${context}:${String(id)}:${suffix}` : `${context}:${String(id)}`;
}

function invalidateModelClassesSummary(modelId) {
  // Clear all cached variants for this model
  for (const k of _classSummaryCache.keys()) {
    if (String(k).startsWith(`model:${String(modelId)}:`) || String(k) === `model:${String(modelId)}`) {
      _classSummaryCache.delete(k);
    }
  }
}

function invalidateProfileClassesSummary(profileId) {
  // Clear all cached variants for this profile
  for (const k of _classSummaryCache.keys()) {
    if (String(k).startsWith(`profile:${String(profileId)}:`) || String(k) === `profile:${String(profileId)}`) {
      _classSummaryCache.delete(k);
    }
  }
}

async function listModelClassesSummary(projectId, modelId, { force = false, filters = {} } = {}) {
  if (!projectId || !modelId) return [];
  const key = _cacheKey("model", modelId, filters);

  const cached = _classSummaryCache.get(key);
  if (!force && cached && Date.now() - cached.ts < _CLASS_SUMMARY_TTL_MS) {
    return cached.items;
  }

  const items = await repoListModelClassesSummary(String(modelId), { filters });
  _classSummaryCache.set(key, { ts: Date.now(), items });
  return items;
}

async function listProfileClassesSummary(projectId, profileId, { force = false, filters = {} } = {}) {
  if (!projectId || !profileId) return [];
  const key = _cacheKey("profile", profileId, filters);

  const cached = _classSummaryCache.get(key);
  if (!force && cached && Date.now() - cached.ts < _CLASS_SUMMARY_TTL_MS) {
    return cached.items;
  }

  const items = await repoListProfileClassesSummary(String(profileId), { filters });
  _classSummaryCache.set(key, { ts: Date.now(), items });
  return items;
}

async function updateModelClass(projectId, modelId, classId, updates) {
  if (!projectId || !modelId || !classId) return null;
  try {
    return await repoUpdateModelClass(String(modelId), String(classId), updates);
  } catch (error) {
    console.error(
      `[updateModelClass] Failed for model ${modelId}, class ${classId}:`,
      error
    );
    throw error;
  }
}

async function updateProfileClass(projectId, profileId, classId, updates) {
  if (!projectId || !profileId || !classId) return null;
  try {
    return await repoUpdateProfileClass(String(profileId), String(classId), updates);
  } catch (error) {
    console.error(
      `[updateProfileClass] Failed for profile ${profileId}, class ${classId}:`,
      error
    );
    throw error;
  }
}

async function createModelClass(projectId, modelId, packageId, payload) {
  if (!projectId || !modelId || !packageId) return null;
  try {
    return await repoCreateModelClass(String(modelId), String(packageId), payload);
  } catch (error) {
    console.error(
      `[createModelClass] Failed for model ${modelId}, package ${packageId}:`,
      error
    );
    throw error;
  }
}

async function createProfileClass(projectId, profileId, packageId, payload) {
  if (!projectId || !profileId || !packageId) return null;
  try {
    return await repoCreateProfileClass(String(profileId), String(packageId), payload);
  } catch (error) {
    console.error(
      `[createProfileClass] Failed for profile ${profileId}, package ${packageId}:`,
      error
    );
    throw error;
  }
}

export { updateModelClass, updateProfileClass, createModelClass, createProfileClass };

export {
  listModelClassesSummary,
  listProfileClassesSummary,
  invalidateModelClassesSummary,
  invalidateProfileClassesSummary,
};
