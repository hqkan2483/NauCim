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
 * Create new model
 * @param {string} projectId
 * @param {object} payload - { name, description, type, legalState, accessRight }
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

  const newModel = {
    id: generateUUID(),
    name: payload.name.trim(),
    description: payload.description ?  payload.description.trim() : "",
    type: payload.type ? payload.type : "Custom",
    version: payload.version || "0.1",
    createDate: new Date().toISOString(),
    modifyDate: new Date().toISOString(),
    legalState: payload.legalState || "project",
    legalAct: payload.legalAct || "",
    accessRight: payload.accessRight || "readWrite",
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

  // Validate name
  if (updates.name && ! updates.name.trim()) {
    console.error("[updateModel] Name cannot be empty");
    return null;
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


export { getModels, getModel, createModel, updateModel, deleteModel };
