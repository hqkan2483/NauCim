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
