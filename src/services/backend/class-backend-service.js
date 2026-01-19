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
export async function listModelClassesSummary(modelId, { filters = {} } = {}) {
  const exclude = Array.isArray(filters?.excludeStereotypes) ? filters.excludeStereotypes : [];
  const includeTypes = Array.isArray(filters?.includeTypes) ? filters.includeTypes : [];
  const excludeTypes = Array.isArray(filters?.excludeTypes) ? filters.excludeTypes : [];
  const params = new URLSearchParams();
  if (exclude.length) params.set("excludeStereotypes", exclude.map((x) => String(x)).filter(Boolean).join(","));
  if (includeTypes.length) params.set("includeTypes", includeTypes.map((x) => String(x)).filter(Boolean).join(","));
  if (excludeTypes.length) params.set("excludeTypes", excludeTypes.map((x) => String(x)).filter(Boolean).join(","));

  const qs = params.toString();
  const url = `/api/models/${encodeURIComponent(String(modelId))}/classes/summary${qs ? `?${qs}` : ""}`;
  return apiClient.get(url);
}

export async function listProfileClassesSummary(profileId, { filters = {} } = {}) {
  const exclude = Array.isArray(filters?.excludeStereotypes) ? filters.excludeStereotypes : [];
  const includeTypes = Array.isArray(filters?.includeTypes) ? filters.includeTypes : [];
  const excludeTypes = Array.isArray(filters?.excludeTypes) ? filters.excludeTypes : [];
  const params = new URLSearchParams();
  if (exclude.length) params.set("excludeStereotypes", exclude.map((x) => String(x)).filter(Boolean).join(","));
  if (includeTypes.length) params.set("includeTypes", includeTypes.map((x) => String(x)).filter(Boolean).join(","));
  if (excludeTypes.length) params.set("excludeTypes", excludeTypes.map((x) => String(x)).filter(Boolean).join(","));

  const qs = params.toString();
  const url = `/api/profiles/${encodeURIComponent(String(profileId))}/classes/summary${qs ? `?${qs}` : ""}`;
  return apiClient.get(url);
}
