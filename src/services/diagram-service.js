import {
  createModelDiagram as repoCreateModelDiagram,
  createProfileDiagram as repoCreateProfileDiagram,
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

export { createModelDiagram, createProfileDiagram };
