import { apiClient } from "./api-client.js";

/**
 * Enumeration Backend Service - Data Layer
 *
 * Separate endpoints and request helpers for creating enumerations.
 */

/**
 * Create an enumeration inside a model package.
 * Backend returns full updated project (export payload).
 *
 * @param {string} modelId
 * @param {string} packageId
 * @param {object} payload
 * @returns {Promise<object>} Full exported project
 */
export async function createModelEnumeration(modelId, packageId, payload) {
  return apiClient.post(
    `/api/models/${encodeURIComponent(String(modelId))}/packages/${encodeURIComponent(
      String(packageId)
    )}/enumerations`,
    payload
  );
}

/**
 * Create an enumeration inside a profile package.
 * Backend returns full updated project (export payload).
 *
 * Note: profile enumerations are stored in ClassProfile and may require refModel fields.
 *
 * @param {string} profileId
 * @param {string} packageId
 * @param {object} payload
 * @returns {Promise<object>} Full exported project
 */
export async function createProfileEnumeration(profileId, packageId, payload) {
  return apiClient.post(
    `/api/profiles/${encodeURIComponent(String(profileId))}/packages/${encodeURIComponent(
      String(packageId)
    )}/enumerations`,
    payload
  );
}
