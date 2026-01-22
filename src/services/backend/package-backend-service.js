import { apiClient } from "./api-client.js";

/**
 * Package Backend Service - Data Layer
 * Direct API calls to backend for packages (model/profile trees)
 */

export async function updateModelPackage(modelId, packageId, payload) {
  return apiClient.put(
    `/api/models/${encodeURIComponent(String(modelId))}/packages/${encodeURIComponent(
      String(packageId)
    )}`,
    payload
  );
}

export async function updateProfilePackage(profileId, packageId, payload) {
  return apiClient.put(
    `/api/profiles/${encodeURIComponent(String(profileId))}/packages/${encodeURIComponent(
      String(packageId)
    )}`,
    payload
  );
}

export async function createModelSubpackage(modelId, parentPackageId, payload) {
  return apiClient.post(
    `/api/models/${encodeURIComponent(String(modelId))}/packages/${encodeURIComponent(
      String(parentPackageId)
    )}/subpackages`,
    payload
  );
}

export async function createProfileSubpackage(profileId, parentPackageId, payload) {
  return apiClient.post(
    `/api/profiles/${encodeURIComponent(String(profileId))}/packages/${encodeURIComponent(
      String(parentPackageId)
    )}/subpackages`,
    payload
  );
}

/**
 * Delete a package from a model graph and return full updated project.
 *
 * @param {string} modelId
 * @param {string} packageId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelPackage(modelId, packageId) {
  return apiClient.del(
    `/api/models/${encodeURIComponent(String(modelId))}/packages/${encodeURIComponent(
      String(packageId)
    )}`
  );
}

/**
 * Delete a package from a profile graph and return full updated project.
 *
 * @param {string} profileId
 * @param {string} packageId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfilePackage(profileId, packageId) {
  return apiClient.del(
    `/api/profiles/${encodeURIComponent(String(profileId))}/packages/${encodeURIComponent(
      String(packageId)
    )}`
  );
}
