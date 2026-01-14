import { apiClient } from "./api-client.js";

/**
 * Profile Backend Service - Data Layer
 * Direct API calls to backend for profiles
 */

export async function listProfiles(projectId) {
  return apiClient.get(`/api/profiles/project/${encodeURIComponent(String(projectId))}`);
}

export async function getProfile(profileId) {
  return apiClient.get(`/api/profiles/${encodeURIComponent(String(profileId))}`);
}

export async function getProfileHeader(profileId) {
  return apiClient.get(`/api/profiles/${encodeURIComponent(String(profileId))}/header`);
}

export async function createProfile(profile) {
  return apiClient.post("/api/profiles", profile);
}

export async function updateProfile(profileId, updates) {
  return apiClient.put(`/api/profiles/${encodeURIComponent(String(profileId))}`, updates);
}

export async function deleteProfile(profileId) {
  return apiClient.del(`/api/profiles/${encodeURIComponent(String(profileId))}`);
}

// Import rootPackages into existing profile (replaces current graph)
// payload: { path?: string, rootPackages?: any }
export async function importProfileRootPackages(profileId, payload) {
  return apiClient.post(
    `/api/profiles/${encodeURIComponent(String(profileId))}/import`,
    payload
  );
}
