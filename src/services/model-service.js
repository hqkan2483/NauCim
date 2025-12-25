import { MemoryStore } from "../store/memory-store.js";
import { generateUUID } from "../utils/uuid.js";

// ============================================================
// MODEL SERVICE - Manages Model Data Operations
// ============================================================

/**
 * Get all models for a project
 * @param {string} projectId
 * @returns {Array} - Array of models
 */
function getModels(projectId) {
  const project = MemoryStore.getProjectById(String(projectId));
  return project ?  project.models || [] : [];
}

/**
 * Get single model by ID
 * @param {string} projectId
 * @param {string} modelId
 * @returns {object|null} - Model object or null
 */
function getModel(projectId, modelId) {
  const models = getModels(projectId);
  return models.find((m) => String(m.id) === String(modelId)) || null;
}

/**
 * Check if model name is unique within project
 * @param {string} projectId
 * @param {string} name - Model name to check
 * @param {string} excludeId - Model ID to exclude from check (for edit)
 * @returns {boolean} - true if name is unique
 */
function isModelNameUnique(projectId, name, excludeId = null) {
  const models = getModels(projectId);
  const trimmedName = name.trim().toLowerCase();

  return !models.some((m) => {
    // Skip the model being edited
    if (excludeId && String(m.id) === String(excludeId)) {
      return false;
    }
    return m.name.trim().toLowerCase() === trimmedName;
  });
}

/**
 * Create new model
 * @param {string} projectId
 * @param {object} payload - { name, description, version }
 * @returns {object|null} - Created model or null
 */
function createModel(projectId, payload) {
  if (!payload || !payload.name || !payload.name.trim()) {
    console.error("[createModel] Name is required");
    return null;
  }

  const project = MemoryStore.getProjectById(String(projectId));
  if (!project) {
    console.error(`[createModel] Project not found: ${projectId}`);
    return null;
  }

  const trimmedName = payload.name.trim();

  // Validate name length
  if (trimmedName.length < 3) {
    console.error("[createModel] Name must be at least 3 characters");
    return null;
  }

  // Validate name uniqueness
  if (! isModelNameUnique(projectId, trimmedName)) {
    console.error(`[createModel] Model name "${trimmedName}" already exists in this project`);
    return null;
  }

  const newModel = {
    id:  generateUUID(),
    name: trimmedName,
    description: payload.description ?  payload.description.trim() : "",
    version: payload.version ?  payload.version.trim() : "0.1",
    createDate: new Date().toISOString(),
    modifyDate: new Date().toISOString(),
    legalState: "project",
    accessRight: "readWrite",
    relatedProfiles: [],
    rootPackages: [],
  };

  if (! project.models) {
    project.models = [];
  }

  project.models.push(newModel);
  MemoryStore.updateProject(String(projectId), project);

  console.log(`✅ Model created:  ${newModel.name} (id: ${newModel.id})`);
  return newModel;
}

/**
 * Update model
 * @param {string} projectId
 * @param {string} modelId
 * @param {object} updates - Fields to update
 * @returns {object|null} - Updated model or null
 */
function updateModel(projectId, modelId, updates) {
  if (!modelId) {
    console.error("[updateModel] Model ID is required");
    return null;
  }

  const project = MemoryStore.getProjectById(String(projectId));
  if (!project) {
    console.error(`[updateModel] Project not found: ${projectId}`);
    return null;
  }

  const modelIndex = project.models.findIndex((m) => String(m.id) === String(modelId));
  if (modelIndex === -1) {
    console.error(`[updateModel] Model not found: ${modelId}`);
    return null;
  }

  // Validate name if provided
  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();

    if (trimmedName.length < 3) {
      console.error("[updateModel] Name must be at least 3 characters");
      return null;
    }

    if (! isModelNameUnique(projectId, trimmedName, modelId)) {
      console.error(`[updateModel] Model name "${trimmedName}" already exists in this project`);
      return null;
    }

    updates.name = trimmedName;
  }

  project.models[modelIndex] = {
    ...project.models[modelIndex],
    ...updates,
    id: project.models[modelIndex].id, // preserve ID
    modifyDate: new Date().toISOString(),
  };

  MemoryStore.updateProject(String(projectId), project);
  console.log(`✅ Model updated: ${project.models[modelIndex].name} (id: ${modelId})`);

  return project.models[modelIndex];
}

/**
 * Delete model
 * @param {string} projectId
 * @param {string} modelId
 * @returns {boolean} - true if deleted, false otherwise
 */
function deleteModel(projectId, modelId) {
  if (!modelId) {
    console.error("[deleteModel] Model ID is required");
    return false;
  }

  const project = MemoryStore.getProjectById(String(projectId));
  if (!project) {
    console.error(`[deleteModel] Project not found: ${projectId}`);
    return false;
  }

  const initialLength = project.models.length;
  project.models = project.models.filter((m) => String(m.id) !== String(modelId));

  if (project.models.length < initialLength) {
    MemoryStore.updateProject(String(projectId), project);
    console.log(`✅ Model deleted (id: ${modelId})`);
    return true;
  }

  console.error(`[deleteModel] Model not found: ${modelId}`);
  return false;
}

export { getModels, getModel, createModel, updateModel, deleteModel, isModelNameUnique };
