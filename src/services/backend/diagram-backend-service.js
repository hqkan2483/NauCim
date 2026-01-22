import { apiClient } from "./api-client.js";

/**
 * Diagram Backend Service - Data Layer
 * Direct API calls to backend for diagrams (model/profile trees)
 */

export async function createModelDiagram(modelId, packageId, payload) {
  return apiClient.post(
    `/api/models/${encodeURIComponent(String(modelId))}/packages/${encodeURIComponent(
      String(packageId)
    )}/diagrams`,
    payload
  );
}

export async function createProfileDiagram(profileId, packageId, payload) {
  return apiClient.post(
    `/api/profiles/${encodeURIComponent(String(profileId))}/packages/${encodeURIComponent(
      String(packageId)
    )}/diagrams`,
    payload
  );
}

/**
 * Delete a diagram from a model graph and return full updated project.
 *
 * @param {string} modelId
 * @param {string} diagramId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelDiagram(modelId, diagramId) {
  return apiClient.del(
    `/api/models/${encodeURIComponent(String(modelId))}/diagrams/${encodeURIComponent(
      String(diagramId)
    )}`
  );
}

/**
 * Delete a diagram from a profile graph and return full updated project.
 *
 * @param {string} profileId
 * @param {string} diagramId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfileDiagram(profileId, diagramId) {
  return apiClient.del(
    `/api/profiles/${encodeURIComponent(String(profileId))}/diagrams/${encodeURIComponent(
      String(diagramId)
    )}`
  );
}
