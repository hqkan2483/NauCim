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
