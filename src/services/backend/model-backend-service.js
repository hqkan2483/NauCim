import { apiClient } from "./api-client.js";

/**
 * Model Backend Service - Data Layer
 * Direct API calls to backend for models
 */

export async function listModels(projectId) {
  return apiClient.get(`/api/models/project/${encodeURIComponent(String(projectId))}`);
}

export async function getModel(modelId) {
  return apiClient.get(`/api/models/${encodeURIComponent(String(modelId))}`);
}

export async function createModel(model) {
  return apiClient.post("/api/models", model);
}

export async function updateModel(modelId, updates) {
  return apiClient.put(`/api/models/${encodeURIComponent(String(modelId))}`, updates);
}

export async function deleteModel(modelId) {
  return apiClient.del(`/api/models/${encodeURIComponent(String(modelId))}`);
}
