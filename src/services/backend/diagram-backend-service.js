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
