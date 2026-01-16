import {
  updateModelClass as repoUpdateModelClass,
  updateProfileClass as repoUpdateProfileClass,
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

function _cacheKey(context, id) {
  return `${context}:${String(id)}`;
}

function invalidateModelClassesSummary(modelId) {
  _classSummaryCache.delete(_cacheKey("model", modelId));
}

function invalidateProfileClassesSummary(profileId) {
  _classSummaryCache.delete(_cacheKey("profile", profileId));
}

async function listModelClassesSummary(projectId, modelId, { force = false } = {}) {
  if (!projectId || !modelId) return [];
  const key = _cacheKey("model", modelId);

  const cached = _classSummaryCache.get(key);
  if (!force && cached && Date.now() - cached.ts < _CLASS_SUMMARY_TTL_MS) {
    return cached.items;
  }

  const items = await repoListModelClassesSummary(String(modelId));
  _classSummaryCache.set(key, { ts: Date.now(), items });
  return items;
}

async function listProfileClassesSummary(projectId, profileId, { force = false } = {}) {
  if (!projectId || !profileId) return [];
  const key = _cacheKey("profile", profileId);

  const cached = _classSummaryCache.get(key);
  if (!force && cached && Date.now() - cached.ts < _CLASS_SUMMARY_TTL_MS) {
    return cached.items;
  }

  const items = await repoListProfileClassesSummary(String(profileId));
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

export { updateModelClass, updateProfileClass };

export {
  listModelClassesSummary,
  listProfileClassesSummary,
  invalidateModelClassesSummary,
  invalidateProfileClassesSummary,
};
