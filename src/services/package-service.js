import {
  updateModelPackage as repoUpdateModelPackage,
  updateProfilePackage as repoUpdateProfilePackage,
  createModelSubpackage as repoCreateModelSubpackage,
  createProfileSubpackage as repoCreateProfileSubpackage,
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

async function createModelSubpackage(projectId, modelId, parentPackageId, payload) {
  if (!projectId || !modelId || !parentPackageId) return null;
  try {
    return await repoCreateModelSubpackage(String(modelId), String(parentPackageId), payload);
  } catch (error) {
    console.error(
      `[createModelSubpackage] Failed for model ${modelId}, parent ${parentPackageId}:`,
      error
    );
    throw error;
  }
}

async function createProfileSubpackage(projectId, profileId, parentPackageId, payload) {
  if (!projectId || !profileId || !parentPackageId) return null;
  try {
    return await repoCreateProfileSubpackage(String(profileId), String(parentPackageId), payload);
  } catch (error) {
    console.error(
      `[createProfileSubpackage] Failed for profile ${profileId}, parent ${parentPackageId}:`,
      error
    );
    throw error;
  }
}

export { updateModelPackage, updateProfilePackage, createModelSubpackage, createProfileSubpackage };
