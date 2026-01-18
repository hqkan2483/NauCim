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

export async function createModelClass(modelId, packageId, payload) {
  return apiClient.post(
    `/api/models/${encodeURIComponent(String(modelId))}/packages/${encodeURIComponent(
      String(packageId)
    )}/classes`,
    payload
  );
}

export async function createProfileClass(profileId, packageId, payload) {
  return apiClient.post(
    `/api/profiles/${encodeURIComponent(String(profileId))}/packages/${encodeURIComponent(
      String(packageId)
    )}/classes`,
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
