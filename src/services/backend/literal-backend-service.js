import { apiClient } from "./api-client.js";

/**
 * Literal Backend Service - Data Layer
 * Direct API calls to backend for literals (model/profile graphs)
 */

export async function updateModelLiteral(modelId, literalId, payload) {
  return apiClient.put(
    `/api/models/${encodeURIComponent(String(modelId))}/literals/${encodeURIComponent(
      String(literalId)
    )}`,
    payload
  );
}

export async function updateProfileLiteral(profileId, literalId, payload) {
  return apiClient.put(
    `/api/profiles/${encodeURIComponent(String(profileId))}/literals/${encodeURIComponent(
      String(literalId)
    )}`,
    payload
  );
}

export async function createModelLiteral(modelId, classId, payload) {
  return apiClient.post(
    `/api/models/${encodeURIComponent(String(modelId))}/classes/${encodeURIComponent(
      String(classId)
    )}/literals`,
    payload
  );
}

export async function createProfileLiteral(profileId, classId, payload) {
  return apiClient.post(
    `/api/profiles/${encodeURIComponent(String(profileId))}/classes/${encodeURIComponent(
      String(classId)
    )}/literals`,
    payload
  );
}

/**
 * Delete a literal from a model graph and return full updated project.
 */
export async function deleteModelLiteral(modelId, literalId) {
  return apiClient.del(
    `/api/models/${encodeURIComponent(String(modelId))}/literals/${encodeURIComponent(
      String(literalId)
    )}`
  );
}

/**
 * Delete a literal from a profile graph and return full updated project.
 */
export async function deleteProfileLiteral(profileId, literalId) {
  return apiClient.del(
    `/api/profiles/${encodeURIComponent(String(profileId))}/literals/${encodeURIComponent(
      String(literalId)
    )}`
  );
}
