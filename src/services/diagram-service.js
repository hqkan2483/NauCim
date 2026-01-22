import {
  createModelDiagram as repoCreateModelDiagram,
  createProfileDiagram as repoCreateProfileDiagram,
  deleteModelDiagram as repoDeleteModelDiagram,
  deleteProfileDiagram as repoDeleteProfileDiagram,
} from "./repositories/diagram-repository.js";

/**
 * Diagram Service - Service Layer
 * Creates diagrams in model/profile graphs.
 * Backend returns the full updated project.
 */

async function createModelDiagram(projectId, modelId, packageId, payload) {
  if (!projectId || !modelId || !packageId) return null;
  try {
    return await repoCreateModelDiagram(String(modelId), String(packageId), payload);
  } catch (error) {
    console.error(
      `[createModelDiagram] Failed for model ${modelId}, package ${packageId}:`,
      error
    );
    throw error;
  }
}

async function createProfileDiagram(projectId, profileId, packageId, payload) {
  if (!projectId || !profileId || !packageId) return null;
  try {
    return await repoCreateProfileDiagram(String(profileId), String(packageId), payload);
  } catch (error) {
    console.error(
      `[createProfileDiagram] Failed for profile ${profileId}, package ${packageId}:`,
      error
    );
    throw error;
  }
}

/**
 * Delete a diagram from a model graph and return full updated project.
 *
 * @param {string} projectId
 * @param {string} modelId
 * @param {string} diagramId
 * @returns {Promise<object|null>}
 */
async function deleteModelDiagram(projectId, modelId, diagramId) {
  if (!projectId || !modelId || !diagramId) return null;
  try {
    return await repoDeleteModelDiagram(String(modelId), String(diagramId));
  } catch (error) {
    console.error(
      `[deleteModelDiagram] Failed for model ${modelId}, diagram ${diagramId}:`,
      error
    );
    throw error;
  }
}

/**
 * Delete a diagram from a profile graph and return full updated project.
 *
 * @param {string} projectId
 * @param {string} profileId
 * @param {string} diagramId
 * @returns {Promise<object|null>}
 */
async function deleteProfileDiagram(projectId, profileId, diagramId) {
  if (!projectId || !profileId || !diagramId) return null;
  try {
    return await repoDeleteProfileDiagram(String(profileId), String(diagramId));
  } catch (error) {
    console.error(
      `[deleteProfileDiagram] Failed for profile ${profileId}, diagram ${diagramId}:`,
      error
    );
    throw error;
  }
}

export { createModelDiagram, createProfileDiagram, deleteModelDiagram, deleteProfileDiagram };
