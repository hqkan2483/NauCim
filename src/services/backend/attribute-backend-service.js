import { apiClient } from "./api-client.js";

/**
 * Attribute Backend Service - Data Layer
 * Direct API calls to backend for attributes (model/profile graphs)
 */

export async function updateModelAttribute(modelId, attributeId, payload) {
  return apiClient.put(
    `/api/models/${encodeURIComponent(String(modelId))}/attributes/${encodeURIComponent(
      String(attributeId)
    )}`,
    payload
  );
}

export async function updateProfileAttribute(profileId, attributeId, payload) {
  return apiClient.put(
    `/api/profiles/${encodeURIComponent(String(profileId))}/attributes/${encodeURIComponent(
      String(attributeId)
    )}`,
    payload
  );
}

export async function createModelAttribute(modelId, classId, payload) {
  return apiClient.post(
    `/api/models/${encodeURIComponent(String(modelId))}/classes/${encodeURIComponent(
      String(classId)
    )}/attributes`,
    payload
  );
}

export async function createProfileAttribute(profileId, classId, payload) {
  return apiClient.post(
    `/api/profiles/${encodeURIComponent(String(profileId))}/classes/${encodeURIComponent(
      String(classId)
    )}/attributes`,
    payload
  );
}

/**
 * Delete an attribute from a model graph and return full updated project.
 *
 * @param {string} modelId
 * @param {string} attributeId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelAttribute(modelId, attributeId) {
  return apiClient.del(
    `/api/models/${encodeURIComponent(String(modelId))}/attributes/${encodeURIComponent(
      String(attributeId)
    )}`
  );
}

/**
 * Delete an attribute from a profile graph and return full updated project.
 *
 * @param {string} profileId
 * @param {string} attributeId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfileAttribute(profileId, attributeId) {
  return apiClient.del(
    `/api/profiles/${encodeURIComponent(String(profileId))}/attributes/${encodeURIComponent(
      String(attributeId)
    )}`
  );
}
