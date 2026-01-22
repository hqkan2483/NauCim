/**
 * Diagram Repository - Data Layer
 * Handles diagram create operations via backend API
 */

import {
  createModelDiagram as backendCreateModelDiagram,
  createProfileDiagram as backendCreateProfileDiagram,
  deleteModelDiagram as backendDeleteModelDiagram,
  deleteProfileDiagram as backendDeleteProfileDiagram,
} from "../backend/diagram-backend-service.js";

export async function createModelDiagram(modelId, packageId, payload) {
  if (!modelId) throw new Error("Model ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendCreateModelDiagram(String(modelId), String(packageId), payload);
}

export async function createProfileDiagram(profileId, packageId, payload) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendCreateProfileDiagram(String(profileId), String(packageId), payload);
}

/**
 * Delete a diagram from a model graph.
 *
 * @param {string} modelId
 * @param {string} diagramId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelDiagram(modelId, diagramId) {
  if (!modelId) throw new Error("Model ID is required");
  if (!diagramId) throw new Error("Diagram ID is required");
  return backendDeleteModelDiagram(String(modelId), String(diagramId));
}

/**
 * Delete a diagram from a profile graph.
 *
 * @param {string} profileId
 * @param {string} diagramId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfileDiagram(profileId, diagramId) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!diagramId) throw new Error("Diagram ID is required");
  return backendDeleteProfileDiagram(String(profileId), String(diagramId));
}
