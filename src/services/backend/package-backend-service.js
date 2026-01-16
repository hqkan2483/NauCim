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
