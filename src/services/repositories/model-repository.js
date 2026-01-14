/**
 * Model Repository - Data Layer
 * Handles all data operations for models via backend API
 */

import {
  listModels as backendListModels,
  getModel as backendGetModel,
  getModelHeader as backendGetModelHeader,
  createModel as backendCreateModel,
  updateModel as backendUpdateModel,
  deleteModel as backendDeleteModel,
} from "../backend/model-backend-service.js";

/**
 * Get all models for a project
 * @param {string} projectId
 * @returns {Promise<Array>} Array of models
 */
export async function getModels(projectId) {
  if (!projectId) return [];
  try {
    const models = await backendListModels(projectId);
    return Array.isArray(models) ? models : [];
  } catch (error) {
    console.error(`[ModelRepository] Failed to fetch models for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Get single model by ID
 * @param {string} modelId
 * @returns {Promise<Object|null>} Model object or null
 */
export async function getModel(modelId) {
  if (!modelId) return null;
  try {
    const model = await backendGetModel(modelId);
    return model || null;
  } catch (error) {
    if (error.status === 404) return null;
    console.error(`[ModelRepository] Failed to fetch model ${modelId}:`, error);
    throw error;
  }
}

/**
 * Get model header by ID (everything except rootPackages)
 * @param {string} modelId
 * @returns {Promise<Object|null>}
 */
export async function getModelHeader(modelId) {
  if (!modelId) return null;
  try {
    const model = await backendGetModelHeader(modelId);
    return model || null;
  } catch (error) {
    if (error.status === 404) return null;
    console.error(`[ModelRepository] Failed to fetch model header ${modelId}:`, error);
    throw error;
  }
}

/**
 * Create new model
 * @param {Object} modelData - Model data
 * @returns {Promise<Object>} Created model
 */
export async function createModel(modelData) {
  try {
    const created = await backendCreateModel(modelData);
    return created;
  } catch (error) {
    console.error("[ModelRepository] Failed to create model:", error);
    throw error;
  }
}

/**
 * Update model
 * @param {string} modelId
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated model
 */
export async function updateModel(modelId, updates) {
  if (!modelId) throw new Error("Model ID is required");
  try {
    const updated = await backendUpdateModel(modelId, updates);
    return updated;
  } catch (error) {
    console.error(`[ModelRepository] Failed to update model ${modelId}:`, error);
    throw error;
  }
}

/**
 * Delete model
 * @param {string} modelId
 * @returns {Promise<boolean>} true if deleted
 */
export async function deleteModel(modelId) {
  if (!modelId) return false;
  try {
    await backendDeleteModel(modelId);
    return true;
  } catch (error) {
    if (error.status === 404) return false;
    console.error(`[ModelRepository] Failed to delete model ${modelId}:`, error);
    throw error;
  }
}
