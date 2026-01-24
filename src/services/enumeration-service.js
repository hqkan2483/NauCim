import {
  createModelEnumeration as repoCreateModelEnumeration,
  createProfileEnumeration as repoCreateProfileEnumeration,
} from "./repositories/enumeration-repository.js";

/**
 * Enumeration Service - Service Layer
 *
 * Creates enumerations in model/profile trees.
 * Backend returns the full updated project.
 */

/**
 * Create an enumeration inside a model package.
 *
 * @param {string} projectId
 * @param {string} modelId
 * @param {string} packageId
 * @param {object} payload
 * @returns {Promise<object|null>}
 */
export async function createModelEnumeration(projectId, modelId, packageId, payload) {
  if (!projectId || !modelId || !packageId) return null;
  try {
    return await repoCreateModelEnumeration(String(modelId), String(packageId), payload);
  } catch (error) {
    console.error(
      `[createModelEnumeration] Failed for model ${modelId}, package ${packageId}:`,
      error
    );
    throw error;
  }
}

/**
 * Create an enumeration inside a profile package.
 *
 * @param {string} projectId
 * @param {string} profileId
 * @param {string} packageId
 * @param {object} payload
 * @returns {Promise<object|null>}
 */
export async function createProfileEnumeration(projectId, profileId, packageId, payload) {
  if (!projectId || !profileId || !packageId) return null;
  try {
    return await repoCreateProfileEnumeration(String(profileId), String(packageId), payload);
  } catch (error) {
    console.error(
      `[createProfileEnumeration] Failed for profile ${profileId}, package ${packageId}:`,
      error
    );
    throw error;
  }
}
