import {
  updateModelClass as repoUpdateModelClass,
  updateProfileClass as repoUpdateProfileClass,
} from "./repositories/class-repository.js";

/**
 * Class Service - Service Layer
 * Updates classes in model/profile trees.
 * Backend returns the full updated project.
 */

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
