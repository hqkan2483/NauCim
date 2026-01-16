import { apiClient } from "./api-client.js";

/**
 * Class Backend Service - Data Layer
 * Direct API calls to backend for classes (model/profile trees)
 */

export async function updateModelClass(modelId, classId, payload) {
  return apiClient.put(
    `/api/models/${encodeURIComponent(String(modelId))}/classes/${encodeURIComponent(
      String(classId)
    )}`,
    payload
  );
}

export async function updateProfileClass(profileId, classId, payload) {
  return apiClient.put(
    `/api/profiles/${encodeURIComponent(String(profileId))}/classes/${encodeURIComponent(
      String(classId)
    )}`,
    payload
  );
}

// Lightweight lookup lists for data type picker
export async function listModelClassesSummary(modelId) {
  return apiClient.get(
    `/api/models/${encodeURIComponent(String(modelId))}/classes/summary`
  );
}

export async function listProfileClassesSummary(profileId) {
  return apiClient.get(
    `/api/profiles/${encodeURIComponent(String(profileId))}/classes/summary`
  );
}
