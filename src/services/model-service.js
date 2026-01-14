import { generateUUID } from "../utils/uuid.js";
import {
  getModels as repoGetModels,
  getModel as repoGetModel,
  getModelHeader as repoGetModelHeader,
  createModel as repoCreateModel,
  updateModel as repoUpdateModel,
  deleteModel as repoDeleteModel,
} from "./repositories/model-repository.js";
import {
  validateCreateModelPayload,
  validateUpdateModelPayload,
} from "./business/model-validator.js";
import { getProjectById } from "./project-service.js";

// ============================================================
// MODEL SERVICE - Service Layer
// Manages Model Business Operations
// ============================================================

/**
 * Get all models for a project
 * @param {string} projectId
 * @returns {Promise<Array>} Array of models
 */
async function getModels(projectId) {
  if (!projectId) return [];
  try {
    return await repoGetModels(String(projectId));
  } catch (error) {
    console.error(`[getModels] Failed for project ${projectId}:`, error);
    return [];
  }
}

/**
 * Get single model by ID
 * @param {string} projectId
 * @param {string} modelId
 * @returns {Promise<object|null>} Model object or null
 */
async function getModel(projectId, modelId) {
  if (!projectId || !modelId) return null;
  try {
    // First try to get from project (to ensure it belongs to project)
    const project = await getProjectById(projectId);
    if (project && project.models) {
      const model = project.models.find((m) => String(m.id) === String(modelId));
      if (model) return model;
    }
    // Fallback to direct repository call
    return await repoGetModel(String(modelId));
  } catch (error) {
    console.error(`[getModel] Failed for model ${modelId}:`, error);
    return null;
  }
}

/**
 * Get model header by ID (everything except rootPackages)
 * @param {string} projectId
 * @param {string} modelId
 * @returns {Promise<object|null>} Model header or null
 */
async function getModelHeader(projectId, modelId) {
  if (!projectId || !modelId) return null;
  try {
    const header = await repoGetModelHeader(String(modelId));
    if (!header) return null;
    if (String(header.projectId) !== String(projectId)) {
      console.warn(
        `[getModelHeader] Model ${modelId} does not belong to project ${projectId}`
      );
      return null;
    }
    return header;
  } catch (error) {
    console.error(`[getModelHeader] Failed for model ${modelId}:`, error);
    return null;
  }
}

/**
 * Check if model name is unique within project
 * @param {string} projectId
 * @param {string} name - Model name to check
 * @param {string} excludeId - Model ID to exclude from check (for edit)
 * @returns {Promise<boolean>} true if name is unique
 */
async function isModelNameUnique(projectId, name, excludeId = null) {
  if (!projectId) return false;
  try {
    const models = await repoGetModels(String(projectId));
    const trimmedName = name.trim().toLowerCase();

    return !models.some((m) => {
      // Skip the model being edited
      if (excludeId && String(m.id) === String(excludeId)) {
        return false;
      }
      return m.name.trim().toLowerCase() === trimmedName;
    });
  } catch (error) {
    console.error(`[isModelNameUnique] Failed for project ${projectId}:`, error);
    return false;
  }
}

/**
 * Create new model
 * @param {string} projectId
 * @param {object} payload - { name, description?, version? }
 * @returns {Promise<object|null>} Created model or null
 */
async function createModel(projectId, payload) {
  if (!projectId) {
    console.error("[createModel] Project ID is required");
    return null;
  }

  // Validate payload
  const validation = validateCreateModelPayload(payload);
  if (!validation.valid) {
    console.error("[createModel]", validation.error);
    return null;
  }

  // Verify project exists
  const project = await getProjectById(String(projectId));
  if (!project) {
    console.error(`[createModel] Project not found: ${projectId}`);
    return null;
  }

  const trimmedName = payload.name.trim();

  // Check name uniqueness
  const isUnique = await isModelNameUnique(projectId, trimmedName);
  if (!isUnique) {
    console.error(`[createModel] Model name "${trimmedName}" already exists in this project`);
    return null;
  }

  // Prepare model data
  const newModel = {
    id: generateUUID(),
    projectId: String(projectId),
    name: trimmedName,
    description: payload.description ? payload.description.trim() : "",
    version: payload.version ? payload.version.trim() : "0.1",
    createDate: new Date().toISOString(),
    modifyDate: new Date().toISOString(),
    legalState: "project",
    accessRights: "readWrite",
  };

  try {
    const created = await repoCreateModel(newModel);
    return created;
  } catch (error) {
    console.error("[createModel] Failed to create model:", error);
    // Check for duplicate name error from backend
    if (error.status === 409 || error.details?.name) {
      console.error(`[createModel] Model name "${trimmedName}" already exists in this project`);
    }
    return null;
  }
}

/**
 * Update model
 * @param {string} projectId
 * @param {string} modelId
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated model or null
 */
async function updateModel(projectId, modelId, updates) {
  if (!projectId || !modelId) {
    console.error("[updateModel] Project ID and Model ID are required");
    return null;
  }

  // Validate payload
  const validation = validateUpdateModelPayload(updates);
  if (!validation.valid) {
    console.error("[updateModel]", validation.error);
    return null;
  }

  // Get existing model
  const existingModel = await getModel(projectId, modelId);
  if (!existingModel) {
    console.error(`[updateModel] Model not found: ${modelId}`);
    return null;
  }

  // Validate name if provided
  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();

    // Check uniqueness if name changed
    if (trimmedName.toLowerCase() !== existingModel.name.trim().toLowerCase()) {
      const isUnique = await isModelNameUnique(projectId, trimmedName, modelId);
      if (!isUnique) {
        console.error(`[updateModel] Model name "${trimmedName}" already exists in this project`);
        return null;
      }
    }

    updates.name = trimmedName;
  }

  // Prepare update data
  const updateData = {
    ...updates,
    modifyDate: new Date().toISOString(),
  };

  try {
    const updated = await repoUpdateModel(String(modelId), updateData);
    return updated;
  } catch (error) {
    console.error(`[updateModel] Failed to update model ${modelId}:`, error);
    // Check for duplicate name error from backend
    if (error.status === 409 || error.details?.name) {
      console.error(`[updateModel] Model name "${updates.name}" already exists in this project`);
    }
    return null;
  }
}

/**
 * Delete model
 * @param {string} projectId
 * @param {string} modelId
 * @returns {Promise<boolean>} true if deleted, false otherwise
 */
async function deleteModel(projectId, modelId) {
  if (!projectId || !modelId) {
    console.error("[deleteModel] Project ID and Model ID are required");
    return false;
  }

  try {
    const deleted = await repoDeleteModel(String(modelId));
    if (deleted) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[deleteModel] Failed to delete model ${modelId}:`, error);
    return false;
  }
}

export {
  getModels,
  getModel,
  getModelHeader,
  createModel,
  updateModel,
  deleteModel,
  isModelNameUnique,
};
