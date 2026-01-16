import {
  updateModelPackage as repoUpdateModelPackage,
  updateProfilePackage as repoUpdateProfilePackage,
} from "./repositories/package-repository.js";

/**
 * Package Service - Service Layer
 * Updates packages in model/profile trees.
 * Backend returns the full updated project.
 */

async function updateModelPackage(projectId, modelId, packageId, updates) {
  if (!projectId || !modelId || !packageId) return null;
  try {
    return await repoUpdateModelPackage(String(modelId), String(packageId), updates);
  } catch (error) {
    console.error(
      `[updateModelPackage] Failed for model ${modelId}, package ${packageId}:`,
      error
    );
    throw error;
  }
}

async function updateProfilePackage(projectId, profileId, packageId, updates) {
  if (!projectId || !profileId || !packageId) return null;
  try {
    return await repoUpdateProfilePackage(String(profileId), String(packageId), updates);
  } catch (error) {
    console.error(
      `[updateProfilePackage] Failed for profile ${profileId}, package ${packageId}:`,
      error
    );
    throw error;
  }
}

export { updateModelPackage, updateProfilePackage };
